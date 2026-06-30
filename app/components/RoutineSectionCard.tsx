"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, CheckIcon, ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { getSectionScheduleLabel, isReferenceSection, type RoutineSection } from "@/lib/routine";
import { getTaskIconName, taskIconOptions, type TaskIconName } from "@/lib/task-icons";
import type { PersonalizedRoutineItem } from "@/lib/types";
import EnglishTutor from "../EnglishTutor";
import { RoutineIcon } from "./RoutineIcon";
import TaskIcon, { getTaskIconComponent } from "./TaskIcon";

type RoutineSectionCardProps = {
  section: RoutineSection;
  items: PersonalizedRoutineItem[];
  doneItems: Set<string>;
  guideDoneItems: Set<string>;
  showGuide?: boolean;
  isOpen: boolean;
  time: string;
  newItem: string;
  onToggleSection: () => void;
  onToggleItem: (key: string) => void;
  onToggleGuideItem: (key: string) => void;
  onDeleteItem: (item: PersonalizedRoutineItem) => void;
  onEditItem: (item: PersonalizedRoutineItem, label: string, icon: TaskIconName) => void;
  onNewItemChange: (value: string) => void;
  onAddItem: () => void;
  onTimeChange: (value: string) => void;
  onClear: () => void;
};

export default function RoutineSectionCard({
  section,
  items,
  doneItems,
  guideDoneItems,
  showGuide = true,
  isOpen,
  time,
  newItem,
  onToggleSection,
  onToggleItem,
  onToggleGuideItem,
  onDeleteItem,
  onEditItem,
  onNewItemChange,
  onAddItem,
  onTimeChange,
  onClear
}: RoutineSectionCardProps) {
  const referenceSection = isReferenceSection(section);
  const referenceGroups = section.referenceGroups ?? [];
  const groupedContentLabel = "itens marcados como dominados";
  const referenceTotal = referenceGroups.reduce((sum, group) => sum + group.items.length, 0);
  const referenceDone = guideDoneItems.size;
  const pct = referenceSection
    ? referenceTotal ? Math.round((referenceDone / referenceTotal) * 100) : 0
    : items.length ? Math.round((doneItems.size / items.length) * 100) : 0;
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingIcon, setEditingIcon] = useState<TaskIconName>("notebook");
  const [shouldRenderChecklist, setShouldRenderChecklist] = useState(isOpen);
  const [activeReferenceGroup, setActiveReferenceGroup] = useState(0);

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
    setEditingIcon(item.icon ?? getTaskIconName(item.label));
  }

  function cancelEditing() {
    setEditingItemKey(null);
    setEditingLabel("");
    setEditingIcon("notebook");
  }

  function saveEditing(item: PersonalizedRoutineItem) {
    const nextLabel = editingLabel.trim();
    if (!nextLabel) return;
    onEditItem(item, nextLabel, editingIcon);
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
            {referenceSection ? `${referenceDone}/${referenceTotal}` : items.length ? `${doneItems.size}/${items.length}` : "0/0"}
          </span>
          <ChevronDown className={isOpen ? "chevron open" : "chevron"} size={18} aria-hidden />
        </span>
      </button>

      {shouldRenderChecklist && (
        <div className={isOpen ? "checklistShell open" : "checklistShell"} aria-hidden={!isOpen}>
          <div className="checklist">
            {section.note && <p className="sectionNote">{section.note}</p>}
            {section.key === "english" && <EnglishTutor />}
            {!referenceSection && (
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
                      <div className="taskIconPicker" role="radiogroup" aria-label={`Ícone de ${item.label}`}>
                        {taskIconOptions.map((option) => {
                          const Icon = getTaskIconComponent(option.name);
                          return (
                            <button
                              key={option.name}
                              type="button"
                              className={editingIcon === option.name ? "selected" : ""}
                              onClick={() => setEditingIcon(option.name)}
                              aria-label={option.label}
                              aria-checked={editingIcon === option.name}
                              role="radio"
                            >
                              <Icon size={15} aria-hidden />
                            </button>
                          );
                        })}
                      </div>
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
                        <TaskIcon label={item.label} icon={item.icon} />
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
            {!referenceSection && (
              <form className="taskForm sectionTaskForm" onSubmit={handleAddItem}>
                <input value={newItem} onChange={(event) => onNewItemChange(event.target.value)} placeholder={`Adicionar tarefa em ${section.label}`} />
                <button type="submit" aria-label="Adicionar tarefa">
                  <Plus size={16} aria-hidden />
                </button>
              </form>
            )}
            {items.length === 0 && !referenceSection && (
              <div className="emptySection">Nada programado para hoje. Esta seção aparece em {getSectionScheduleLabel(section)}.</div>
            )}
            {section.references?.length ? (
              <ol className="referenceList">
                {section.references.map((reference) => <li key={reference}>{reference}</li>)}
              </ol>
            ) : null}
            {showGuide && referenceGroups.length ? (
              <div className="referenceSlider">
                <div className="referenceSliderSummary">
                  <span>{referenceDone} de {referenceTotal} {groupedContentLabel}</span>
                  <strong>{referenceTotal ? Math.round((referenceDone / referenceTotal) * 100) : 0}%</strong>
                </div>
                <div className="referenceSliderProgress" aria-hidden>
                  <span style={{ width: `${referenceTotal ? (referenceDone / referenceTotal) * 100 : 0}%`, background: section.color }} />
                </div>
                <div className="referenceSliderNav">
                  <button
                    type="button"
                    onClick={() => setActiveReferenceGroup((current) => (current - 1 + referenceGroups.length) % referenceGroups.length)}
                    aria-label="Tópico anterior"
                  >
                    <ChevronLeft size={17} aria-hidden />
                  </button>
                  <span>{activeReferenceGroup + 1} / {referenceGroups.length}</span>
                  <button
                    type="button"
                    onClick={() => setActiveReferenceGroup((current) => (current + 1) % referenceGroups.length)}
                    aria-label="Próximo tópico"
                  >
                    <ChevronRight size={17} aria-hidden />
                  </button>
                </div>
                {referenceGroups.map((group, groupIndex) => groupIndex === activeReferenceGroup ? (
                  <section className="referenceSlide" key={group.title}>
                    <div className="referenceSlideHeader">
                      <div>
                        <small>Tópico {groupIndex + 1}</small>
                        <h3>{group.title}</h3>
                      </div>
                      <span>{group.items.filter((_, itemIndex) => guideDoneItems.has(`${groupIndex}:${itemIndex}`)).length}/{group.items.length}</span>
                    </div>
                    <div className="referenceChecklist">
                      {group.items.map((reference, itemIndex) => {
                        const itemKey = `${groupIndex}:${itemIndex}`;
                        const checked = guideDoneItems.has(itemKey);
                        return (
                          <label className={checked ? "referenceCheck done" : "referenceCheck"} key={reference}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggleGuideItem(itemKey)}
                            />
                            <span className="referenceCheckbox">{checked && <Check size={13} aria-hidden />}</span>
                            <span>{reference}</span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ) : null)}
                <div className="referenceDots" aria-label="Escolher tópico">
                  {referenceGroups.map((group, index) => (
                    <button
                      type="button"
                      className={index === activeReferenceGroup ? "active" : ""}
                      key={group.title}
                      onClick={() => setActiveReferenceGroup(index)}
                      aria-label={group.title}
                      aria-current={index === activeReferenceGroup ? "step" : undefined}
                    />
                  ))}
                </div>
              </div>
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
