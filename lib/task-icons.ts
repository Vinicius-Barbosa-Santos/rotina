export type TaskIconName =
  | "alarm"
  | "bed"
  | "book"
  | "briefcase"
  | "calendar"
  | "checklist"
  | "code"
  | "coffee"
  | "dumbbell"
  | "fileText"
  | "gitPullRequest"
  | "globe"
  | "heart"
  | "home"
  | "lightbulb"
  | "megaphone"
  | "message"
  | "mic"
  | "moon"
  | "notebook"
  | "play"
  | "rocket"
  | "sparkles"
  | "target"
  | "trendingUp"
  | "utensils"
  | "wallet"
  | "water"
  | "youtube";

const taskIconRules: Array<{ icon: TaskIconName; keywords: string[] }> = [
  { icon: "alarm", keywords: ["acordar"] },
  { icon: "bed", keywords: ["arrumar cama", "cama"] },
  { icon: "water", keywords: ["agua", "beber"] },
  { icon: "sparkles", keywords: ["oracao", "alongamento", "mindfulness"] },
  { icon: "coffee", keywords: ["cafe"] },
  { icon: "home", keywords: ["casa", "roupa", "documentos"] },
  { icon: "calendar", keywords: ["planejamento", "priorizar", "sprint", "jira", "agenda"] },
  { icon: "message", keywords: ["daily", "conversacao", "conversar", "comunicacao", "feedback", "respeito", "networking"] },
  { icon: "wallet", keywords: ["investimento", "investimentos", "patrimonio", "aportes", "financeiro"] },
  { icon: "youtube", keywords: ["youtube"] },
  { icon: "play", keywords: ["gravar", "video", "roteiro", "pauta"] },
  { icon: "megaphone", keywords: ["marketing", "conteudo", "distribuicao", "posicionamento"] },
  { icon: "book", keywords: ["leitura", "vocabulario", "listening", "ingles", "estudar", "aprendi"] },
  { icon: "code", keywords: ["programacao", "codigo", "feature", "correcao", "frontend", "backend", "react", "java"] },
  { icon: "gitPullRequest", keywords: ["pull request", "pull requests", "revisar codigo", "review"] },
  { icon: "checklist", keywords: ["testes", "teste", "pendencias", "task", "tasks"] },
  { icon: "fileText", keywords: ["documentacao", "documentar"] },
  { icon: "utensils", keywords: ["almoco", "jantar", "refeicao", "cozinhar"] },
  { icon: "dumbbell", keywords: ["academia", "treino", "caminhada"] },
  { icon: "rocket", keywords: ["certificacao", "portfolio", "system design", "arquitetura", "carreira"] },
  { icon: "lightbulb", keywords: ["ideia", "ideias", "renda extra"] },
  { icon: "heart", keywords: ["familia", "amigos", "pessoas", "relacionamento"] },
  { icon: "target", keywords: ["prioridade", "objetivo"] },
  { icon: "trendingUp", keywords: ["evolucao", "crescimento", "crescer"] },
  { icon: "briefcase", keywords: ["trabalho"] },
  { icon: "moon", keywords: ["domingo", "semana"] },
  { icon: "globe", keywords: ["internacional"] }
];

export function getTaskIconName(label: string): TaskIconName {
  const normalizedLabel = normalize(label);
  const rule = taskIconRules.find((item) => item.keywords.some((keyword) => normalizedLabel.includes(keyword)));
  return rule?.icon ?? "notebook";
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
