import assert from "node:assert/strict";
import test from "node:test";
import { currentProfileStacks, getStackCategory, getStackTopics, mergeProfileStacks } from "../lib/profile-stacks.ts";

test("current profile includes the complete development stack", () => {
  assert.ok(currentProfileStacks.includes("Java"));
  assert.ok(currentProfileStacks.includes("Spring Boot"));
  assert.ok(currentProfileStacks.includes("Angular"));
  assert.ok(currentProfileStacks.includes("AWS Lambda"));
  assert.ok(currentProfileStacks.includes("Amazon API Gateway"));
  assert.ok(currentProfileStacks.includes("Amazon SQS"));
  assert.ok(currentProfileStacks.includes("Amazon DynamoDB"));
  assert.ok(currentProfileStacks.includes("Amazon CloudWatch"));
  assert.ok(currentProfileStacks.includes("Amazon S3"));
  assert.ok(currentProfileStacks.includes("Microservices"));
});

test("custom profile stacks are appended without duplicates", () => {
  const stacks = mergeProfileStacks(["react", "Terraform"]);

  assert.equal(stacks.filter((stack) => stack.toLowerCase() === "react").length, 1);
  assert.ok(stacks.includes("Terraform"));
});

test("stacks are grouped into useful learning categories", () => {
  assert.equal(getStackCategory("React"), "Frontend");
  assert.equal(getStackCategory("Spring Boot"), "Backend & APIs");
  assert.equal(getStackCategory("AWS Lambda"), "Cloud AWS");
  assert.equal(getStackCategory("PostgreSQL"), "Dados & DevOps");
  assert.equal(getStackCategory("Codex"), "IA & Ferramentas");
  assert.equal(getStackCategory("Terraform"), "Outras");
});

test("known and custom stacks receive trackable learning topics", () => {
  assert.deepEqual(getStackTopics("React"), [
    "Componentes e estado",
    "Hooks",
    "Rotas e dados do servidor",
    "Testes e acessibilidade"
  ]);
  assert.deepEqual(getStackTopics("Terraform"), [
    "Fundamentos e ambiente",
    "Prática guiada",
    "Projeto aplicado",
    "Testes e boas práticas"
  ]);
});
