"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { weekDays } from "@/lib/manual-meetings";
import type { MeetingForm, ManualMeeting } from "@/lib/types";

type ManualMeetingsCardProps = {
  meetings: ManualMeeting[];
  todayCount: number;
  form: MeetingForm;
  setForm: Dispatch<SetStateAction<MeetingForm>>;
  onToggleDay: (day: number) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

export default function ManualMeetingsCard({
  meetings,
  todayCount,
  form,
  setForm,
  onToggleDay,
  onCreate,
  onDelete
}: ManualMeetingsCardProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onCreate();
  }

  return (
    <article className="routineCard" id="meetings">
      <span className="sectionProgress" style={{ width: "100%", background: "var(--blue)" }} />
      <div className="sectionHeader staticHeader">
        <span className="iconBadge" style={{ color: "var(--blue)", background: "rgba(106, 167, 255, 0.12)" }}>
          <CalendarDays size={17} aria-hidden />
        </span>
        <span className="sectionTitle">
          <strong>Reuniões recorrentes</strong>
          <small>cadastradas por você</small>
        </span>
        <span className="sectionActions">
          <span className="countBadge" style={{ color: "var(--blue)", background: "rgba(106, 167, 255, 0.12)" }}>
            {todayCount}/{meetings.length}
          </span>
        </span>
      </div>
      <div className="checklist">
        <form className="meetingForm" onSubmit={handleSubmit}>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Nome da reunião"
          />
          <div className="timeFields">
            <label>
              Início
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
              />
            </label>
            <label>
              Fim
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
              />
            </label>
          </div>
          <input
            value={form.meetingUrl}
            onChange={(event) => setForm((current) => ({ ...current, meetingUrl: event.target.value }))}
            placeholder="Link da reunião"
          />
          <div className="dayToggleGroup" aria-label="Dias da reunião">
            {weekDays.map((day) => (
              <button
                className={form.days.includes(day.value) ? "dayToggle selected" : "dayToggle"}
                key={day.value}
                type="button"
                onClick={() => onToggleDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
          <button className="meetingSubmit" type="submit">
            <Plus size={16} aria-hidden />
            Criar reunião
          </button>
        </form>

        {meetings.length === 0 && <div className="emptySection">Nenhuma reunião recorrente cadastrada.</div>}
        {meetings.map((meeting) => (
          <div className="meetingItem" key={meeting.id}>
            <div>
              <strong>{meeting.title}</strong>
              <small>
                {meeting.startTime}-{meeting.endTime} ·{" "}
                {weekDays.filter((day) => meeting.days.includes(day.value)).map((day) => day.label).join(", ")}
              </small>
            </div>
            <button
              className="deleteTaskButton"
              onClick={() => onDelete(meeting.id)}
              aria-label={`Excluir ${meeting.title}`}
            >
              <Trash2 size={15} aria-hidden />
              <span>Excluir</span>
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}
