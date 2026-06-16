import type { RoutinePrefs, RoutineState, RoutineSyncSnapshot } from "./types";

export function hasSyncSnapshotData(snapshot?: RoutineSyncSnapshot | null) {
  if (!snapshot) return false;

  return Boolean(
    hasRoutineStatesData(snapshot.states) ||
      snapshot.completedDates.length ||
      hasRoutinePrefsData(snapshot.routinePrefs) ||
      snapshot.manualMeetings.length ||
      snapshot.profileStacks.length ||
      snapshot.telegramAutomaticEnabled ||
      Object.keys(snapshot.telegramReportsSent).length
  );
}

export function resolveInitialSyncSnapshot(local: RoutineSyncSnapshot, remote: RoutineSyncSnapshot) {
  if (hasSyncSnapshotData(remote)) {
    return { snapshot: remote, shouldSave: false };
  }

  if (!hasSyncSnapshotData(local)) {
    return { snapshot: remote, shouldSave: false };
  }

  return { snapshot: local, shouldSave: true };
}

function hasRoutineStatesData(states: Record<string, RoutineState>) {
  return Object.values(states).some((dayState) => getCompletedCount(dayState) > 0);
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
