export const calendarRoutineSyncDays = 45;

export function clampCalendarRoutineSyncDays(value?: number) {
  return Math.min(Math.max(value ?? 1, 1), calendarRoutineSyncDays);
}
