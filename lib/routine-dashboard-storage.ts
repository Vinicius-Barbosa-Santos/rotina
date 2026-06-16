import { progressTrackingStartDate } from "@/lib/progress-history";
import { readStorageJson } from "@/lib/storage";
import type { ManualMeeting, RoutinePrefs, RoutineState, RoutineSyncSnapshot } from "@/lib/types";

export const notifiedSectionsKey = "rotina_notified_sections";
export const notificationPreferenceKey = "rotina_browser_notifications";
export const profileStacksKey = "rotina_profile_stacks";
export const routineStatePrefix = "rotina_next_";
export const telegramAutomaticKey = "rotina_telegram_automatic";
export const telegramReportSentKey = "rotina_telegram_reports_sent";

export function readCompletedDates() {
  return readStorageJson<string[]>("rotina_completed_dates", []);
}

export function normalizeRoutinePrefs(savedPrefs: Partial<RoutinePrefs>): RoutinePrefs {
  return {
    hiddenItems: savedPrefs.hiddenItems ?? {},
    customItems: savedPrefs.customItems ?? {},
    timeOverrides: savedPrefs.timeOverrides ?? {},
    labelOverrides: savedPrefs.labelOverrides ?? {}
  };
}

export function readRoutineStatesFromStorage() {
  const states: Record<string, RoutineState> = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(routineStatePrefix)) continue;
    states[key.replace(routineStatePrefix, "")] = readStorageJson<RoutineState>(key, {});
  }

  return states;
}

export function buildLocalSyncSnapshot(): RoutineSyncSnapshot {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    states: readRoutineStatesFromStorage(),
    completedDates: readCompletedDates().filter((date) => date >= progressTrackingStartDate).sort(),
    routinePrefs: normalizeRoutinePrefs(readStorageJson<Partial<RoutinePrefs>>("rotina_preferences", {})),
    manualMeetings: readStorageJson<ManualMeeting[]>("rotina_manual_meetings", []),
    profileStacks: readStorageJson<string[]>(profileStacksKey, []),
    telegramAutomaticEnabled: localStorage.getItem(telegramAutomaticKey) === "true",
    telegramReportsSent: readStorageJson<Record<string, boolean>>(telegramReportSentKey, {})
  };
}

export function mergeSyncSnapshots(local: RoutineSyncSnapshot, remote?: RoutineSyncSnapshot | null): RoutineSyncSnapshot {
  if (!remote) return local;

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    states: mergeRoutineStates(local.states, remote.states),
    completedDates: [...new Set([...remote.completedDates, ...local.completedDates])]
      .filter((date) => date >= progressTrackingStartDate)
      .sort(),
    routinePrefs: hasRoutinePrefsData(local.routinePrefs) ? local.routinePrefs : remote.routinePrefs,
    manualMeetings: local.manualMeetings.length ? local.manualMeetings : remote.manualMeetings,
    profileStacks: local.profileStacks.length ? local.profileStacks : remote.profileStacks,
    telegramAutomaticEnabled: local.telegramAutomaticEnabled || remote.telegramAutomaticEnabled,
    telegramReportsSent: { ...remote.telegramReportsSent, ...local.telegramReportsSent }
  };
}

export function writeSyncSnapshotToStorage(snapshot: RoutineSyncSnapshot) {
  Object.entries(snapshot.states).forEach(([date, dayState]) => {
    localStorage.setItem(`${routineStatePrefix}${date}`, JSON.stringify(dayState));
  });
  localStorage.setItem("rotina_completed_dates", JSON.stringify(snapshot.completedDates));
  localStorage.setItem("rotina_preferences", JSON.stringify(snapshot.routinePrefs));
  localStorage.setItem("rotina_manual_meetings", JSON.stringify(snapshot.manualMeetings));
  localStorage.setItem(profileStacksKey, JSON.stringify(snapshot.profileStacks));
  localStorage.setItem(telegramAutomaticKey, String(snapshot.telegramAutomaticEnabled));
  localStorage.setItem(telegramReportSentKey, JSON.stringify(snapshot.telegramReportsSent));
}

function mergeRoutineStates(local: Record<string, RoutineState>, remote: Record<string, RoutineState>) {
  const states: Record<string, RoutineState> = { ...remote };
  const dates = new Set([...Object.keys(remote), ...Object.keys(local)]);

  dates.forEach((date) => {
    const localState = local[date];
    const remoteState = remote[date];
    if (!remoteState || getCompletedCount(localState) > 0) states[date] = localState;
  });

  return states;
}

function getCompletedCount(dayState?: RoutineState) {
  return Object.values(dayState ?? {}).reduce((sum, keys) => sum + keys.length, 0);
}

function hasRoutinePrefsData(prefs: RoutinePrefs) {
  return Boolean(
    Object.keys(prefs.hiddenItems).length ||
      Object.keys(prefs.customItems).length ||
      Object.keys(prefs.timeOverrides).length ||
      Object.keys(prefs.labelOverrides).length
  );
}
