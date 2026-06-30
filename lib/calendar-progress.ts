export type CalendarProgressSection = {
  done: number;
  total: number;
};

export type CalendarProgressDay = CalendarProgressSection & {
  sections: Record<string, CalendarProgressSection>;
};

export type CalendarProgressDays = Record<string, CalendarProgressDay>;

const routineTitlePattern = /Rotina:\s*(.+?)\s+\((\d+)\/(\d+)\)/i;

type ProgressCalendarEvent = {
  title: string;
  startsAt: string;
  routineProgress?: {
    section: string;
    done: number;
    total: number;
  };
};

export function extractCalendarProgress(events: ProgressCalendarEvent[]): CalendarProgressDays {
  return events.reduce<CalendarProgressDays>((progress, event) => {
    const match = event.title.match(routineTitlePattern);
    const sectionLabel = event.routineProgress?.section ?? match?.[1];
    const done = event.routineProgress?.done ?? Number(match?.[2]);
    const total = event.routineProgress?.total ?? Number(match?.[3]);
    if (!sectionLabel) return progress;
    if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return progress;

    const key = eventDateKey(event.startsAt);
    const current = progress[key] ?? { done: 0, total: 0, sections: {} };
    const section = current.sections[sectionLabel] ?? { done: 0, total: 0 };

    current.done += done;
    current.total += total;
    current.sections[sectionLabel] = {
      done: Math.max(section.done, done),
      total: Math.max(section.total, total)
    };
    progress[key] = current;

    return progress;
  }, {});
}

function eventDateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
