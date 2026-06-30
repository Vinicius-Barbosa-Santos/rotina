import { NextResponse } from "next/server";
import { readRoutineSyncData, writeRoutineSyncData } from "@/lib/routine-sync";
import {
  buildAutomatedTelegramReport,
  getDateKeyInTimeZone,
  getDueTelegramReportPeriods
} from "@/lib/telegram-automation";
import { formatTelegramReport } from "@/lib/telegram-report";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    return NextResponse.json(
      { message: "Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID." },
      { status: 503 }
    );
  }

  try {
    const syncData = await readRoutineSyncData();
    if (!syncData) {
      return NextResponse.json({ message: "Configure o Supabase para os envios automáticos." }, { status: 503 });
    }
    if (!syncData.telegramAutomaticEnabled) {
      return NextResponse.json({ ok: true, skipped: "automatic-disabled" });
    }

    const timeZone = process.env.CALENDAR_TIMEZONE || "America/Sao_Paulo";
    const reportDate = getDateKeyInTimeZone(new Date(), timeZone);
    const periods = getDueTelegramReportPeriods(reportDate);
    const sent: string[] = [];

    for (const period of periods) {
      const sentKey = `${period}-${reportDate}`;
      if (syncData.telegramReportsSent[sentKey]) continue;

      const report = buildAutomatedTelegramReport(syncData, period, reportDate);
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
      if (!response.ok) throw new Error(payload.description ?? "O Telegram não conseguiu enviar o relatório.");

      syncData.telegramReportsSent[sentKey] = true;
      sent.push(period);
    }

    if (sent.length) await writeRoutineSyncData(syncData);
    return NextResponse.json({ ok: true, date: reportDate, sent });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Não consegui enviar os relatórios automáticos." },
      { status: 500 }
    );
  }
}
