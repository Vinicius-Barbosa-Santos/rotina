import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAutomatedTelegramReport,
  getDateKeyInTimeZone,
  getDueTelegramReportPeriods
} from "../lib/telegram-automation.ts";
import type { RoutinePrefs } from "../lib/types.ts";

const routinePrefs: RoutinePrefs = {
  hiddenItems: {},
  customItems: {},
  timeOverrides: {},
  labelOverrides: {},
  iconOverrides: {},
  guideChecks: {}
};

test("23h in Sao Paulo resolves to the previous UTC calendar date", () => {
  assert.equal(
    getDateKeyInTimeZone(new Date("2026-07-01T02:00:00.000Z"), "America/Sao_Paulo"),
    "2026-06-30"
  );
});

test("automatic reports follow daily, weekly and monthly boundaries", () => {
  assert.deepEqual(getDueTelegramReportPeriods("2026-07-19"), ["weekly"]);
  assert.deepEqual(getDueTelegramReportPeriods("2026-07-20"), ["daily"]);
  assert.deepEqual(getDueTelegramReportPeriods("2026-07-26"), ["weekly"]);
  assert.deepEqual(getDueTelegramReportPeriods("2026-07-31"), ["daily", "monthly"]);
});

test("server report includes every weekday even when no task was checked", () => {
  const report = buildAutomatedTelegramReport(
    {
      states: {
        "2026-07-20": { work: ["0"] }
      },
      completedDates: [],
      routinePrefs
    },
    "weekly",
    "2026-07-26"
  );

  assert.deepEqual(report.days.map((day) => day.date), [
    "2026-07-20",
    "2026-07-21",
    "2026-07-22",
    "2026-07-23",
    "2026-07-24"
  ]);
  assert.equal(report.days[0]?.sections.find((section) => section.label === "Programação")?.done, 1);
  assert.equal(report.days[0]?.sections.find((section) => section.label === "Inglês")?.total, 5);
  assert.equal(report.days[0]?.sections.some((section) => section.label === "Guia do Desenvolvedor"), false);
  assert.ok(report.days.every((day) => day.total > 0));
});
