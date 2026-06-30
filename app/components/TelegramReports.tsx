import { Loader2, Send } from "lucide-react";
import type { TelegramReportPeriod } from "@/lib/types";

type TelegramReportsProps = {
  automaticEnabled: boolean;
  sending: TelegramReportPeriod | null;
  message: string;
  onSend: (period: TelegramReportPeriod) => void;
  onToggleAutomatic: () => void;
};

const reports: Array<{ period: TelegramReportPeriod; label: string }> = [
  { period: "daily", label: "Diário" },
  { period: "weekly", label: "Semanal" },
  { period: "monthly", label: "Mensal" }
];

export default function TelegramReports({
  automaticEnabled,
  sending,
  message,
  onSend,
  onToggleAutomatic
}: TelegramReportsProps) {
  return (
    <div className="telegramReports">
      <div className="telegramReportButtons">
        {reports.map((report) => (
          <button
            key={report.period}
            type="button"
            disabled={Boolean(sending)}
            onClick={() => onSend(report.period)}
          >
            {sending === report.period ? <Loader2 className="spin" size={14} aria-hidden /> : <Send size={14} aria-hidden />}
            {report.label}
          </button>
        ))}
      </div>
      <button
        className={automaticEnabled ? "telegramAutomatic active" : "telegramAutomatic"}
        type="button"
        onClick={onToggleAutomatic}
      >
        Envios às 23h {automaticEnabled ? "ativados" : "desativados"}
      </button>
      <span>{message || "Diário nos dias úteis, semanal no domingo e mensal no último dia do mês."}</span>
    </div>
  );
}
