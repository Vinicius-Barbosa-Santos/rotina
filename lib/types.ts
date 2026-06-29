import type { RoutineSection, Weekday } from "@/lib/routine";
import type { TaskIconName } from "@/lib/task-icons";

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location?: string;
  meetingUrl?: string;
  provider?: string;
  calendarId?: string;
};

export type CalendarResponse = {
  configured: boolean;
  authRequired?: boolean;
  source?: string;
  timeZone?: string;
  events: CalendarEvent[];
  message?: string;
};

export type RoutineDoneKey = number | string;
export type RoutineState = Record<string, RoutineDoneKey[]>;

export type ManualMeeting = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
  days: number[];
};

export type MeetingForm = Omit<ManualMeeting, "id">;

export type RoutineCustomItem = {
  id: string;
  label: string;
};

export type RoutinePrefs = {
  hiddenItems: Record<string, number[]>;
  customItems: Record<string, RoutineCustomItem[]>;
  timeOverrides: Record<string, string>;
  labelOverrides: Record<string, Record<string, string>>;
  iconOverrides: Record<string, Record<string, TaskIconName>>;
  guideChecks: Record<string, string[]>;
};

export type PersonalizedRoutineItem = {
  key: string;
  label: string;
  icon?: TaskIconName;
  defaultIndex?: number;
  customId?: string;
};

export type RoutineNotificationSection = {
  key: string;
  label: string;
  startsAt: Date;
  items: string[];
};

export type CalendarSyncSection = Omit<RoutineSection, "items"> & {
  items: Array<{ label: string; completed?: boolean; days?: Weekday[] }>;
};

export type TelegramReportPeriod = "daily" | "weekly" | "monthly";

export type RoutineReportDay = {
  date: string;
  done: number;
  total: number;
  sections: Array<{
    label: string;
    done: number;
    total: number;
  }>;
};

export type TelegramRoutineReport = {
  period: TelegramReportPeriod;
  streak: number;
  generatedAt: string;
  days: RoutineReportDay[];
};

export type ProgressPoint = {
  date: string;
  label: string;
  shortLabel: string;
  done: number;
  total: number;
  pct: number;
};

export type RoutineSyncSnapshot = {
  version: 1;
  updatedAt: string;
  states: Record<string, RoutineState>;
  completedDates: string[];
  routinePrefs: RoutinePrefs;
  manualMeetings: ManualMeeting[];
  profileStacks: string[];
  telegramAutomaticEnabled: boolean;
  telegramReportsSent: Record<string, boolean>;
};
