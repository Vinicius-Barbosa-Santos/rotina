import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-auth";
import { formatTelegramReport, isRoutineReport } from "@/lib/telegram-report";

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json(
      { message: "Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID para enviar relatórios." },
      { status: 503 }
    );
  }

  const googleAccessToken = await getGoogleAccessToken();
  if (!googleAccessToken) {
    return NextResponse.json(
      { message: "Conecte seu Google Calendar antes de enviar relatórios pelo Telegram." },
      { status: 401 }
    );
  }

  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  if (origin && origin !== requestOrigin) {
    return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  }

  const report = await request.json().catch(() => null);
  if (!isRoutineReport(report)) {
    return NextResponse.json({ message: "Relatório inválido." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatTelegramReport(report),
        disable_web_page_preview: true
      })
    });
    const payload = (await response.json()) as { description?: string };

    if (!response.ok) {
      return NextResponse.json(
        { message: payload.description ?? "O Telegram não conseguiu enviar o relatório." },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Não consegui acessar o Telegram agora." }, { status: 502 });
  }
}
