import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAutomatedTelegramReport,
  getDateKeyInTimeZone,
  getDueTelegramReportPeriods
} from "../lib/telegram-automation.ts";
import type { RoutinePrefs } from "../lib/types.ts";
import { progressResetVersion } from "../lib/progress-history.ts";

const routinePrefs: RoutinePrefs = {
  progressResetVersion,
  hiddenItems: {},
  customItems: {},
  timeOverrides: {},
  labelOverrides: {},
  iconOverrides: {},
  guideChecks: {},
  stackProgress: {},
  stackTopicChecks: {}
};

test("23h in Sao Paulo resolves to the previous UTC calendar date", () => {
  assert.equal(
    getDateKeyInTimeZone(new Date("2026-07-01T02:00:00.000Z"), "America/Sao_Paulo"),
    "2026-06-30"
  );
});

test("automatic reports follow daily, weekly and monthly boundaries", () => {
  assert.deepEqual(getDueTelegramReportPeriods("2026-09-06"), ["weekly"]);
  assert.deepEqual(getDueTelegramReportPeriods("2026-09-08"), ["daily"]);
  assert.deepEqual(getDueTelegramReportPeriods("2026-09-13"), ["weekly"]);
  assert.deepEqual(getDueTelegramReportPeriods("2026-09-30"), ["daily", "monthly"]);
});

test("server report includes every weekday even when no task was checked", () => {
  const report = buildAutomatedTelegramReport(
    {
      states: {
        "2026-09-01": { work: ["0"] }
      },
      completedDates: [],
      routinePrefs
    },
    "weekly",
    "2026-09-06"
  );

  assert.deepEqual(report.days.map((day) => day.date), [
    "2026-09-01",
    "2026-09-02",
    "2026-09-03",
    "2026-09-04"
  ]);
  assert.equal(report.days[0]?.sections.find((section) => section.label === "Programação")?.done, 1);
  assert.equal(report.days[0]?.sections.find((section) => section.label === "Inglês")?.total, 5);
  assert.equal(report.days[0]?.sections.some((section) => section.label === "Guia do Desenvolvedor"), false);
  assert.ok(report.days.every((day) => day.total > 0));
});
