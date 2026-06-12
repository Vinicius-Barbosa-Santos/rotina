import type { CalendarEvent, ManualMeeting } from "@/lib/types";

export const weekDays = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" }
];

export const defaultMeetingForm = {
  title: "",
  startTime: "10:15",
  endTime: "11:00",
  meetingUrl: "",
  days: [1, 2, 3, 4, 5]
};

export function getManualMeetingEvents(meetings: ManualMeeting[], date = new Date()) {
  const day = date.getDay();
  return meetings
    .filter((meeting) => meeting.days.includes(day))
    .map((meeting) => buildManualMeetingEvent(meeting, date))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function buildManualMeetingEvent(meeting: ManualMeeting, date: Date): CalendarEvent {
  const [startHour, startMinute] = meeting.startTime.split(":").map(Number);
  const [endHour, endMinute] = meeting.endTime.split(":").map(Number);
  const startsAt = new Date(date);
  startsAt.setHours(startHour || 0, startMinute || 0, 0, 0);
  const endsAt = new Date(date);
  endsAt.setHours(endHour || 0, endMinute || 0, 0, 0);

  return {
    id: `manual:${meeting.id}`,
    title: meeting.title,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    allDay: false,
    meetingUrl: meeting.meetingUrl || undefined,
    provider: "Manual",
    calendarId: "manual"
  };
}
