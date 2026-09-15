"use client";

import { useState, type CSSProperties } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, Clock3, Filter, Languages, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import { getStackCategory, getStackTopics, stackCategoryOrder, type StackCategory } from "@/lib/profile-stacks";
import type { WeeklyPriority } from "@/lib/types";
import StackIcon from "./StackIcon";
import WeeklyFocusPanel from "./WeeklyFocusPanel";

type ProgressValue = { done: number; total: number };
type EnglishTrackGroup = { title: string; items: string[] };

type LearningProgressPanelProps = {
  stacks: string[];
  customStacks: string[];
  stackTopicChecks: Record<string, string[]>;
  stackTopicInProgress: Record<string, string[]>;
  stackNextSteps: Record<string, string>;
  stackTopicEvidence: Record<string, Record<string, string>>;
  stackTopicReviewedAt: Record<string, Record<string, string>>;
  weeklyPriorities: WeeklyPriority[];
  currentWeekKey: string;
  englishDaily: ProgressValue;
  englishGuide: ProgressValue;
  englishTrack: EnglishTrackGroup[];
  englishTrackChecks: string[];
  newStack: string;
  onNewStackChange: (value: string) => void;
  onAddStack: () => void;
  onDeleteStack: (stack: string) => void;
  onSetStackTopicStatus: (stack: string, topic: string, status: "pending" | "progress" | "done") => void;
  onSetStackNextStep: (stack: string, value: string) => void;
  onSetStackTopicEvidence: (stack: string, topic: string, value: string) => void;
  onReviewStackTopic: (stack: string, topic: string) => void;
  onAddWeeklyPriority: (label: string) => void;
  onUpdateWeeklyPriority: (id: string, update: { label?: string; done?: boolean; remove?: boolean }) => void;
  onToggleEnglishTopic: (topic: string) => void;
};

function percentage({ done, total }: ProgressValue) {
  return total ? Math.round((done / total) * 100) : 0;
}

function stackKey(stack: string) {
  return stack.trim().toLocaleLowerCase("pt-BR");
}

function getTopicProgress(stack: string, checks: Record<string, string[]>) {
  const topics = getStackTopics(stack);
  const completed = new Set(checks[stack] ?? []);
  const done = topics.filter((_, index) => completed.has(String(index))).length;
  return { done, total: topics.length, pct: topics.length ? Math.round((done / topics.length) * 100) : 0 };
}

export default function LearningProgressPanel({
  stacks, customStacks, stackTopicChecks, stackTopicInProgress, stackNextSteps, stackTopicEvidence,
  stackTopicReviewedAt, weeklyPriorities, currentWeekKey, englishDaily, englishGuide, englishTrack,
  englishTrackChecks, newStack, onNewStackChange, onAddStack, onDeleteStack, onSetStackTopicStatus,
  onSetStackNextStep, onSetStackTopicEvidence, onReviewStackTopic, onAddWeeklyPriority,
  onUpdateWeeklyPriority, onToggleEnglishTopic
}: LearningProgressPanelProps) {
  const categories = stackCategoryOrder.filter((item) => stacks.some((stack) => getStackCategory(stack) === item));
  const [activeCategory, setActiveCategory] = useState<StackCategory>(categories[0] ?? "Frontend");
  const category = categories.includes(activeCategory) ? activeCategory : categories[0];
  const categoryStacks = stacks.filter((stack) => getStackCategory(stack) === category);
  const [activeStack, setActiveStack] = useState(stacks[0] ?? "");
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [activeEnglishGroup, setActiveEnglishGroup] = useState(0);
  const [pendingOnly, setPendingOnly] = useState(false);
  const selectedStack = categoryStacks.includes(activeStack) ? activeStack : categoryStacks[0] ?? "";
  const selectedTopics = selectedStack ? getStackTopics(selectedStack) : [];
  const selectedChecks = new Set(stackTopicChecks[selectedStack] ?? []);
  const selectedInProgress = new Set(stackTopicInProgress[selectedStack] ?? []);
  const topicEntries = selectedTopics.map((topic, index) => ({ topic, index, key: String(index) }));
  const visibleTopicEntries = pendingOnly ? topicEntries.filter(({ key }) => !selectedChecks.has(key)) : topicEntries;
  const activeTopic = visibleTopicEntries.find(({ index }) => index === activeTopicIndex) ?? visibleTopicEntries[0];
  const activeVisibleIndex = activeTopic ? visibleTopicEntries.findIndex(({ key }) => key === activeTopic.key) : -1;
  const selectedProgress = selectedStack ? getTopicProgress(selectedStack, stackTopicChecks) : { done: 0, total: 0, pct: 0 };
  const customKeys = new Set(customStacks.map(stackKey));
  const dailyPct = percentage(englishDaily);
  const guidePct = percentage(englishGuide);
  const selectedEnglishGroup = englishTrack[activeEnglishGroup] ?? englishTrack[0];
  const englishChecks = new Set(englishTrackChecks);
  const stackAverage = stacks.length
    ? Math.round(stacks.reduce((sum, stack) => sum + getTopicProgress(stack, stackTopicChecks).pct, 0) / stacks.length)
    : 0;
  const inProgressCount = Object.values(stackTopicInProgress).reduce((sum, topics) => sum + topics.length, 0);
  const reviewedThisWeek = Object.values(stackTopicReviewedAt).reduce(
    (sum, topics) => sum + Object.values(topics).filter((date) => date >= currentWeekKey).length,
    0
  );

  function moveTopic(direction: -1 | 1) {
    if (!visibleTopicEntries.length) return;
    const nextIndex = (activeVisibleIndex + direction + visibleTopicEntries.length) % visibleTopicEntries.length;
    setActiveTopicIndex(visibleTopicEntries[nextIndex].index);
  }

  return (
    <section className="learningHub" id="learning-progress" aria-labelledby="learning-hub-title">
      <div className="learningHubHeader">
        <div>
          <p className="eyebrow">painel de evolução</p>
          <h2 id="learning-hub-title">Inglês e stacks</h2>
          <span>Siga cada trilha do fundamento ao projeto final e marque as etapas dominadas.</span>
        </div>
        <div className="learningHubSummary"><Sparkles size={16} aria-hidden /><span>Média das stacks</span><strong>{stackAverage}%</strong></div>
      </div>

      <WeeklyFocusPanel
        priorities={weeklyPriorities}
        currentWeekKey={currentWeekKey}
        inProgressCount={inProgressCount}
        reviewedThisWeek={reviewedThisWeek}
        onAdd={onAddWeeklyPriority}
        onUpdate={onUpdateWeeklyPriority}
      />

      <div className="learningHubGrid">
        <article className="englishProgressCard">
          <div className="englishOverview">
            <div className="englishProgressHeading">
              <span className="englishProgressIcon"><Languages size={21} aria-hidden /></span>
              <div><p className="eyebrow">meu inglês</p><h3>Inglês até a fluência</h3></div>
            </div>
            <div className="englishProgressHero">
              <div className="progressRing" style={{ "--progress": `${guidePct * 3.6}deg` } as CSSProperties} aria-label={`${guidePct}% do Guia de Inglês dominado`}><span>{guidePct}%</span></div>
              <div><strong>Conhecimento registrado</strong><span>{englishGuide.done} de {englishGuide.total} competências dominadas</span></div>
            </div>
            <div className="englishMetricList">
              <div className="englishMetric"><span><BookOpen size={15} aria-hidden /> Hábitos de hoje</span><strong>{englishDaily.done}/{englishDaily.total}</strong><div><i style={{ width: `${dailyPct}%` }} /></div><small>{dailyPct}% concluído</small></div>
              <div className="englishMetric guide"><span><Languages size={15} aria-hidden /> Guia completo</span><strong>{englishGuide.done}/{englishGuide.total}</strong><div><i style={{ width: `${guidePct}%` }} /></div><small>{guidePct}% dominado</small></div>
            </div>
            <div className="englishProgressLinks"><a href="#english">Abrir hábitos</a><a href="#english-guide">Abrir Guia de Inglês</a></div>
          </div>
          {selectedEnglishGroup && (
            <section className="englishTrack" aria-label="Trilha completa de inglês até a fluência">
              <div className="englishTrackHeader">
                <div><small>Trilha até a fluência</small><strong>{selectedEnglishGroup.title}</strong></div>
                <span>{activeEnglishGroup + 1} / {englishTrack.length}</span>
              </div>
              <div className="englishTrackNav">
                <button type="button" onClick={() => setActiveEnglishGroup((current) => (current - 1 + englishTrack.length) % englishTrack.length)} aria-label="Tópico de inglês anterior"><ChevronLeft size={17} aria-hidden /></button>
                <div className="englishTrackDots" aria-label="Escolher tópico de inglês">
                  {englishTrack.map((group, index) => <button type="button" key={group.title} className={index === activeEnglishGroup ? "active" : ""} onClick={() => setActiveEnglishGroup(index)} aria-label={group.title} aria-current={index === activeEnglishGroup ? "step" : undefined} />)}
                </div>
                <button type="button" onClick={() => setActiveEnglishGroup((current) => (current + 1) % englishTrack.length)} aria-label="Próximo tópico de inglês"><ChevronRight size={17} aria-hidden /></button>
              </div>
              <div className="englishTrackChecklist">
                {selectedEnglishGroup.items.map((item, itemIndex) => {
                  const itemKey = `${activeEnglishGroup}:${itemIndex}`;
                  const checked = englishChecks.has(itemKey);
                  return (
                    <label className={checked ? "englishTrackCheck checked" : "englishTrackCheck"} key={item}>
                      <input type="checkbox" checked={checked} onChange={() => onToggleEnglishTopic(itemKey)} />
                      <span className="stackTopicCheckbox">{checked && <Check size={13} aria-hidden />}</span>
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}
        </article>

        <article className="stackProgressCard">
          <div className="stackProgressHeader">
            <div><p className="eyebrow">minhas stacks</p><h3>Passo a passo das stacks</h3></div>
            <form className="stackProgressForm" onSubmit={(event) => { event.preventDefault(); onAddStack(); }}>
              <input value={newStack} onChange={(event) => onNewStackChange(event.target.value)} placeholder="Adicionar tecnologia" aria-label="Adicionar stack" />
              <button type="submit" disabled={!newStack.trim()} aria-label="Adicionar stack"><Plus size={16} aria-hidden /></button>
            </form>
          </div>

          <div className="stackMotionStrip" aria-hidden>
            {stacks.map((stack, index) => (
              <span key={stack} style={{ "--stack-index": index } as CSSProperties}>
                <StackIcon stack={stack} />
              </span>
            ))}
          </div>

          <div className="stackCategoryTabs" role="tablist" aria-label="Categorias de tecnologias">
            {categories.map((item) => (
              <button key={item} type="button" role="tab" aria-selected={item === category} className={item === category ? "active" : ""}
                onClick={() => {
                  setActiveCategory(item);
                  setActiveStack(stacks.find((stack) => getStackCategory(stack) === item) ?? "");
                  setActiveTopicIndex(0);
                }}>
                {item}<span>{stacks.filter((stack) => getStackCategory(stack) === item).length}</span>
              </button>
            ))}
          </div>

          <div className="stackExplorer">
            <div className="stackPicker" role="tablist" aria-label={`Tecnologias de ${category}`}>
              {categoryStacks.map((stack, index) => {
                const progress = getTopicProgress(stack, stackTopicChecks);
                return (
                  <button key={stack} style={{ "--stack-index": index } as CSSProperties} type="button" role="tab" aria-selected={stack === selectedStack} className={stack === selectedStack ? "active" : ""} onClick={() => { setActiveStack(stack); setActiveTopicIndex(0); }}>
                    <span className="stackProgressIcon"><StackIcon stack={stack} /></span>
                    <span className="stackPickerLabel"><strong>{stack}</strong><small>{progress.done}/{progress.total} tópicos</small></span>
                    <span className="stackPickerProgress"><i style={{ width: `${progress.pct}%` }} /></span>
                    <output>{progress.pct}%</output>
                  </button>
                );
              })}
            </div>

            {selectedStack && (
              <section className="stackTopicPanel" key={selectedStack} aria-label={`Tópicos de ${selectedStack}`}>
                <div className="stackTopicHeader">
                  <div className="stackTopicTitle"><span className="stackProgressIcon large"><StackIcon stack={selectedStack} /></span><div><span>Trilha selecionada</span><h4>{selectedStack}</h4></div></div>
                  <div className="stackTopicSummary"><strong>{selectedProgress.pct}%</strong><span>{selectedProgress.done} de {selectedProgress.total}</span></div>
                  {customKeys.has(stackKey(selectedStack)) && <button className="stackDeleteButton" type="button" onClick={() => onDeleteStack(selectedStack)} aria-label={`Remover ${selectedStack}`}><X size={15} aria-hidden /></button>}
                </div>
                <div className="stackTopicBar"><i style={{ width: `${selectedProgress.pct}%` }} /></div>
                <label className="stackNextStep">
                  <span>Próximo passo</span>
                  <input value={stackNextSteps[selectedStack] ?? ""} onChange={(event) => onSetStackNextStep(selectedStack, event.target.value)} placeholder="Defina a ação mais importante desta stack" />
                </label>
                <div className="stackTopicSlider">
                  <div className="stackTopicSliderNav">
                    <button type="button" onClick={() => moveTopic(-1)} aria-label="Tópico anterior" disabled={!visibleTopicEntries.length}>
                      <ChevronLeft size={18} aria-hidden />
                    </button>
                    <span>{activeTopic ? `Tópico ${activeVisibleIndex + 1} de ${visibleTopicEntries.length}` : "Nenhuma pendência"}</span>
                    <button type="button" onClick={() => moveTopic(1)} aria-label="Próximo tópico" disabled={!visibleTopicEntries.length}>
                      <ChevronRight size={18} aria-hidden />
                    </button>
                  </div>
                  <button type="button" className={pendingOnly ? "stackPendingFilter active" : "stackPendingFilter"} onClick={() => setPendingOnly((current) => !current)}>
                    <Filter size={13} aria-hidden /> {pendingOnly ? "Exibindo pendentes" : "Mostrar somente pendentes"}
                  </button>
                  {activeTopic ? (() => {
                    const topicKey = activeTopic.key;
                    const checked = selectedChecks.has(topicKey);
                    const inProgress = selectedInProgress.has(topicKey);
                    const status = checked ? "done" : inProgress ? "progress" : "pending";
                    const reviewedAt = stackTopicReviewedAt[selectedStack]?.[topicKey];
                    return (
                      <div className={`stackTopicSlide ${status}`} key={`${selectedStack}-${topicKey}`}>
                        <span className="stackTopicCheckbox">{checked ? "×" : inProgress ? "~" : ""}</span>
                        <span><small>Etapa {activeTopic.index + 1}</small><strong>{activeTopic.topic}</strong></span>
                        <div className="stackTopicStatus" aria-label="Status do tópico">
                          <button type="button" className={status === "pending" ? "active" : ""} onClick={() => onSetStackTopicStatus(selectedStack, topicKey, "pending")}>[ ] Pendente</button>
                          <button type="button" className={status === "progress" ? "active progress" : ""} onClick={() => onSetStackTopicStatus(selectedStack, topicKey, "progress")}>[~] Em andamento</button>
                          <button type="button" className={status === "done" ? "active done" : ""} onClick={() => onSetStackTopicStatus(selectedStack, topicKey, "done")}>[x] Concluído</button>
                        </div>
                        <label className="stackEvidence">
                          <span>Evidência prática</span>
                          <input value={stackTopicEvidence[selectedStack]?.[topicKey] ?? ""} onChange={(event) => onSetStackTopicEvidence(selectedStack, topicKey, event.target.value)} placeholder="Projeto, exercício ou link que comprova o domínio" />
                        </label>
                        <div className="stackReviewMeta">
                          <span><Clock3 size={13} aria-hidden /> {reviewedAt ? `Última revisão: ${new Intl.DateTimeFormat("pt-BR").format(new Date(`${reviewedAt}T12:00:00`))}` : "Ainda não revisado"}</span>
                          <button type="button" onClick={() => onReviewStackTopic(selectedStack, topicKey)}><RotateCcw size={13} aria-hidden /> Revisado hoje</button>
                        </div>
                      </div>
                    );
                  })() : <div className="stackEmptyTopics"><Check size={20} aria-hidden /><strong>Nenhum tópico pendente</strong><span>Você concluiu todas as etapas visíveis desta stack.</span></div>}
                  <div className="stackTopicDots" aria-label="Escolher tópico">
                    {visibleTopicEntries.map(({ topic, index }) => (
                      <button type="button" className={index === activeTopic?.index ? "active" : ""} key={topic} onClick={() => setActiveTopicIndex(index)} aria-label={`Abrir tópico ${index + 1}`} aria-current={index === activeTopic?.index ? "step" : undefined} />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
