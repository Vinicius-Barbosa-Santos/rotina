"use client";

import { useState, type CSSProperties } from "react";
import { BookOpen, Check, Languages, Plus, Sparkles, X } from "lucide-react";
import { getStackCategory, getStackTopics, stackCategoryOrder, type StackCategory } from "@/lib/profile-stacks";
import StackIcon from "./StackIcon";

type ProgressValue = { done: number; total: number };

type LearningProgressPanelProps = {
  stacks: string[];
  customStacks: string[];
  stackTopicChecks: Record<string, string[]>;
  englishDaily: ProgressValue;
  englishGuide: ProgressValue;
  newStack: string;
  onNewStackChange: (value: string) => void;
  onAddStack: () => void;
  onDeleteStack: (stack: string) => void;
  onToggleStackTopic: (stack: string, topic: string) => void;
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
  stacks, customStacks, stackTopicChecks, englishDaily, englishGuide, newStack,
  onNewStackChange, onAddStack, onDeleteStack, onToggleStackTopic
}: LearningProgressPanelProps) {
  const categories = stackCategoryOrder.filter((item) => stacks.some((stack) => getStackCategory(stack) === item));
  const [activeCategory, setActiveCategory] = useState<StackCategory>(categories[0] ?? "Frontend");
  const category = categories.includes(activeCategory) ? activeCategory : categories[0];
  const categoryStacks = stacks.filter((stack) => getStackCategory(stack) === category);
  const [activeStack, setActiveStack] = useState(stacks[0] ?? "");
  const selectedStack = categoryStacks.includes(activeStack) ? activeStack : categoryStacks[0] ?? "";
  const selectedTopics = selectedStack ? getStackTopics(selectedStack) : [];
  const selectedChecks = new Set(stackTopicChecks[selectedStack] ?? []);
  const selectedProgress = selectedStack ? getTopicProgress(selectedStack, stackTopicChecks) : { done: 0, total: 0, pct: 0 };
  const customKeys = new Set(customStacks.map(stackKey));
  const dailyPct = percentage(englishDaily);
  const guidePct = percentage(englishGuide);
  const stackAverage = stacks.length
    ? Math.round(stacks.reduce((sum, stack) => sum + getTopicProgress(stack, stackTopicChecks).pct, 0) / stacks.length)
    : 0;

  return (
    <section className="learningHub" id="learning-progress" aria-labelledby="learning-hub-title">
      <div className="learningHubHeader">
        <div>
          <p className="eyebrow">painel de evolução</p>
          <h2 id="learning-hub-title">Inglês e stacks</h2>
          <span>Escolha uma tecnologia e marque os tópicos que você já domina.</span>
        </div>
        <div className="learningHubSummary"><Sparkles size={16} aria-hidden /><span>Média das stacks</span><strong>{stackAverage}%</strong></div>
      </div>

      <div className="learningHubGrid">
        <article className="englishProgressCard">
          <div className="englishProgressHeading">
            <span className="englishProgressIcon"><Languages size={21} aria-hidden /></span>
            <div><p className="eyebrow">meu inglês</p><h3>Progresso do idioma</h3></div>
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
        </article>

        <article className="stackProgressCard">
          <div className="stackProgressHeader">
            <div><p className="eyebrow">minhas stacks</p><h3>Progresso por tópico</h3></div>
            <form className="stackProgressForm" onSubmit={(event) => { event.preventDefault(); onAddStack(); }}>
              <input value={newStack} onChange={(event) => onNewStackChange(event.target.value)} placeholder="Adicionar tecnologia" aria-label="Adicionar stack" />
              <button type="submit" disabled={!newStack.trim()} aria-label="Adicionar stack"><Plus size={16} aria-hidden /></button>
            </form>
          </div>

          <div className="stackCategoryTabs" role="tablist" aria-label="Categorias de tecnologias">
            {categories.map((item) => (
              <button key={item} type="button" role="tab" aria-selected={item === category} className={item === category ? "active" : ""}
                onClick={() => { setActiveCategory(item); setActiveStack(stacks.find((stack) => getStackCategory(stack) === item) ?? ""); }}>
                {item}<span>{stacks.filter((stack) => getStackCategory(stack) === item).length}</span>
              </button>
            ))}
          </div>

          <div className="stackExplorer">
            <div className="stackPicker" role="tablist" aria-label={`Tecnologias de ${category}`}>
              {categoryStacks.map((stack) => {
                const progress = getTopicProgress(stack, stackTopicChecks);
                return (
                  <button key={stack} type="button" role="tab" aria-selected={stack === selectedStack} className={stack === selectedStack ? "active" : ""} onClick={() => setActiveStack(stack)}>
                    <span className="stackProgressIcon"><StackIcon stack={stack} /></span>
                    <span className="stackPickerLabel"><strong>{stack}</strong><small>{progress.done}/{progress.total} tópicos</small></span>
                    <span className="stackPickerProgress"><i style={{ width: `${progress.pct}%` }} /></span>
                    <output>{progress.pct}%</output>
                  </button>
                );
              })}
            </div>

            {selectedStack && (
              <section className="stackTopicPanel" aria-label={`Tópicos de ${selectedStack}`}>
                <div className="stackTopicHeader">
                  <div className="stackTopicTitle"><span className="stackProgressIcon large"><StackIcon stack={selectedStack} /></span><div><span>Trilha selecionada</span><h4>{selectedStack}</h4></div></div>
                  <div className="stackTopicSummary"><strong>{selectedProgress.pct}%</strong><span>{selectedProgress.done} de {selectedProgress.total}</span></div>
                  {customKeys.has(stackKey(selectedStack)) && <button className="stackDeleteButton" type="button" onClick={() => onDeleteStack(selectedStack)} aria-label={`Remover ${selectedStack}`}><X size={15} aria-hidden /></button>}
                </div>
                <div className="stackTopicBar"><i style={{ width: `${selectedProgress.pct}%` }} /></div>
                <div className="stackTopicList">
                  {selectedTopics.map((topic, index) => {
                    const topicKey = String(index);
                    const checked = selectedChecks.has(topicKey);
                    return (
                      <label className={checked ? "stackTopicCheck checked" : "stackTopicCheck"} key={topic}>
                        <input type="checkbox" checked={checked} onChange={() => onToggleStackTopic(selectedStack, topicKey)} />
                        <span className="stackTopicCheckbox"><Check size={14} aria-hidden /></span><span>{topic}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
