"use client";

import type { CSSProperties } from "react";
import { BookOpen, Languages, Plus, Sparkles, X } from "lucide-react";
import { getStackCategory, stackCategoryOrder } from "@/lib/profile-stacks";
import StackIcon from "./StackIcon";

type ProgressValue = {
  done: number;
  total: number;
};

type LearningProgressPanelProps = {
  stacks: string[];
  customStacks: string[];
  stackProgress: Record<string, number>;
  englishDaily: ProgressValue;
  englishGuide: ProgressValue;
  newStack: string;
  onNewStackChange: (value: string) => void;
  onAddStack: () => void;
  onDeleteStack: (stack: string) => void;
  onStackProgressChange: (stack: string, value: number) => void;
};

function percentage({ done, total }: ProgressValue) {
  return total ? Math.round((done / total) * 100) : 0;
}

function stackKey(stack: string) {
  return stack.trim().toLocaleLowerCase("pt-BR");
}

export default function LearningProgressPanel({
  stacks,
  customStacks,
  stackProgress,
  englishDaily,
  englishGuide,
  newStack,
  onNewStackChange,
  onAddStack,
  onDeleteStack,
  onStackProgressChange
}: LearningProgressPanelProps) {
  const dailyPct = percentage(englishDaily);
  const guidePct = percentage(englishGuide);
  const customKeys = new Set(customStacks.map(stackKey));
  const stackAverage = stacks.length
    ? Math.round(stacks.reduce((sum, stack) => sum + (stackProgress[stack] ?? 0), 0) / stacks.length)
    : 0;

  return (
    <section className="learningHub" id="learning-progress" aria-labelledby="learning-hub-title">
      <div className="learningHubHeader">
        <div>
          <p className="eyebrow">painel de evolução</p>
          <h2 id="learning-hub-title">Inglês e stacks</h2>
          <span>Acompanhe hábitos, competências e seu nível em cada tecnologia.</span>
        </div>
        <div className="learningHubSummary">
          <Sparkles size={16} aria-hidden />
          <span>Média das stacks</span>
          <strong>{stackAverage}%</strong>
        </div>
      </div>

      <div className="learningHubGrid">
        <article className="englishProgressCard">
          <div className="englishProgressHeading">
            <span className="englishProgressIcon"><Languages size={21} aria-hidden /></span>
            <div>
              <p className="eyebrow">meu inglês</p>
              <h3>Progresso do idioma</h3>
            </div>
          </div>

          <div className="englishProgressHero">
            <div
              className="progressRing"
              style={{ "--progress": `${guidePct * 3.6}deg` } as CSSProperties}
              aria-label={`${guidePct}% do Guia de Inglês dominado`}
            >
              <span>{guidePct}%</span>
            </div>
            <div>
              <strong>Conhecimento registrado</strong>
              <span>{englishGuide.done} de {englishGuide.total} competências dominadas</span>
            </div>
          </div>

          <div className="englishMetricList">
            <div className="englishMetric">
              <span><BookOpen size={15} aria-hidden /> Hábitos de hoje</span>
              <strong>{englishDaily.done}/{englishDaily.total}</strong>
              <div><i style={{ width: `${dailyPct}%` }} /></div>
              <small>{dailyPct}% concluído</small>
            </div>
            <div className="englishMetric guide">
              <span><Languages size={15} aria-hidden /> Guia completo</span>
              <strong>{englishGuide.done}/{englishGuide.total}</strong>
              <div><i style={{ width: `${guidePct}%` }} /></div>
              <small>{guidePct}% dominado</small>
            </div>
          </div>

          <div className="englishProgressLinks">
            <a href="#english">Abrir hábitos</a>
            <a href="#english-guide">Abrir Guia de Inglês</a>
          </div>
        </article>

        <article className="stackProgressCard">
          <div className="stackProgressHeader">
            <div>
              <p className="eyebrow">minhas stacks</p>
              <h3>Tecnologias e progresso</h3>
            </div>
            <form
              className="stackProgressForm"
              onSubmit={(event) => {
                event.preventDefault();
                onAddStack();
              }}
            >
              <input
                value={newStack}
                onChange={(event) => onNewStackChange(event.target.value)}
                placeholder="Adicionar tecnologia"
                aria-label="Adicionar stack"
              />
              <button type="submit" disabled={!newStack.trim()} aria-label="Adicionar stack">
                <Plus size={16} aria-hidden />
              </button>
            </form>
          </div>

          <div className="stackCategoryList">
            {stackCategoryOrder.map((category) => {
              const categoryStacks = stacks.filter((stack) => getStackCategory(stack) === category);
              if (!categoryStacks.length) return null;

              return (
                <section className="stackCategory" key={category} aria-label={category}>
                  <div className="stackCategoryHeading">
                    <strong>{category}</strong>
                    <span>{categoryStacks.length} {categoryStacks.length === 1 ? "tecnologia" : "tecnologias"}</span>
                  </div>
                  <div className="stackProgressGrid">
                    {categoryStacks.map((stack) => {
                      const progress = stackProgress[stack] ?? 0;
                      const custom = customKeys.has(stackKey(stack));

                      return (
                        <div className="stackProgressItem" key={stack}>
                          <div className="stackProgressIdentity">
                            <span className="stackProgressIcon"><StackIcon stack={stack} /></span>
                            <strong title={stack}>{stack}</strong>
                            <output>{progress}%</output>
                            {custom && (
                              <button type="button" onClick={() => onDeleteStack(stack)} aria-label={`Remover ${stack}`}>
                                <X size={13} aria-hidden />
                              </button>
                            )}
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={progress}
                            onChange={(event) => onStackProgressChange(stack, Number(event.target.value))}
                            aria-label={`Progresso em ${stack}`}
                            style={{ "--stack-progress": `${progress}%` } as CSSProperties}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}
