import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete("google_access_token");
  response.cookies.delete("google_refresh_token");
  response.cookies.delete("google_token_expires_at");
  response.cookies.delete("google_oauth_state");
  return response;
}
