import type { TelegramReportPeriod } from "@/lib/types";
import { isSaoPauloHolidayDate } from "./sao-paulo-holidays.ts";

export const progressTrackingStartDate = "2026-07-20";

const progressResetKey = "rotina_progress_reset_version";
const completedDatesKey = "rotina_completed_dates";
const telegramReportsSentKey = "rotina_telegram_reports_sent";
const routineStatePrefix = "rotina_next_";

function progressDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isProgressTrackingDate(date: Date) {
  const weekday = date.getDay();
  return weekday >= 1 && weekday <= 5 && !isSaoPauloHolidayDate(date) && progressDateKey(date) >= progressTrackingStartDate;
}

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  key: (index: number) => string | null;
  length: number;
};

export function resetProgressHistory(storage: StorageLike) {
  if (storage.getItem(progressResetKey) === progressTrackingStartDate) return false;

  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
    (key): key is string => Boolean(key)
  );
  keys.filter((key) => key.startsWith(routineStatePrefix)).forEach((key) => storage.removeItem(key));
  storage.removeItem(completedDatesKey);
  storage.removeItem(telegramReportsSentKey);
  storage.setItem(progressResetKey, progressTrackingStartDate);
  return true;
}

export function getProgressReportDates(period: TelegramReportPeriod, now = new Date()) {
  const end = new Date(now);
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);

  if (period === "weekly") start.setDate(start.getDate() - 6);
  if (period === "monthly") start.setDate(1);

  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    if (isProgressTrackingDate(cursor)) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function calculateProgressStreak(dates: string[], now = new Date()) {
  const completed = new Set(dates.filter((date) => date >= progressTrackingStartDate));
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  while (progressDateKey(cursor) >= progressTrackingStartDate && !isProgressTrackingDate(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  if (!completed.has(progressDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  while (progressDateKey(cursor) >= progressTrackingStartDate && !isProgressTrackingDate(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let count = 0;
  while (progressDateKey(cursor) >= progressTrackingStartDate) {
    if (!isProgressTrackingDate(cursor)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (!completed.has(progressDateKey(cursor))) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
}
