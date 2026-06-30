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
  referenceGroups?: Array<{
    title: string;
    items: string[];
  }>;
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
    days: weekdays,
    note: "Os cinco hábitos acima entram no progresso da rotina. O guia abaixo é apenas um mapa de conhecimento: marque o que já domina e use os itens pendentes para escolher os próximos estudos.",
    items: [
      { label: "Duolingo" },
      { label: "Leitura em inglês" },
      { label: "Vocabulário" },
      { label: "Conversação" },
      { label: "Listening" }
    ],
    referenceGroups: [
      {
        title: "Fundamentos do idioma",
        items: [
          "Alfabeto, soletração, números, datas, horas e valores",
          "Pronomes pessoais, possessivos, demonstrativos e objetos",
          "Verbo to be no presente e no passado",
          "There is, there are, have e have got",
          "Artigos a, an e the e quando não usar artigo",
          "Plural, substantivos contáveis e incontáveis",
          "Some, any, much, many, few, little e a lot of"
        ]
      },
      {
        title: "Present Simple e Present Continuous",
        items: [
          "Present Simple para rotina, fatos e hábitos",
          "Do, does, negativas e perguntas no Present Simple",
          "Advérbios de frequência: always, usually, often, sometimes e never",
          "Present Continuous para ações acontecendo agora",
          "Am, is, are + verbo com -ing em frases, negativas e perguntas",
          "Regras de escrita do -ing: working, making, running e lying",
          "Diferença entre Present Simple e Present Continuous",
          "Stative verbs: know, want, need, believe, understand e prefer"
        ]
      },
      {
        title: "Passado e narrativas",
        items: [
          "Past Simple com verbos regulares e irregulares",
          "Did, negativas e perguntas no passado",
          "Past Continuous para ações em andamento no passado",
          "Diferença entre Past Simple e Past Continuous",
          "Used to para hábitos e situações antigas",
          "Marcadores de tempo: ago, last, yesterday, when e while",
          "Contar uma sequência de acontecimentos com clareza"
        ]
      },
      {
        title: "Present Perfect e tempos perfeitos",
        items: [
          "Present Perfect com have ou has + particípio",
          "Experiências com ever, never, already, yet e just",
          "Ações com duração usando since e for",
          "Diferença entre Present Perfect e Past Simple",
          "Present Perfect Continuous para duração e atividade recente",
          "Past Perfect para ordenar acontecimentos no passado",
          "Particípios dos verbos irregulares mais frequentes"
        ]
      },
      {
        title: "Futuro",
        items: [
          "Will para decisões, previsões, promessas e ofertas",
          "Going to para planos e previsões com evidência",
          "Present Continuous para compromissos futuros",
          "Present Simple para horários e programações",
          "Future Continuous e Future Perfect",
          "Orações de tempo futuro com when, as soon as, before e after",
          "Diferenças práticas entre will, going to e formas do presente"
        ]
      },
      {
        title: "Modais, condições e hipóteses",
        items: [
          "Can, could, may e might para capacidade e possibilidade",
          "Must, have to, should e ought to para obrigação e conselho",
          "Would para pedidos, preferências e situações hipotéticas",
          "Zero e First Conditional para fatos e possibilidades reais",
          "Second Conditional para hipóteses presentes",
          "Third Conditional para hipóteses passadas",
          "Mixed Conditionals",
          "Wish, if only e would rather"
        ]
      },
      {
        title: "Estruturas gramaticais avançadas",
        items: [
          "Voz passiva nos principais tempos verbais",
          "Reported Speech e mudanças de tempo, pronome e referência",
          "Relative clauses com who, which, that, whose e where",
          "Gerunds e infinitives: doing, to do e bare infinitive",
          "Comparativos, superlativos e estruturas com as...as",
          "Question tags e perguntas indiretas",
          "Inversão e estruturas de ênfase",
          "Phrasal verbs, collocations e padrões verbo + preposição"
        ]
      },
      {
        title: "Construção de frases",
        items: [
          "Ordem de palavras em afirmações, negativas e perguntas",
          "Adjetivos, advérbios e posição na frase",
          "Preposições de tempo, lugar, movimento e combinação fixa",
          "Conectores de adição, contraste, causa, efeito e conclusão",
          "Orações simples, compostas e complexas",
          "Pontuação, contrações e uso de maiúsculas",
          "Coesão: referência, substituição e evitar repetição",
          "Paráfrase e escolha de registro formal ou informal"
        ]
      },
      {
        title: "Vocabulário geral",
        items: [
          "Apresentações, família, casa, alimentação e rotina",
          "Cidade, transporte, viagens e direções",
          "Saúde, corpo, emoções e bem-estar",
          "Compras, dinheiro, serviços e atendimento",
          "Educação, notícias, cultura e entretenimento",
          "Trabalho, carreira, reuniões e produtividade",
          "Sinônimos, antônimos, word families e formação de palavras",
          "Expressões idiomáticas e phrasal verbs de alta frequência"
        ]
      },
      {
        title: "Pronúncia",
        items: [
          "Sons vocálicos curtos, longos e ditongos",
          "Consoantes difíceis para falantes de português: th, r, h, w e final sounds",
          "Pronúncia das terminações -ed e -s",
          "Word stress e sílaba tônica",
          "Sentence stress, ritmo e redução de palavras funcionais",
          "Connected speech: linking, assimilation e contractions",
          "Entonação em afirmações, perguntas, contraste e emoção",
          "Alfabeto fonético e uso de dicionário com áudio"
        ]
      },
      {
        title: "Listening",
        items: [
          "Identificar ideia principal antes de buscar detalhes",
          "Reconhecer números, nomes, datas e palavras-chave",
          "Entender diferentes sotaques e velocidades de fala",
          "Acompanhar conversas, entrevistas, vídeos e podcasts",
          "Entender instruções, explicações e opiniões",
          "Inferir significado pelo contexto",
          "Praticar shadowing, transcrição e repetição espaçada",
          "Assistir sem legenda, com legenda em inglês e revisar trechos difíceis"
        ]
      },
      {
        title: "Speaking",
        items: [
          "Apresentar-se e sustentar uma conversa cotidiana",
          "Descrever pessoas, lugares, processos e experiências",
          "Narrar acontecimentos no presente, passado e futuro",
          "Expressar opinião, concordar, discordar e justificar",
          "Pedir repetição, esclarecimento e tempo para pensar",
          "Falar com fluidez sem traduzir cada frase mentalmente",
          "Reformular quando não souber uma palavra",
          "Gravar a própria fala e corrigir clareza, gramática e pronúncia"
        ]
      },
      {
        title: "Reading",
        items: [
          "Skimming para identificar assunto e estrutura",
          "Scanning para localizar informações específicas",
          "Distinguir fato, opinião, argumento e exemplo",
          "Inferir palavras desconhecidas pelo contexto",
          "Reconhecer referência de pronomes e conectores",
          "Ler notícias, artigos, mensagens e textos longos",
          "Resumir ideias principais com as próprias palavras",
          "Usar dicionário monolíngue sem interromper toda a leitura"
        ]
      },
      {
        title: "Writing",
        items: [
          "Escrever frases corretas e parágrafos com uma ideia central",
          "Organizar introdução, desenvolvimento e conclusão",
          "Usar conectores e evitar repetição",
          "Escrever mensagens, e-mails e solicitações claras",
          "Descrever fatos, processos, problemas e soluções",
          "Resumir e parafrasear sem copiar o texto original",
          "Revisar gramática, vocabulário, tom e pontuação",
          "Escrever textos formais e informais adequados ao público"
        ]
      },
      {
        title: "Inglês profissional",
        items: [
          "Apresentar trajetória, responsabilidades e resultados",
          "Participar de reuniões, one-on-ones e apresentações",
          "Negociar prazo, prioridade, escopo e expectativas",
          "Dar e receber feedback com clareza e educação",
          "Escrever mensagens de Slack e e-mails profissionais",
          "Fazer networking e manter small talk",
          "Preparar currículo, LinkedIn e entrevistas em inglês",
          "Explicar um assunto complexo para pessoas não técnicas"
        ]
      },
      {
        title: "Inglês para desenvolvimento de software",
        items: [
          "Explicar andamento, próximos passos e bloqueios na daily",
          "Ler documentação, RFCs, tickets e critérios de aceite",
          "Escrever commits, pull requests e comentários de code review",
          "Descrever bugs, passos para reprodução e resultados esperados",
          "Explicar código, arquitetura, decisões e trade-offs",
          "Discutir testes, deploy, incidentes e causa raiz",
          "Vocabulário de frontend, backend, dados, cloud e segurança",
          "Acompanhar demos, talks, cursos e entrevistas técnicas"
        ]
      }
    ]
  },
  {
    key: "work",
    icon: "Job",
    label: "Programação",
    shortLabel: "Código",
    color: "#4f8ef7",
    bg: "rgba(79, 142, 247, 0.12)",
    time: "10:00-18:00",
    days: weekdays,
    items: [
      { label: "Daily técnica" },
      { label: "Priorizar tasks do sprint" },
      { label: "Implementar feature ou correção" },
      { label: "Revisar pull requests" },
      { label: "Escrever ou ajustar testes" },
      { label: "Atualizar Jira" },
      { label: "Documentação técnica" },
      { label: "Almoço" },
      { label: "Caminhada após almoço" },
      { label: "Fechar pendências e próximo passo" }
    ]
  },
  {
    key: "career",
    icon: "Rocket",
    label: "Guia do Desenvolvedor",
    shortLabel: "Guia Dev",
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.12)",
    time: "guia permanente",
    note: "Mapa de competências para sua formação como desenvolvedor. Marque o que já domina e use os itens pendentes para decidir os próximos estudos. Este guia não entra no progresso da rotina.",
    items: [],
    referenceGroups: [
      {
        title: "Lógica, algoritmos e estruturas de dados",
        items: [
          "Variáveis, tipos, operadores, condições e laços",
          "Funções, escopo, recursão e tratamento de erros",
          "Arrays, listas, pilhas, filas, conjuntos, mapas, árvores e grafos",
          "Busca, ordenação e técnicas de resolução de problemas",
          "Complexidade de tempo e espaço com notação Big O",
          "Decompor problemas, escrever pseudocódigo e validar casos extremos",
          "Imutabilidade, efeitos colaterais e programação funcional básica",
          "Resolver exercícios e explicar a solução em voz alta"
        ]
      },
      {
        title: "Fundamentos de computação",
        items: [
          "Como CPU, memória, disco e processos executam um programa",
          "Sistemas operacionais, threads, concorrência e paralelismo",
          "Bits, bytes, codificação de texto e representação de dados",
          "Internet, DNS, TCP, UDP, TLS e modelo cliente-servidor",
          "Terminal, sistema de arquivos, permissões e variáveis de ambiente",
          "Compilação, interpretação, runtime e gerenciamento de memória",
          "Virtualização, containers e diferenças para máquinas virtuais"
        ]
      },
      {
        title: "Git e colaboração",
        items: [
          "Criar repositório, commits, branches, merges e tags",
          "Entender working tree, staging area e histórico",
          "Resolver conflitos, rebase, cherry-pick e revert com segurança",
          "Escrever commits pequenos e mensagens claras",
          "Trabalhar com pull requests, code review e proteção de branches",
          "Usar .gitignore e evitar segredos no histórico",
          "Definir estratégias de branch e fluxo de entrega em equipe"
        ]
      },
      {
        title: "Web — HTML, CSS e navegador",
        items: [
          "HTML semântico, formulários, tabelas, mídia e metadados",
          "CSS: cascata, especificidade, box model e posicionamento",
          "Flexbox, Grid, responsividade e mobile first",
          "Acessibilidade: teclado, foco, contraste, labels e ARIA",
          "DOM, eventos, armazenamento, cookies e ciclo de renderização",
          "DevTools, network, console, performance e depuração no navegador",
          "SEO técnico e fundamentos de compatibilidade entre navegadores"
        ]
      },
      {
        title: "JavaScript e TypeScript",
        items: [
          "Tipos, coerção, igualdade, escopo, closures e hoisting",
          "Objetos, arrays, destructuring, spread e módulos",
          "Promises, async/await, event loop e tratamento de erros",
          "Funções de alta ordem, map, filter, reduce e composição",
          "TypeScript: tipos, interfaces, unions, narrowing e generics",
          "Configuração, lint, formatação, bundling e gerenciamento de pacotes",
          "Boas práticas para código assíncrono e segurança de tipos"
        ]
      },
      {
        title: "Frontend com React",
        items: [
          "Componentes, JSX, props, estado e eventos",
          "Hooks, efeitos, refs, contexto e hooks personalizados",
          "Composição, separação de responsabilidades e design de componentes",
          "Formulários, validação, rotas e consumo de APIs",
          "Estado local, estado do servidor e gerenciamento global",
          "Loading, erro, estados vazios e atualizações otimistas",
          "Testes de componentes e acessibilidade",
          "Performance, memoização, code splitting e Server Components",
          "Next.js: renderização, rotas, cache, metadados e deploy"
        ]
      },
      {
        title: "Java e orientação a objetos",
        items: [
          "Sintaxe, tipos, operadores, controle de fluxo e métodos",
          "Classes, objetos, encapsulamento, herança e polimorfismo",
          "Interfaces, classes abstratas, records, enums e generics",
          "Collections, streams, lambdas e Optional",
          "Exceptions, recursos, datas e entrada e saída",
          "Imutabilidade, equals, hashCode e contratos de objetos",
          "Concorrência, threads, executors e CompletableFuture",
          "JVM, garbage collection, build com Maven ou Gradle e testes"
        ]
      },
      {
        title: "Backend com Spring",
        items: [
          "Spring Boot, configuração e injeção de dependência",
          "Controllers, services, repositories e separação em camadas",
          "DTOs, validação, mapeamento e tratamento global de erros",
          "Spring Data JPA, Hibernate, transações e paginação",
          "Spring Security, autenticação, autorização e CORS",
          "Configuração por ambiente, secrets e profiles",
          "Testes unitários, integração e Testcontainers",
          "Documentação OpenAPI e observabilidade da aplicação"
        ]
      },
      {
        title: "APIs e integrações",
        items: [
          "HTTP, métodos, status codes, headers, cookies e cache",
          "REST, recursos, contratos, versionamento e compatibilidade",
          "Validação, paginação, filtros, ordenação e idempotência",
          "OpenAPI, documentação e testes de contrato",
          "Autenticação com sessão, JWT e OAuth 2.0",
          "Webhooks, retries, timeout, circuit breaker e rate limiting",
          "Mensageria, filas, eventos e processamento assíncrono",
          "GraphQL, WebSocket e quando usar cada alternativa"
        ]
      },
      {
        title: "Bancos de dados e dados",
        items: [
          "Modelagem relacional, normalização e relacionamentos",
          "SQL: SELECT, JOIN, agregações, subqueries e window functions",
          "Índices, planos de execução e otimização de consultas",
          "Transações, isolamento, locks e consistência",
          "Migrations, backup, restauração e segurança de dados",
          "NoSQL: documento, chave-valor, coluna e grafo",
          "Cache com Redis, invalidação e estratégias de expiração",
          "Escolher armazenamento conforme acesso, volume e consistência"
        ]
      },
      {
        title: "Testes e qualidade de software",
        items: [
          "Testes unitários, integração, contrato e ponta a ponta",
          "Pirâmide de testes, cobertura útil e testes baseados em comportamento",
          "Mocks, stubs, fakes, fixtures e test data builders",
          "Testar casos felizes, falhas, limites e concorrência",
          "Clean Code, SOLID, coesão, acoplamento e refatoração",
          "Lint, análise estática, qualidade no CI e dívida técnica",
          "Code review respeitoso, objetivo e orientado a risco",
          "Depuração sistemática e investigação de causa raiz"
        ]
      },
      {
        title: "Arquitetura e design de software",
        items: [
          "Separação de responsabilidades e arquitetura em camadas",
          "Design patterns e critérios para não superutilizá-los",
          "Domain-Driven Design: entidades, value objects e bounded contexts",
          "Arquitetura hexagonal, Clean Architecture e ports and adapters",
          "Monólito modular, microsserviços e trade-offs",
          "Acoplamento síncrono e assíncrono entre módulos e serviços",
          "ADRs, diagramas C4 e documentação de decisões",
          "Evoluir arquitetura de forma incremental conforme a necessidade"
        ]
      },
      {
        title: "System design e sistemas distribuídos",
        items: [
          "Levantar requisitos funcionais, não funcionais e estimativas",
          "Escalabilidade horizontal e vertical, balanceamento e CDN",
          "Disponibilidade, confiabilidade, latência e throughput",
          "Consistência, particionamento, replicação e teorema CAP",
          "Cache, filas, streaming, backpressure e processamento em lote",
          "Idempotência, deduplicação e consistência eventual",
          "Tolerância a falhas, retries, timeouts e circuit breakers",
          "Desenhar APIs, dados, componentes, gargalos e trade-offs"
        ]
      },
      {
        title: "Cloud, Docker e entrega",
        items: [
          "Linux, processos, rede, logs e automação por scripts",
          "Dockerfiles, imagens, containers, volumes e redes",
          "Docker Compose e configuração local reproduzível",
          "CI/CD, pipelines, artefatos, ambientes e aprovações",
          "Deploy, rollback, blue-green, canary e feature flags",
          "AWS: IAM, VPC, EC2, S3, RDS, Lambda e CloudWatch",
          "Infraestrutura como código e fundamentos de Terraform",
          "Kubernetes: pods, deployments, services e configuração básica"
        ]
      },
      {
        title: "Segurança de aplicações",
        items: [
          "Princípios de menor privilégio, defesa em profundidade e threat modeling",
          "OWASP Top 10: injection, XSS, CSRF, SSRF e falhas de acesso",
          "Hash de senhas, sessões, tokens e armazenamento seguro",
          "Autenticação, autorização, RBAC e auditoria",
          "TLS, CORS, CSP, headers e cookies seguros",
          "Validação de entrada, encoding de saída e queries parametrizadas",
          "Gestão de secrets, dependências e supply chain",
          "Privacidade, proteção de dados, backups e resposta a incidentes"
        ]
      },
      {
        title: "Observabilidade e performance",
        items: [
          "Logs estruturados, correlação e níveis adequados",
          "Métricas, traces, dashboards e alertas acionáveis",
          "SLI, SLO, SLA e error budgets",
          "Profiling de CPU e memória e análise de gargalos",
          "Performance de frontend, Core Web Vitals e tamanho de bundle",
          "Performance de APIs, consultas, cache e pool de conexões",
          "Health checks, graceful shutdown e readiness",
          "Conduzir incidentes, post-mortems e ações preventivas"
        ]
      },
      {
        title: "Produto e trabalho em equipe",
        items: [
          "Entender problema, usuário, regra de negócio e resultado esperado",
          "Refinar requisitos, critérios de aceite e casos extremos",
          "Dividir entregas grandes em incrementos pequenos",
          "Estimar com incerteza e comunicar risco, bloqueio e dependência",
          "Scrum, Kanban, planning, daily, review e retrospectiva",
          "Documentar decisões, APIs, runbooks e onboarding",
          "Colaborar com produto, design, QA, dados e operações",
          "Equilibrar velocidade, qualidade, manutenção e valor para o usuário"
        ]
      },
      {
        title: "Carreira e evolução profissional",
        items: [
          "Construir projetos completos e explicar suas decisões",
          "Manter GitHub, portfólio, currículo e LinkedIn claros",
          "Preparar entrevistas de código, backend, frontend e system design",
          "Comunicar impacto, contexto, ações e resultados",
          "Pedir feedback, criar plano de desenvolvimento e acompanhar evolução",
          "Aprender por documentação, experimentos e projetos, não só por cursos",
          "Contribuir com revisões, mentoria, documentação e comunidade",
          "Desenvolver autonomia sem deixar de pedir ajuda cedo"
        ]
      }
    ]
  },
  {
    key: "house-cleaning",
    icon: "Home",
    label: "Limpeza da Casa",
    shortLabel: "Limpeza",
    color: "#6dd3b2",
    bg: "rgba(109, 211, 178, 0.12)",
    time: "20:00-20:30",
    days: weekdays,
    note: "Pouco por dia para a casa não acumular. Proteja coluna e joelhos: evite torcer o tronco, ajoelhar e carregar peso excessivo.",
    items: [
      { label: "Manutenção diária: guardar o que está fora do lugar (10 min)" },
      { label: "Manutenção diária: lavar louça e limpar pia e bancada" },
      { label: "Segunda — Cozinha: fogão, mesa, geladeira por fora e lixo", days: [1] },
      { label: "Terça — Banheiro: vaso, pia, espelho, box e trocar toalhas", days: [2] },
      { label: "Quarta — Quarto e roupas: tirar pó, organizar e lavar roupa", days: [3] },
      { label: "Quinta — Sala e escritório: tirar pó, organizar e aspirar", days: [4] },
      { label: "Sexta — Pisos, roupa de cama e revisão geral da casa", days: [5] }
    ]
  },
  {
    key: "health",
    icon: "Fit",
    label: "Academia",
    shortLabel: "Academia",
    color: "#8ec3f7",
    bg: "rgba(142, 195, 247, 0.12)",
    time: "20:30-21:15",
    days: weekdays,
    note: "Treino inicial de baixo impacto. Ajuste carga, amplitude e aparelhos com um profissional que conheça sua coluna e seu joelho; pare se houver dor aguda, formigamento ou piora dos sintomas.",
    items: [
      { label: "Segunda — Aquecimento: bicicleta leve (5-10 min)", days: [1] },
      { label: "Segunda — Peito: chest press na máquina", days: [1] },
      { label: "Segunda — Peito: crucifixo na máquina", days: [1] },
      { label: "Segunda — Tríceps: extensão na polia", days: [1] },
      { label: "Segunda — Cardio leve para finalizar (10 min)", days: [1] },
      { label: "Terça — Aquecimento: bicicleta leve (5-10 min)", days: [2] },
      { label: "Terça — Costas: puxada frontal com pegada confortável", days: [2] },
      { label: "Terça — Costas: remada sentada com apoio", days: [2] },
      { label: "Terça — Bíceps: rosca na polia ou máquina", days: [2] },
      { label: "Terça — Mobilidade confortável (5-10 min)", days: [2] },
      { label: "Quarta — Cardio de baixo impacto: bicicleta ou elíptico (25-35 min)", days: [3] },
      { label: "Quarta — Core orientado: estabilidade sem dor (10 min)", days: [3] },
      { label: "Quarta — Mobilidade de quadril, tornozelo e coluna torácica", days: [3] },
      { label: "Quarta — Recuperação: caminhada leve e hidratação", days: [3] },
      { label: "Quinta — Aquecimento: bicicleta leve (5-10 min)", days: [4] },
      { label: "Quinta — Glúteos: ponte ou hip thrust orientado", days: [4] },
      { label: "Quinta — Posterior: mesa flexora com carga confortável", days: [4] },
      { label: "Quinta — Quadril: cadeira abdutora", days: [4] },
      { label: "Quinta — Panturrilha com apoio", days: [4] },
      { label: "Sexta — Aquecimento: bicicleta leve (5-10 min)", days: [5] },
      { label: "Sexta — Ombros: elevação lateral sentada", days: [5] },
      { label: "Sexta — Ombros: desenvolvimento na máquina, se liberado", days: [5] },
      { label: "Sexta — Braços: bíceps e tríceps na polia", days: [5] },
      { label: "Sexta — Cardio de baixo impacto em ritmo confortável (15-20 min)", days: [5] }
    ]
  },
  {
    key: "functional-life",
    icon: "Home",
    label: "Adulto Funcional",
    shortLabel: "Funcional",
    color: "#f4b860",
    bg: "rgba(244, 184, 96, 0.12)",
    time: "guia permanente",
    note: "Um mapa do que vale saber para cuidar da própria vida. Consulte quando precisar; nada aqui é uma cobrança semanal.",
    items: [],
    referenceGroups: [
      {
        title: "Autonomia e organização pessoal",
        items: [
          "Manter agenda, prazos, contatos importantes e uma rotina básica sustentável",
          "Definir prioridades, dividir problemas em próximos passos e cumprir combinados",
          "Organizar documentos físicos e digitais e saber onde encontrar cada um",
          "Pedir ajuda, pesquisar com senso crítico e reconhecer quando chamar um profissional"
        ]
      },
      {
        title: "Cozinha e alimentação",
        items: [
          "Planejar refeições e compras sem desperdício e dentro do orçamento",
          "Preparar arroz, feijão, massas, ovos, carnes, legumes, saladas, sopas e molhos básicos",
          "Usar faca, fogão, forno, air fryer e panela de pressão com segurança",
          "Armazenar, congelar, descongelar e reaproveitar alimentos com higiene",
          "Ler validade e rótulos e montar refeições equilibradas para o dia a dia",
          "Limpar a cozinha e evitar contaminação cruzada"
        ]
      },
      {
        title: "Casa, limpeza e manutenção",
        items: [
          "Limpar banheiro, cozinha, quartos, pisos, vidros e eletrodomésticos",
          "Lavar, secar, passar e guardar roupas entendendo etiquetas e tipos de tecido",
          "Criar rotinas de lixo, compras, despensa, geladeira e prevenção de pragas",
          "Trocar lâmpada, resistência do chuveiro e pilhas e fazer pequenos reparos com segurança",
          "Saber fechar registros de água e gás e desligar disjuntores em uma emergência",
          "Identificar vazamento, mofo, curto, infiltração e quando chamar assistência",
          "Ter ferramentas básicas, contatos de confiança e noção dos custos da casa"
        ]
      },
      {
        title: "Dinheiro e patrimônio",
        items: [
          "Montar orçamento, acompanhar gastos e gastar menos do que ganha",
          "Pagar contas em dia, entender juros, crédito, empréstimos e parcelamentos",
          "Criar reserva de emergência e proteção para imprevistos",
          "Entender conta bancária, cartão, Pix, golpes e segurança financeira",
          "Declarar imposto de renda e guardar comprovantes e contratos",
          "Conhecer o básico de inflação, investimentos, seguros e aposentadoria",
          "Comparar preços, negociar e decidir compras grandes pelo custo total"
        ]
      },
      {
        title: "Documentos, direitos e vida civil",
        items: [
          "Manter RG, CPF, CNH, título, passaporte, cartões e certidões válidos e seguros",
          "Ler contratos antes de assinar e guardar cópias e comprovantes",
          "Conhecer direitos básicos de consumidor, trabalho, moradia e privacidade",
          "Resolver serviços públicos, banco, cartório, correios e atendimentos oficiais",
          "Entender aluguel, condomínio, garantias, multas e cancelamentos",
          "Reconhecer quando buscar Procon, Defensoria, advogado ou outro especialista"
        ]
      },
      {
        title: "Saúde, autocuidado e emergências",
        items: [
          "Manter higiene, sono, alimentação, exercício e saúde bucal",
          "Agendar consultas e exames preventivos e organizar receitas e histórico médico",
          "Usar medicamentos apenas com orientação e entender dose, horário e validade",
          "Montar kit de primeiros socorros e saber agir em cortes, queimaduras e engasgos",
          "Reconhecer sinais de urgência e saber acionar SAMU, Bombeiros e contatos de emergência",
          "Cuidar da saúde mental, perceber limites e procurar apoio profissional",
          "Conhecer prevenção de ISTs, contracepção, consentimento e cuidados sexuais"
        ]
      },
      {
        title: "Relacionamentos e convivência",
        items: [
          "Comunicar necessidades e sentimentos com clareza, respeito e escuta",
          "Estabelecer limites, aceitar um não e respeitar consentimento",
          "Conversar sobre dinheiro, tarefas, expectativas, sexo e futuro numa parceria",
          "Resolver conflitos sem humilhar, ameaçar, manipular ou fugir do problema",
          "Reconhecer relações abusivas e saber buscar uma rede de apoio",
          "Cultivar família, amizades, comunidade e tempo de qualidade",
          "Pedir desculpas, reparar erros e encerrar relações com maturidade"
        ]
      },
      {
        title: "Carro, moto e transporte",
        items: [
          "Conhecer documentos, licenciamento, seguro, multas e responsabilidades do veículo",
          "Verificar combustível, óleo, água, pneus, luzes, bateria e painel",
          "Calibrar pneus, trocar pneu com segurança e saber quando chamar assistência",
          "Seguir o plano de revisão e entender manutenção preventiva e sinais de defeito",
          "Agir em pane ou acidente, sinalizar o local e registrar as informações necessárias",
          "Planejar rota, estacionamento, pedágios e custo real do transporte",
          "Usar transporte público, aplicativos, bicicleta e caminhada com segurança"
        ]
      },
      {
        title: "Trabalho e vida profissional",
        items: [
          "Criar currículo e portfólio, procurar vagas e se preparar para entrevistas",
          "Comunicar andamento, riscos, dúvidas e resultados no trabalho",
          "Organizar tarefas, prazos, arquivos, reuniões e aprendizado contínuo",
          "Entender salário, benefícios, férias, impostos e direitos trabalhistas",
          "Negociar remuneração e limites e construir uma rede profissional",
          "Manter postura ética, documentar acordos e planejar mudanças de carreira"
        ]
      },
      {
        title: "Tecnologia e segurança digital",
        items: [
          "Usar senhas únicas, gerenciador de senhas e autenticação em dois fatores",
          "Fazer backup e organizar fotos, arquivos, e-mails e contas importantes",
          "Reconhecer phishing, golpes, links suspeitos e engenharia social",
          "Configurar privacidade, atualizações e bloqueio dos dispositivos",
          "Usar editor de texto, planilhas, videoconferência e serviços digitais essenciais",
          "Planejar o que acontece com contas e dados digitais numa emergência"
        ]
      },
      {
        title: "Segurança e imprevistos",
        items: [
          "Ter contatos de emergência, cópias de documentos, lanterna e itens essenciais",
          "Saber o que fazer em incêndio, enchente, falta de energia, vazamento de gás e invasão",
          "Conhecer rotas de saída e números de emergência do lugar onde vive",
          "Evitar riscos domésticos e avaliar situações antes de tentar resolver sozinho",
          "Ter um plano para perda ou roubo de celular, carteira, cartões e documentos"
        ]
      },
      {
        title: "Viagens, lazer e vida em sociedade",
        items: [
          "Planejar viagem, orçamento, documentos, hospedagem, deslocamento e seguro",
          "Fazer mala adequada e cuidar da segurança em lugares desconhecidos",
          "Receber visitas, ser um bom hóspede e praticar etiqueta básica à mesa e em público",
          "Acompanhar notícias por fontes confiáveis e entender deveres cívicos básicos",
          "Construir hobbies, descanso e lazer sem comprometer saúde ou finanças",
          "Cuidar do meio ambiente próximo: consumo, descarte, reciclagem e uso consciente"
        ]
      }
    ]
  },
  {
    key: "growth",
    icon: "Growth",
    label: "Crescimento",
    shortLabel: "Crescer",
    color: "#b57bee",
    bg: "rgba(181, 123, 238, 0.12)",
    time: "21:30-22:30",
    note: "Construir reputação e carreira como desenvolvedor.",
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
    icon: "Growth",
    label: "Foco Opcional",
    shortLabel: "Opcional",
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.12)",
    time: "fim de semana",
    note: "Sem cobrança de progresso: escolha uma alavanca para crescer com calma.",
    days: [6, 0],
    items: [
      { label: "Revisar carteira de investimentos" },
      { label: "Estudar marketing digital" },
      { label: "Planejar pauta para YouTube" },
      { label: "Gravar ou roteirizar um vídeo curto" },
      { label: "Anotar ideias para renda extra digital" }
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
    note: "Durante a semana conta como rotina; no domingo vira reflexão opcional.",
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
    note: "Opcional: use como fechamento leve para voltar forte na segunda.",
    days: [0],
    items: [
      { label: "O que aprendi esta semana?", days: [0] },
      { label: "Quanto investi?", days: [0] },
      { label: "O que publiquei ou aprendi sobre YouTube?", days: [0] },
      { label: "Qual ideia de marketing digital vale testar?", days: [0] },
      { label: "Qual investimento ou hábito financeiro vou acompanhar?", days: [0] },
      { label: "Qual é a prioridade profissional da próxima semana?", days: [0] }
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
  if (isReferenceSection(section)) return "referência";
  const days = section.days ?? uniqueDays(section.items.flatMap((item) => item.days ?? []));
  if (!days.length) return "todos os dias";
  if (isSameDays(days, weekdays)) return "segunda a sexta";
  return days.map((day) => ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][day]).join(", ");
}

export function isReferenceSection(section: RoutineSection) {
  return section.items.length === 0 && Boolean(section.references?.length || section.referenceGroups?.length);
}

const routineSectionEmoji: Record<string, string> = {
  personal: "🌅",
  english: "🇬🇧",
  work: "💻",
  career: "🚀",
  "house-cleaning": "🧹",
  health: "💪",
  "functional-life": "🏠",
  growth: "📈",
  saturday: "🎯",
  finance: "💰",
  relationships: "❤️",
  "sunday-review": "🗓️"
};

export function getRoutineSectionEmoji(section: Pick<RoutineSection, "key">) {
  return routineSectionEmoji[section.key] ?? "📌";
}

export const trackedRoutineSections = routineSections.filter((section) => !isReferenceSection(section));
export const routineReferenceSections = routineSections.filter(isReferenceSection);

function uniqueDays(days: Weekday[]) {
  return [...new Set(days)].sort();
}

function isSameDays(a: Weekday[], b: Weekday[]) {
  return a.length === b.length && a.every((day, index) => day === b[index]);
}
