"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Code2,
  Dumbbell,
  Home,
  Heart,
  Loader2,
  Moon,
  Plus,
  Rocket,
  RotateCcw,
  Sparkles,
  Sunrise,
  Target,
  Trash2,
  TrendingUp,
  Users
} from "lucide-react";
import { getSectionScheduleLabel, getVisibleItems, routineSections } from "@/lib/routine";
import EnglishTutor from "./EnglishTutor";

type CalendarEvent = {
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

type CalendarResponse = {
  configured: boolean;
  authRequired?: boolean;
  source?: string;
  timeZone?: string;
  events: CalendarEvent[];
  message?: string;
};

type RoutineDoneKey = number | string;
type RoutineState = Record<string, RoutineDoneKey[]>;

type ManualMeeting = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
  days: number[];
};

type RoutineCustomItem = {
  id: string;
  label: string;
};

type RoutinePrefs = {
  hiddenItems: Record<string, number[]>;
  customItems: Record<string, RoutineCustomItem[]>;
  timeOverrides: Record<string, string>;
};

type RoutineNotificationSection = {
  key: string;
  label: string;
  startsAt: Date;
  items: string[];
};

const iconMap = {
  Mind: Sparkles,
  Sun: Sunrise,
  EN: Sparkles,
  Fit: Dumbbell,
  Job: Briefcase,
  Home,
  Cash: CircleDollarSign,
  Code: Code2,
  Rocket,
  Growth: TrendingUp,
  Heart,
  Review: BookOpen,
  Target,
  People: Users,
  Admin: ClipboardList,
  Night: Moon
};

const weekDays = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" }
];

const defaultMeetingForm = {
  title: "",
  startTime: "10:15",
  endTime: "11:00",
  meetingUrl: "",
  days: [1, 2, 3, 4, 5]
};

const notificationPreferenceKey = "rotina_browser_notifications";
const notifiedSectionsKey = "rotina_notified_sections";

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(date);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getSectionStartDate(time: string, date = new Date()) {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  const startsAt = new Date(date);
  startsAt.setHours(hour, minute, 0, 0);
  return startsAt;
}

function readNotifiedSectionKeys() {
  try {
    const stored = JSON.parse(localStorage.getItem(notifiedSectionsKey) || "{}") as Record<string, string[]>;
    return new Set(stored[todayKey()] ?? []);
  } catch {
    return new Set<string>();
  }
}

function saveNotifiedSectionKey(sectionKey: string) {
  try {
    const stored = JSON.parse(localStorage.getItem(notifiedSectionsKey) || "{}") as Record<string, string[]>;
    const today = todayKey();
    const nextKeys = new Set(stored[today] ?? []);
    nextKeys.add(sectionKey);
    localStorage.setItem(notifiedSectionsKey, JSON.stringify({ [today]: Array.from(nextKeys) }));
  } catch {
    localStorage.setItem(notifiedSectionsKey, JSON.stringify({ [todayKey()]: [sectionKey] }));
  }
}

function readCompletedDates() {
  try {
    return JSON.parse(localStorage.getItem("rotina_completed_dates") || "[]") as string[];
  } catch {
    return [];
  }
}

function calculateStreak(dates: string[]) {
  const completed = new Set(dates);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!completed.has(todayKey())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let count = 0;
  while (completed.has(dateKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

function getManualMeetingEvents(meetings: ManualMeeting[], date = new Date()) {
  const day = date.getDay();
  return meetings
    .filter((meeting) => meeting.days.includes(day))
    .map((meeting) => buildManualMeetingEvent(meeting, date))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<RoutineState>({});
  const [openSections, setOpenSections] = useState(() => new Set(routineSections.map((item) => item.key)));
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");
  const notificationTimers = useRef<number[]>([]);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [manualMeetings, setManualMeetings] = useState<ManualMeeting[]>([]);
  const [newMeeting, setNewMeeting] = useState(defaultMeetingForm);
  const [routinePrefs, setRoutinePrefs] = useState<RoutinePrefs>({
    hiddenItems: {},
    customItems: {},
    timeOverrides: {}
  });
  const [newRoutineItems, setNewRoutineItems] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(`rotina_next_${todayKey()}`);
    if (saved) setState(JSON.parse(saved) as RoutineState);

    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      setBrowserNotificationsEnabled(localStorage.getItem(notificationPreferenceKey) === "true");
    } else {
      setNotificationPermission("unsupported");
    }

    const savedMeetings = localStorage.getItem("rotina_manual_meetings");
    if (savedMeetings) setManualMeetings(JSON.parse(savedMeetings) as ManualMeeting[]);

    const savedPrefs = localStorage.getItem("rotina_preferences");
    if (savedPrefs) {
      const parsedPrefs = JSON.parse(savedPrefs) as RoutinePrefs;
      const savedCustomItems = parsedPrefs.customItems ?? {};
      setRoutinePrefs({
        ...parsedPrefs,
        customItems: {
          ...savedCustomItems,
          career: (savedCustomItems.career ?? []).filter((item) => item.label.trim().toLowerCase() !== "outlier")
        }
      });
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(`rotina_next_${todayKey()}`, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem("rotina_manual_meetings", JSON.stringify(manualMeetings));
  }, [manualMeetings]);

  useEffect(() => {
    localStorage.setItem("rotina_preferences", JSON.stringify(routinePrefs));
  }, [routinePrefs]);

  useEffect(() => {
    let alive = true;

    async function loadCalendar() {
      setCalendarLoading(true);
      setCalendarError("");

      try {
        const response = await fetch(`/api/calendar/today?date=${todayKey()}`);
        const payload = (await response.json()) as CalendarResponse;
        if (!alive) return;
        setCalendar(payload);
        if (!response.ok) setCalendarError(payload.message ?? "Não consegui carregar sua agenda.");
      } catch {
        if (alive) setCalendarError("Não consegui carregar sua agenda.");
      } finally {
        if (alive) setCalendarLoading(false);
      }
    }

    loadCalendar();
    return () => {
      alive = false;
    };
  }, []);

  const totals = useMemo(() => {
    const today = new Date();
    const routineTotal = routineSections.reduce((sum, section) => sum + getPersonalizedItems(section, today).length, 0);
    const routineDone = routineSections.reduce((sum, section) => {
      const visibleKeys = new Set(getPersonalizedItems(section, today).map((item) => item.key));
      const doneToday = (state[section.key] ?? []).filter((key) => visibleKeys.has(String(key))).length;
      return sum + doneToday;
    }, 0);
    const total = routineTotal;
    const done = routineDone;
    return { total, done, pending: total - done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [routinePrefs, state]);

  const manualEvents = useMemo(() => getManualMeetingEvents(manualMeetings), [manualMeetings]);
  const visibleAgendaEvents = useMemo(
    () => [...manualEvents, ...(calendar?.events ?? [])].filter((event) => Boolean(event.meetingUrl)),
    [calendar?.events, manualEvents]
  );
  const routineNotificationSections = useMemo<RoutineNotificationSection[]>(() => {
    const today = new Date();

    return routineSections
      .map((section) => {
        const startsAt = getSectionStartDate(getSectionTime(section.key, section.time), today);
        const items = getPersonalizedItems(section, today).map((item) => item.label);
        if (!startsAt || items.length === 0) return null;
        return { key: section.key, label: section.label, startsAt, items };
      })
      .filter((section): section is RoutineNotificationSection => Boolean(section));
  }, [routinePrefs]);

  useEffect(() => {
    notificationTimers.current.forEach((timer) => window.clearTimeout(timer));
    notificationTimers.current = [];

    if (!browserNotificationsEnabled || notificationPermission !== "granted") return;

    const notified = readNotifiedSectionKeys();
    const now = Date.now();

    routineNotificationSections.forEach((section) => {
      if (notified.has(section.key)) return;

      const delay = section.startsAt.getTime() - now;
      if (delay < 0) return;

      const timer = window.setTimeout(() => {
        const firstItems = section.items.slice(0, 3).join(", ");
        new Notification(`Começa agora: ${section.label}`, {
          body: firstItems ? `Próximos itens: ${firstItems}` : "Hora de começar este bloco da rotina.",
          icon: "/minha-rotina-logo.png",
          tag: `rotina-${todayKey()}-${section.key}`
        });
        saveNotifiedSectionKey(section.key);
      }, delay);

      notificationTimers.current.push(timer);
    });

    return () => {
      notificationTimers.current.forEach((timer) => window.clearTimeout(timer));
      notificationTimers.current = [];
    };
  }, [browserNotificationsEnabled, notificationPermission, routineNotificationSections]);

  useEffect(() => {
    const storedDates = readCompletedDates();
    const isComplete = totals.total > 0 && totals.done === totals.total;
    const today = todayKey();
    const nextDates = new Set(storedDates);

    if (isComplete) nextDates.add(today);
    else nextDates.delete(today);

    const sortedDates = [...nextDates].sort();
    localStorage.setItem("rotina_completed_dates", JSON.stringify(sortedDates));
    setStreak(calculateStreak(sortedDates));
  }, [totals.done, totals.total]);

  function toggleItem(sectionKey: string, key: string) {
    setState((current) => {
      const selected = new Set((current[sectionKey] ?? []).map(String));
      if (selected.has(key)) selected.delete(key);
      else selected.add(key);
      return { ...current, [sectionKey]: Array.from(selected) };
    });
  }

  function clearSection(sectionKey: string) {
    setState((current) => ({ ...current, [sectionKey]: [] }));
  }

  function toggleSection(sectionKey: string) {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(sectionKey)) next.delete(sectionKey);
      else next.add(sectionKey);
      return next;
    });
  }

  function toggleMeetingDay(day: number) {
    setNewMeeting((current) => {
      const selected = new Set(current.days);
      if (selected.has(day)) selected.delete(day);
      else selected.add(day);
      return { ...current, days: Array.from(selected).sort((a, b) => a - b) };
    });
  }

  function addManualMeeting() {
    const title = newMeeting.title.trim();
    const meetingUrl = newMeeting.meetingUrl.trim();
    if (!title || !newMeeting.startTime || !newMeeting.endTime || !newMeeting.days.length) return;

    setManualMeetings((meetings) => [
      ...meetings,
      {
        id: crypto.randomUUID(),
        title,
        startTime: newMeeting.startTime,
        endTime: newMeeting.endTime,
        meetingUrl,
        days: newMeeting.days
      }
    ]);
    setNewMeeting(defaultMeetingForm);
  }

  function deleteManualMeeting(id: string) {
    setManualMeetings((meetings) => meetings.filter((meeting) => meeting.id !== id));
  }

  function getSectionTime(sectionKey: string, fallback: string) {
    return routinePrefs.timeOverrides[sectionKey] ?? fallback;
  }

  function getPersonalizedItems(section: (typeof routineSections)[number], date = new Date()) {
    const hidden = new Set(routinePrefs.hiddenItems[section.key] ?? []);
    const defaultItems = getVisibleItems(section, date)
      .filter(({ index }) => !hidden.has(index))
      .map(({ item, index }) => ({
        key: String(index),
        label: item.label,
        defaultIndex: index
      }));
    const custom = (routinePrefs.customItems[section.key] ?? []).map((item) => ({
      key: item.id,
      label: item.label,
      customId: item.id
    }));

    if (section.days && !section.days.includes(date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
      return defaultItems;
    }

    return [...defaultItems, ...custom];
  }

  function deleteRoutineItem(sectionKey: string, item: { key: string; defaultIndex?: number; customId?: string }) {
    setRoutinePrefs((current) => {
      if (typeof item.defaultIndex === "number") {
        return {
          ...current,
          hiddenItems: {
            ...current.hiddenItems,
            [sectionKey]: [...new Set([...(current.hiddenItems[sectionKey] ?? []), item.defaultIndex])]
          }
        };
      }

      return {
        ...current,
        customItems: {
          ...current.customItems,
          [sectionKey]: (current.customItems[sectionKey] ?? []).filter((customItem) => customItem.id !== item.customId)
        }
      };
    });
    setState((current) => ({
      ...current,
      [sectionKey]: (current[sectionKey] ?? []).filter((key) => String(key) !== item.key)
    }));
  }

  function addRoutineItem(sectionKey: string) {
    const label = (newRoutineItems[sectionKey] ?? "").trim();
    if (!label) return;
    setRoutinePrefs((current) => ({
      ...current,
      customItems: {
        ...current.customItems,
        [sectionKey]: [...(current.customItems[sectionKey] ?? []), { id: crypto.randomUUID(), label }]
      }
    }));
    setNewRoutineItems((current) => ({ ...current, [sectionKey]: "" }));
  }

  function updateSectionTime(sectionKey: string, value: string) {
    setRoutinePrefs((current) => ({
      ...current,
      timeOverrides: {
        ...current.timeOverrides,
        [sectionKey]: value
      }
    }));
  }

  function buildReminderSections() {
    return routineSections.map((section) => ({
      ...section,
      time: getSectionTime(section.key, section.time),
      items: getPersonalizedItems(section).map((item) => ({ label: item.label }))
    }));
  }

  async function toggleBrowserNotifications() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    if (browserNotificationsEnabled) {
      localStorage.setItem(notificationPreferenceKey, "false");
      setBrowserNotificationsEnabled(false);
      return;
    }

    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      localStorage.setItem(notificationPreferenceKey, "true");
      setBrowserNotificationsEnabled(true);
    }
  }

  if (!hydrated) {
    return (
      <main className="appLoading">
        <img src="/minha-rotina-logo.png" alt="Minha Rotina" />
        <Loader2 className="spin" size={20} aria-hidden />
        <span>Carregando sua rotina</span>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brandHeader">
          <img src="/minha-rotina-logo.png" alt="Minha Rotina" />
          <div>
            <p className="eyebrow">minha rotina</p>
            <h1>{formatDate(new Date())}</h1>
          </div>
        </div>
        <div className="progressPill" aria-label={`Progresso ${totals.pct}%`}>
          <div className="progressTrack">
            <span style={{ width: `${totals.pct}%` }} />
          </div>
          <strong>{totals.pct}%</strong>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" aria-label="Resumo do dia">
          <section className="sideBlock">
            <p className="sideLabel">hoje</p>
            <div className="statsGrid">
              <div>
                <strong>{totals.done}</strong>
                <span>feitos</span>
              </div>
              <div>
                <strong>{totals.pending}</strong>
                <span>restantes</span>
              </div>
              <div>
                <strong>{streak}</strong>
                <span>streak</span>
              </div>
              <div>
                <strong>{visibleAgendaEvents.length}</strong>
                <span>eventos</span>
              </div>
            </div>
          </section>

          <section className="sideBlock">
            <p className="sideLabel">agenda</p>
            <AgendaPanel
              calendar={calendar}
              loading={calendarLoading}
              error={calendarError}
              manualEvents={manualEvents}
              getReminderSections={buildReminderSections}
            />
          </section>

          <section className="sideBlock">
            <p className="sideLabel">avisos</p>
            <div className="notificationActions">
              <button
                className={browserNotificationsEnabled ? "notificationButton active" : "notificationButton"}
                onClick={toggleBrowserNotifications}
                type="button"
              >
                <Bell size={15} aria-hidden />
                {browserNotificationsEnabled ? "Avisos ativados" : "Ativar avisos"}
              </button>
              <span>
                {notificationPermission === "unsupported"
                  ? "Este navegador não suporta avisos do sistema."
                  : notificationPermission === "denied"
                    ? "Permissão bloqueada no navegador."
                    : browserNotificationsEnabled
                      ? `${routineNotificationSections.length} blocos com horário hoje.`
                      : "Receba um aviso quando cada bloco começar."}
              </span>
            </div>
          </section>

          <section className="sideBlock navList">
            <p className="sideLabel">seções</p>
            <a href="#meetings" className="navItem">
              <CalendarDays size={16} aria-hidden />
              <span>Reuniões</span>
              <i>
                <b
                  style={{
                    width: manualMeetings.length ? "100%" : "0%",
                    background: "var(--blue)"
                  }}
                />
              </i>
              <em>{manualEvents.length}/{manualMeetings.length}</em>
            </a>
            {routineSections.map((section) => {
              const visibleItems = getPersonalizedItems(section);
              const visibleKeys = new Set(visibleItems.map((item) => item.key));
              const done = (state[section.key] ?? []).filter((key) => visibleKeys.has(String(key))).length;
              const total = visibleItems.length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const Icon = iconMap[section.icon as keyof typeof iconMap] ?? Sparkles;

              return (
                <a key={section.key} href={`#${section.key}`} className="navItem">
                  <Icon size={16} aria-hidden />
                  <span>{section.shortLabel}</span>
                  <i>
                    <b style={{ width: `${pct}%`, background: section.color }} />
                  </i>
                  <em>{total ? `${done}/${total}` : section.references?.length ? "ref" : "fora"}</em>
                </a>
              );
            })}
          </section>
        </aside>

        <section className="content" aria-label="Checklist da rotina">
          <div className="dayCard">
            <div>
              <p className="eyebrow">{formatShortDate(new Date())}</p>
              <h2>{totals.done} itens concluídos hoje</h2>
            </div>
            <div className="wideProgress">
              <span style={{ width: `${totals.pct}%` }} />
            </div>
          </div>

          <div className="sections">
            <article className="routineCard" id="meetings">
              <span className="sectionProgress" style={{ width: "100%", background: "var(--blue)" }} />
              <div className="sectionHeader staticHeader">
                <span className="iconBadge" style={{ color: "var(--blue)", background: "rgba(106, 167, 255, 0.12)" }}>
                  <CalendarDays size={17} aria-hidden />
                </span>
                <span className="sectionTitle">
                  <strong>Reuniões recorrentes</strong>
                  <small>cadastradas por você</small>
                </span>
                <span className="sectionActions">
                  <span className="countBadge" style={{ color: "var(--blue)", background: "rgba(106, 167, 255, 0.12)" }}>
                    {manualEvents.length}/{manualMeetings.length}
                  </span>
                </span>
              </div>
              <div className="checklist">
                <form
                  className="meetingForm"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addManualMeeting();
                  }}
                >
                  <input
                    value={newMeeting.title}
                    onChange={(event) => setNewMeeting((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Nome da reunião"
                  />
                  <div className="timeFields">
                    <label>
                      Início
                      <input
                        type="time"
                        value={newMeeting.startTime}
                        onChange={(event) => setNewMeeting((current) => ({ ...current, startTime: event.target.value }))}
                      />
                    </label>
                    <label>
                      Fim
                      <input
                        type="time"
                        value={newMeeting.endTime}
                        onChange={(event) => setNewMeeting((current) => ({ ...current, endTime: event.target.value }))}
                      />
                    </label>
                  </div>
                  <input
                    value={newMeeting.meetingUrl}
                    onChange={(event) => setNewMeeting((current) => ({ ...current, meetingUrl: event.target.value }))}
                    placeholder="Link da reunião"
                  />
                  <div className="dayToggleGroup" aria-label="Dias da reunião">
                    {weekDays.map((day) => (
                      <button
                        className={newMeeting.days.includes(day.value) ? "dayToggle selected" : "dayToggle"}
                        key={day.value}
                        type="button"
                        onClick={() => toggleMeetingDay(day.value)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <button className="meetingSubmit" type="submit">
                    <Plus size={16} aria-hidden />
                    Criar reunião
                  </button>
                </form>

                {manualMeetings.length === 0 && <div className="emptySection">Nenhuma reunião recorrente cadastrada.</div>}
                {manualMeetings.map((meeting) => (
                  <div className="meetingItem" key={meeting.id}>
                    <div>
                      <strong>{meeting.title}</strong>
                      <small>
                        {meeting.startTime}-{meeting.endTime} ·{" "}
                        {weekDays.filter((day) => meeting.days.includes(day.value)).map((day) => day.label).join(", ")}
                      </small>
                    </div>
                    <button
                      className="deleteTaskButton"
                      onClick={() => deleteManualMeeting(meeting.id)}
                      aria-label={`Excluir ${meeting.title}`}
                    >
                      <Trash2 size={15} aria-hidden />
                      <span>Excluir</span>
                    </button>
                  </div>
                ))}
              </div>
            </article>

            {routineSections.map((section) => {
              const visibleItems = getPersonalizedItems(section);
              const visibleKeys = new Set(visibleItems.map((item) => item.key));
              const doneItems = new Set((state[section.key] ?? []).filter((key) => visibleKeys.has(String(key))).map(String));
              const pct = visibleItems.length ? Math.round((doneItems.size / visibleItems.length) * 100) : 0;
              const isOpen = openSections.has(section.key);
              const Icon = iconMap[section.icon as keyof typeof iconMap] ?? Sparkles;

              return (
                <article className="routineCard" id={section.key} key={section.key}>
                  <span className="sectionProgress" style={{ width: `${pct}%`, background: section.color }} />
                  <button className="sectionHeader" onClick={() => toggleSection(section.key)}>
                    <span className="iconBadge" style={{ color: section.color, background: section.bg }}>
                      <Icon size={17} aria-hidden />
                    </span>
                    <span className="sectionTitle">
                      <strong>{section.label}</strong>
                      <small>{getSectionTime(section.key, section.time)} · {getSectionScheduleLabel(section)}</small>
                    </span>
                    <span className="sectionActions">
                      <span className="countBadge" style={{ color: section.color, background: section.bg }}>
                        {visibleItems.length ? `${doneItems.size}/${visibleItems.length}` : "ref"}
                      </span>
                      <ChevronDown className={isOpen ? "chevron open" : "chevron"} size={18} aria-hidden />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="checklist">
                      {section.note && <p className="sectionNote">{section.note}</p>}
                      {section.key === "english" && <EnglishTutor />}
                      {!section.references?.length && (
                        <div className="sectionEditor">
                          <label>
                            Horário
                            <input
                              value={getSectionTime(section.key, section.time)}
                              onChange={(event) => updateSectionTime(section.key, event.target.value)}
                              placeholder="09:00-10:00"
                            />
                          </label>
                        </div>
                      )}
                      {visibleItems.map((item) => {
                        const checked = doneItems.has(item.key);
                        return (
                          <div className={checked ? "checkItem customTask done" : "checkItem customTask"} key={`${section.key}-${item.key}`}>
                            <button className="taskCheckButton" onClick={() => toggleItem(section.key, item.key)}>
                              <span className="checkCircle">{checked && <Check size={13} aria-hidden />}</span>
                              <span>{item.label}</span>
                            </button>
                            <button
                              className="deleteTaskButton"
                              onClick={() => deleteRoutineItem(section.key, item)}
                              aria-label={`Excluir ${item.label}`}
                            >
                              <Trash2 size={15} aria-hidden />
                              <span>Excluir</span>
                            </button>
                          </div>
                        );
                      })}
                      {!section.references?.length && (
                        <form
                          className="taskForm sectionTaskForm"
                          onSubmit={(event) => {
                            event.preventDefault();
                            addRoutineItem(section.key);
                          }}
                        >
                          <input
                            value={newRoutineItems[section.key] ?? ""}
                            onChange={(event) =>
                              setNewRoutineItems((current) => ({ ...current, [section.key]: event.target.value }))
                            }
                            placeholder={`Adicionar tarefa em ${section.label}`}
                          />
                          <button type="submit" aria-label="Adicionar tarefa">
                            <Plus size={16} aria-hidden />
                          </button>
                        </form>
                      )}
                      {visibleItems.length === 0 && !section.references?.length && (
                        <div className="emptySection">
                          Nada programado para hoje. Esta seção aparece em {getSectionScheduleLabel(section)}.
                        </div>
                      )}
                      {section.references?.length ? (
                        <ol className="referenceList">
                          {section.references.map((reference) => (
                            <li key={reference}>{reference}</li>
                          ))}
                        </ol>
                      ) : null}
                      {doneItems.size > 0 && (
                        <button className="resetButton" onClick={() => clearSection(section.key)}>
                          <RotateCcw size={14} aria-hidden />
                          limpar seção
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function AgendaPanel({
  calendar,
  loading,
  error,
  manualEvents,
  getReminderSections
}: {
  calendar: CalendarResponse | null;
  loading: boolean;
  error: string;
  manualEvents: CalendarEvent[];
  getReminderSections: () => Array<{
    key: string;
    label: string;
    shortLabel: string;
    icon: string;
    color: string;
    bg: string;
    time: string;
    note?: string;
    days?: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>;
    items: Array<{ label: string }>;
    references?: string[];
  }>;
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const events = useMemo(
    () =>
      [...manualEvents, ...(calendar?.events ?? [])]
        .filter((event) => Boolean(event.meetingUrl))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [calendar?.events, manualEvents]
  );

  async function syncRoutineReminders() {
    setSyncing(true);
    setSyncMessage("");

    try {
      const response = await fetch("/api/calendar/routine-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: getReminderSections() })
      });
      const payload = (await response.json()) as { count?: number; message?: string };

      if (!response.ok) {
        setSyncMessage(payload.message ?? "Não consegui criar as notificações.");
        return;
      }

      setSyncMessage(`Notificações criadas para ${payload.count ?? 0} blocos da rotina.`);
    } catch {
      setSyncMessage("Não consegui criar as notificações.");
    } finally {
      setSyncing(false);
    }
  }

  if (loading && manualEvents.length === 0) {
    return (
      <div className="agendaState">
        <Loader2 className="spin" size={18} aria-hidden />
        <span>Carregando agenda</span>
      </div>
    );
  }

  if (error && manualEvents.length === 0) return <div className="agendaState danger">{error}</div>;

  if (!calendar?.configured && manualEvents.length === 0) {
    return (
      <div className="agendaState">
        Defina o OAuth do Google ou <code>CALENDAR_ICS_URL</code> para conectar sua agenda.
      </div>
    );
  }

  if (calendar?.authRequired && manualEvents.length === 0) {
    return (
      <div className="agendaState agendaConnect">
        <span>{calendar.message ?? "Conecte seu Google Calendar para carregar sua agenda."}</span>
        <a className="connectButton" href="/api/auth/google">
          Conectar Google Calendar
          <ArrowUpRight size={14} aria-hidden />
        </a>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="agendaState agendaConnect">
        <span>Nenhum evento para hoje.</span>
        {calendar?.source === "oauth" && (
          <a className="disconnectLink" href="/api/auth/google/logout">
            Desconectar Google Calendar
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="agendaList">
      {calendar?.source === "oauth" && (
        <div className="calendarActions">
          <button className="syncButton" onClick={syncRoutineReminders} disabled={syncing}>
            {syncing ? "Criando notificações..." : "Criar notificações da rotina"}
          </button>
          <a className="disconnectLink" href="/api/auth/google/logout">
            Desconectar Google Calendar
          </a>
          {syncMessage && <span>{syncMessage}</span>}
        </div>
      )}
      {error && <div className="agendaState danger">{error}</div>}
      {calendar?.authRequired && (
        <div className="agendaState agendaConnect">
          <span>{calendar.message ?? "Conecte sua agenda externa."}</span>
          <a className="connectButton" href="/api/auth/google">
            Conectar Google Calendar
            <ArrowUpRight size={14} aria-hidden />
          </a>
        </div>
      )}
      {events.map((event) => (
        <article className="agendaItem" key={event.id}>
          <div className="agendaTime">
            <CalendarDays size={15} aria-hidden />
            <span>{event.allDay ? "dia todo" : `${formatTime(event.startsAt)}-${formatTime(event.endsAt)}`}</span>
          </div>
          <strong>{event.title}</strong>
          {event.calendarId === "manual" && <small>reunião manual</small>}
          {event.location && <small>{event.location}</small>}
          {event.meetingUrl ? (
            <a href={event.meetingUrl} target="_blank" rel="noreferrer">
              Entrar na reunião
              <ArrowUpRight size={14} aria-hidden />
            </a>
          ) : (
            <span className="noLink">sem link detectado</span>
          )}
        </article>
      ))}
    </div>
  );
}
