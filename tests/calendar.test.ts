import assert from "node:assert/strict";
import test from "node:test";
import { mapGoogleCalendarEvents, parseCalendarEvents } from "../lib/calendar.ts";

test("mapGoogleCalendarEvents only exposes recognized meeting links", () => {
  const events = mapGoogleCalendarEvents([
    {
      id: "calendar-only",
      summary: "Rotina",
      htmlLink: "https://calendar.google.com/calendar/event?eid=123",
      start: { dateTime: "2026-06-12T09:00:00-03:00" },
      end: { dateTime: "2026-06-12T10:00:00-03:00" }
    },
    {
      id: "meeting",
      summary: "Daily",
      description: "Join at https://meet.google.com/abc-defg-hij",
      start: { dateTime: "2026-06-12T10:00:00-03:00" },
      end: { dateTime: "2026-06-12T10:30:00-03:00" }
    }
  ]);

  assert.equal(events[0].meetingUrl, undefined);
  assert.equal(events[1].meetingUrl, "https://meet.google.com/abc-defg-hij");
});

test("mapGoogleCalendarEvents recognizes Morning Class links from Coders", () => {
  const [event] = mapGoogleCalendarEvents([
    {
      id: "morning-class",
      summary: "Morning Class",
      description: "https://hub.coders.com.br/api/community/events/e6fcfcfc-3950-4",
      start: { dateTime: "2026-09-08T08:00:00-03:00" },
      end: { dateTime: "2026-09-08T09:00:00-03:00" }
    }
  ]);

  assert.equal(event.meetingUrl, "https://hub.coders.com.br/api/community/events/e6fcfcfc-3950-4");
  assert.equal(event.provider, "Coders");
});

test("parseCalendarEvents recognizes recurring Morning Class links from Coders", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:morning-class",
    "SUMMARY:Morning Class",
    "DTSTART:20260908T110000Z",
    "DTEND:20260908T120000Z",
    "RRULE:FREQ=WEEKLY;BYDAY=TU,WE,TH",
    "DESCRIPTION:https://hub.coders.com.br/api/community/events/e6fcfcfc-3950-4",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const [event] = parseCalendarEvents(ics, new Date("2026-09-08T12:00:00-03:00"));

  assert.equal(event.title, "Morning Class");
  assert.equal(event.provider, "Coders");
});

test("mapGoogleCalendarEvents reads routine progress from private metadata", () => {
  const [event] = mapGoogleCalendarEvents([
    {
      id: "routine",
      summary: "💻 Rotina: Programação",
      start: { dateTime: "2026-06-12T10:00:00-03:00" },
      end: { dateTime: "2026-06-12T18:00:00-03:00" },
      extendedProperties: {
        private: {
          rotinaSectionLabel: "Programação",
          rotinaCompleted: "7",
          rotinaTotal: "10",
        },
      },
    },
  ]);

  assert.deepEqual(event.routineProgress, { section: "Programação", done: 7, total: 10 });
});

test("parseCalendarEvents expands weekly events for the requested day", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:daily-1",
    "SUMMARY:Daily",
    "DTSTART:20260608T130000Z",
    "DTEND:20260608T133000Z",
    "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    "DESCRIPTION:https://meet.google.com/abc-defg-hij",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const events = parseCalendarEvents(ics, new Date("2026-06-12T12:00:00-03:00"));
  assert.equal(events.length, 1);
  assert.equal(events[0].title, "Daily");
  assert.equal(events[0].provider, "Google Meet");
});
