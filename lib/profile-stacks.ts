// Conteúdo condensado a partir da seção "Trilhas Técnicas em Andamento".
export const currentProfileStacks = [
  "HTML, CSS & JavaScript",
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
  "Configurar o ambiente e entender os fundamentos",
  "Aprender a sintaxe e os principais conceitos",
  "Praticar cada conceito com exercícios pequenos",
  "Conhecer as ferramentas e bibliotecas principais",
  "Construir uma funcionalidade completa",
  "Tratar erros, validação e segurança",
  "Escrever testes automatizados",
  "Aplicar boas práticas e refatoração",
  "Publicar um projeto próprio",
  "Documentar o aprendizado e revisar pontos fracos"
] as const;

const stackTopics: Record<string, readonly string[]> = {
  "html, css & javascript": [
    "Entender como a web funciona: navegador, servidor, HTTP, URLs e DevTools",
    "Criar páginas com HTML semântico, metadados e uma estrutura acessível",
    "Dominar links, imagens, tabelas, mídia e formulários com validação",
    "Aplicar CSS com cascata, especificidade, herança e box model",
    "Construir layouts responsivos com Flexbox, Grid e abordagem mobile-first",
    "Usar variáveis, pseudo-classes, animações e uma organização sustentável de CSS",
    "Dominar JavaScript: tipos, operadores, condições, laços e funções",
    "Trabalhar com arrays, objetos, escopo, closures e módulos",
    "Manipular DOM, eventos, formulários, storage e acessibilidade pelo JavaScript",
    "Consumir APIs com Fetch, Promises, async/await e tratamento de erros",
    "Melhorar qualidade com depuração, testes, desempenho e boas práticas",
    "Construir, documentar e publicar uma aplicação responsiva completa sem framework"
  ],
  "full-stack typescript": [
    "Entender web, HTTP, navegador, terminal e Git",
    "Dominar JavaScript: tipos, funções, objetos, arrays e módulos",
    "Entender escopo, closures, protótipos e event loop",
    "Trabalhar com Promises, async/await e tratamento de erros",
    "Aplicar TypeScript: interfaces, unions, narrowing e generics",
    "Usar mapped types, utility types e configuração estrita",
    "Construir APIs Node.js com rotas, camadas e validação",
    "Implementar autenticação, autorização, sessões ou JWT",
    "Modelar SQL, migrations, relacionamentos, índices e transações",
    "Usar NoSQL e cache somente quando o problema justificar",
    "Integrar frontend, API, estado, cache, CSR e SSR",
    "Testar, proteger, documentar, dockerizar e publicar um projeto completo"
  ],
  react: [
    "Revisar JavaScript moderno, módulos e imutabilidade",
    "Criar componentes com JSX, props, composição e eventos",
    "Controlar estado local e renderização condicional",
    "Dominar useState, useEffect, useRef e hooks personalizados",
    "Criar formulários acessíveis com React Hook Form e Zod",
    "Implementar rotas, layouts, loading, erro e páginas vazias",
    "Consumir APIs e gerenciar cache com TanStack Query ou SWR",
    "Usar Context e estado global apenas quando necessário",
    "Testar comportamento, interações e acessibilidade",
    "Otimizar renderização, memoização, divisão de código e imagens",
    "Conhecer Server Components e os fundamentos do Next.js",
    "Publicar uma aplicação completa com documentação e testes"
  ],
  angular: [
    "Revisar TypeScript, decorators, classes e interfaces",
    "Configurar workspace, Angular CLI e estrutura do projeto",
    "Criar componentes standalone, templates e data binding",
    "Usar diretivas, pipes e comunicação entre componentes",
    "Organizar serviços e injeção de dependências",
    "Gerenciar estado local e derivado com Signals",
    "Dominar Observables, operadores, Subjects e RxJS",
    "Criar Reactive Forms com validação e mensagens de erro",
    "Configurar rotas, lazy loading, guards e resolvers",
    "Consumir APIs com HttpClient e interceptors",
    "Escrever testes de componentes, serviços e fluxos",
    "Otimizar build e publicar uma aplicação Angular completa"
  ],
  "java & spring boot": [
    "Dominar sintaxe Java, tipos, fluxo, métodos e depuração",
    "Aplicar orientação a objetos, interfaces, records e enums",
    "Usar collections, generics, streams, lambdas e Optional",
    "Tratar exceptions, datas, arquivos e entrada e saída",
    "Entender concorrência, executors e CompletableFuture",
    "Configurar Maven ou Gradle e testes com JUnit e Mockito",
    "Criar projeto Spring Boot com configuração e injeção de dependência",
    "Organizar controllers, services, repositories, DTOs e mappers",
    "Validar entradas e padronizar o tratamento de erros",
    "Modelar entidades, JPA, relacionamentos, queries e transações",
    "Implementar autenticação e autorização com Spring Security e JWT",
    "Testar com MockMvc e Testcontainers, observar e publicar uma API"
  ],
  "microsserviços node.js": [
    "Construir um serviço Node.js com TypeScript, testes e configuração",
    "Separar domínios, responsabilidades e dados de cada serviço",
    "Definir contratos REST e versionamento compatível",
    "Comparar comunicação síncrona, gRPC e eventos",
    "Usar filas ou streaming com RabbitMQ, Kafka ou SQS",
    "Garantir idempotência, retries, deduplicação e DLQ",
    "Implementar API Gateway, autenticação e rate limiting",
    "Aplicar timeout, circuit breaker, fallback e health checks",
    "Coordenar transações distribuídas com sagas e compensações",
    "Adicionar logs estruturados, métricas, traces e alertas",
    "Executar o ambiente com Docker e Docker Compose",
    "Testar contratos e falhas e publicar um sistema com dois serviços"
  ],
  graphql: [
    "Entender quando GraphQL é adequado e compará-lo com REST",
    "Modelar schema, scalars, types, interfaces e unions",
    "Criar queries, mutations, inputs e fragments",
    "Implementar resolvers, contexto e separação em camadas",
    "Validar entradas, autenticar e autorizar operações",
    "Resolver o problema N+1 com DataLoader e batching",
    "Implementar paginação, filtros, erros e limites de consulta",
    "Adicionar subscriptions quando houver necessidade em tempo real",
    "Integrar Apollo Client ou Urql e gerenciar o cache",
    "Criar atualizações otimistas e fragmentos reutilizáveis",
    "Testar schema, resolvers, autorização e integração",
    "Publicar uma aplicação Full-Stack GraphQL documentada"
  ],
  aws: [
    "Entender regiões, zonas e responsabilidade compartilhada",
    "Configurar conta, MFA, budgets e alertas de custo",
    "Dominar IAM, roles, policies e menor privilégio",
    "Entender VPC, subnets, rotas, security groups e DNS",
    "Executar aplicações com EC2, Load Balancer e Auto Scaling",
    "Armazenar arquivos com S3, políticas, lifecycle e versionamento",
    "Escolher entre RDS e DynamoDB conforme acesso e consistência",
    "Criar funções Lambda orientadas a eventos",
    "Expor serviços com API Gateway",
    "Processar tarefas assíncronas com SQS, SNS e EventBridge",
    "Monitorar logs, métricas e alarmes com CloudWatch",
    "Automatizar, proteger e publicar uma arquitetura pequena controlando custos"
  ],
  "desenvolvimento com ia": [
    "Entender capacidades, limites, alucinações e janela de contexto",
    "Escrever objetivos claros, restrições e critérios de aceite",
    "Fornecer contexto relevante sem expor dados sensíveis",
    "Criar regras reutilizáveis para o projeto e sua arquitetura",
    "Usar Cursor para navegar, editar e refatorar com contexto",
    "Usar Codex para implementar, testar e revisar alterações completas",
    "Usar Claude Code para análise, diagnóstico e refatoração",
    "Dividir tarefas grandes em planos pequenos e verificáveis",
    "Validar toda saída com testes, tipos, lint e revisão humana",
    "Revisar segurança, permissões, dependências e dados privados",
    "Gerenciar contexto, tokens, custo e escolha de modelo",
    "Automatizar um fluxo real e documentar decisões, riscos e resultados"
  ]
};

const stackCategories: Record<string, StackCategory> = {
  "html, css & javascript": "Base Full-Stack",
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
