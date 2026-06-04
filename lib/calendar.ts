export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location?: string;
  meetingUrl?: string;
  provider?: string;
  calendarId?: string;
};

export type GoogleCalendarApiEvent = {
  id?: string;
  iCalUID?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start?: {
    date?: string;
    dateTime?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
  };
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
  };
};

type RawEvent = {
  uid: string;
  summary: string;
  description: string;
  location: string;
  url: string;
  dtstart?: ParsedDate;
  dtend?: ParsedDate;
  rrule?: string;
};

type ParsedDate = {
  date: Date;
  allDay: boolean;
};

const meetingHosts = [
  ["meet.google.com", "Google Meet"],
  ["zoom.us", "Zoom"],
  ["teams.microsoft.com", "Microsoft Teams"],
  ["whereby.com", "Whereby"],
  ["webex.com", "Webex"],
  ["discord.com", "Discord"],
  ["facetime.apple.com", "FaceTime"]
] as const;

export function parseCalendarEvents(
  icsText: string,
  day = new Date(),
  timeZone = "America/Sao_Paulo"
): CalendarEvent[] {
  const dayStart = startOfLocalDay(day, timeZone);
  const dayEnd = addDays(dayStart, 1);
  const rawEvents = readRawEvents(icsText);

  return rawEvents
    .flatMap((event) => expandForDay(event, dayStart, dayEnd))
    .filter((event) => event.dtstart && event.dtend)
    .map((event) => toCalendarEvent(event))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function mapGoogleCalendarEvents(
  events: GoogleCalendarApiEvent[],
  options: { calendarId?: string } = {}
): CalendarEvent[] {
  const mappedEvents = events
    .map<CalendarEvent | null>((event) => {
      const startsAt = event.start?.dateTime ?? event.start?.date;
      const endsAt = event.end?.dateTime ?? event.end?.date;
      if (!startsAt || !endsAt) return null;

      const allDay = Boolean(event.start?.date);
      const meetingUrl = findGoogleMeetingUrl(event);
      const provider = meetingUrl ? identifyProvider(meetingUrl) : undefined;

      return {
        id: [options.calendarId, event.iCalUID ?? event.id ?? `${event.summary}-${startsAt}`]
          .filter(Boolean)
          .join(":"),
        title: event.summary || "Sem título",
        startsAt: normalizeGoogleDate(startsAt, allDay),
        endsAt: normalizeGoogleDate(endsAt, allDay),
        allDay,
        location: event.location || undefined,
        meetingUrl,
        provider,
        calendarId: options.calendarId
      };
    })
    .filter((event): event is CalendarEvent => Boolean(event));

  return mappedEvents.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function readRawEvents(icsText: string): RawEvent[] {
  const unfolded = icsText.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const events: RawEvent[] = [];
  let current: RawEvent | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = { uid: "", summary: "Sem título", description: "", location: "", url: "" };
      continue;
    }

    if (line === "END:VEVENT") {
      if (current?.dtstart) events.push(current);
      current = null;
      continue;
    }

    if (!current) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const left = line.slice(0, separator);
    const value = decodeIcsValue(line.slice(separator + 1));
    const [name, ...params] = left.split(";");
    const upperName = name.toUpperCase();
    const paramText = params.join(";");

    if (upperName === "UID") current.uid = value;
    if (upperName === "SUMMARY") current.summary = value || "Sem título";
    if (upperName === "DESCRIPTION") current.description = value;
    if (upperName === "LOCATION") current.location = value;
    if (upperName === "URL") current.url = value;
    if (upperName === "RRULE") current.rrule = value;
    if (upperName === "DTSTART") current.dtstart = parseIcsDate(value, paramText);
    if (upperName === "DTEND") current.dtend = parseIcsDate(value, paramText);
  }

  return events;
}

function expandForDay(event: RawEvent, dayStart: Date, dayEnd: Date): RawEvent[] {
  if (!event.dtstart) return [];
  const duration = Math.max(
    1,
    (event.dtend?.date.getTime() ?? event.dtstart.date.getTime() + 60 * 60 * 1000) -
      event.dtstart.date.getTime()
  );

  if (!event.rrule) {
    const endsAt = event.dtend?.date ?? new Date(event.dtstart.date.getTime() + duration);
    return overlaps(event.dtstart.date, endsAt, dayStart, dayEnd)
      ? [{ ...event, dtend: { date: endsAt, allDay: event.dtstart.allDay } }]
      : [];
  }

  const candidates: RawEvent[] = [];
  const rule = parseRRule(event.rrule);
  const interval = Number(rule.INTERVAL ?? "1") || 1;
  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL, "")?.date : undefined;
  const count = rule.COUNT ? Number(rule.COUNT) : undefined;
  const frequency = rule.FREQ;
  const byDay = rule.BYDAY?.split(",") ?? [];
  let occurrences = 0;
  let cursor = new Date(event.dtstart.date);

  for (let safety = 0; safety < 1500; safety += 1) {
    if (count && occurrences >= count) break;
    if (until && cursor > until) break;
    if (cursor >= dayEnd && frequency !== "MONTHLY") break;

    const shouldInclude =
      frequency === "DAILY" ||
      (frequency === "WEEKLY" &&
        (!byDay.length || byDay.includes(weekdayCode(cursor))) &&
        weeksBetween(event.dtstart.date, cursor) % interval === 0) ||
      (frequency === "MONTHLY" &&
        cursor.getUTCDate() === event.dtstart.date.getUTCDate() &&
        monthsBetween(event.dtstart.date, cursor) % interval === 0);

    if (shouldInclude) {
      occurrences += 1;
      const start = new Date(cursor);
      const end = new Date(start.getTime() + duration);
      if (overlaps(start, end, dayStart, dayEnd)) {
        candidates.push({
          ...event,
          dtstart: { ...event.dtstart, date: start },
          dtend: { allDay: event.dtstart.allDay, date: end }
        });
      }
    }

    cursor =
      frequency === "MONTHLY"
        ? addMonths(cursor, 1)
        : addDays(cursor, frequency === "DAILY" ? interval : 1);
  }

  return candidates;
}

function toCalendarEvent(event: RawEvent): CalendarEvent {
  const textWithLinks = [event.url, event.location, event.description].filter(Boolean).join(" ");
  const meetingUrl = findMeetingUrl(textWithLinks);
  const provider = meetingUrl ? identifyProvider(meetingUrl) : undefined;

  return {
    id: event.uid || `${event.summary}-${event.dtstart?.date.toISOString()}`,
    title: event.summary,
    startsAt: event.dtstart!.date.toISOString(),
    endsAt: event.dtend!.date.toISOString(),
    allDay: event.dtstart!.allDay,
    location: event.location || undefined,
    meetingUrl,
    provider
  };
}

function parseIcsDate(value: string, params: string): ParsedDate | undefined {
  const allDay = params.includes("VALUE=DATE") || /^\d{8}$/.test(value);

  if (/^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    return { date: new Date(Date.UTC(year, month, day)), allDay: true };
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!match) return undefined;

  const [, y, m, d, hh, mm, ss, z] = match;
  const date =
    z === "Z"
      ? new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss))
      : new Date(+y, +m - 1, +d, +hh, +mm, +ss);

  return { date, allDay };
}

function parseRRule(rule: string) {
  return Object.fromEntries(
    rule.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  ) as Record<string, string | undefined>;
}

function findMeetingUrl(text: string) {
  const urls = text.match(/https?:\/\/[^\s<>"')]+/g) ?? [];
  return urls.find((url) => meetingHosts.some(([host]) => url.includes(host))) ?? urls[0];
}

function findGoogleMeetingUrl(event: GoogleCalendarApiEvent) {
  const conferenceUrl = event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri;
  const textWithLinks = [
    conferenceUrl,
    event.hangoutLink,
    event.htmlLink,
    event.location,
    event.description
  ]
    .filter(Boolean)
    .join(" ");

  return findMeetingUrl(textWithLinks);
}

function identifyProvider(url: string) {
  return meetingHosts.find(([host]) => url.includes(host))?.[1] ?? "Link";
}

function decodeIcsValue(value: string) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function normalizeGoogleDate(value: string, allDay: boolean) {
  return allDay ? new Date(`${value}T00:00:00`).toISOString() : new Date(value).toISOString();
}

function overlaps(start: Date, end: Date, rangeStart: Date, rangeEnd: Date) {
  return start < rangeEnd && end > rangeStart;
}

function startOfLocalDay(day: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(day);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  return new Date(`${value("year")}-${value("month")}-${value("day")}T00:00:00`);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function weeksBetween(start: Date, end: Date) {
  return Math.floor((startOfUtcDay(end).getTime() - startOfUtcDay(start).getTime()) / 604800000);
}

function monthsBetween(start: Date, end: Date) {
  return (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function weekdayCode(date: Date) {
  return ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][date.getDay()];
}
