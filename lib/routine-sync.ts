import "server-only";

import type { ManualMeeting, RoutinePrefs, RoutineState } from "@/lib/types";

export type RoutineSyncData = {
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

const tableName = "routine_sync";

export function getDefaultRoutineSyncData(): RoutineSyncData {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    states: {},
    completedDates: [],
    routinePrefs: {
      hiddenItems: {},
      customItems: {},
      timeOverrides: {},
      labelOverrides: {}
    },
    manualMeetings: [],
    profileStacks: [],
    telegramAutomaticEnabled: false,
    telegramReportsSent: {}
  };
}

export function isRoutineSyncConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function readRoutineSyncData() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${getRoutineSyncId()}&select=data`, {
    cache: "no-store",
    headers: getSupabaseHeaders(serviceRoleKey)
  });

  if (!response.ok) {
    throw new Error(`Não consegui ler a sincronização (${response.status}).`);
  }

  const rows = (await response.json()) as Array<{ data?: Partial<RoutineSyncData> }>;
  const data = rows[0]?.data;
  return data ? normalizeRoutineSyncData(data) : getDefaultRoutineSyncData();
}

export async function writeRoutineSyncData(data: RoutineSyncData) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?on_conflict=id`, {
    method: "POST",
    headers: {
      ...getSupabaseHeaders(serviceRoleKey),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      id: getRoutineSyncId(),
      data: normalizeRoutineSyncData({
        ...data,
        updatedAt: new Date().toISOString()
      })
    })
  });

  if (!response.ok) {
    throw new Error(`Não consegui salvar a sincronização (${response.status}).`);
  }

  return true;
}

function getRoutineSyncId() {
  return process.env.ROUTINE_SYNC_ID || "vinicius-main";
}

function getSupabaseHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`
  };
}

function normalizeRoutineSyncData(data: Partial<RoutineSyncData>): RoutineSyncData {
  const defaults = getDefaultRoutineSyncData();

  return {
    version: 1,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : defaults.updatedAt,
    states: isObject(data.states) ? data.states as Record<string, RoutineState> : defaults.states,
    completedDates: Array.isArray(data.completedDates) ? data.completedDates.filter(isString).sort() : [],
    routinePrefs: {
      hiddenItems: isObject(data.routinePrefs?.hiddenItems) ? data.routinePrefs.hiddenItems : {},
      customItems: isObject(data.routinePrefs?.customItems) ? data.routinePrefs.customItems : {},
      timeOverrides: isObject(data.routinePrefs?.timeOverrides) ? data.routinePrefs.timeOverrides : {},
      labelOverrides: isObject(data.routinePrefs?.labelOverrides) ? data.routinePrefs.labelOverrides : {}
    },
    manualMeetings: Array.isArray(data.manualMeetings) ? data.manualMeetings : [],
    profileStacks: Array.isArray(data.profileStacks)
      ? data.profileStacks.filter(isString).map((stack) => stack.trim()).filter(Boolean).slice(0, 20)
      : [],
    telegramAutomaticEnabled: Boolean(data.telegramAutomaticEnabled),
    telegramReportsSent: isObject(data.telegramReportsSent) ? data.telegramReportsSent as Record<string, boolean> : {}
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
