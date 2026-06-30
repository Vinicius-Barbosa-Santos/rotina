import type { RoutineReportDay, TelegramRoutineReport } from "@/lib/types";

const periodLabels = {
  daily: "diário",
  weekly: "semanal",
  monthly: "mensal"
} as const;

function isFiniteCount(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10000;
}

function isReportDay(value: unknown): value is RoutineReportDay {
  if (!value || typeof value !== "object") return false;
  const day = value as Partial<RoutineReportDay>;
  return (
    typeof day.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
    isFiniteCount(day.done) &&
    isFiniteCount(day.total) &&
    Boolean(day.done! <= day.total!) &&
    Array.isArray(day.sections) &&
    day.sections.length <= 30 &&
    day.sections.every(
      (section) =>
        Boolean(section) &&
        typeof section.label === "string" &&
        section.label.length > 0 &&
        section.label.length <= 100 &&
        isFiniteCount(section.done) &&
        isFiniteCount(section.total) &&
        section.done <= section.total
    )
  );
}

export function isRoutineReport(value: unknown): value is TelegramRoutineReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<TelegramRoutineReport>;
  return (
    ["daily", "weekly", "monthly"].includes(report.period ?? "") &&
    isFiniteCount(report.streak) &&
    typeof report.generatedAt === "string" &&
    report.generatedAt.length <= 50 &&
    Array.isArray(report.days) &&
    report.days.length > 0 &&
    report.days.length <= 31 &&
    report.days.every(isReportDay)
  );
}

function totalForDays(days: RoutineReportDay[]) {
  return days.reduce(
    (result, day) => ({ done: result.done + day.done, total: result.total + day.total }),
    { done: 0, total: 0 }
  );
}

function percentage(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

function formatReportDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(`${value}T12:00:00-03:00`));
}

function motivationalMessage(pct: number) {
  if (pct === 100) return "Dia perfeito. Você cumpriu tudo o que planejou. Continue protegendo essa consistência.";
  if (pct >= 80) return "Excelente ritmo. Sua consistência está transformando esforço em evolução.";
  if (pct >= 50) return "Bom avanço. Você fez o dia andar e amanhã pode continuar de onde parou.";
  if (pct > 0) return "Cada tarefa concluída conta. Recomeçar no próximo bloco também faz parte da consistência.";
  return "Hoje pode não ter saído como planejado, mas amanhã é uma nova chance de manter a rotina viva.";
}

function aggregateSections(days: RoutineReportDay[]) {
  const sections = new Map<string, { done: number; total: number }>();

  days.forEach((day) => {
    day.sections.forEach((section) => {
      const current = sections.get(section.label) ?? { done: 0, total: 0 };
      sections.set(section.label, {
        done: current.done + section.done,
        total: current.total + section.total
      });
    });
  });

  return [...sections.entries()]
    .filter(([, values]) => values.total > 0)
    .sort((a, b) => b[1].done - a[1].done);
}

function findSection(sections: Array<[string, { done: number; total: number }]>, patterns: RegExp[]) {
  return sections.find(([label]) => patterns.some((pattern) => pattern.test(label)));
}

function formatSectionScore(entry: [string, { done: number; total: number }] | undefined, fallback: string) {
  if (!entry) return fallback;
  const [label, values] = entry;
  return `${label}: ${values.done}/${values.total} (${percentage(values.done, values.total)}%)`;
}

function getWeeklyInsights(report: TelegramRoutineReport) {
  const sections = aggregateSections(report.days);
  const strongest = sections[0];
  const weakest = [...sections].sort((a, b) => percentage(a[1].done, a[1].total) - percentage(b[1].done, b[1].total))[0];
  const programming = findSection(sections, [/programa/i, /c[oó]digo/i, /stack/i, /builder/i]);
  const optionalGrowth = findSection(sections, [/finance/i, /invest/i, /youtube/i, /marketing/i, /opcional/i]);
  const totals = totalForDays(report.days);
  const pct = percentage(totals.done, totals.total);

  const recommendation =
    pct >= 85
      ? "Mantenha o mesmo ritmo e escolha uma melhoria pequena para aumentar qualidade, não volume."
      : pct >= 60
        ? "Proteja programação e inglês primeiro; deixe o resto como bônus."
        : "Reduza o escopo da próxima semana e vença com tarefas menores todos os dias úteis.";

  return [
    "",
    "🧠 Leitura inteligente da semana",
    `• Pontos fortes: ${formatSectionScore(strongest, "houve avanço, mas ainda sem seção dominante.")}`,
    `• Onde caiu: ${formatSectionScore(weakest, "sem queda clara nesta semana.")}`,
    `• Recomendação: ${recommendation}`,
    `• Foco de programação: ${formatSectionScore(programming, "priorize uma entrega pequena de código por dia útil.")}`,
    `• Investimentos/YouTube/marketing: ${formatSectionScore(optionalGrowth, "use o fim de semana como opcional, sem afetar o streak.")}`
  ];
}

export function formatTelegramReport(report: TelegramRoutineReport) {
  const totals = totalForDays(report.days);
  const pct = percentage(totals.done, totals.total);
  const completeDays = report.days.filter((day) => day.total > 0 && day.done === day.total).length;
  const title = `🔥 Relatório ${periodLabels[report.period]} da Minha Rotina`;
  const lines = [title, "", `✅ ${totals.done} de ${totals.total} tarefas concluídas (${pct}%)`, `🔥 Streak atual: ${report.streak} dia${report.streak === 1 ? "" : "s"}`];

  if (report.period === "daily") {
    const day = report.days[0];
    lines.splice(2, 0, `📅 ${day ? formatReportDate(day.date) : "Hoje"}`, "");
    if (day?.sections.length) {
      lines.push("", "Por seção:");
      day.sections.forEach((section) => lines.push(`• ${section.label}: ${section.done}/${section.total}`));
    }
  } else {
    lines.push(`📆 ${completeDays} dia${completeDays === 1 ? "" : "s"} com a rotina completa`);
    lines.push("", "Evolução por seção:");
    aggregateSections(report.days).forEach(([label, values]) => {
      lines.push(`• ${label}: ${values.done}/${values.total} (${percentage(values.done, values.total)}%)`);
    });
    if (report.period === "weekly") lines.push(...getWeeklyInsights(report));
  }

  lines.push("", motivationalMessage(pct));
  return lines.join("\n").slice(0, 4096);
}
