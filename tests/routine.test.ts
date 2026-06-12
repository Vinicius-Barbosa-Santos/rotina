import assert from "node:assert/strict";
import test from "node:test";
import { getSectionScheduleLabel, getVisibleItems, type RoutineSection } from "../lib/routine.ts";

const section: RoutineSection = {
  key: "test",
  label: "Teste",
  shortLabel: "Teste",
  icon: "Target",
  color: "#fff",
  bg: "#000",
  time: "09:00-10:00",
  days: [1, 2, 3, 4, 5],
  items: [
    { label: "Todo dia útil" },
    { label: "Somente sexta", days: [5] }
  ]
};

test("getVisibleItems respects section and item weekdays", () => {
  assert.deepEqual(
    getVisibleItems(section, new Date(2026, 5, 12)).map(({ item }) => item.label),
    ["Todo dia útil", "Somente sexta"]
  );
  assert.deepEqual(getVisibleItems(section, new Date(2026, 5, 13)), []);
});

test("getSectionScheduleLabel describes weekdays", () => {
  assert.equal(getSectionScheduleLabel(section), "segunda a sexta");
});
