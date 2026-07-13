import { calculateProgressStreak, progressTrackingStartDate } from "./progress-history.ts";
import { getVisibleItems, trackedRoutineSections } from "./routine.ts";
import { isSaoPauloHolidayDate } from "./sao-paulo-holidays.ts";
import type { RoutineSyncSnapshot, TelegramReportPeriod, TelegramRoutineReport } from "./types.ts";

type AutomatedRoutineData = Pick<RoutineSyncSnapshot, "states" | "completedDates" | "routinePrefs">;

export function getDateKeyInTimeZone(date = new Date(), timeZone = "America/Sao_Paulo") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function getDueTelegramReportPeriods(dateKey: string): TelegramReportPeriod[] {
  const date = dateFromKey(dateKey);
  const periods: TelegramReportPeriod[] = [];

  if (isProgressDateKey(dateKey)) periods.push("daily");
  if (date.getUTCDay() === 0) periods.push("weekly");
  if (isLastDayOfMonth(date)) periods.push("monthly");

  return periods;
}

export function buildAutomatedTelegramReport(
  data: AutomatedRoutineData,
  period: TelegramReportPeriod,
  reportDateKey: string
): TelegramRoutineReport {
  const reportDate = dateFromKey(reportDateKey);
  const days = getPeriodDateKeys(period, reportDateKey).map((key) => {
    const date = dateFromKey(key);
    const dayState = data.states[key] ?? {};
    const sections = trackedRoutineSections
      .map((section) => {
        const hidden = new Set(data.routinePrefs.hiddenItems[section.key] ?? []);
        const defaultItems = getVisibleItems(section, date)
          .filter(({ index }) => !hidden.has(index))
          .map(({ index }) => String(index));
        const customItems = section.days && !section.days.includes(date.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6)
          ? []
          : (data.routinePrefs.customItems[section.key] ?? []).map((item) => item.id);
        const itemKeys = [...defaultItems, ...customItems];
        const visibleKeys = new Set(itemKeys);
        const done = (dayState[section.key] ?? []).filter((itemKey) => visibleKeys.has(String(itemKey))).length;

        return { label: section.label, done, total: itemKeys.length };
      })
      .filter((section) => section.total > 0);

    return {
      date: key,
      done: sections.reduce((sum, section) => sum + section.done, 0),
      total: sections.reduce((sum, section) => sum + section.total, 0),
      sections
    };
  });

  return {
    period,
    streak: calculateProgressStreak(data.completedDates, reportDate),
    generatedAt: new Date().toISOString(),
    days
  };
}

function getPeriodDateKeys(period: TelegramReportPeriod, reportDateKey: string) {
  const end = dateFromKey(reportDateKey);
  const start = new Date(end);

  if (period === "weekly") start.setUTCDate(start.getUTCDate() - 6);
  if (period === "monthly") start.setUTCDate(1);

  const keys: string[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = formatUtcDateKey(cursor);
    if (isProgressDateKey(key)) keys.push(key);
  }
  return keys;
}

function isProgressDateKey(dateKey: string) {
  const date = dateFromKey(dateKey);
  const weekday = date.getUTCDay();
  return weekday >= 1 && weekday <= 5 && !isSaoPauloHolidayDate(date) && dateKey >= progressTrackingStartDate;
}

function isLastDayOfMonth(date: Date) {
  const tomorrow = new Date(date);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.getUTCMonth() !== date.getUTCMonth();
}

function dateFromKey(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function formatUtcDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}
