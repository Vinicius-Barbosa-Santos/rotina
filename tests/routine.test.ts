import assert from "node:assert/strict";
import test from "node:test";
import {
  getSectionScheduleLabel,
  getVisibleItems,
  routineSections,
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

test("health routine alternates low-impact strength, cardio and recovery", () => {
  const health = routineSections.find((item) => item.key === "health");

  assert.ok(health);
  assert.match(health.note ?? "", /baixo impacto/i);
  assert.ok(getVisibleItems(health, new Date(2026, 5, 22)).some(({ item }) => item.label.includes("Força A")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 23)).some(({ item }) => item.label.includes("Cardio de baixo impacto")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 24)).some(({ item }) => item.label.includes("Recuperação ativa")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 25)).some(({ item }) => item.label.includes("Força B")));
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
