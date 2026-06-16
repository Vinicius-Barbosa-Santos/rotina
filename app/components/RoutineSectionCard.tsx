"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, CheckIcon, ChevronDown, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
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
  onEditItem: (item: PersonalizedRoutineItem, label: string) => void;
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
  onEditItem,
  onNewItemChange,
  onAddItem,
  onTimeChange,
  onClear
}: RoutineSectionCardProps) {
  const pct = items.length ? Math.round((doneItems.size / items.length) * 100) : 0;
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [shouldRenderChecklist, setShouldRenderChecklist] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRenderChecklist(true);
      return undefined;
    }

    const timer = window.setTimeout(() => setShouldRenderChecklist(false), 280);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  function handleAddItem(event: FormEvent) {
    event.preventDefault();
    onAddItem();
  }

  function startEditing(item: PersonalizedRoutineItem) {
    setEditingItemKey(item.key);
    setEditingLabel(item.label);
  }

  function cancelEditing() {
    setEditingItemKey(null);
    setEditingLabel("");
  }

  function saveEditing(item: PersonalizedRoutineItem) {
    const nextLabel = editingLabel.trim();
    if (!nextLabel) return;
    onEditItem(item, nextLabel);
    cancelEditing();
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

      {shouldRenderChecklist && (
        <div className={isOpen ? "checklistShell open" : "checklistShell"} aria-hidden={!isOpen}>
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
              const isEditing = editingItemKey === item.key;
              return (
                <div className={checked ? "checkItem customTask done" : "checkItem customTask"} key={`${section.key}-${item.key}`}>
                  {isEditing ? (
                    <form
                      className="taskEditForm"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveEditing(item);
                      }}
                    >
                      <input
                        autoFocus
                        value={editingLabel}
                        onChange={(event) => setEditingLabel(event.target.value)}
                        aria-label={`Editar ${item.label}`}
                      />
                      <button type="submit" aria-label={`Salvar ${item.label}`} disabled={!editingLabel.trim()}>
                        <CheckIcon size={15} aria-hidden />
                      </button>
                      <button type="button" onClick={cancelEditing} aria-label="Cancelar edição">
                        <X size={15} aria-hidden />
                      </button>
                    </form>
                  ) : (
                    <>
                      <button className="taskCheckButton" onClick={() => onToggleItem(item.key)}>
                        <span className="checkCircle">{checked && <Check size={13} aria-hidden />}</span>
                        <span>{item.label}</span>
                      </button>
                      <span className="taskItemActions">
                        <button className="editTaskButton" onClick={() => startEditing(item)} aria-label={`Editar ${item.label}`}>
                          <Pencil size={15} aria-hidden />
                        </button>
                        <button className="deleteTaskButton" onClick={() => onDeleteItem(item)} aria-label={`Excluir ${item.label}`}>
                          <Trash2 size={15} aria-hidden />
                          <span>Excluir</span>
                        </button>
                      </span>
                    </>
                  )}
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
        </div>
      )}
    </article>
  );
}
