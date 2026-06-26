import { progressTrackingStartDate } from "./progress-history";
import { readStorageJson } from "./storage";
import type { ManualMeeting, RoutinePrefs, RoutineState, RoutineSyncSnapshot } from "./types";

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
    labelOverrides: savedPrefs.labelOverrides ?? {},
    iconOverrides: savedPrefs.iconOverrides ?? {}
  };
}

export function readRoutineStatesFromStorage() {
  const states: Record<string, RoutineState> = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(routineStatePrefix)) continue;
    const date = key.replace(routineStatePrefix, "");
    if (date >= progressTrackingStartDate) states[date] = readStorageJson<RoutineState>(key, {});
  }

  return states;
}

export function buildLocalSyncSnapshot(): RoutineSyncSnapshot {
  return sanitizeRoutineSyncSnapshot({
    version: 1,
    updatedAt: new Date().toISOString(),
    states: readRoutineStatesFromStorage(),
    completedDates: readCompletedDates(),
    routinePrefs: normalizeRoutinePrefs(readStorageJson<Partial<RoutinePrefs>>("rotina_preferences", {})),
    manualMeetings: readStorageJson<ManualMeeting[]>("rotina_manual_meetings", []),
    profileStacks: readStorageJson<string[]>(profileStacksKey, []),
    telegramAutomaticEnabled: localStorage.getItem(telegramAutomaticKey) === "true",
    telegramReportsSent: readStorageJson<Record<string, boolean>>(telegramReportSentKey, {})
  });
}

export function mergeSyncSnapshots(local: RoutineSyncSnapshot, remote?: RoutineSyncSnapshot | null): RoutineSyncSnapshot {
  if (!remote) return local;

  return sanitizeRoutineSyncSnapshot({
    version: 1,
    updatedAt: new Date().toISOString(),
    states: filterRoutineStatesByTrackingDate(mergeRoutineStates(local.states, remote.states)),
    completedDates: [...new Set([...remote.completedDates, ...local.completedDates])],
    routinePrefs: hasRoutinePrefsData(local.routinePrefs) ? local.routinePrefs : remote.routinePrefs,
    manualMeetings: local.manualMeetings.length ? local.manualMeetings : remote.manualMeetings,
    profileStacks: local.profileStacks.length ? local.profileStacks : remote.profileStacks,
    telegramAutomaticEnabled: local.telegramAutomaticEnabled || remote.telegramAutomaticEnabled,
    telegramReportsSent: filterTelegramReportsByTrackingDate({ ...remote.telegramReportsSent, ...local.telegramReportsSent })
  });
}

export function sanitizeRoutineSyncSnapshot(snapshot: RoutineSyncSnapshot): RoutineSyncSnapshot {
  return {
    ...snapshot,
    states: filterRoutineStatesByTrackingDate(snapshot.states),
    completedDates: snapshot.completedDates.filter((date) => date >= progressTrackingStartDate).sort(),
    telegramReportsSent: filterTelegramReportsByTrackingDate(snapshot.telegramReportsSent)
  };
}

export function writeSyncSnapshotToStorage(snapshot: RoutineSyncSnapshot) {
  const sanitized = sanitizeRoutineSyncSnapshot(snapshot);

  Object.entries(sanitized.states).forEach(([date, dayState]) => {
    localStorage.setItem(`${routineStatePrefix}${date}`, JSON.stringify(dayState));
  });
  localStorage.setItem("rotina_completed_dates", JSON.stringify(sanitized.completedDates));
  localStorage.setItem("rotina_preferences", JSON.stringify(sanitized.routinePrefs));
  localStorage.setItem("rotina_manual_meetings", JSON.stringify(sanitized.manualMeetings));
  localStorage.setItem(profileStacksKey, JSON.stringify(sanitized.profileStacks));
  localStorage.setItem(telegramAutomaticKey, String(sanitized.telegramAutomaticEnabled));
  localStorage.setItem(telegramReportSentKey, JSON.stringify(sanitized.telegramReportsSent));
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
      Object.keys(prefs.labelOverrides).length ||
      Object.keys(prefs.iconOverrides).length
  );
}

function filterRoutineStatesByTrackingDate(states: Record<string, RoutineState>) {
  return Object.fromEntries(Object.entries(states).filter(([date]) => date >= progressTrackingStartDate));
}

function filterTelegramReportsByTrackingDate(reports: Record<string, boolean>) {
  return Object.fromEntries(
    Object.entries(reports).filter(([key]) => {
      const date = key.match(/\d{4}-\d{2}-\d{2}/)?.[0];
      return !date || date >= progressTrackingStartDate;
    })
  );
}
