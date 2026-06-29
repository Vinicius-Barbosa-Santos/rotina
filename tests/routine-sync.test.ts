import assert from "node:assert/strict";
import test from "node:test";
import {
  hasSyncSnapshotData,
  resolveInitialSyncSnapshot,
} from "../lib/routine-sync-selection.ts";
import type { RoutineSyncSnapshot } from "../lib/types.ts";

function snapshot(overrides: Partial<RoutineSyncSnapshot> = {}): RoutineSyncSnapshot {
  return {
    version: 1,
    updatedAt: "2026-06-16T00:00:00.000Z",
    states: {},
    completedDates: [],
    routinePrefs: {
      hiddenItems: {},
      customItems: {},
      timeOverrides: {},
      labelOverrides: {},
      iconOverrides: {},
      guideChecks: {},
    },
    manualMeetings: [],
    profileStacks: [],
    telegramAutomaticEnabled: false,
    telegramReportsSent: {},
    ...overrides,
  };
}

test("empty device data does not replace an existing remote routine", () => {
  const local = snapshot();
  const remote = snapshot({
    states: {
      "2026-06-16": {
        work: [0, 1],
      },
    },
  });

  const result = resolveInitialSyncSnapshot(local, remote);

  assert.equal(hasSyncSnapshotData(local), false);
  assert.equal(hasSyncSnapshotData(remote), true);
  assert.equal(result.shouldSave, false);
  assert.deepEqual(result.snapshot, remote);
});

test("local data seeds the remote routine only when the remote is empty", () => {
  const local = snapshot({
    completedDates: ["2026-06-16"],
    profileStacks: ["React"],
  });
  const remote = snapshot({ updatedAt: "1970-01-01T00:00:00.000Z" });

  const result = resolveInitialSyncSnapshot(local, remote);

  assert.equal(result.shouldSave, true);
  assert.deepEqual(result.snapshot.completedDates, ["2026-06-16"]);
  assert.deepEqual(result.snapshot.profileStacks, ["React"]);
});
