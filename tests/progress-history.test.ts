import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateProgressStreak,
  getProgressReportDates,
  isProgressTrackingDate,
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
  const weeklyDates = getProgressReportDates("weekly", new Date("2026-07-06T12:00:00-03:00")).map(dateKey);

  assert.deepEqual(weeklyDates, ["2026-06-30", "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-06"]);
  assert.equal(isProgressTrackingDate(new Date("2026-07-04T12:00:00-03:00")), false);
  assert.equal(isProgressTrackingDate(new Date("2026-07-06T12:00:00-03:00")), true);
  assert.equal(
    calculateProgressStreak(
      ["2026-07-02", "2026-07-03", "2026-07-06"],
      new Date("2026-07-06T12:00:00-03:00")
    ),
    3
  );
});

test("São Paulo holidays are day off and do not count in progress", () => {
  const weeklyDates = getProgressReportDates("weekly", new Date("2026-07-10T12:00:00-03:00")).map(dateKey);

  assert.deepEqual(weeklyDates, ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-10"]);
  assert.equal(isProgressTrackingDate(new Date("2026-07-09T12:00:00-03:00")), false);
  assert.equal(
    calculateProgressStreak(
      ["2026-07-07", "2026-07-08", "2026-07-10"],
      new Date("2026-07-10T12:00:00-03:00")
    ),
    3
  );
});

test("reports and streak only count dates from the new start date", () => {
  const dates = getProgressReportDates("weekly", new Date("2026-07-01T12:00:00-03:00")).map(dateKey);

  assert.deepEqual(dates, ["2026-06-29", "2026-06-30", "2026-07-01"]);
  assert.equal(
    calculateProgressStreak(
      ["2026-06-27", "2026-06-28", "2026-06-29", "2026-06-30"],
      new Date("2026-07-01T12:00:00-03:00")
    ),
    2
  );
  assert.equal(progressTrackingStartDate, "2026-06-29");
});
