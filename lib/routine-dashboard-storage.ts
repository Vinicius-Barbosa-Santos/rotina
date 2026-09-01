import { progressResetVersion, progressTrackingStartDate } from "./progress-history";
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
  const resetProgress = savedPrefs.progressResetVersion !== progressResetVersion;
  const guideChecks = resetProgress ? {} : { ...(savedPrefs.guideChecks ?? {}) };
  const timeOverrides = removeLegacyTimeOverrides(savedPrefs.timeOverrides ?? {});
  if (!guideChecks["english-guide"]?.length && guideChecks.english?.length) {
    guideChecks["english-guide"] = [...guideChecks.english];
  }
  delete guideChecks.english;

  return {
    progressResetVersion,
    hiddenItems: savedPrefs.hiddenItems ?? {},
    customItems: savedPrefs.customItems ?? {},
    timeOverrides,
    labelOverrides: savedPrefs.labelOverrides ?? {},
    iconOverrides: savedPrefs.iconOverrides ?? {},
    guideChecks,
    stackProgress: resetProgress ? {} : normalizeStackProgress(savedPrefs.stackProgress),
    stackTopicChecks: resetProgress ? {} : normalizeStackTopicChecks(savedPrefs.stackTopicChecks)
  };
}

function removeLegacyTimeOverrides(savedOverrides: Record<string, string>) {
  const timeOverrides = { ...savedOverrides };
  const legacyTimes: Record<string, string[]> = {
    personal: ["06:00-08:00", "06:30-08:00", "03:00 e 07:00-08:00", "07:00-08:00"],
    english: ["09:00-10:00", "08:00-09:00"],
    work: ["10:00-18:00", "03:00-07:00"],
    "technical-study": ["09:00-11:00"],
    "programming-study": ["18:30-20:00", "17:00-18:00"],
    "house-cleaning": ["20:00-20:30", "11:00-15:00", "11:00-12:30"],
    health: ["20:30-21:15", "18:00-21:00", "18:00-20:30"],
    growth: ["21:30-22:30", "11:00-15:00", "12:30-14:00"],
    "projects-meetings": ["14:00-16:30"],
    transition: ["16:30-17:00"],
    evening: ["20:30-21:30"],
    sleep: ["21:30-03:00"]
  };

  Object.entries(legacyTimes).forEach(([sectionKey, values]) => {
    if (values.includes(timeOverrides[sectionKey])) delete timeOverrides[sectionKey];
  });

  return timeOverrides;
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
    routinePrefs: normalizeRoutinePrefs(snapshot.routinePrefs),
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
      Object.keys(prefs.iconOverrides).length ||
      Object.keys(prefs.guideChecks).length ||
      Object.keys(prefs.stackProgress).length ||
      Object.keys(prefs.stackTopicChecks).length
  );
}

function normalizeStackProgress(progress?: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(progress ?? {})
      .filter(([stack, value]) => stack.trim() && Number.isFinite(value))
      .map(([stack, value]) => [stack, Math.min(100, Math.max(0, Math.round(value)))])
  );
}

function normalizeStackTopicChecks(checks?: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(checks ?? {})
      .filter(([stack, topics]) => stack.trim() && Array.isArray(topics))
      .map(([stack, topics]) => [stack, [...new Set(topics.filter((topic) => typeof topic === "string" && topic.trim()))]])
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
