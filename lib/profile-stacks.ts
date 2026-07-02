export const currentProfileStacks = [
  "Java",
  "Spring Boot",
  "Angular",
  "React",
  "Next.js",
  "Node.js",
  "TypeScript",
  "AWS",
  "AWS Lambda",
  "Amazon API Gateway",
  "Amazon SQS",
  "Amazon DynamoDB",
  "Amazon CloudWatch",
  "Amazon S3",
  "Docker",
  "Kubernetes",
  "Jenkins",
  "Git",
  "Oracle",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "REST APIs",
  "Microservices"
] as const;

export function mergeProfileStacks(stacks: readonly string[]) {
  const unique = new Map<string, string>();

  [...currentProfileStacks, ...stacks].forEach((stack) => {
    const value = stack.trim();
    if (value) unique.set(value.toLocaleLowerCase("pt-BR"), value);
  });

  return [...unique.values()];
}
