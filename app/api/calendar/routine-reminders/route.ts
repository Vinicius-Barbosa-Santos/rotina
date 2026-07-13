import { NextResponse } from "next/server";
import { clearGoogleAuthCookies, getGoogleAccessToken, GoogleCalendarAuthError } from "@/lib/google-auth";
import { clampCalendarRoutineSyncDays } from "@/lib/calendar-routine-sync";
import { getRoutineSectionEmoji, routineReferenceSections, trackedRoutineSections, type RoutineSection } from "@/lib/routine";
import { isSaoPauloHolidayDate } from "@/lib/sao-paulo-holidays";
import { getTaskEmoji, type TaskIconName } from "@/lib/task-icons";

export const maxDuration = 60;

type GoogleEventListResponse = {
  items?: Array<{ id: string; summary?: string; recurrence?: string[] }>;
};

type SyncSection = Omit<RoutineSection, "items"> & {
  items: Array<{ label: string; icon?: TaskIconName; completed?: boolean; days?: Array<0 | 1 | 2 | 3 | 4 | 5 | 6> }>;
};

const reminderMinutes = 10;
const googleRequestRetries = 5;
const googleRetryDelayMs = 750;

export async function POST(request: Request) {
  try {
    const accessToken = await getGoogleAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { message: "Conecte seu Google Calendar antes de criar notificações." },
        { status: 401 }
      );
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const timeZone = process.env.CALENDAR_TIMEZONE || "America/Sao_Paulo";
    const body = await request.json().catch(() => undefined) as
      | { sections?: SyncSection[]; rangeDays?: number }
      | undefined;
    const sourceSections = body?.sections?.length ? body.sections : trackedRoutineSections;
    const rangeDays = clampCalendarRoutineSyncDays(body?.rangeDays);
    const dates = getCalendarDates(rangeDays, timeZone);
    const synced: string[] = [];

    await deleteObsoleteRoutineEvents({
      sectionKeys: routineReferenceSections.map((section) => section.key),
      calendarId,
      accessToken
    });

    if (rangeDays > 1) {
      for (const sectionBatch of chunk(sourceSections, 3)) {
        await Promise.all(
          sectionBatch.map((section) => deleteLegacyRecurringRoutineEvents({ section, calendarId, accessToken }))
        );
      }
    }

    const syncTasks = dates.flatMap((date) =>
      sourceSections
        .filter((section) => !isSaoPauloHolidayDate(date) && parseTimeRange(section.time) && isSectionScheduledForDay(section, date.getUTCDay()))
        .map((section) => ({ date, section }))
    );

    for (const taskBatch of chunk(syncTasks, 3)) {
      await Promise.all(
        taskBatch.map(async ({ date, section }) => {
          await upsertRoutineEvent({ section, calendarId, accessToken, timeZone, date });
          synced.push(`${formatDateForCalendar(date)}:${section.label}`);
        })
      );
    }

    return NextResponse.json({
      ok: true,
      count: synced.length,
      reminderMinutes,
      synced
    });
  } catch (error) {
    if (error instanceof GoogleCalendarAuthError) {
      const response = NextResponse.json(
        { message: "Sua sessão do Google expirou. Conecte o Google Calendar novamente." },
        { status: 401 }
      );
      clearGoogleAuthCookies(response);
      return response;
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Não consegui criar as notificações." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const accessToken = await getGoogleAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { message: "Conecte seu Google Calendar antes de limpar a rotina." },
        { status: 401 }
      );
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const deleted = await deleteAllRoutineEvents({ calendarId, accessToken });

    return NextResponse.json({
      ok: true,
      deleted
    });
  } catch (error) {
    if (error instanceof GoogleCalendarAuthError) {
      const response = NextResponse.json(
        { message: "Sua sessão do Google expirou. Conecte o Google Calendar novamente." },
        { status: 401 }
      );
      clearGoogleAuthCookies(response);
      return response;
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Não consegui limpar a rotina do Google Calendar." },
      { status: 500 }
    );
  }
}

async function upsertRoutineEvent({
  section,
  calendarId,
  accessToken,
  timeZone,
  date
}: {
  section: SyncSection;
  calendarId: string;
  accessToken: string;
  timeZone: string;
  date: Date;
}) {
  const dateKey = formatDateForCalendar(date);
  const existingIds = await findExistingRoutineEvents({ section, calendarId, accessToken, dateKey });
  const eventBody = buildRoutineEvent(section, timeZone, date);
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const idsToUpdate = existingIds.length ? existingIds : [undefined];

  for (const existingId of idsToUpdate) {
    const url = existingId ? `${baseUrl}/${encodeURIComponent(existingId)}` : baseUrl;
    const response = await googleCalendarFetch(url, {
      method: existingId ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throwGoogleCalendarError(response.status, errorText, `sincronizar ${section.label}`);
    }
  }
}

async function deleteLegacyRecurringRoutineEvents({
  section,
  calendarId,
  accessToken
}: {
  section: SyncSection;
  calendarId: string;
  accessToken: string;
}) {
  const legacyEvents = await listRoutineEvents({
    calendarId,
    accessToken,
    privateExtendedProperties: [`rotinaSectionKey=${section.key}`]
  });
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  for (const eventBatch of chunk(legacyEvents.filter((event) => event.recurrence?.length), 3)) {
    await Promise.all(
      eventBatch.map(async (event) => {
        const response = await googleCalendarFetch(`${baseUrl}/${encodeURIComponent(event.id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throwGoogleCalendarError(response.status, errorText, `remover a rotina antiga de ${section.label}`);
        }
      })
    );
  }
}

async function deleteAllRoutineEvents({
  calendarId,
  accessToken
}: {
  calendarId: string;
  accessToken: string;
}) {
  const routineEvents = await listAllRoutineEvents({ calendarId, accessToken });
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  let deleted = 0;

  for (const eventBatch of chunk(routineEvents, 3)) {
    await Promise.all(
      eventBatch.map(async (event) => {
        const response = await googleCalendarFetch(`${baseUrl}/${encodeURIComponent(event.id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok && response.status !== 410) {
          const errorText = await response.text();
          throwGoogleCalendarError(response.status, errorText, "remover eventos da rotina");
        }

        deleted += 1;
      })
    );
  }

  return deleted;
}

async function deleteObsoleteRoutineEvents({
  sectionKeys,
  calendarId,
  accessToken
}: {
  sectionKeys: string[];
  calendarId: string;
  accessToken: string;
}) {
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  for (const sectionKey of sectionKeys) {
    const events = await listRoutineEvents({
      calendarId,
      accessToken,
      privateExtendedProperties: [`rotinaSectionKey=${sectionKey}`],
      maxResults: 250
    });

    for (const eventBatch of chunk(events, 3)) {
      await Promise.all(eventBatch.map(async (event) => {
        const response = await googleCalendarFetch(`${baseUrl}/${encodeURIComponent(event.id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok && response.status !== 410) {
          const errorText = await response.text();
          throwGoogleCalendarError(response.status, errorText, "remover blocos antigos da rotina");
        }
      }));
    }
  }
}

async function listAllRoutineEvents({
  calendarId,
  accessToken
}: {
  calendarId: string;
  accessToken: string;
}) {
  const events = new Map<string, { id: string; summary?: string; recurrence?: string[] }>();

  for (const sectionBatch of chunk(trackedRoutineSections, 3)) {
    const batchEvents = await Promise.all(
      sectionBatch.map((section) =>
        listRoutineEvents({
          calendarId,
          accessToken,
          privateExtendedProperties: [`rotinaSectionKey=${section.key}`],
          maxResults: 250
        })
      )
    );
    batchEvents.flat().forEach((event) => events.set(event.id, event));
  }

  const byTitle = await listRoutineEvents({
    calendarId,
    accessToken,
    q: "Rotina:",
    maxResults: 250
  });
  byTitle
    .filter((event) => event.summary?.includes("Rotina:"))
    .forEach((event) => events.set(event.id, event));

  return [...events.values()];
}

async function findExistingRoutineEvents({
  section,
  calendarId,
  accessToken,
  dateKey
}: {
  section: SyncSection;
  calendarId: string;
  accessToken: string;
  dateKey: string;
}) {
  const ids = new Set<string>();
  const byPrivateProperty = await listRoutineEvents({
    calendarId,
    accessToken,
    privateExtendedProperties: [`rotinaSectionKey=${section.key}`, `rotinaDate=${dateKey}`]
  });
  byPrivateProperty.forEach((event) => ids.add(event.id));

  return [...ids];
}

async function listRoutineEvents({
  calendarId,
  accessToken,
  privateExtendedProperties,
  q,
  maxResults = 10
}: {
  calendarId: string;
  accessToken: string;
  privateExtendedProperties?: string[];
  q?: string;
  maxResults?: number;
}) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  privateExtendedProperties?.forEach((property) => url.searchParams.append("privateExtendedProperty", property));
  if (q) url.searchParams.set("q", q);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("singleEvents", "false");
  url.searchParams.set("fields", "items(id,summary,recurrence)");

  const response = await googleCalendarFetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throwGoogleCalendarError(response.status, errorText, "consultar eventos da rotina");
  }

  const payload = (await response.json()) as GoogleEventListResponse;
  return payload.items ?? [];
}

function buildRoutineEvent(section: SyncSection, timeZone: string, date: Date) {
  const range = parseTimeRange(section.time);
  if (!range) throw new Error(`A seção ${section.label} não tem horário válido.`);

  const startDate = formatDateForCalendar(date);
  const items = section.items.filter((item) => !item.days?.length || item.days.includes(date.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6));
  const isToday = startDate === formatDateInTimeZone(new Date(), timeZone);
  const completedCount = isToday ? items.filter((item) => item.completed).length : 0;

  return {
    summary: `${getRoutineSectionEmoji(section)} Rotina: ${section.label}`,
    description: [
      section.note,
      items.length
        ? items.map((item) => `${getTaskEmoji(item.label, item.icon)} ${item.label}`).join("\n")
        : undefined
    ]
      .filter(Boolean)
      .join("\n\n"),
    start: {
      dateTime: `${startDate}T${range.start}:00`,
      timeZone
    },
    end: {
      dateTime: `${startDate}T${range.end}:00`,
      timeZone
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: reminderMinutes }]
    },
    extendedProperties: {
      private: {
        rotinaSectionKey: section.key,
        rotinaDate: startDate,
        rotinaSectionLabel: section.label,
        rotinaCompleted: String(completedCount),
        rotinaTotal: String(items.length)
      }
    }
  };
}

function parseTimeRange(time: string) {
  const match = time.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (!match) return undefined;
  return { start: match[1], end: match[2] };
}

function daysForSection(section: SyncSection) {
  if (section.days?.length) return [...section.days].sort();
  const explicitDays = new Set(section.items.flatMap((item) => item.days ?? []));
  if (explicitDays.size > 0) return [...explicitDays].sort();
  return [0, 1, 2, 3, 4, 5, 6];
}

function isSectionScheduledForDay(section: SyncSection, weekday: number) {
  return daysForSection(section).includes(weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6);
}

function formatDateForCalendar(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

function getCalendarDates(rangeDays: number, timeZone: string) {
  const [year, month, day] = formatDateInTimeZone(new Date(), timeZone).split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 12));

  return Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date;
  });
}

function chunk<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size)
  );
}

async function googleCalendarFetch(input: string | URL, init?: RequestInit) {
  for (let attempt = 0; attempt < googleRequestRetries; attempt += 1) {
    const response = await fetch(input, init);
    const shouldRetry = await isGoogleRateLimitResponse(response);

    if (!shouldRetry || attempt === googleRequestRetries - 1) {
      return response;
    }

    const retryAfterSeconds = Number(response.headers.get("retry-after") ?? "0");
    const delay = retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : googleRetryDelayMs * 2 ** attempt;
    await wait(delay);
  }

  throw new Error("Não consegui acessar o Google Calendar.");
}

async function isGoogleRateLimitResponse(response: Response) {
  if (response.status === 429) return true;
  if (response.status !== 403) return false;

  const errorText = await response.clone().text();
  return errorText.includes("rateLimitExceeded") || errorText.includes("userRateLimitExceeded");
}

function throwGoogleCalendarError(status: number, errorText: string, action: string): never {
  if (status === 401) {
    throw new GoogleCalendarAuthError();
  }

  if (status === 403 || status === 429) {
    throw new Error("O Google Calendar está temporariamente ocupado. Aguarde alguns segundos e tente novamente.");
  }

  throw new Error(`Não consegui ${action} no Google Calendar (${status}): ${errorText}`);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function formatDateInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
