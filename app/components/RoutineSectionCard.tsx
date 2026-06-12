"use client";

import type { FormEvent } from "react";
import { Check, ChevronDown, Plus, RotateCcw, Trash2 } from "lucide-react";
import { getSectionScheduleLabel, type RoutineSection } from "@/lib/routine";
import type { PersonalizedRoutineItem } from "@/lib/types";
import EnglishTutor from "../EnglishTutor";
import { RoutineIcon } from "./RoutineIcon";

type RoutineSectionCardProps = {
  section: RoutineSection;
  items: PersonalizedRoutineItem[];
  doneItems: Set<string>;
  isOpen: boolean;
  time: string;
  newItem: string;
  onToggleSection: () => void;
  onToggleItem: (key: string) => void;
  onDeleteItem: (item: PersonalizedRoutineItem) => void;
  onNewItemChange: (value: string) => void;
  onAddItem: () => void;
  onTimeChange: (value: string) => void;
  onClear: () => void;
};

export default function RoutineSectionCard({
  section,
  items,
  doneItems,
  isOpen,
  time,
  newItem,
  onToggleSection,
  onToggleItem,
  onDeleteItem,
  onNewItemChange,
  onAddItem,
  onTimeChange,
  onClear
}: RoutineSectionCardProps) {
  const pct = items.length ? Math.round((doneItems.size / items.length) * 100) : 0;

  function handleAddItem(event: FormEvent) {
    event.preventDefault();
    onAddItem();
  }

  return (
    <article className="routineCard" id={section.key}>
      <span className="sectionProgress" style={{ width: `${pct}%`, background: section.color }} />
      <button className="sectionHeader" onClick={onToggleSection}>
        <span className="iconBadge" style={{ color: section.color, background: section.bg }}>
          <RoutineIcon name={section.icon} size={17} />
        </span>
        <span className="sectionTitle">
          <strong>{section.label}</strong>
          <small>{time} · {getSectionScheduleLabel(section)}</small>
        </span>
        <span className="sectionActions">
          <span className="countBadge" style={{ color: section.color, background: section.bg }}>
            {items.length ? `${doneItems.size}/${items.length}` : "ref"}
          </span>
          <ChevronDown className={isOpen ? "chevron open" : "chevron"} size={18} aria-hidden />
        </span>
      </button>

      {isOpen && (
        <div className="checklist">
          {section.note && <p className="sectionNote">{section.note}</p>}
          {section.key === "english" && <EnglishTutor />}
          {!section.references?.length && (
            <div className="sectionEditor">
              <label>
                Horário
                <input value={time} onChange={(event) => onTimeChange(event.target.value)} placeholder="09:00-10:00" />
              </label>
            </div>
          )}
          {items.map((item) => {
            const checked = doneItems.has(item.key);
            return (
              <div className={checked ? "checkItem customTask done" : "checkItem customTask"} key={`${section.key}-${item.key}`}>
                <button className="taskCheckButton" onClick={() => onToggleItem(item.key)}>
                  <span className="checkCircle">{checked && <Check size={13} aria-hidden />}</span>
                  <span>{item.label}</span>
                </button>
                <button className="deleteTaskButton" onClick={() => onDeleteItem(item)} aria-label={`Excluir ${item.label}`}>
                  <Trash2 size={15} aria-hidden />
                  <span>Excluir</span>
                </button>
              </div>
            );
          })}
          {!section.references?.length && (
            <form className="taskForm sectionTaskForm" onSubmit={handleAddItem}>
              <input value={newItem} onChange={(event) => onNewItemChange(event.target.value)} placeholder={`Adicionar tarefa em ${section.label}`} />
              <button type="submit" aria-label="Adicionar tarefa">
                <Plus size={16} aria-hidden />
              </button>
            </form>
          )}
          {items.length === 0 && !section.references?.length && (
            <div className="emptySection">Nada programado para hoje. Esta seção aparece em {getSectionScheduleLabel(section)}.</div>
          )}
          {section.references?.length ? (
            <ol className="referenceList">
              {section.references.map((reference) => <li key={reference}>{reference}</li>)}
            </ol>
          ) : null}
          {doneItems.size > 0 && (
            <button className="resetButton" onClick={onClear}>
              <RotateCcw size={14} aria-hidden />
              limpar seção
            </button>
          )}
        </div>
      )}
    </article>
  );
}
