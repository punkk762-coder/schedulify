import { prisma } from "../db";
import { todayUtc, addDays } from "../dates";
import { occurrenceService } from "./occurrences";

/**
 * Schedule service — manages schedules with effective date versioning.
 * Key invariant: changing future schedules never touches historical occurrences.
 */
export const scheduleService = {
  /**
   * Create a new schedule for a routine item.
   */
  async create(data: {
    routineItemId: string;
    recurrenceRule: string;
    scheduledTime: string;
    effectiveFrom: Date;
    effectiveUntil?: Date;
    reminderOffsetMinutes?: number;
  }) {
    const schedule = await prisma.schedule.create({ data });

    // Generate occurrences for next 14 days (rolling horizon)
    const horizon = addDays(data.effectiveFrom, 14);
    const end = data.effectiveUntil && data.effectiveUntil < horizon ? data.effectiveUntil : horizon;
    await occurrenceService.generateForRange(data.effectiveFrom, end);

    return schedule;
  },

  /**
   * End current schedule and create a new one from a future date.
   * This is the core "future change" operation.
   * Historical occurrences are preserved — only future is affected.
   */
  async changeFuture(data: {
    currentScheduleId: string;
    newRoutineItemId?: string;
    newRecurrenceRule?: string;
    newScheduledTime?: string;
    newReminderOffset?: number;
    effectiveFrom: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.schedule.findUniqueOrThrow({
        where: { id: data.currentScheduleId },
      });

      const effectiveDate = data.effectiveFrom;
      const yesterday = addDays(effectiveDate, -1);

      // 1. End the current schedule the day before the change
      await tx.schedule.update({
        where: { id: current.id },
        data: { effectiveUntil: yesterday },
      });

      // 2. Delete future PENDING occurrences for the old schedule
      await tx.occurrence.deleteMany({
        where: {
          scheduleId: current.id,
          scheduledDate: { gte: effectiveDate },
          status: "PENDING",
        },
      });

      // 3. Create the new schedule
      const newSchedule = await tx.schedule.create({
        data: {
          routineItemId: data.newRoutineItemId || current.routineItemId,
          recurrenceRule: data.newRecurrenceRule || current.recurrenceRule,
          scheduledTime: data.newScheduledTime || current.scheduledTime,
          effectiveFrom: effectiveDate,
          reminderOffsetMinutes: data.newReminderOffset ?? current.reminderOffsetMinutes,
        },
      });

      return newSchedule;
    });
  },

  /**
   * Get active schedules for a routine item.
   */
  async getActiveForItem(routineItemId: string) {
    const today = todayUtc();
    return prisma.schedule.findMany({
      where: {
        routineItemId,
        effectiveFrom: { lte: today },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: today } }],
      },
    });
  },

  /**
   * Get all schedules that are active on a given date.
   */
  async getActiveForDate(date: Date) {
    return prisma.schedule.findMany({
      where: {
        effectiveFrom: { lte: date },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: date } }],
      },
      include: { routineItem: true },
    });
  },
};
