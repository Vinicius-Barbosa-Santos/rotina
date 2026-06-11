import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { routineSections, type RoutineSection } from "@/lib/routine";

type GoogleEventListResponse = {
  items?: Array<{ id: string; summary?: string }>;
};

type RefreshResponse = {
  access_token?: string;
  expires_in?: number;
  error_description?: string;
};

class GoogleCalendarAuthError extends Error {}

const reminderMinutes = 10;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("google_refresh_token")?.value;
    let accessToken = cookieStore.get("google_access_token")?.value;
    const expiresAt = Number(cookieStore.get("google_token_expires_at")?.value ?? "0");

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { message: "Conecte seu Google Calendar antes de criar notificações." },
        { status: 401 }
      );
    }

    if ((!accessToken || expiresAt < Date.now()) && refreshToken) {
      const refreshed = await refreshGoogleAccessToken(refreshToken);
      accessToken = refreshed.accessToken;
      cookieStore.set("google_access_token", refreshed.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: refreshed.expiresIn
      });
      cookieStore.set("google_token_expires_at", String(Date.now() + (refreshed.expiresIn - 60) * 1000), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: refreshed.expiresIn
      });
    }

    if (!accessToken) {
      return NextResponse.json(
        { message: "Conecte seu Google Calendar antes de criar notificações." },
        { status: 401 }
      );
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const timeZone = process.env.CALENDAR_TIMEZONE || "America/Sao_Paulo";
    const body = await request.json().catch(() => undefined) as { sections?: RoutineSection[] } | undefined;
    const sourceSections = body?.sections?.length ? body.sections : routineSections;
    const timedSections = sourceSections.filter((section) => parseTimeRange(section.time));
    const synced: string[] = [];

    for (const section of timedSections) {
      await upsertRoutineEvent({ section, calendarId, accessToken, timeZone });
      synced.push(section.label);
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

async function upsertRoutineEvent({
  section,
  calendarId,
  accessToken,
  timeZone
}: {
  section: RoutineSection;
  calendarId: string;
  accessToken: string;
  timeZone: string;
}) {
  const existingIds = await findExistingRoutineEvents({ section, calendarId, accessToken });
  const eventBody = buildRoutineEvent(section, timeZone);
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const idsToUpdate = existingIds.length ? existingIds : [undefined];

  for (const existingId of idsToUpdate) {
    const url = existingId ? `${baseUrl}/${encodeURIComponent(existingId)}` : baseUrl;
    const response = await fetch(url, {
      method: existingId ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Não consegui sincronizar ${section.label} (${response.status}): ${errorText}`);
    }
  }
}

async function findExistingRoutineEvents({
  section,
  calendarId,
  accessToken
}: {
  section: RoutineSection;
  calendarId: string;
  accessToken: string;
}) {
  const ids = new Set<string>();
  const byPrivateProperty = await listRoutineEvents({
    calendarId,
    accessToken,
    privateExtendedProperty: `rotinaSectionKey=${section.key}`
  });
  byPrivateProperty.forEach((event) => ids.add(event.id));

  const byTitle = await listRoutineEvents({
    calendarId,
    accessToken,
    q: `Rotina: ${section.label}`
  });
  byTitle
    .filter((event) => event.summary === `Rotina: ${section.label}`)
    .forEach((event) => ids.add(event.id));

  return [...ids];
}

async function listRoutineEvents({
  calendarId,
  accessToken,
  privateExtendedProperty,
  q
}: {
  calendarId: string;
  accessToken: string;
  privateExtendedProperty?: string;
  q?: string;
}) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  if (privateExtendedProperty) url.searchParams.set("privateExtendedProperty", privateExtendedProperty);
  if (q) url.searchParams.set("q", q);
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("singleEvents", "false");
  url.searchParams.set("fields", "items(id,summary)");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as GoogleEventListResponse;
  return payload.items ?? [];
}

function buildRoutineEvent(section: RoutineSection, timeZone: string) {
  const range = parseTimeRange(section.time);
  if (!range) throw new Error(`A seção ${section.label} não tem horário válido.`);

  const start = nextDateForWeekday(new Date(), firstWeekdayForSection(section));
  const startDate = formatDateForCalendar(start);
  const recurrenceDays = recurrenceDaysForSection(section);

  return {
    summary: `Rotina: ${section.label}`,
    description: [
      section.note,
      section.items.length ? "Atividades: " + section.items.map((item) => item.label).join(", ") : undefined
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
    recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${recurrenceDays.join(",")}`],
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: reminderMinutes }]
    },
    extendedProperties: {
      private: {
        rotinaSectionKey: section.key
      }
    }
  };
}

function parseTimeRange(time: string) {
  const match = time.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (!match) return undefined;
  return { start: match[1], end: match[2] };
}

function firstWeekdayForSection(section: RoutineSection) {
  const days = daysForSection(section);
  return days[0] ?? 1;
}

function recurrenceDaysForSection(section: RoutineSection) {
  return daysForSection(section).map((day) => ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][day]);
}

function daysForSection(section: RoutineSection) {
  if (section.days?.length) return [...section.days].sort();
  const explicitDays = new Set(section.items.flatMap((item) => item.days ?? []));
  if (explicitDays.size > 0) return [...explicitDays].sort();
  return [0, 1, 2, 3, 4, 5, 6];
}

function nextDateForWeekday(date: Date, weekday: number) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const delta = (weekday - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + delta);
  return next;
}

function formatDateForCalendar(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("OAuth do Google não está configurado.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  const payload = (await response.json()) as RefreshResponse;

  if (!response.ok || !payload.access_token) {
    throw new GoogleCalendarAuthError(payload.error_description ?? "Não consegui renovar o acesso ao Google Calendar.");
  }

  return {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in ?? 3600
  };
}

function clearGoogleAuthCookies(response: NextResponse) {
  response.cookies.delete("google_access_token");
  response.cookies.delete("google_refresh_token");
  response.cookies.delete("google_token_expires_at");
}
