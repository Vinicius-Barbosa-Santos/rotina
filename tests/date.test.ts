import assert from "node:assert/strict";
import test from "node:test";
import { dateKey, formatTime } from "../lib/date.ts";

test("dateKey formats local dates without UTC conversion", () => {
  assert.equal(dateKey(new Date(2026, 5, 12, 23, 30)), "2026-06-12");
});

test("formatTime returns a Brazilian hour and minute", () => {
  assert.match(formatTime("2026-06-12T21:20:00-03:00"), /^\d{2}:\d{2}$/);
});
