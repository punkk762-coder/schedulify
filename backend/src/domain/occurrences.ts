import { prisma } from "../db";
import { todayUtc, matchesRecurrence, addDays, dateKeyInTz } from "../dates";
import { cache } from "../cache";

/**
 * Occurrence service — generates, queries, and manages occurrence lifecycle.
 * Occurrences are immutable historical facts once completed.
 */
export const occurrenceService = {
  /**
   * Get all occurrences for a specific date (cached with 60s TTL).
   */
  async getForDate(date: Date) {
    const dateKey = dateKeyInTz(date);
    const cacheKey = `occurrences:${dateKey}`;

    const isHistoricalPast = dateKey < dateKeyInTz(todayUtc());

    return cache.wrap(cacheKey, 60, async () => {
      return prisma.occurrence.findMany({
        where: {
          scheduledDate: date,
          ...(isHistoricalPast
            ? {}
            : { routineItem: { plan: { status: "ACTIVE" } } }),
        },
        include: {
          routineItem: {
            include: {
              meal: { include: { components: true } },
              primaryAlternatives: { include: { alternativeItem: true } },
              nutritionSnapshots: { where: { source: "PLANNED" } },
            },
          },
          completion: true,
          nutritionSnapshots: true,
        },
        orderBy: { scheduledTime: "asc" },
      });
    });
  },

  /**
   * Get today's occurrences.
   */
  async getToday() {
    return this.getForDate(todayUtc());
  },

  /**
   * Get occurrences for a date range.
   */
  async getForRange(startDate: Date, endDate: Date) {
    return prisma.occurrence.findMany({
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
      },
      include: {
        routineItem: true,
        completion: true,
      },
      orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
    });
  },

  /**
   * Invalidate occurrence caches for date
   */
  async invalidateDateCache(date: Date) {
    const dateKey = dateKeyInTz(date);
    await cache.del(`occurrences:${dateKey}`);
    await cache.del(`today_payload:${dateKey}`);
    await cache.del(`mom_kitchen_payload:${dateKey}`);
    await cache.del(`kitchen_meals:${dateKey}`);
    await cache.invalidatePattern("analytics:");
  },

  /**
   * Complete an occurrence (single-roundtrip batch).
   */
  async complete(occurrenceId: string, notes?: string) {
    const occurrence = await prisma.occurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      select: { id: true, status: true, scheduledDate: true },
    });

    if (occurrence.status !== "PENDING") {
      throw new Error(`Occurrence ${occurrenceId} is already ${occurrence.status}`);
    }

    const [, comp] = await prisma.$transaction([
      prisma.occurrence.update({
        where: { id: occurrenceId },
        data: { status: "COMPLETED" },
      }),
      prisma.completion.create({
        data: {
          occurrenceId,
          status: "COMPLETED",
          notes,
        },
      }),
    ]);

    await this.invalidateDateCache(occurrence.scheduledDate);
    return comp;
  },

  /**
   * Skip an occurrence (single-roundtrip batch).
   */
  async skip(occurrenceId: string, notes?: string) {
    const occurrence = await prisma.occurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      select: { id: true, status: true, scheduledDate: true },
    });

    if (occurrence.status !== "PENDING") {
      throw new Error(`Occurrence ${occurrenceId} is already ${occurrence.status}`);
    }

    const [, comp] = await prisma.$transaction([
      prisma.occurrence.update({
        where: { id: occurrenceId },
        data: { status: "SKIPPED" },
      }),
      prisma.completion.create({
        data: {
          occurrenceId,
          status: "SKIPPED",
          notes,
        },
      }),
    ]);

    await this.invalidateDateCache(occurrence.scheduledDate);
    return comp;
  },

  /**
   * Replace an occurrence with an alternative item.
   */
  async replace(occurrenceId: string, alternativeItemId: string, notes?: string) {
    const occurrence = await prisma.occurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      select: { id: true, status: true, scheduledDate: true },
    });

    if (occurrence.status !== "PENDING") {
      throw new Error(`Occurrence ${occurrenceId} is already ${occurrence.status}`);
    }

    // Verify the alternative exists
    await prisma.routineItem.findUniqueOrThrow({
      where: { id: alternativeItemId },
      select: { id: true },
    });

    const [, comp] = await prisma.$transaction([
      prisma.occurrence.update({
        where: { id: occurrenceId },
        data: { status: "REPLACED" },
      }),
      prisma.completion.create({
        data: {
          occurrenceId,
          status: "REPLACED",
          actualItemId: alternativeItemId,
          notes,
        },
      }),
    ]);

    await this.invalidateDateCache(occurrence.scheduledDate);
    return comp;
  },

  /**
   * Undo / restore an occurrence to PENDING (single-roundtrip batch).
   */
  async undo(occurrenceId: string) {
    const occurrence = await prisma.occurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      select: { id: true, scheduledDate: true },
    });

    await prisma.$transaction([
      prisma.occurrence.update({
        where: { id: occurrenceId },
        data: { status: "PENDING" },
      }),
      prisma.completion.deleteMany({
        where: { occurrenceId },
      }),
    ]);

    await this.invalidateDateCache(occurrence.scheduledDate);
    return { success: true };
  },

  /**
   * Generate occurrences from active schedules for a date range in one batch.
   * Single-shot batch query + batch insertion.
   */
  async generateForRange(startDate: Date, endDate: Date) {
    const startStr = dateKeyInTz(startDate);
    const endStr = dateKeyInTz(endDate);
    const cacheKey = `gen_range:${startStr}_${endStr}`;

    // Fast check: if generated within last 1 hour and no schedules changed, skip!
    const alreadyGenerated = await cache.get<boolean>(cacheKey);
    if (alreadyGenerated) {
      return [];
    }

    // Run schedule query and existing occurrence check in one go (parallel)
    const [schedules, existingOccurrences] = await Promise.all([
      prisma.schedule.findMany({
        where: {
          effectiveFrom: { lte: endDate },
          OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: startDate } }],
          routineItem: {
            plan: {
              status: "ACTIVE",
            },
          },
        },
        include: { routineItem: true },
      }),
      prisma.occurrence.findMany({
        where: {
          scheduledDate: { gte: startDate, lte: endDate },
        },
        select: {
          scheduleId: true,
          scheduledDate: true,
        },
      }),
    ]);

    // Build O(1) set of existing occurrences
    const existingKeySet = new Set<string>();
    for (const occ of existingOccurrences) {
      if (occ.scheduleId) {
        existingKeySet.add(`${occ.scheduleId}_${occ.scheduledDate.getTime()}`);
      }
    }

    const created: string[] = [];
    const toCreate: Array<{
      scheduleId: string;
      routineItemId: string;
      scheduledDate: Date;
      scheduledTime: string;
      status: "PENDING";
    }> = [];

    let current = new Date(startDate);

    while (current <= endDate) {
      for (const schedule of schedules) {
        if (current < schedule.effectiveFrom) continue;
        if (schedule.effectiveUntil && current > schedule.effectiveUntil) continue;
        if (!matchesRecurrence(current, schedule.recurrenceRule)) continue;

        const key = `${schedule.id}_${current.getTime()}`;
        if (!existingKeySet.has(key)) {
          toCreate.push({
            scheduleId: schedule.id,
            routineItemId: schedule.routineItemId,
            scheduledDate: new Date(current),
            scheduledTime: schedule.scheduledTime,
            status: "PENDING",
          });
          created.push(`${schedule.routineItem.title} on ${current.toISOString()}`);
          existingKeySet.add(key);
        }
      }
      current = addDays(current, 1);
    }

    // Batch create in one single operation if any missing
    if (toCreate.length > 0) {
      await prisma.occurrence.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      // Invalidate relevant dates
      await this.invalidateDateCache(startDate);
    }

    // Cache flag for 5 minutes
    await cache.set(cacheKey, true, 300);

    return created;
  },

  /**
   * Mark overdue PENDING occurrences as MISSED.
   */
  async markMissed() {
    const today = todayUtc();
    const result = await prisma.occurrence.updateMany({
      where: {
        status: "PENDING",
        scheduledDate: { lt: today },
      },
      data: { status: "MISSED" },
    });
    return result.count;
  },
};

