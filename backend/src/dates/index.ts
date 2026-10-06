import {
  format,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  isToday,
  isYesterday,
  isBefore,
  isAfter,
  parseISO,
  differenceInDays,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const DEFAULT_TZ = process.env.APP_TIMEZONE || "Asia/Kolkata";

/**
 * Get current time in app timezone.
 */
export function nowInTz(tz: string = DEFAULT_TZ): Date {
  return toZonedTime(new Date(), tz);
}

/**
 * Get today's date (start of day) in app timezone as UTC Date.
 */
export function todayUtc(tz: string = DEFAULT_TZ): Date {
  const zonedNow = toZonedTime(new Date(), tz);
  const startOfZonedDay = startOfDay(zonedNow);
  return fromZonedTime(startOfZonedDay, tz);
}

/**
 * Parse YYYY-MM-DD date string to start of day in app timezone as UTC Date.
 */
export function dateStrToUtc(dateStr: string, tz: string = DEFAULT_TZ): Date {
  return fromZonedTime(`${dateStr}T00:00:00`, tz);
}

/**
 * Format a date in app timezone.
 */
export function formatInTz(date: Date, fmt: string, tz: string = DEFAULT_TZ): string {
  const zonedDate = toZonedTime(date, tz);
  return format(zonedDate, fmt);
}

/**
 * Parse HH:mm time string to { hours, minutes }.
 */
export function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(":").map(Number);
  return { hours: h, minutes: m };
}

/**
 * Format hours/minutes to HH:mm.
 */
export function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Get day-of-week abbreviation (MON, TUE, etc.) for a date.
 */
export function dayOfWeek(date: Date, tz: string = DEFAULT_TZ): string {
  return formatInTz(date, "EEE", tz).toUpperCase();
}

/**
 * Check if a date matches a recurrence rule.
 * Rules: DAILY, WEEKDAYS, WEEKENDS, ONCE, or comma-separated days (MON,WED,FRI)
 */
export function matchesRecurrence(date: Date, rule: string, tz: string = DEFAULT_TZ): boolean {
  const upper = rule.toUpperCase().trim();
  if (upper === "DAILY") return true;
  if (upper === "ONCE") return true; // caller handles one-time logic

  const dow = dayOfWeek(date, tz);
  if (upper === "WEEKDAYS") {
    return !["SAT", "SUN"].includes(dow);
  }
  if (upper === "WEEKENDS") {
    return ["SAT", "SUN"].includes(dow);
  }

  // Comma-separated days: MON,WED,FRI
  const days = upper.split(",").map((d) => d.trim());
  return days.includes(dow);
}

// Re-export useful date-fns functions
export {
  format,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  isToday,
  isYesterday,
  isBefore,
  isAfter,
  parseISO,
  differenceInDays,
};
