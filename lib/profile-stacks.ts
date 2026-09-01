export const currentProfileStacks = [
  "Java",
  "Spring Boot",
  "Angular",
  "React",
  "Next.js",
  "Node.js",
  "GraphQL",
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
  "Microservices",
  "Codex",
  "Claude Code",
  "Cursor"
] as const;

export const stackCategoryOrder = ["Frontend", "Backend & APIs", "Cloud AWS", "Dados & DevOps", "IA & Ferramentas", "Outras"] as const;
export type StackCategory = (typeof stackCategoryOrder)[number];

const stackCategories: Record<string, StackCategory> = {
  angular: "Frontend",
  react: "Frontend",
  "next.js": "Frontend",
  typescript: "Frontend",
  java: "Backend & APIs",
  "spring boot": "Backend & APIs",
  "node.js": "Backend & APIs",
  graphql: "Backend & APIs",
  "rest apis": "Backend & APIs",
  microservices: "Backend & APIs",
  aws: "Cloud AWS",
  "aws lambda": "Cloud AWS",
  "amazon api gateway": "Cloud AWS",
  "amazon sqs": "Cloud AWS",
  "amazon dynamodb": "Cloud AWS",
  "amazon cloudwatch": "Cloud AWS",
  "amazon s3": "Cloud AWS",
  docker: "Dados & DevOps",
  kubernetes: "Dados & DevOps",
  jenkins: "Dados & DevOps",
  git: "Dados & DevOps",
  oracle: "Dados & DevOps",
  postgresql: "Dados & DevOps",
  mongodb: "Dados & DevOps",
  redis: "Dados & DevOps",
  codex: "IA & Ferramentas",
  "claude code": "IA & Ferramentas",
  cursor: "IA & Ferramentas"
};

export function getStackCategory(stack: string): StackCategory {
  return stackCategories[stack.trim().toLocaleLowerCase("pt-BR")] ?? "Outras";
}

export function mergeProfileStacks(stacks: readonly string[]) {
  const unique = new Map<string, string>();

  [...currentProfileStacks, ...stacks].forEach((stack) => {
    const value = stack.trim();
    if (value) unique.set(value.toLocaleLowerCase("pt-BR"), value);
  });

  return [...unique.values()];
}
