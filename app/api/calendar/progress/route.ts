import { NextResponse } from "next/server";
import { extractCalendarProgress } from "@/lib/calendar-progress";
import { mapGoogleCalendarEvents, type GoogleCalendarApiEvent } from "@/lib/calendar";
import { clearGoogleAuthCookies, getGoogleAccessToken, GoogleCalendarAuthError } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const timeZone = process.env.CALENDAR_TIMEZONE || "America/Sao_Paulo";
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const oauthConfigured = Boolean(googleClientId && googleClientSecret && process.env.GOOGLE_REDIRECT_URI);

  if (!oauthConfigured) {
    return NextResponse.json({
      configured: false,
      days: {},
      message: "Conecte o Google Calendar para recuperar o histórico da rotina."
    });
  }

  if (!isDateKey(start) || !isDateKey(end) || start > end) {
    return NextResponse.json(
      {
        configured: true,
        days: {},
        message: "Informe um período válido para recuperar o progresso."
      },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getGoogleAccessToken();

    if (!accessToken) {
      return NextResponse.json({
        configured: true,
        authRequired: true,
        days: {},
        message: "Conecte seu Google Calendar para recuperar o histórico da rotina."
      });
    }

    const events = await fetchCalendarEventsForRange({
      accessToken,
      calendarIds: getGoogleCalendarIds(),
      start,
      end,
      timeZone
    });

    return NextResponse.json({
      configured: true,
      days: extractCalendarProgress(events)
    });
  } catch (error) {
    if (error instanceof GoogleCalendarAuthError) {
      const response = NextResponse.json({
        configured: true,
        authRequired: true,
        days: {},
        message: "Sua sessão do Google expirou ou a permissão foi removida. Conecte o Google Calendar novamente."
      });
      clearGoogleAuthCookies(response);
      return response;
    }

    return NextResponse.json(
      {
        configured: true,
        days: {},
        message: error instanceof Error ? error.message : "Erro ao recuperar o histórico da rotina."
      },
      { status: 500 }
    );
  }
}

function getGoogleCalendarIds() {
  const configuredIds = process.env.GOOGLE_CALENDAR_IDS || process.env.GOOGLE_CALENDAR_ID || "";
  const calendarIds = configuredIds
    .split(",")
    .map((calendarId) => calendarId.trim())
    .filter(Boolean);

  return calendarIds.length ? calendarIds : ["primary"];
}

async function fetchCalendarEventsForRange({
  accessToken,
  calendarIds,
  start,
  end,
  timeZone
}: {
  accessToken: string;
  calendarIds: string[];
  start: string;
  end: string;
  timeZone: string;
}) {
  const eventsByCalendar = await Promise.all(
    calendarIds.map(async (calendarId) => {
      const url = getCalendarEventsUrl({ calendarId, start, end, timeZone });
      const response = await fetch(url, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new GoogleCalendarAuthError("Google Calendar precisa ser conectado novamente.");
        }

        throw new Error(`Não consegui recuperar o histórico do Google Calendar (${response.status}).`);
      }

      const payload = (await response.json()) as { items?: GoogleCalendarApiEvent[] };
      return mapGoogleCalendarEvents(payload.items ?? [], { calendarId });
    })
  );

  return eventsByCalendar.flat();
}

function getCalendarEventsUrl({
  calendarId,
  start,
  end,
  timeZone
}: {
  calendarId: string;
  start: string;
  end: string;
  timeZone: string;
}) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set("timeMin", zonedMidnightToUtc(start, timeZone).toISOString());
  url.searchParams.set("timeMax", zonedMidnightToUtc(nextDateKey(end), timeZone).toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeZone", timeZone);
  url.searchParams.set("q", "Rotina:");
  url.searchParams.set(
    "fields",
    "items(id,iCalUID,summary,start,end,extendedProperties)"
  );
  return url;
}

function isDateKey(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function nextDateKey(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

function zonedMidnightToUtc(dateKey: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const estimate = new Date(Date.UTC(year, month - 1, day));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(estimate);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  const offset = representedAsUtc - estimate.getTime();
  return new Date(estimate.getTime() - offset);
}
