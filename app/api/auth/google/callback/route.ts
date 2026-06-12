import { NextResponse } from "next/server";
import { exchangeGoogleAuthorizationCode, GoogleCalendarAuthError, setGoogleTokenCookies } from "@/lib/google-auth";

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

  try {
    const token = await exchangeGoogleAuthorizationCode(code, redirectUri);
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("google_oauth_state");
    setGoogleTokenCookies(response.cookies, token);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof GoogleCalendarAuthError
          ? error.message
          : "Não consegui conectar o Google Calendar."
      },
      { status: 502 }
    );
  }
}
