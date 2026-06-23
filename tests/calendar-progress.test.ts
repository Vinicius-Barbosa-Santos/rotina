import assert from "node:assert/strict";
import test from "node:test";
import { extractCalendarProgress } from "../lib/calendar-progress.ts";
import type { CalendarEvent } from "../lib/types.ts";

function event(title: string): CalendarEvent {
  return {
    id: title,
    title,
    startsAt: "2026-06-17T09:00:00-03:00",
    endsAt: "2026-06-17T10:00:00-03:00",
    allDay: false,
  };
}

test("extracts routine completion progress from Google Calendar event titles", () => {
  const progress = extractCalendarProgress([
    event("✅ Rotina: Inglês (4/4)"),
    event("✅ Rotina: Trabalho (9/9)"),
    event("Acompanhamento | Black Belt"),
  ]);

  assert.deepEqual(progress["2026-06-17"], {
    done: 13,
    total: 13,
    sections: {
      Inglês: { done: 4, total: 4 },
      Trabalho: { done: 9, total: 9 },
    },
  });
});
