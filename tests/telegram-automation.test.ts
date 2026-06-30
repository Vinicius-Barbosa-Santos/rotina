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
  assert.deepEqual(getDueTelegramReportPeriods("2026-06-30"), ["daily", "monthly"]);
  assert.deepEqual(getDueTelegramReportPeriods("2026-07-05"), ["weekly"]);
  assert.deepEqual(getDueTelegramReportPeriods("2026-07-31"), ["daily", "monthly"]);
});

test("server report includes every weekday even when no task was checked", () => {
  const report = buildAutomatedTelegramReport(
    {
      states: {
        "2026-06-29": { work: ["0"] }
      },
      completedDates: [],
      routinePrefs
    },
    "weekly",
    "2026-07-05"
  );

  assert.deepEqual(report.days.map((day) => day.date), [
    "2026-06-29",
    "2026-06-30",
    "2026-07-01",
    "2026-07-02",
    "2026-07-03"
  ]);
  assert.equal(report.days[0]?.sections.find((section) => section.label === "Programação")?.done, 1);
  assert.equal(report.days[0]?.sections.some((section) => section.label === "Guia de Inglês"), false);
  assert.equal(report.days[0]?.sections.some((section) => section.label === "Guia do Desenvolvedor"), false);
  assert.ok(report.days.every((day) => day.total > 0));
});
