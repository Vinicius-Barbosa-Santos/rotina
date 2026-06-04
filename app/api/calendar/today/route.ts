import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mapGoogleCalendarEvents, parseCalendarEvents, type GoogleCalendarApiEvent } from "@/lib/calendar";

export const dynamic = "force-dynamic";

class GoogleCalendarAuthError extends Error {}

export async function GET(request: Request) {
  const calendarUrl = process.env.CALENDAR_ICS_URL;
  const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
  const googleCalendarIds = getGoogleCalendarIds();
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const timeZone = process.env.CALENDAR_TIMEZONE || "America/Sao_Paulo";
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const day = dateParam ? new Date(`${dateParam}T12:00:00`) : new Date();
  const oauthConfigured = Boolean(googleClientId && googleClientSecret && process.env.GOOGLE_REDIRECT_URI);

  if (!calendarUrl && (!googleCalendarIds.length || !googleApiKey) && !oauthConfigured) {
    return NextResponse.json({
      configured: false,
      events: [],
      message: "Defina OAuth do Google, GOOGLE_CALENDAR_IDS + GOOGLE_API_KEY ou CALENDAR_ICS_URL para carregar sua agenda."
    });
  }

  try {
    if (oauthConfigured) {
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get("google_refresh_token")?.value;
      let accessToken = cookieStore.get("google_access_token")?.value;
      const expiresAt = Number(cookieStore.get("google_token_expires_at")?.value ?? "0");

      if (!accessToken && !refreshToken) {
        return NextResponse.json({
          configured: true,
          authRequired: true,
          source: "oauth",
          events: [],
          message: "Conecte seu Google Calendar para carregar sua agenda."
        });
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
        return NextResponse.json({
          configured: true,
          authRequired: true,
          source: "oauth",
          events: [],
          message: "Conecte seu Google Calendar para carregar sua agenda."
        });
      }

      const events = await fetchGoogleCalendarEventsFromMany({
        calendarIds: googleCalendarIds.length ? googleCalendarIds : ["primary"],
        accessToken,
        day,
        timeZone
      });

      return NextResponse.json({
        configured: true,
        source: "oauth",
        timeZone,
        events
      });
    }

    if (googleCalendarIds.length && googleApiKey) {
      const events = await fetchGoogleCalendarEventsFromManyWithApiKey({
        calendarIds: googleCalendarIds,
        apiKey: googleApiKey,
        day,
        timeZone
      });

      return NextResponse.json({
        configured: true,
        source: "google",
        timeZone,
        events
      });
    }

    if (!calendarUrl) {
      return NextResponse.json({
        configured: false,
        events: [],
        message: "Defina CALENDAR_ICS_URL para carregar sua agenda."
      });
    }

    const response = await fetch(calendarUrl, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        {
          configured: true,
          events: [],
          message: `Não consegui carregar o calendário (${response.status}).`
        },
        { status: 502 }
      );
    }

    const icsText = await response.text();
    const events = parseCalendarEvents(icsText, day, timeZone);

    return NextResponse.json({
      configured: true,
      source: "ics",
      timeZone,
      events
    });
  } catch (error) {
    if (error instanceof GoogleCalendarAuthError) {
      return NextResponse.json({
        configured: true,
        authRequired: true,
        source: "oauth",
        events: [],
        message: "Sua sessão do Google expirou ou a permissão foi removida. Conecte o Google Calendar novamente."
      });
    }

    return NextResponse.json(
      {
        configured: true,
        events: [],
        message: error instanceof Error ? error.message : "Erro ao carregar o calendário."
      },
      { status: 500 }
    );
  }
}

function getGoogleCalendarIds() {
  const configuredIds = process.env.GOOGLE_CALENDAR_IDS || process.env.GOOGLE_CALENDAR_ID || "";
  return configuredIds
    .split(",")
    .map((calendarId) => calendarId.trim())
    .filter(Boolean);
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
  const payload = (await response.json()) as { access_token?: string; expires_in?: number; error_description?: string };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? "Não consegui renovar o acesso ao Google Calendar.");
  }

  return {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in ?? 3600
  };
}

async function fetchGoogleCalendarEventsWithToken({
  calendarId,
  accessToken,
  day,
  timeZone
}: {
  calendarId: string;
  accessToken: string;
  day: Date;
  timeZone: string;
}) {
  const { timeMin, timeMax } = getDayRange(day);
  const url = getGoogleCalendarEventsUrl({ calendarId, timeMin, timeMax, timeZone });
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new GoogleCalendarAuthError("Google Calendar precisa ser conectado novamente.");
    }

    throw new Error(`Não consegui carregar o Google Calendar (${response.status}).`);
  }

  const payload = (await response.json()) as { items?: GoogleCalendarApiEvent[] };
  return mapGoogleCalendarEvents(payload.items ?? [], { calendarId });
}

async function fetchGoogleCalendarEventsFromMany({
  calendarIds,
  accessToken,
  day,
  timeZone
}: {
  calendarIds: string[];
  accessToken: string;
  day: Date;
  timeZone: string;
}) {
  const eventsByCalendar = await Promise.all(
    calendarIds.map((calendarId) =>
      fetchGoogleCalendarEventsWithToken({
        calendarId,
        accessToken,
        day,
        timeZone
      })
    )
  );

  return eventsByCalendar.flat().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

async function fetchGoogleCalendarEvents({
  calendarId,
  apiKey,
  day,
  timeZone
}: {
  calendarId: string;
  apiKey: string;
  day: Date;
  timeZone: string;
}) {
  const { timeMin, timeMax } = getDayRange(day);
  const url = getGoogleCalendarEventsUrl({ calendarId, timeMin, timeMax, timeZone });
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Não consegui carregar o Google Calendar (${response.status}).`);
  }

  const payload = (await response.json()) as { items?: GoogleCalendarApiEvent[] };
  return mapGoogleCalendarEvents(payload.items ?? [], { calendarId });
}

async function fetchGoogleCalendarEventsFromManyWithApiKey({
  calendarIds,
  apiKey,
  day,
  timeZone
}: {
  calendarIds: string[];
  apiKey: string;
  day: Date;
  timeZone: string;
}) {
  const eventsByCalendar = await Promise.all(
    calendarIds.map((calendarId) =>
      fetchGoogleCalendarEvents({
        calendarId,
        apiKey,
        day,
        timeZone
      })
    )
  );

  return eventsByCalendar.flat().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function getGoogleCalendarEventsUrl({
  calendarId,
  timeMin,
  timeMax,
  timeZone
}: {
  calendarId: string;
  timeMin: string;
  timeMax: string;
  timeZone: string;
}) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeZone", timeZone);
  url.searchParams.set(
    "fields",
    "items(id,iCalUID,summary,description,location,htmlLink,hangoutLink,start,end,conferenceData(entryPoints(entryPointType,uri)))"
  );
  return url;
}

function getDayRange(day: Date) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString()
  };
}
