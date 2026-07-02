"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { Braces, Code2, Network } from "lucide-react";

type StackVisual = {
  src: string;
  color: string;
  matches: string[];
  surface?: string;
};

const stackVisuals: StackVisual[] = [
  { src: "https://icon.icepanel.io/AWS/svg/Compute/Lambda.svg", color: "#ff9900", matches: ["aws lambda", "lambda"] },
  { src: "https://icon.icepanel.io/AWS/svg/App-Integration/API-Gateway.svg", color: "#d946ef", matches: ["api gateway"] },
  { src: "https://icon.icepanel.io/AWS/svg/App-Integration/Simple-Queue-Service.svg", color: "#ff4f8b", matches: ["amazon sqs", "aws sqs", "sqs"] },
  { src: "https://icon.icepanel.io/AWS/svg/Database/DynamoDB.svg", color: "#527fff", matches: ["dynamodb"] },
  { src: "https://icon.icepanel.io/AWS/svg/Management-Governance/CloudWatch.svg", color: "#759c3e", matches: ["cloudwatch"] },
  { src: "https://icon.icepanel.io/AWS/svg/Storage/Simple-Storage-Service.svg", color: "#7aa116", matches: ["amazon s3", "aws s3", "simple storage"] },
  { src: "https://cdn.simpleicons.org/amazonwebservices/FF9900", color: "#ff9900", matches: ["aws", "amazon web services"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg", color: "#6db33f", matches: ["spring boot", "spring"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angular/angular-original.svg", color: "#dd0031", matches: ["angular"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg", color: "#61dafb", matches: ["react"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg", color: "#ffffff", matches: ["next.js", "nextjs", "next"], surface: "#ffffff" },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg", color: "#68a063", matches: ["node.js", "nodejs", "node"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg", color: "#3178c6", matches: ["typescript", "type script"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg", color: "#f89820", matches: ["java", "jvm"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg", color: "#2496ed", matches: ["docker"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-original.svg", color: "#326ce5", matches: ["kubernetes", "k8s"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jenkins/jenkins-original.svg", color: "#d33833", matches: ["jenkins"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg", color: "#f05032", matches: ["git"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/oracle/oracle-original.svg", color: "#f80000", matches: ["oracle"], surface: "#ffffff" },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg", color: "#4169e1", matches: ["postgresql", "postgres"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg", color: "#47a248", matches: ["mongodb", "mongo"] },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redis/redis-original.svg", color: "#dc382d", matches: ["redis"] }
];

export default function StackIcon({ stack }: { stack: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const normalizedStack = stack.trim().toLocaleLowerCase("pt-BR");
  const visual = stackVisuals.find((candidate) =>
    candidate.matches.some((term) => normalizedStack.includes(term))
  );
  const color = visual?.color ?? "#8ec3f7";
  const style: CSSProperties = {
    color,
    borderColor: `${color}55`,
    backgroundColor: visual?.surface ?? `${color}16`,
    boxShadow: `0 0 16px ${color}12`
  };
  const ConceptIcon = normalizedStack.includes("microservice") ? Network
    : normalizedStack.includes("rest") || normalizedStack.includes("api") ? Braces
      : Code2;

  return (
    <span className="dayStackIcon" style={style} title={stack} role="img" aria-label={stack}>
      {visual && !imageFailed
        ? <img src={visual.src} alt="" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
        : <ConceptIcon size={18} strokeWidth={1.9} aria-hidden />}
    </span>
  );
}
