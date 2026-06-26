import assert from "node:assert/strict";
import test from "node:test";
import { getTaskIconName } from "../lib/task-icons.ts";

test("maps routine tasks to contextual icons", () => {
  assert.equal(getTaskIconName("Implementar feature ou correção"), "code");
  assert.equal(getTaskIconName("Revisar pull requests"), "gitPullRequest");
  assert.equal(getTaskIconName("Revisar carteira de investimentos"), "wallet");
  assert.equal(getTaskIconName("Planejar pauta para YouTube"), "youtube");
  assert.equal(getTaskIconName("Estudar marketing digital"), "megaphone");
});
