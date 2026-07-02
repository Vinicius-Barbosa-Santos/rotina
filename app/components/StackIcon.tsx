import type { CSSProperties } from "react";
import {
  Atom,
  Braces,
  Cloud,
  Code2,
  Coffee,
  Container,
  Database,
  GitBranch,
  Globe2,
  Leaf,
  Network,
  Server,
  Smartphone,
  Terminal,
  Triangle,
  type LucideIcon
} from "lucide-react";

type StackVisual = {
  icon: LucideIcon;
  color: string;
  matches: string[];
};

const stackVisuals: StackVisual[] = [
  { icon: Smartphone, color: "#61dafb", matches: ["react native", "android", "ios", "mobile", "flutter"] },
  { icon: Atom, color: "#61dafb", matches: ["react"] },
  { icon: Triangle, color: "#f5f5f5", matches: ["next.js", "nextjs", "next"] },
  { icon: Server, color: "#68a063", matches: ["node.js", "nodejs", "node"] },
  { icon: Braces, color: "#3178c6", matches: ["typescript", "type script"] },
  { icon: Braces, color: "#f7df1e", matches: ["javascript", "java script"] },
  { icon: Coffee, color: "#f89820", matches: ["java", "jvm"] },
  { icon: Leaf, color: "#6db33f", matches: ["spring", "spring boot"] },
  { icon: Cloud, color: "#ff9900", matches: ["aws", "amazon web services", "cloud"] },
  { icon: Container, color: "#2496ed", matches: ["docker", "container", "kubernetes", "k8s"] },
  { icon: Database, color: "#6aa7ff", matches: ["database", "banco de dados", "sql", "postgres", "mysql", "mongo", "redis"] },
  { icon: GitBranch, color: "#f05032", matches: ["git", "github", "gitlab"] },
  { icon: Network, color: "#b57bee", matches: ["system design", "arquitetura", "architecture", "microservice"] },
  { icon: Globe2, color: "#e87952", matches: ["html", "css", "web", "frontend"] },
  { icon: Terminal, color: "#52c98e", matches: ["linux", "terminal", "bash", "shell", "devops"] }
];

export default function StackIcon({ stack }: { stack: string }) {
  const normalizedStack = stack.trim().toLocaleLowerCase("pt-BR");
  const visual = stackVisuals.find((candidate) =>
    candidate.matches.some((term) => normalizedStack.includes(term))
  );
  const Icon = visual?.icon ?? Code2;
  const color = visual?.color ?? "#8ec3f7";
  const style: CSSProperties = {
    color,
    borderColor: `${color}55`,
    backgroundColor: `${color}16`,
    boxShadow: `0 0 16px ${color}12`
  };

  return (
    <span className="dayStackIcon" style={style} title={stack} role="img" aria-label={stack}>
      <Icon size={18} strokeWidth={1.9} aria-hidden />
    </span>
  );
}
