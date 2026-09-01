// Conteúdo condensado a partir da seção "Trilhas Técnicas em Andamento".
export const currentProfileStacks = [
  "Full-Stack TypeScript",
  "React",
  "Angular",
  "Java & Spring Boot",
  "Microsserviços Node.js",
  "GraphQL",
  "AWS",
  "Desenvolvimento com IA"
] as const;

export const stackCategoryOrder = ["Base Full-Stack", "Frontend", "Backend", "Cloud", "IA", "Outras"] as const;
export type StackCategory = (typeof stackCategoryOrder)[number];

const defaultStackTopics = [
  "Entender os fundamentos essenciais",
  "Praticar com um exercício real",
  "Aplicar em um pequeno projeto",
  "Validar com testes e boas práticas"
] as const;

const stackTopics: Record<string, readonly string[]> = {
  "full-stack typescript": [
    "JavaScript: escopo, closures e assincronismo",
    "TypeScript: generics e utility types",
    "APIs seguras com autenticação e validação",
    "Dados, testes, Docker e deploy"
  ],
  react: [
    "Componentes, props, estado e hooks",
    "Dados do servidor, cache e rotas",
    "Formulários acessíveis e validação",
    "Testes, performance e boas práticas"
  ],
  angular: [
    "Componentes standalone e data binding",
    "Serviços, injeção de dependência e Signals",
    "RxJS e programação reativa",
    "Forms, rotas e consumo de APIs"
  ],
  "java & spring boot": [
    "Java: orientação a objetos, collections e streams",
    "APIs Spring com camadas, DTOs e validação",
    "JPA, relacionamentos e transações",
    "Security, testes e observabilidade"
  ],
  "microsserviços node.js": [
    "Limites de domínio e comunicação entre serviços",
    "Mensageria, idempotência, retries e DLQ",
    "Resiliência com gateway, timeout e circuit breaker",
    "Docker Compose e transações distribuídas"
  ],
  graphql: [
    "Schemas, queries, mutations e subscriptions",
    "Resolvers seguros e DataLoader",
    "Cliente, cache e fragmentos",
    "Atualizações otimistas e testes"
  ],
  aws: [
    "Regiões, disponibilidade e responsabilidade compartilhada",
    "IAM e princípio do menor privilégio",
    "EC2, VPC, Lambda e API Gateway",
    "S3, bancos, CloudWatch e controle de custos"
  ],
  "desenvolvimento com ia": [
    "Contexto, regras e prompts objetivos",
    "Codex e Claude Code para implementar e diagnosticar",
    "Testes, revisão e segurança assistidos por IA",
    "Controle de contexto, tokens e documentação"
  ]
};

const stackCategories: Record<string, StackCategory> = {
  "full-stack typescript": "Base Full-Stack",
  react: "Frontend",
  angular: "Frontend",
  "java & spring boot": "Backend",
  "microsserviços node.js": "Backend",
  graphql: "Backend",
  aws: "Cloud",
  "desenvolvimento com ia": "IA"
};

function normalizeStackName(stack: string) {
  return stack.trim().toLocaleLowerCase("pt-BR");
}

export function getStackCategory(stack: string): StackCategory {
  return stackCategories[normalizeStackName(stack)] ?? "Outras";
}

export function getStackTopics(stack: string) {
  return [...(stackTopics[normalizeStackName(stack)] ?? defaultStackTopics)];
}

export function mergeProfileStacks(stacks: readonly string[]) {
  const unique = new Map<string, string>();

  [...currentProfileStacks, ...stacks].forEach((stack) => {
    const value = stack.trim();
    if (value) unique.set(normalizeStackName(value), value);
  });

  return [...unique.values()];
}
