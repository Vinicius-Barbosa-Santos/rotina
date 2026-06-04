export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RoutineItem = {
  label: string;
  days?: Weekday[];
};

export type RoutineSection = {
  key: string;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  bg: string;
  time: string;
  note?: string;
  days?: Weekday[];
  items: RoutineItem[];
  references?: string[];
};

const weekdays: Weekday[] = [1, 2, 3, 4, 5];

export const routineSections: RoutineSection[] = [
  {
    key: "personal",
    icon: "Sun",
    label: "Desenvolvimento Pessoal",
    shortLabel: "Pessoal",
    color: "#f7c948",
    bg: "rgba(247, 201, 72, 0.12)",
    time: "06:30-08:00",
    days: weekdays,
    items: [
      { label: "Acordar" },
      { label: "Arrumar cama" },
      { label: "Beber água" },
      { label: "Oração" },
      { label: "Alongamento (10 min)" },
      { label: "Café da manhã" },
      { label: "Planejamento do dia" }
    ]
  },
  {
    key: "english",
    icon: "EN",
    label: "Inglês",
    shortLabel: "Inglês",
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.12)",
    time: "09:00-10:00",
    note: "Objetivo: exposição diária ao idioma.",
    days: weekdays,
    items: [
      { label: "Conversação" },
      { label: "Leitura" },
      { label: "Vocabulário" },
      { label: "Listening" }
    ]
  },
  {
    key: "work",
    icon: "Job",
    label: "Trabalho",
    shortLabel: "Trabalho",
    color: "#4f8ef7",
    bg: "rgba(79, 142, 247, 0.12)",
    time: "10:00-18:00",
    days: weekdays,
    items: [
      { label: "Daily" },
      { label: "Demandas do dia" },
      { label: "Revisão de código" },
      { label: "Atualização Jira" },
      { label: "Documentação" },
      { label: "Aprender algo novo no trabalho" },
      { label: "Almoço" },
      { label: "Caminhada após almoço" },
      { label: "Revisar pendências antes de encerrar" }
    ]
  },
  {
    key: "career",
    icon: "Rocket",
    label: "Evolução Profissional",
    shortLabel: "Carreira",
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.12)",
    time: "18:30-20:00",
    days: weekdays,
    items: [
      { label: "React" },
      { label: "Java" },
      { label: "AWS" }
    ]
  },
  {
    key: "health",
    icon: "Fit",
    label: "Saúde",
    shortLabel: "Saúde",
    color: "#8ec3f7",
    bg: "rgba(142, 195, 247, 0.12)",
    time: "20:00-21:00",
    days: weekdays,
    items: [
      { label: "Academia" },
      { label: "Alongamento" },
      { label: "Jantar" },
      { label: "Água" },
      { label: "Caminhada leve (opcional)" }
    ]
  },
  {
    key: "growth",
    icon: "Growth",
    label: "Crescimento",
    shortLabel: "Crescer",
    color: "#b57bee",
    bg: "rgba(181, 123, 238, 0.12)",
    time: "21:00-22:30",
    note: "Alternar entre os temas da semana.",
    days: weekdays,
    items: [
      { label: "Leitura", days: [1] },
      { label: "Certificação", days: [2] },
      { label: "LinkedIn", days: [3] },
      { label: "Portfólio", days: [4] },
      { label: "Networking", days: [5] }
    ]
  },
  {
    key: "saturday",
    icon: "Code",
    label: "Sábado",
    shortLabel: "Sábado",
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.12)",
    time: "flexível",
    note: "Dia para projeto pessoal, social e organização sem ritmo de trabalho.",
    days: [6],
    items: [
      { label: "Projeto pessoal" },
      { label: "Projeto Full Stack" },
      { label: "React + Java" },
      { label: "Organizar a semana" },
      { label: "Fazer algo fora de casa" }
    ]
  },
  {
    key: "finance",
    icon: "Cash",
    label: "Financeiro",
    shortLabel: "Finanças",
    color: "#52c98e",
    bg: "rgba(82, 201, 142, 0.12)",
    time: "semanal",
    note: "Aparece segunda, sexta e domingo.",
    items: [
      { label: "Revisar investimentos", days: [1] },
      { label: "Atualizar patrimônio", days: [5] },
      { label: "Planejamento financeiro", days: [0] },
      { label: "Registrar gastos da semana", days: [0] },
      { label: "Acompanhar evolução rumo ao primeiro milhão", days: [0] }
    ]
  },
  {
    key: "relationships",
    icon: "Heart",
    label: "Relacionamentos",
    shortLabel: "Relações",
    color: "#e87eb8",
    bg: "rgba(232, 126, 184, 0.12)",
    time: "toda semana",
    note: "Aparece no fim de semana para manter vínculos vivos.",
    days: [6, 0],
    items: [
      { label: "Conversar com família" },
      { label: "Conversar com amigos" },
      { label: "Fazer algo fora de casa" },
      { label: "Conhecer pessoas novas" },
      { label: "Sair para um hobby ou atividade social" }
    ]
  },
  {
    key: "sunday-review",
    icon: "Review",
    label: "Revisão de Domingo",
    shortLabel: "Domingo",
    color: "#9ba8b5",
    bg: "rgba(155, 168, 181, 0.12)",
    time: "domingo",
    note: "Responder com calma antes de planejar a próxima semana.",
    days: [0],
    items: [
      { label: "O que aprendi esta semana?", days: [0] },
      { label: "Quanto investi?", days: [0] },
      { label: "Quanto treinei?", days: [0] },
      { label: "Quanto estudei?", days: [0] },
      { label: "O que evoluí em inglês?", days: [0] },
      { label: "O que evoluí em Java?", days: [0] },
      { label: "O que evoluí em React?", days: [0] },
      { label: "Estou mais próximo da vaga internacional?", days: [0] },
      { label: "Qual é a prioridade da próxima semana?", days: [0] }
    ]
  }
];

export function getVisibleItems(section: RoutineSection, date = new Date()) {
  const weekday = date.getDay() as Weekday;
  if (section.days && !section.days.includes(weekday)) return [];
  return section.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.days || item.days.includes(weekday));
}

export function hasScheduledItems(section: RoutineSection, date = new Date()) {
  return getVisibleItems(section, date).length > 0;
}

export function getSectionScheduleLabel(section: RoutineSection) {
  if (section.references?.length) return "referência";
  const days = section.days ?? uniqueDays(section.items.flatMap((item) => item.days ?? []));
  if (!days.length) return "todos os dias";
  if (isSameDays(days, weekdays)) return "segunda a sexta";
  return days.map((day) => ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][day]).join(", ");
}

function uniqueDays(days: Weekday[]) {
  return [...new Set(days)].sort();
}

function isSameDays(a: Weekday[], b: Weekday[]) {
  return a.length === b.length && a.every((day, index) => day === b[index]);
}
