import assert from "node:assert/strict";
import test from "node:test";
import { parseTutorReport } from "../lib/english-tutor.ts";

test("splits the English report into readable sections", () => {
  assert.deepEqual(
    parseTutorReport("## Escrita\n- Correção completa\n\n## Pronúncia\nSem observações."),
    [
      { title: "Escrita", content: "- Correção completa" },
      { title: "Pronúncia", content: "Sem observações." },
    ],
  );
});

test("keeps reports without headings readable", () => {
  assert.deepEqual(parseTutorReport("Continue praticando."), [
    { title: "Análise geral", content: "Continue praticando." },
  ]);
});
