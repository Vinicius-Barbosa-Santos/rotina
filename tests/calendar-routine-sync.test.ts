import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarRoutineSyncDays,
  clampCalendarRoutineSyncDays
} from "../lib/calendar-routine-sync.ts";

test("calendar routine sync covers the complete six-week month view", () => {
  assert.equal(calendarRoutineSyncDays, 45);
  assert.equal(clampCalendarRoutineSyncDays(45), 45);
  assert.equal(clampCalendarRoutineSyncDays(90), 45);
  assert.equal(clampCalendarRoutineSyncDays(0), 1);
});
