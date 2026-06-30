import assert from "node:assert/strict";
import test from "node:test";
import {
  getSectionScheduleLabel,
  getVisibleItems,
  routineReferenceSections,
  routineSections,
  trackedRoutineSections,
  type RoutineSection,
} from "../lib/routine.ts";

const section: RoutineSection = {
  key: "test",
  label: "Teste",
  shortLabel: "Teste",
  icon: "Target",
  color: "#fff",
  bg: "#000",
  time: "09:00-10:00",
  days: [1, 2, 3, 4, 5],
  items: [{ label: "Todo dia útil" }, { label: "Somente sexta", days: [5] }],
};

test("getVisibleItems respects section and item weekdays", () => {
  assert.deepEqual(
    getVisibleItems(section, new Date(2026, 5, 12)).map(
      ({ item }) => item.label,
    ),
    ["Todo dia útil", "Somente sexta"],
  );
  assert.deepEqual(getVisibleItems(section, new Date(2026, 5, 13)), []);
});

test("getSectionScheduleLabel describes weekdays", () => {
  assert.equal(getSectionScheduleLabel(section), "segunda a sexta");
});

test("weekday routine is centered on programming work", () => {
  const programming = routineSections.find((item) => item.key === "work");

  assert.ok(programming);
  assert.equal(programming.label, "Programação");
  assert.deepEqual(
    programming.items.map((item) => item.label).slice(0, 5),
    [
      "Daily técnica",
      "Priorizar tasks do sprint",
      "Implementar feature ou correção",
      "Revisar pull requests",
      "Escrever ou ajustar testes",
    ],
  );
});

test("English habits count toward progress while the complete guide remains below", () => {
  const english = routineSections.find((item) => item.key === "english");

  assert.ok(english);
  assert.equal(english.label, "Inglês");
  assert.equal(english.guideLabel, "Guia de Inglês");
  assert.equal(getSectionScheduleLabel(english), "segunda a sexta");
  assert.deepEqual(
    getVisibleItems(english, new Date(2026, 5, 22)).map(({ item }) => item.label),
    ["Duolingo", "Leitura em inglês", "Vocabulário", "Conversação", "Listening"],
  );
  assert.ok(english.referenceGroups?.some((group) => group.title === "Present Simple e Present Continuous"));
  assert.ok(english.referenceGroups?.some((group) => group.title === "Inglês para desenvolvimento de software"));
  assert.equal(trackedRoutineSections.some((section) => section.key === english.key), true);
  assert.equal(routineReferenceSections.some((section) => section.key === english.key), false);
});

test("developer curriculum is a permanent guide and does not count toward routine progress", () => {
  const career = routineSections.find((item) => item.key === "career");

  assert.ok(career);
  assert.equal(career.label, "Guia do Desenvolvedor");
  assert.equal(getSectionScheduleLabel(career), "referência");
  assert.deepEqual(getVisibleItems(career, new Date(2026, 5, 25)), []);
  assert.ok(career.referenceGroups?.some((group) => group.title === "Frontend com React"));
  assert.ok(career.referenceGroups?.some((group) => group.title === "Backend com Spring"));
  assert.ok(career.referenceGroups?.some((group) => group.title === "System design e sistemas distribuídos"));
  assert.equal(trackedRoutineSections.some((section) => section.key === career.key), false);
  assert.equal(routineReferenceSections.some((section) => section.key === career.key), true);
});

test("house cleaning is distributed from Monday to Friday", () => {
  const cleaning = routineSections.find((item) => item.key === "house-cleaning");

  assert.ok(cleaning);
  assert.equal(cleaning.label, "Limpeza da Casa");
  assert.deepEqual(
    getVisibleItems(cleaning, new Date(2026, 5, 22)).map(({ item }) => item.label),
    [
      "Manutenção diária: guardar o que está fora do lugar (10 min)",
      "Manutenção diária: lavar louça e limpar pia e bancada",
      "Segunda — Cozinha: fogão, mesa, geladeira por fora e lixo",
    ],
  );
  assert.deepEqual(
    getVisibleItems(cleaning, new Date(2026, 5, 26)).map(({ item }) => item.label),
    [
      "Manutenção diária: guardar o que está fora do lugar (10 min)",
      "Manutenção diária: lavar louça e limpar pia e bancada",
      "Sexta — Pisos, roupa de cama e revisão geral da casa",
    ],
  );
});

test("gym routine alternates muscle groups, cardio and recovery", () => {
  const health = routineSections.find((item) => item.key === "health");

  assert.ok(health);
  assert.equal(health.label, "Academia");
  assert.match(health.note ?? "", /baixo impacto/i);
  assert.ok(getVisibleItems(health, new Date(2026, 5, 22)).some(({ item }) => item.label.includes("Peito")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 23)).some(({ item }) => item.label.includes("Costas")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 24)).some(({ item }) => item.label.includes("Cardio de baixo impacto")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 25)).some(({ item }) => item.label.includes("Glúteos")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 26)).some(({ item }) => item.label.includes("Ombros")));
});

test("functional adult section is a permanent, categorized reference guide", () => {
  const functional = routineSections.find((item) => item.key === "functional-life");

  assert.ok(functional);
  assert.equal(functional.label, "Adulto Funcional");
  assert.equal(getSectionScheduleLabel(functional), "referência");
  assert.deepEqual(getVisibleItems(functional, new Date(2026, 5, 23)), []);
  assert.ok(functional.referenceGroups?.some((group) => group.title === "Relacionamentos e convivência"));
  assert.ok(functional.referenceGroups?.some((group) => group.title === "Carro, moto e transporte"));
  assert.ok(functional.referenceGroups?.some((group) => group.title === "Cozinha e alimentação"));
  assert.equal(trackedRoutineSections.some((section) => section.key === functional.key), false);
  assert.equal(routineReferenceSections.some((section) => section.key === functional.key), true);
});

test("weekend optional focus includes investments, digital marketing and YouTube", () => {
  const optional = routineSections.find((item) => item.key === "saturday");

  assert.ok(optional);
  assert.equal(optional.label, "Foco Opcional");
  assert.deepEqual(optional.days, [6, 0]);
  assert.deepEqual(
    getVisibleItems(optional, new Date(2026, 5, 20)).map(({ item }) => item.label),
    [
      "Revisar carteira de investimentos",
      "Estudar marketing digital",
      "Planejar pauta para YouTube",
      "Gravar ou roteirizar um vídeo curto",
      "Anotar ideias para renda extra digital",
    ],
  );
});
