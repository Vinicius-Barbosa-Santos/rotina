import type { CSSProperties } from "react";
import type { ProgressPoint } from "@/lib/types";

type ProgressChartsProps = {
  weekly: ProgressPoint[];
  monthly: ProgressPoint[];
};

function average(points: ProgressPoint[]) {
  const active = points.filter((point) => point.total > 0);
  if (!active.length) return 0;
  return Math.round(active.reduce((sum, point) => sum + point.pct, 0) / active.length);
}

function totals(points: ProgressPoint[]) {
  return points.reduce(
    (result, point) => ({ done: result.done + point.done, total: result.total + point.total }),
    { done: 0, total: 0 }
  );
}

function ChartCard({ title, points, mode }: { title: string; points: ProgressPoint[]; mode: "week" | "month" }) {
  const summary = totals(points);
  const avg = average(points);

  return (
    <article className="evolutionChartCard">
      <div className="evolutionChartHeader">
        <div>
          <strong>{title}</strong>
          <span>
            {summary.done}/{summary.total} tarefas
          </span>
        </div>
        <em>{avg}%</em>
      </div>

      <div className={`evolutionBars ${mode}`} role="list" aria-label={`Evolução ${title.toLowerCase()}`}>
        {points.map((point) => (
          <div
            key={point.date}
            className="evolutionBar"
            role="listitem"
            aria-label={`${point.label}: ${point.pct}% concluído`}
          >
            <div className="evolutionBarTrack">
              <span
                style={{ "--pct": `${point.total ? Math.max(point.pct, 4) : 0}%` } as CSSProperties}
              />
            </div>
            <small>{mode === "week" ? point.shortLabel : point.date.slice(-2)}</small>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function ProgressCharts({ weekly, monthly }: ProgressChartsProps) {
  return (
    <section className="evolutionPanel" aria-labelledby="evolution-title">
      <div className="evolutionHeader">
        <div>
          <p className="eyebrow">evolução</p>
          <h2 id="evolution-title">Seu progresso no tempo</h2>
        </div>
        <span>Histórico desde 15/06/2026</span>
      </div>

      <div className="evolutionCharts">
        <ChartCard title="Semana" points={weekly} mode="week" />
        <ChartCard title="Mês" points={monthly} mode="month" />
      </div>
    </section>
  );
}
