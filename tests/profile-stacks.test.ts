import assert from "node:assert/strict";
import test from "node:test";
import { currentProfileStacks, mergeProfileStacks } from "../lib/profile-stacks.ts";

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
