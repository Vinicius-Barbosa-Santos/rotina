"use client";

import { useState } from "react";
import { Check, Gauge, Plus, Target, Trash2 } from "lucide-react";
import type { WeeklyPriority } from "@/lib/types";

type WeeklyFocusPanelProps = {
  priorities: WeeklyPriority[];
  currentWeekKey: string;
  inProgressCount: number;
  reviewedThisWeek: number;
  onAdd: (label: string) => void;
  onUpdate: (id: string, update: { label?: string; done?: boolean; remove?: boolean }) => void;
};

export default function WeeklyFocusPanel({
  priorities,
  currentWeekKey,
  inProgressCount,
  reviewedThisWeek,
  onAdd,
  onUpdate
}: WeeklyFocusPanelProps) {
  const [newPriority, setNewPriority] = useState("");
  const completed = priorities.filter((priority) => priority.done).length;
  const activeLoad = priorities.filter((priority) => !priority.done).length + inProgressCount;
  const load = activeLoad <= 2
    ? { label: "Leve", tone: "light", detail: "Há espaço para avançar sem sobrecarga." }
    : activeLoad <= 4
      ? { label: "Equilibrada", tone: "balanced", detail: "Carga adequada para manter consistência." }
      : { label: "Alta", tone: "high", detail: "Conclua algo antes de assumir um novo foco." };
  const isFriday = new Date().getDay() === 5;

  function submitPriority(event: React.FormEvent) {
    event.preventDefault();
    if (!newPriority.trim() || priorities.length >= 3) return;
    onAdd(newPriority);
    setNewPriority("");
  }

  return (
    <article className="weeklyFocusCard" aria-labelledby="weekly-focus-title">
      <div className="weeklyFocusIntro">
        <span className="weeklyFocusIcon"><Target size={18} aria-hidden /></span>
        <div>
          <p className="eyebrow">foco essencial</p>
          <h3 id="weekly-focus-title">Três prioridades da semana</h3>
          <small>Semana iniciada em {new Intl.DateTimeFormat("pt-BR").format(new Date(`${currentWeekKey}T12:00:00`))}</small>
        </div>
      </div>

      <div className="weeklyPriorityList">
        {priorities.map((priority, index) => (
          <div className={priority.done ? "weeklyPriority done" : "weeklyPriority"} key={priority.id}>
            <button type="button" className="weeklyPriorityCheck" onClick={() => onUpdate(priority.id, { done: !priority.done })} aria-label={priority.done ? `Reabrir ${priority.label}` : `Concluir ${priority.label}`}>
              {priority.done ? <Check size={14} aria-hidden /> : index + 1}
            </button>
            <input value={priority.label} onChange={(event) => onUpdate(priority.id, { label: event.target.value })} aria-label={`Prioridade ${index + 1}`} />
            <button type="button" className="weeklyPriorityDelete" onClick={() => onUpdate(priority.id, { remove: true })} aria-label={`Remover ${priority.label}`}><Trash2 size={14} aria-hidden /></button>
          </div>
        ))}
        {priorities.length < 3 && (
          <form className="weeklyPriorityForm" onSubmit={submitPriority}>
            <input value={newPriority} onChange={(event) => setNewPriority(event.target.value)} placeholder="Adicionar prioridade essencial" aria-label="Nova prioridade semanal" />
            <button type="submit" disabled={!newPriority.trim()} aria-label="Adicionar prioridade"><Plus size={16} aria-hidden /></button>
          </form>
        )}
      </div>

      <div className={`weeklyLoad ${load.tone}`}>
        <Gauge size={17} aria-hidden />
        <div><small>Carga da semana</small><strong>{load.label}</strong><span>{load.detail}</span></div>
      </div>

      <div className={isFriday ? "weeklyReview active" : "weeklyReview"}>
        <small>{isFriday ? "Revisão de sexta disponível" : "Revisão automática de sexta"}</small>
        <strong>{completed}/{priorities.length} prioridades · {reviewedThisWeek} tópicos revisados</strong>
        <span>{isFriday ? "Feche pendências, registre aprendizados e escolha o que continua na próxima semana." : "Na sexta, este resumo ajuda a encerrar a semana com clareza."}</span>
      </div>
    </article>
  );
}
