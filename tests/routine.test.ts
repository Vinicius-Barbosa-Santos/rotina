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
