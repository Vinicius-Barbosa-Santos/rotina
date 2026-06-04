import { NextResponse } from "next/server";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.headers
    .get("cookie")
    ?.split("; ")
    .find((cookie) => cookie.startsWith("google_oauth_state="))
    ?.split("=")[1];

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { message: "Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI." },
      { status: 500 }
    );
  }

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.json({ message: "Callback OAuth inválido." }, { status: 400 });
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code
    })
  });
  const token = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !token.access_token) {
    return NextResponse.json(
      { message: token.error_description ?? token.error ?? "Não consegui conectar o Google Calendar." },
      { status: 502 }
    );
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  const commonCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };

  response.cookies.delete("google_oauth_state");
  response.cookies.set("google_access_token", token.access_token, {
    ...commonCookieOptions,
    maxAge: token.expires_in ?? 3600
  });
  response.cookies.set("google_token_expires_at", String(Date.now() + ((token.expires_in ?? 3600) - 60) * 1000), {
    ...commonCookieOptions,
    maxAge: token.expires_in ?? 3600
  });

  if (token.refresh_token) {
    response.cookies.set("google_refresh_token", token.refresh_token, {
      ...commonCookieOptions,
      maxAge: 60 * 60 * 24 * 90
    });
  }

  return response;
}
