import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-auth";
import {
  isRoutineSyncConfigured,
  readRoutineSyncData,
  type RoutineSyncData,
  writeRoutineSyncData
} from "@/lib/routine-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isRoutineSyncConfigured()) {
    return NextResponse.json({
      configured: false,
      message: "Configure o Supabase para sincronizar os dados entre dispositivos."
    });
  }

  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { configured: true, authRequired: true, message: "Conecte o Google Calendar para sincronizar sua rotina." },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json({ configured: true, data: await readRoutineSyncData() });
  } catch (error) {
    return NextResponse.json(
      { configured: true, message: error instanceof Error ? error.message : "Não consegui sincronizar." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!isRoutineSyncConfigured()) {
    return NextResponse.json({
      configured: false,
      message: "Configure o Supabase para sincronizar os dados entre dispositivos."
    });
  }

  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { configured: true, authRequired: true, message: "Conecte o Google Calendar para sincronizar sua rotina." },
      { status: 401 }
    );
  }

  try {
    const data = (await request.json()) as RoutineSyncData;
    await writeRoutineSyncData(data);
    return NextResponse.json({ configured: true, saved: true });
  } catch (error) {
    return NextResponse.json(
      { configured: true, message: error instanceof Error ? error.message : "Não consegui salvar a sincronização." },
      { status: 500 }
    );
  }
}
