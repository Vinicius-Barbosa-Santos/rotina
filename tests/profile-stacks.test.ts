import assert from "node:assert/strict";
import test from "node:test";
import { currentProfileStacks, getStackCategory, getStackTopics, mergeProfileStacks } from "../lib/profile-stacks.ts";

test("current profile includes the complete development stack", () => {
  assert.ok(currentProfileStacks.includes("Java & Spring Boot"));
  assert.ok(currentProfileStacks.includes("Angular"));
  assert.ok(currentProfileStacks.includes("Full-Stack TypeScript"));
  assert.ok(currentProfileStacks.includes("Microsserviços Node.js"));
  assert.ok(currentProfileStacks.includes("Desenvolvimento com IA"));
  assert.equal(currentProfileStacks.length, 8);
});

test("custom profile stacks are appended without duplicates", () => {
  const stacks = mergeProfileStacks(["react", "Terraform"]);

  assert.equal(stacks.filter((stack) => stack.toLowerCase() === "react").length, 1);
  assert.ok(stacks.includes("Terraform"));
});

test("stacks are grouped into useful learning categories", () => {
  assert.equal(getStackCategory("Full-Stack TypeScript"), "Base Full-Stack");
  assert.equal(getStackCategory("React"), "Frontend");
  assert.equal(getStackCategory("Java & Spring Boot"), "Backend");
  assert.equal(getStackCategory("AWS"), "Cloud");
  assert.equal(getStackCategory("Desenvolvimento com IA"), "IA");
  assert.equal(getStackCategory("Terraform"), "Outras");
});

test("known and custom stacks receive trackable learning topics", () => {
  assert.deepEqual(getStackTopics("React"), [
    "Componentes, props, estado e hooks",
    "Dados do servidor, cache e rotas",
    "Formulários acessíveis e validação",
    "Testes, performance e boas práticas"
  ]);
  assert.deepEqual(getStackTopics("Terraform"), [
    "Entender os fundamentos essenciais",
    "Praticar com um exercício real",
    "Aplicar em um pequeno projeto",
    "Validar com testes e boas práticas"
  ]);
});
