import assert from "node:assert/strict";
import test from "node:test";
import { deduplicateCalendarEvents, mapGoogleCalendarEvents, parseCalendarEvents } from "../lib/calendar.ts";

test("deduplicates the same meeting imported more than once", () => {
  const sharedMeeting = {
    title: "Daily Time de Desenvolvimento (N3 – Corretivas)",
    startsAt: "2026-09-08T10:15:00-03:00",
    endsAt: "2026-09-08T11:00:00-03:00",
    allDay: false,
    meetingUrl: "https://meet.google.com/abc-defg-hij"
  };
  const events = deduplicateCalendarEvents([
    { ...sharedMeeting, id: "calendar-a:event-1", calendarId: "calendar-a" },
    { ...sharedMeeting, id: "calendar-b:event-1", calendarId: "calendar-b" }
  ]);

  assert.equal(events.length, 1);
  assert.equal(events[0].id, "calendar-a:event-1");
});

test("deduplicates visually identical meetings even when their links are different", () => {
  const sharedTime = {
    title: "Daily",
    startsAt: "2026-09-08T10:15:00-03:00",
    endsAt: "2026-09-08T11:00:00-03:00",
    allDay: false
  };
  const events = deduplicateCalendarEvents([
    { ...sharedTime, id: "event-1", meetingUrl: "https://meet.google.com/abc-defg-hij" },
    { ...sharedTime, id: "event-2", title: "Daily!", meetingUrl: "https://meet.google.com/xyz-wxyz-xyz" }
  ]);

  assert.equal(events.length, 1);
});

test("deduplicates copies on different dates when title and visible time are equal", () => {
  const events = deduplicateCalendarEvents([
    {
      id: "event-today",
      title: "Daily Time de Desenvolvimento (N3 – Corretivas)",
      startsAt: "2026-09-09T10:15:00-03:00",
      endsAt: "2026-09-09T11:00:00-03:00",
      allDay: false,
      meetingUrl: "https://meet.google.com/abc-defg-hij"
    },
    {
      id: "event-adjacent-date",
      title: "Daily Time de Desenvolvimento (N3 - Corretivas)",
      startsAt: "2026-09-10T10:15:30-03:00",
      endsAt: "2026-09-10T11:00:30-03:00",
      allDay: false,
      meetingUrl: "https://meet.google.com/xyz-wxyz-xyz"
    }
  ], { timeZone: "America/Sao_Paulo" });

  assert.equal(events.length, 1);
});

test("keeps simultaneous meetings when their titles are different", () => {
  const events = deduplicateCalendarEvents([
    {
      id: "event-1",
      title: "Daily do time",
      startsAt: "2026-09-08T10:15:00-03:00",
      endsAt: "2026-09-08T11:00:00-03:00",
      allDay: false,
      meetingUrl: "https://meet.google.com/abc-defg-hij"
    },
    {
      id: "event-2",
      title: "Conversa com cliente",
      startsAt: "2026-09-08T10:15:30-03:00",
      endsAt: "2026-09-08T11:00:30-03:00",
      allDay: false,
      meetingUrl: "https://meet.google.com/xyz-wxyz-xyz"
    }
  ]);

  assert.equal(events.length, 2);
});

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
