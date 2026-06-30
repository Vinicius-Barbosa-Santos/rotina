import assert from "node:assert/strict";
import test from "node:test";
import { getTaskEmoji, getTaskIconName } from "../lib/task-icons.ts";

test("maps routine tasks to contextual icons", () => {
  assert.equal(getTaskIconName("Implementar feature ou correção"), "code");
  assert.equal(getTaskIconName("Revisar pull requests"), "gitPullRequest");
  assert.equal(getTaskIconName("Revisar carteira de investimentos"), "wallet");
  assert.equal(getTaskIconName("Planejar pauta para YouTube"), "youtube");
  assert.equal(getTaskIconName("Estudar marketing digital"), "megaphone");
  assert.equal(getTaskIconName("Preparar uma refeição simples e saudável"), "utensils");
  assert.equal(getTaskIconName("Organizar casa, roupa ou documentos"), "home");
  assert.equal(getTaskIconName("Banheiro: vaso, pia, espelho e box"), "home");
  assert.equal(getTaskIconName("Cardio de baixo impacto com bicicleta"), "dumbbell");
});

test("maps routine tasks and custom icons to calendar emojis", () => {
  assert.equal(getTaskEmoji("Beber água"), "💧");
  assert.equal(getTaskEmoji("Implementar feature"), "💻");
  assert.equal(getTaskEmoji("Minha tarefa", "rocket"), "🚀");
});
