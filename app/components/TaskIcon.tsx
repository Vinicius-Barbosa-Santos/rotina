import {
  AlarmClock,
  Bed,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckSquare,
  Code2,
  Coffee,
  Dumbbell,
  FileText,
  GitPullRequest,
  Globe2,
  Heart,
  Home,
  Lightbulb,
  Megaphone,
  MessageSquare,
  Mic,
  Moon,
  NotebookPen,
  Play,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
  Wallet,
  Waves,
  Youtube
} from "lucide-react";
import { getTaskIconName, type TaskIconName } from "@/lib/task-icons";

const taskIconMap = {
  alarm: AlarmClock,
  bed: Bed,
  book: BookOpen,
  briefcase: Briefcase,
  calendar: CalendarDays,
  checklist: CheckSquare,
  code: Code2,
  coffee: Coffee,
  dumbbell: Dumbbell,
  fileText: FileText,
  gitPullRequest: GitPullRequest,
  globe: Globe2,
  heart: Heart,
  home: Home,
  lightbulb: Lightbulb,
  megaphone: Megaphone,
  message: MessageSquare,
  mic: Mic,
  moon: Moon,
  notebook: NotebookPen,
  play: Play,
  rocket: Rocket,
  sparkles: Sparkles,
  target: Target,
  trendingUp: TrendingUp,
  utensils: Utensils,
  wallet: Wallet,
  water: Waves,
  youtube: Youtube
} satisfies Record<TaskIconName, typeof AlarmClock>;

export default function TaskIcon({ label }: { label: string }) {
  const Icon = taskIconMap[getTaskIconName(label)];
  return (
    <span className="taskIcon" aria-hidden>
      <Icon size={15} />
    </span>
  );
}
