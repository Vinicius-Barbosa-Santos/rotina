import {
  BookOpen,
  Briefcase,
  CircleDollarSign,
  ClipboardList,
  Code2,
  Dumbbell,
  Heart,
  Home,
  Moon,
  Rocket,
  Sparkles,
  Sunrise,
  Target,
  TrendingUp,
  Users
} from "lucide-react";

const iconMap = {
  Mind: Sparkles,
  Sun: Sunrise,
  EN: Sparkles,
  Fit: Dumbbell,
  Job: Briefcase,
  Home,
  Cash: CircleDollarSign,
  Code: Code2,
  Rocket,
  Growth: TrendingUp,
  Heart,
  Review: BookOpen,
  Target,
  People: Users,
  Admin: ClipboardList,
  Night: Moon
};

export function RoutineIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = iconMap[name as keyof typeof iconMap] ?? Sparkles;
  return <Icon size={size} aria-hidden />;
}
