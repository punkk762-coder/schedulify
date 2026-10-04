import { prisma } from "../db";
import { todayUtc, matchesRecurrence, addDays } from "../dates";
import { cache } from "../cache";

/**
 * Occurrence service — generates, queries, and manages occurrence lifecycle.
 * Occurrences are immutable historical facts once completed.
 */
export const occurrenceService = {
  /**
   * Get all occurrences for a specific date (cached with 30s TTL).
   */
  async getForDate(date: Date) {
    const dateKey = date.toISOString().split("T")[0];
    const cacheKey = `occurrences:${dateKey}`;

    return cache.wrap(cacheKey, 30, async () => {
      return prisma.occurrence.findMany({
        where: {
          scheduledDate: date,
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
    const dateKey = date.toISOString().split("T")[0];
    await cache.del(`occurrences:${dateKey}`);
    await cache.del(`today_payload:${dateKey}`);
    await cache.invalidatePattern("analytics:");
  },

  /**
   * Complete an occurrence.
   */
  async complete(occurrenceId: string, notes?: string) {
    const result = await prisma.$transaction(async (tx) => {
      const occurrence = await tx.occurrence.findUniqueOrThrow({
        where: { id: occurrenceId },
      });

      // Don't allow re-completing
      if (occurrence.status !== "PENDING") {
        throw new Error(`Occurrence ${occurrenceId} is already ${occurrence.status}`);
      }

      await tx.occurrence.update({
        where: { id: occurrenceId },
        data: { status: "COMPLETED" },
      });

      const comp = await tx.completion.create({
        data: {
          occurrenceId,
          status: "COMPLETED",
          notes,
        },
      });

      return { comp, scheduledDate: occurrence.scheduledDate };
    });

    await this.invalidateDateCache(result.scheduledDate);
    return result.comp;
  },

  /**
   * Skip an occurrence.
   */
  async skip(occurrenceId: string, notes?: string) {
    const result = await prisma.$transaction(async (tx) => {
      const occurrence = await tx.occurrence.findUniqueOrThrow({
        where: { id: occurrenceId },
      });

      if (occurrence.status !== "PENDING") {
        throw new Error(`Occurrence ${occurrenceId} is already ${occurrence.status}`);
      }

      await tx.occurrence.update({
        where: { id: occurrenceId },
        data: { status: "SKIPPED" },
      });

      const comp = await tx.completion.create({
        data: {
          occurrenceId,
          status: "SKIPPED",
          notes,
        },
      });

      return { comp, scheduledDate: occurrence.scheduledDate };
    });

    await this.invalidateDateCache(result.scheduledDate);
    return result.comp;
  },

  /**
   * Replace an occurrence with an alternative item.
   */
  async replace(occurrenceId: string, alternativeItemId: string, notes?: string) {
    const result = await prisma.$transaction(async (tx) => {
      const occurrence = await tx.occurrence.findUniqueOrThrow({
        where: { id: occurrenceId },
      });

      if (occurrence.status !== "PENDING") {
        throw new Error(`Occurrence ${occurrenceId} is already ${occurrence.status}`);
      }

      // Verify the alternative exists
      await tx.routineItem.findUniqueOrThrow({
        where: { id: alternativeItemId },
      });

      await tx.occurrence.update({
        where: { id: occurrenceId },
        data: { status: "REPLACED" },
      });

      const comp = await tx.completion.create({
        data: {
          occurrenceId,
          status: "REPLACED",
          actualItemId: alternativeItemId,
          notes,
        },
      });

      return { comp, scheduledDate: occurrence.scheduledDate };
    });

    await this.invalidateDateCache(result.scheduledDate);
    return result.comp;
  },

  /**
   * Undo / restore an occurrence to PENDING.
   */
  async undo(occurrenceId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const occurrence = await tx.occurrence.findUniqueOrThrow({
        where: { id: occurrenceId },
      });

      await tx.occurrence.update({
        where: { id: occurrenceId },
        data: { status: "PENDING" },
      });

      await tx.completion.deleteMany({
        where: { occurrenceId },
      });

      return { scheduledDate: occurrence.scheduledDate };
    });

    await this.invalidateDateCache(result.scheduledDate);
    return { success: true };
  },

  /**
   * Generate occurrences from active schedules for a date range in one batch.
   * Single-shot batch query + batch insertion.
   */
  async generateForRange(startDate: Date, endDate: Date) {
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];
    const cacheKey = `gen_range:${startStr}_${endStr}`;

    // Fast check: if generated within last 5 minutes and no schedules changed, skip!
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

