import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateProgressStreak,
  getProgressReportDates,
  isProgressTrackingDate,
  progressResetVersion,
  progressTrackingStartDate,
  resetProgressHistory
} from "../lib/progress-history.ts";
import { dateKey } from "../lib/date.ts";

function createStorage(initial: Record<string, string>) {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    key: (index: number) => [...values.keys()][index] ?? null,
    values
  };
}

test("resets progress history once while preserving preferences", () => {
  const storage = createStorage({
    "rotina_next_2026-06-14": "{}",
    rotina_completed_dates: '["2026-06-14"]',
    rotina_telegram_reports_sent: "{}",
    rotina_preferences: '{"customItems":{}}'
  });

  assert.equal(resetProgressHistory(storage), true);
  assert.equal(storage.getItem("rotina_next_2026-06-14"), null);
  assert.equal(storage.getItem("rotina_completed_dates"), null);
  assert.equal(storage.getItem("rotina_telegram_reports_sent"), null);
  assert.equal(storage.getItem("rotina_preferences"), '{"customItems":{}}');
  assert.equal(resetProgressHistory(storage), false);
});

test("weekends are optional and do not count in progress reports or streak", () => {
  const weeklyDates = getProgressReportDates("weekly", new Date("2026-09-14T12:00:00-03:00")).map(dateKey);

  assert.deepEqual(weeklyDates, ["2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-14"]);
  assert.equal(isProgressTrackingDate(new Date("2026-09-12T12:00:00-03:00")), false);
  assert.equal(isProgressTrackingDate(new Date("2026-09-14T12:00:00-03:00")), true);
  assert.equal(
    calculateProgressStreak(
      ["2026-09-10", "2026-09-11", "2026-09-14"],
      new Date("2026-09-14T12:00:00-03:00")
    ),
    3
  );
});

test("São Paulo holidays are day off and do not count in progress", () => {
  const weeklyDates = getProgressReportDates("weekly", new Date("2026-11-20T12:00:00-03:00")).map(dateKey);

  assert.deepEqual(weeklyDates, ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"]);
  assert.equal(isProgressTrackingDate(new Date("2026-11-20T12:00:00-03:00")), false);
  assert.equal(
    calculateProgressStreak(
      ["2026-11-18", "2026-11-19"],
      new Date("2026-11-20T12:00:00-03:00")
    ),
    2
  );
});

test("reports and streak only count dates from the new start date", () => {
  const dates = getProgressReportDates("weekly", new Date("2026-09-09T12:00:00-03:00")).map(dateKey);

  assert.deepEqual(dates, ["2026-09-08", "2026-09-09"]);
  assert.equal(
    calculateProgressStreak(
      ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-08"],
      new Date("2026-09-09T12:00:00-03:00")
    ),
    1
  );
  assert.equal(progressTrackingStartDate, "2026-09-08");
  assert.equal(progressResetVersion, "2026-09-08-complete-trails-v1");
});
