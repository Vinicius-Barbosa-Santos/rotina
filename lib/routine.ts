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
    label: "Stack Builder",
    shortLabel: "Stacks",
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.12)",
    time: "18:30-20:00",
    days: weekdays,
    note: "Aprimorar as stacks principais para oportunidades melhores.",
    items: [
      { label: "Frontend com React" },
      { label: "Backend com Java" },
      { label: "Arquitetura e system design" }
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
    label: "Saúde",
    shortLabel: "Saúde",
    color: "#8ec3f7",
    bg: "rgba(142, 195, 247, 0.12)",
    time: "20:30-21:15",
    days: weekdays,
    note: "Plano inicial de baixo impacto. Faça somente movimentos liberados para a sua coluna e o seu joelho; pare se a dor aumentar e procure fisioterapeuta ou ortopedista.",
    items: [
      { label: "Água ao longo do dia" },
      { label: "Pausa ativa e mobilidade suave (5-10 min)" },
      { label: "Jantar equilibrado com proteína, vegetais e carboidrato" },
      { label: "Preparar o sono para 7-9 horas" },
      { label: "Segunda — Força A orientada: core, glúteos, costas e joelho (20-30 min)", days: [1] },
      { label: "Terça — Cardio de baixo impacto: caminhada plana ou bicicleta (20-30 min)", days: [2] },
      { label: "Quarta — Recuperação ativa: caminhada leve e mobilidade confortável (20 min)", days: [3] },
      { label: "Quinta — Força B orientada: membros superiores, quadril e estabilidade (20-30 min)", days: [4] },
      { label: "Sexta — Cardio de baixo impacto em ritmo confortável (25-30 min)", days: [5] }
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
  return Boolean(section.references?.length || section.referenceGroups?.length);
}

export const trackedRoutineSections = routineSections.filter((section) => !isReferenceSection(section));
export const routineReferenceSections = routineSections.filter(isReferenceSection);

function uniqueDays(days: Weekday[]) {
  return [...new Set(days)].sort();
}

function isSameDays(a: Weekday[], b: Weekday[]) {
  return a.length === b.length && a.every((day, index) => day === b[index]);
}
