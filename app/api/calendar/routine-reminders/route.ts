import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { routineSections, type RoutineSection } from "@/lib/routine";

type GoogleEventListResponse = {
  items?: Array<{ id: string; summary?: string; recurrence?: string[] }>;
};

type SyncSection = Omit<RoutineSection, "items"> & {
  items: Array<{ label: string; completed?: boolean; days?: Array<0 | 1 | 2 | 3 | 4 | 5 | 6> }>;
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
    const body = await request.json().catch(() => undefined) as { sections?: SyncSection[] } | undefined;
    const sourceSections = body?.sections?.length ? body.sections : routineSections;
    const today = new Date();
    const timedSections = sourceSections.filter(
      (section) => parseTimeRange(section.time) && isSectionScheduledForDay(section, today.getDay())
    );
    const synced: string[] = [];

    for (const section of timedSections) {
      await upsertRoutineEvent({ section, calendarId, accessToken, timeZone, date: today });
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
  await deleteLegacyRecurringRoutineEvents({ section, calendarId, accessToken });
  const existingIds = await findExistingRoutineEvents({ section, calendarId, accessToken, dateKey });
  const eventBody = buildRoutineEvent(section, timeZone, date);
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

  await Promise.all(
    legacyEvents
      .filter((event) => event.recurrence?.length)
      .map((event) =>
        fetch(`${baseUrl}/${encodeURIComponent(event.id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      )
  );
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
  q
}: {
  calendarId: string;
  accessToken: string;
  privateExtendedProperties?: string[];
  q?: string;
}) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  privateExtendedProperties?.forEach((property) => url.searchParams.append("privateExtendedProperty", property));
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

function buildRoutineEvent(section: SyncSection, timeZone: string, date: Date) {
  const range = parseTimeRange(section.time);
  if (!range) throw new Error(`A seção ${section.label} não tem horário válido.`);

  const startDate = formatDateForCalendar(date);
  const completedCount = section.items.filter((item) => item.completed).length;
  const allCompleted = section.items.length > 0 && completedCount === section.items.length;

  return {
    summary: `${allCompleted ? "✅" : "⬜"} Rotina: ${section.label} (${completedCount}/${section.items.length})`,
    description: [
      section.note,
      section.items.length
        ? section.items.map((item) => `${item.completed ? "✅" : "⬜"} ${item.label}`).join("\n")
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
        rotinaDate: startDate
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
