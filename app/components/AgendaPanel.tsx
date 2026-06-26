"use client";

import { useMemo, useState, type MutableRefObject } from "react";
import { ArrowUpRight, CalendarDays, Loader2, Trash2 } from "lucide-react";
import { formatTime } from "@/lib/date";
import type { CalendarEvent, CalendarResponse, CalendarSyncSection } from "@/lib/types";

type AgendaPanelProps = {
  calendar: CalendarResponse | null;
  loading: boolean;
  error: string;
  manualEvents: CalendarEvent[];
  getReminderSections: () => CalendarSyncSection[];
  calendarSyncInProgress: MutableRefObject<boolean>;
};

export default function AgendaPanel({
  calendar,
  loading,
  error,
  manualEvents,
  getReminderSections,
  calendarSyncInProgress
}: AgendaPanelProps) {
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const events = useMemo(
    () =>
      [...manualEvents, ...(calendar?.events ?? [])]
        .filter((event) => Boolean(event.meetingUrl))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [calendar?.events, manualEvents]
  );

  async function syncRoutineReminders() {
    if (calendarSyncInProgress.current) {
      setSyncMessage("Aguarde a sincronização atual terminar e tente novamente.");
      return;
    }

    calendarSyncInProgress.current = true;
    setSyncing(true);
    setSyncMessage("");

    try {
      const response = await fetch("/api/calendar/routine-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: getReminderSections(), rangeDays: 30 })
      });
      const payload = (await response.json()) as { count?: number; message?: string };

      if (!response.ok) {
        setSyncMessage(payload.message ?? "Não consegui criar as notificações.");
        return;
      }

      setSyncMessage(`Rotina geral sincronizada: ${payload.count ?? 0} blocos nos próximos 30 dias.`);
    } catch {
      setSyncMessage("Não consegui criar as notificações.");
    } finally {
      calendarSyncInProgress.current = false;
      setSyncing(false);
    }
  }

  async function clearRoutineReminders() {
    if (clearing) return;
    const confirmed = window.confirm("Apagar todos os eventos da rotina criados pelo app no Google Calendar?");
    if (!confirmed) return;

    setClearing(true);
    setSyncMessage("");

    try {
      const response = await fetch("/api/calendar/routine-reminders", { method: "DELETE" });
      const payload = (await response.json()) as { deleted?: number; message?: string };

      if (!response.ok) {
        setSyncMessage(payload.message ?? "Não consegui limpar a rotina do Calendar.");
        return;
      }

      setSyncMessage(`Eventos da rotina apagados: ${payload.deleted ?? 0}.`);
    } catch {
      setSyncMessage("Não consegui limpar a rotina do Calendar.");
    } finally {
      setClearing(false);
    }
  }

  if (loading && manualEvents.length === 0) {
    return (
      <div className="agendaState">
        <Loader2 className="spin" size={18} aria-hidden />
        <span>Carregando agenda</span>
      </div>
    );
  }

  if (error && manualEvents.length === 0) return <div className="agendaState danger">{error}</div>;

  if (!calendar?.configured && manualEvents.length === 0) {
    return (
      <div className="agendaState">
        Defina o OAuth do Google ou <code>CALENDAR_ICS_URL</code> para conectar sua agenda.
      </div>
    );
  }

  if (calendar?.authRequired && manualEvents.length === 0) {
    return <CalendarConnect message={calendar.message ?? "Conecte seu Google Calendar para carregar sua agenda."} />;
  }

  if (events.length === 0) {
    return (
      <div className="agendaState agendaConnect">
        <span>Nenhum evento para hoje.</span>
        {calendar?.source === "oauth" && <DisconnectCalendarLink />}
      </div>
    );
  }

  return (
    <div className="agendaList">
      {calendar?.source === "oauth" && (
        <div className="calendarActions">
          <button className="syncButton" onClick={syncRoutineReminders} disabled={syncing}>
            {syncing ? "Sincronizando rotina..." : "Sincronizar rotina geral"}
          </button>
          <button className="clearCalendarButton" onClick={clearRoutineReminders} disabled={clearing}>
            {clearing ? <Loader2 className="spin" size={13} aria-hidden /> : <Trash2 size={13} aria-hidden />}
            {clearing ? "Limpando..." : "Limpar rotina do Calendar"}
          </button>
          <DisconnectCalendarLink />
          {syncMessage && <span>{syncMessage}</span>}
        </div>
      )}
      {error && <div className="agendaState danger">{error}</div>}
      {calendar?.authRequired && <CalendarConnect message={calendar.message ?? "Conecte sua agenda externa."} />}
      {events.map((event) => (
        <article className="agendaItem" key={event.id}>
          <div className="agendaTime">
            <CalendarDays size={15} aria-hidden />
            <span>{event.allDay ? "dia todo" : `${formatTime(event.startsAt)}-${formatTime(event.endsAt)}`}</span>
          </div>
          <strong>{event.title}</strong>
          {event.calendarId === "manual" && <small>reunião manual</small>}
          {event.location && <small>{event.location}</small>}
          <a href={event.meetingUrl} target="_blank" rel="noreferrer">
            Entrar na reunião
            <ArrowUpRight size={14} aria-hidden />
          </a>
        </article>
      ))}
    </div>
  );
}

function CalendarConnect({ message }: { message: string }) {
  return (
    <div className="agendaState agendaConnect">
      <span>{message}</span>
      <a className="connectButton" href="/api/auth/google">
        Conectar Google Calendar
        <ArrowUpRight size={14} aria-hidden />
      </a>
    </div>
  );
}

function DisconnectCalendarLink() {
  return (
    <a className="disconnectLink" href="/api/auth/google/logout">
      Desconectar Google Calendar
    </a>
  );
}
