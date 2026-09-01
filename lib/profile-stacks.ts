export const currentProfileStacks = [
  "Java",
  "Spring Boot",
  "Angular",
  "React",
  "Next.js",
  "Node.js",
  "GraphQL",
  "TypeScript",
  "AWS",
  "AWS Lambda",
  "Amazon API Gateway",
  "Amazon SQS",
  "Amazon DynamoDB",
  "Amazon CloudWatch",
  "Amazon S3",
  "Docker",
  "Kubernetes",
  "Jenkins",
  "Git",
  "Oracle",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "REST APIs",
  "Microservices",
  "Codex",
  "Claude Code",
  "Cursor"
] as const;

export const stackCategoryOrder = ["Frontend", "Backend & APIs", "Cloud AWS", "Dados & DevOps", "IA & Ferramentas", "Outras"] as const;
export type StackCategory = (typeof stackCategoryOrder)[number];

const defaultStackTopics = [
  "Fundamentos e ambiente",
  "Prática guiada",
  "Projeto aplicado",
  "Testes e boas práticas"
] as const;

const stackTopics: Record<string, readonly string[]> = {
  java: ["Orientação a objetos", "Collections e Streams", "Concorrência", "Testes e build"],
  "spring boot": ["REST e injeção de dependência", "JPA e transações", "Spring Security", "Testes e observabilidade"],
  angular: ["Componentes e Signals", "RxJS", "Forms e Router", "Testes e performance"],
  react: ["Componentes e estado", "Hooks", "Rotas e dados do servidor", "Testes e acessibilidade"],
  "next.js": ["App Router e renderização", "Server e Client Components", "Dados e cache", "Deploy e performance"],
  "node.js": ["Runtime e assincronismo", "APIs", "Persistência e autenticação", "Testes e performance"],
  graphql: ["Schema, queries e mutations", "Resolvers e contexto", "DataLoader e cache", "Subscriptions e testes"],
  typescript: ["Tipos e narrowing", "Generics e utility types", "Tipos avançados", "Configuração e integração"],
  aws: ["IAM e responsabilidade compartilhada", "Computação e rede", "Dados e armazenamento", "Monitoramento e custos"],
  "aws lambda": ["Funções e runtimes", "Eventos e integrações", "Permissões", "Observabilidade e performance"],
  "amazon api gateway": ["Rotas e integrações", "Autorização", "Throttling e cache", "Monitoramento e deploy"],
  "amazon sqs": ["Filas e ciclo da mensagem", "Retries e DLQ", "Idempotência", "Monitoramento e escala"],
  "amazon dynamodb": ["Chaves e modelagem", "Índices e consultas", "Capacidade", "Streams e transações"],
  "amazon cloudwatch": ["Logs e métricas", "Alarmes", "Dashboards", "Tracing e Insights"],
  "amazon s3": ["Buckets e objetos", "IAM e políticas", "Lifecycle e versionamento", "Eventos e hospedagem"],
  docker: ["Dockerfile e imagens", "Containers, redes e volumes", "Docker Compose", "Segurança e otimização"],
  kubernetes: ["Pods e Deployments", "Services e Ingress", "ConfigMaps e Secrets", "Escala e observabilidade"],
  jenkins: ["Pipelines", "Agents e stages", "Credenciais e artefatos", "Automação e notificações"],
  git: ["Commits e branches", "Merge e rebase", "Pull requests e revisão", "Recuperação e tags"],
  oracle: ["SQL e PL/SQL", "Modelagem e índices", "Transações", "Administração e performance"],
  postgresql: ["Modelagem e SQL", "Índices e planos", "Transações", "Backup e segurança"],
  mongodb: ["Documentos e schema", "Consultas e índices", "Aggregation", "Replicação e transações"],
  redis: ["Estruturas de dados", "Estratégias de cache", "Pub/Sub e Streams", "Persistência e alta disponibilidade"],
  "rest apis": ["Recursos e HTTP", "Validação e erros", "Autenticação e versionamento", "Documentação e testes"],
  microservices: ["Limites e DDD", "Comunicação síncrona e assíncrona", "Resiliência", "Observabilidade e deploy"],
  codex: ["Prompts e contexto", "Alterações no projeto", "Testes e revisão", "Automação e segurança"],
  "claude code": ["Contexto do projeto", "Edição e refatoração", "Testes e depuração", "Agentes e custos"],
  cursor: ["Rules e contexto", "Composer", "Refatoração e depuração", "Fluxos de trabalho"]
};

const stackCategories: Record<string, StackCategory> = {
  angular: "Frontend",
  react: "Frontend",
  "next.js": "Frontend",
  typescript: "Frontend",
  java: "Backend & APIs",
  "spring boot": "Backend & APIs",
  "node.js": "Backend & APIs",
  graphql: "Backend & APIs",
  "rest apis": "Backend & APIs",
  microservices: "Backend & APIs",
  aws: "Cloud AWS",
  "aws lambda": "Cloud AWS",
  "amazon api gateway": "Cloud AWS",
  "amazon sqs": "Cloud AWS",
  "amazon dynamodb": "Cloud AWS",
  "amazon cloudwatch": "Cloud AWS",
  "amazon s3": "Cloud AWS",
  docker: "Dados & DevOps",
  kubernetes: "Dados & DevOps",
  jenkins: "Dados & DevOps",
  git: "Dados & DevOps",
  oracle: "Dados & DevOps",
  postgresql: "Dados & DevOps",
  mongodb: "Dados & DevOps",
  redis: "Dados & DevOps",
  codex: "IA & Ferramentas",
  "claude code": "IA & Ferramentas",
  cursor: "IA & Ferramentas"
};

export function getStackCategory(stack: string): StackCategory {
  return stackCategories[stack.trim().toLocaleLowerCase("pt-BR")] ?? "Outras";
}

export function getStackTopics(stack: string) {
  return [...(stackTopics[stack.trim().toLocaleLowerCase("pt-BR")] ?? defaultStackTopics)];
}

export function mergeProfileStacks(stacks: readonly string[]) {
  const unique = new Map<string, string>();

  [...currentProfileStacks, ...stacks].forEach((stack) => {
    const value = stack.trim();
    if (value) unique.set(value.toLocaleLowerCase("pt-BR"), value);
  });

  return [...unique.values()];
}
