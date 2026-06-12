import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export class GoogleCalendarAuthError extends Error {}

export async function getGoogleAccessToken() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("google_refresh_token")?.value;
  const currentAccessToken = cookieStore.get("google_access_token")?.value;
  const expiresAt = Number(cookieStore.get("google_token_expires_at")?.value ?? "0");

  if (currentAccessToken && expiresAt >= Date.now()) return currentAccessToken;
  if (!refreshToken) return currentAccessToken;

  const token = await requestGoogleToken({
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });
  setGoogleTokenCookies(cookieStore, token);
  return token.access_token;
}

export async function exchangeGoogleAuthorizationCode(code: string, redirectUri: string) {
  return requestGoogleToken({
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code
  });
}

export function setGoogleTokenCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>> | NextResponse["cookies"],
  token: GoogleTokenResponse
) {
  if (!token.access_token) throw new GoogleCalendarAuthError("O Google não retornou um token de acesso.");

  const expiresIn = token.expires_in ?? 3600;
  const commonCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };

  cookieStore.set("google_access_token", token.access_token, {
    ...commonCookieOptions,
    maxAge: expiresIn
  });
  cookieStore.set("google_token_expires_at", String(Date.now() + (expiresIn - 60) * 1000), {
    ...commonCookieOptions,
    maxAge: expiresIn
  });

  if (token.refresh_token) {
    cookieStore.set("google_refresh_token", token.refresh_token, {
      ...commonCookieOptions,
      maxAge: 60 * 60 * 24 * 90
    });
  }
}

export function clearGoogleAuthCookies(response: NextResponse) {
  response.cookies.delete("google_access_token");
  response.cookies.delete("google_refresh_token");
  response.cookies.delete("google_token_expires_at");
}

async function requestGoogleToken(parameters: Record<string, string>) {
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
      ...parameters
    })
  });
  const payload = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new GoogleCalendarAuthError(
      payload.error_description ?? payload.error ?? "Não consegui renovar o acesso ao Google Calendar."
    );
  }

  return payload;
}
