"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarDays, Flame, Loader2 } from "lucide-react";
import {
  getVisibleItems,
  isReferenceSection,
  routineReferenceSections,
  routineSections,
  trackedRoutineSections
} from "@/lib/routine";
import { dateKey, formatDate, formatShortDate, todayKey } from "@/lib/date";
import { defaultMeetingForm, getManualMeetingEvents } from "@/lib/manual-meetings";
import type { TaskIconName } from "@/lib/task-icons";
import {
  calculateProgressStreak,
  getProgressReportDates,
  isProgressTrackingDate,
  progressTrackingStartDate,
  resetProgressHistory
} from "@/lib/progress-history";
import {
  buildLocalSyncSnapshot,
  normalizeRoutinePrefs,
  notificationPreferenceKey,
  notifiedSectionsKey,
  profileStacksKey,
  readCompletedDates,
  readRoutineStatesFromStorage,
  routineStatePrefix,
  sanitizeRoutineSyncSnapshot,
  telegramAutomaticKey,
  writeSyncSnapshotToStorage
} from "@/lib/routine-dashboard-storage";
import { resolveInitialSyncSnapshot } from "@/lib/routine-sync-selection";
import { readStorageJson } from "@/lib/storage";
import type { CalendarProgressDays } from "@/lib/calendar-progress";
import type {
  CalendarResponse,
  ManualMeeting,
  PersonalizedRoutineItem,
  RoutineNotificationSection,
  RoutinePrefs,
  RoutineState,
  ProgressPoint,
  RoutineSyncSnapshot,
  TelegramReportPeriod,
  TelegramRoutineReport
} from "@/lib/types";
import AgendaPanel from "./components/AgendaPanel";
import ManualMeetingsCard from "./components/ManualMeetingsCard";
import ProfileStacksCard from "./components/ProfileStacksCard";
import ProgressCharts from "./components/ProgressCharts";
import RoutineSectionCard from "./components/RoutineSectionCard";
import TelegramReports from "./components/TelegramReports";
import WeekendFlowPanel from "./components/WeekendFlowPanel";
import { RoutineIcon } from "./components/RoutineIcon";

const syncSaveDelay = 900;
const syncRefreshInterval = 60_000;
const emptyItemKeys = new Set<string>();

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
  const stored = readStorageJson<Record<string, string[]>>(notifiedSectionsKey, {});
  return new Set(stored[todayKey()] ?? []);
}

function saveNotifiedSectionKey(sectionKey: string) {
  const stored = readStorageJson<Record<string, string[]>>(notifiedSectionsKey, {});
  const today = todayKey();
  const nextKeys = new Set(stored[today] ?? []);
  nextKeys.add(sectionKey);
  localStorage.setItem(notifiedSectionsKey, JSON.stringify({ ...stored, [today]: Array.from(nextKeys) }));
}

function haveSameDoneKeys(previous: RoutineState[string] = [], current: RoutineState[string] = []) {
  if (previous.length !== current.length) return false;
  const previousKeys = new Set(previous.map(String));
  return current.every((key) => previousKeys.has(String(key)));
}

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [state, setState] = useState<RoutineState>({});
  const [openSections, setOpenSections] = useState(() => new Set(routineSections.map((item) => item.key)));
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [calendarProgressDays, setCalendarProgressDays] = useState<CalendarProgressDays>({});
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");
  const notificationTimers = useRef<number[]>([]);
  const calendarSyncTimer = useRef<number | undefined>(undefined);
  const lastCalendarSyncState = useRef<RoutineState | null>(null);
  const lastCalendarSyncPrefs = useRef<Pick<RoutinePrefs, "hiddenItems" | "customItems" | "timeOverrides" | "labelOverrides"> | null>(null);
  const pendingCalendarSectionKeys = useRef(new Set<string>());
  const pendingFullCalendarSync = useRef(false);
  const routineSyncTimer = useRef<number | undefined>(undefined);
  const lastRoutineSyncAt = useRef("");
  const applyingRemoteSync = useRef(false);
  const calendarSyncInProgress = useRef(false);
  const telegramSendingInProgress = useRef(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [manualMeetings, setManualMeetings] = useState<ManualMeeting[]>([]);
  const [newMeeting, setNewMeeting] = useState(defaultMeetingForm);
  const [profileStacks, setProfileStacks] = useState<string[]>([]);
  const [newStack, setNewStack] = useState("");
  const [routinePrefs, setRoutinePrefs] = useState<RoutinePrefs>({
    hiddenItems: {},
    customItems: {},
    timeOverrides: {},
    labelOverrides: {},
    iconOverrides: {},
    guideChecks: {}
  });
  const [newRoutineItems, setNewRoutineItems] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState(0);
  const [telegramAutomaticEnabled, setTelegramAutomaticEnabled] = useState(false);
  const [telegramSending, setTelegramSending] = useState<TelegramReportPeriod | null>(null);
  const [telegramMessage, setTelegramMessage] = useState("");

  useEffect(() => {
    resetProgressHistory(localStorage);
    setState(readStorageJson<RoutineState>(`${routineStatePrefix}${todayKey()}`, {}));

    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      setBrowserNotificationsEnabled(localStorage.getItem(notificationPreferenceKey) === "true");
    } else {
      setNotificationPermission("unsupported");
    }

    setManualMeetings(readStorageJson<ManualMeeting[]>("rotina_manual_meetings", []));
    setProfileStacks(readStorageJson<string[]>(profileStacksKey, []));
    setTelegramAutomaticEnabled(localStorage.getItem(telegramAutomaticKey) === "true");
    setRoutinePrefs(normalizeRoutinePrefs(readStorageJson<Partial<RoutinePrefs>>("rotina_preferences", {})));

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || syncReady) return;
    let alive = true;

    async function loadRoutineSync() {
      const synced = await refreshRoutineSync({ mergeLocal: true });
      if (!alive) return;
      if (!synced) {
        if (!alive) return;
        setSyncMessage("Sincronização local ativa.");
      }
      setSyncReady(true);
    }

    loadRoutineSync();
    return () => {
      alive = false;
    };
  }, [hydrated, syncReady]);

  useEffect(() => {
    if (!hydrated || !syncReady) return;
    localStorage.setItem(`${routineStatePrefix}${todayKey()}`, JSON.stringify(state));
  }, [hydrated, state, syncReady]);

  useEffect(() => {
    if (!hydrated || !syncReady) return;
    localStorage.setItem("rotina_manual_meetings", JSON.stringify(manualMeetings));
  }, [hydrated, manualMeetings, syncReady]);

  useEffect(() => {
    if (!hydrated || !syncReady) return;
    localStorage.setItem(profileStacksKey, JSON.stringify(profileStacks));
  }, [hydrated, profileStacks, syncReady]);

  useEffect(() => {
    if (!hydrated || !syncReady) return;
    localStorage.setItem("rotina_preferences", JSON.stringify(routinePrefs));
  }, [hydrated, routinePrefs, syncReady]);

  useEffect(() => {
    if (!hydrated || !syncReady) return;

    window.clearTimeout(routineSyncTimer.current);
    routineSyncTimer.current = window.setTimeout(() => {
      void saveRoutineSyncSnapshot({
        ...buildLocalSyncSnapshot(),
        states: {
          ...readRoutineStatesFromStorage(),
          [todayKey()]: state
        },
        routinePrefs,
        manualMeetings,
        profileStacks,
        telegramAutomaticEnabled,
        updatedAt: new Date().toISOString()
      });
    }, syncSaveDelay);

    return () => window.clearTimeout(routineSyncTimer.current);
  }, [hydrated, manualMeetings, profileStacks, routinePrefs, state, syncReady, telegramAutomaticEnabled]);

  useEffect(() => {
    if (!hydrated || !syncReady) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshRoutineSync();
    }, syncRefreshInterval);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void refreshRoutineSync();
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, [hydrated, syncReady]);

  useEffect(() => {
    if (!hydrated || calendar?.source !== "oauth") return;

    const calendarPrefs = {
      hiddenItems: routinePrefs.hiddenItems,
      customItems: routinePrefs.customItems,
      timeOverrides: routinePrefs.timeOverrides,
      labelOverrides: routinePrefs.labelOverrides,
      iconOverrides: routinePrefs.iconOverrides
    };
    const previousPrefs = lastCalendarSyncPrefs.current;
    const preferencesChanged = !previousPrefs || Object.keys(calendarPrefs).some(
      (key) => calendarPrefs[key as keyof typeof calendarPrefs] !== previousPrefs[key as keyof typeof previousPrefs]
    );
    const previousState = lastCalendarSyncState.current;
    const changedSectionKeys = previousState
      ? trackedRoutineSections
          .filter((section) => !haveSameDoneKeys(previousState[section.key], state[section.key]))
          .map((section) => section.key)
      : trackedRoutineSections.map((section) => section.key);

    lastCalendarSyncPrefs.current = calendarPrefs;
    lastCalendarSyncState.current = state;

    if (preferencesChanged) pendingFullCalendarSync.current = true;
    else changedSectionKeys.forEach((key) => pendingCalendarSectionKeys.current.add(key));

    if (!pendingFullCalendarSync.current && pendingCalendarSectionKeys.current.size === 0) return;

    function syncChangedCalendarSections() {
      if (calendarSyncInProgress.current) {
        calendarSyncTimer.current = window.setTimeout(syncChangedCalendarSections, 800);
        return;
      }

      const syncAllSections = pendingFullCalendarSync.current;
      const sectionKeys = new Set(pendingCalendarSectionKeys.current);
      const sections = buildCalendarSections().filter(
        (section) => syncAllSections || sectionKeys.has(section.key)
      );
      pendingFullCalendarSync.current = false;
      pendingCalendarSectionKeys.current.clear();
      calendarSyncInProgress.current = true;
      fetch("/api/calendar/routine-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections })
      })
        .catch(() => undefined)
        .finally(() => {
          calendarSyncInProgress.current = false;
        });
    }

    window.clearTimeout(calendarSyncTimer.current);
    calendarSyncTimer.current = window.setTimeout(syncChangedCalendarSections, 800);

    return () => window.clearTimeout(calendarSyncTimer.current);
  }, [
    calendar?.source,
    hydrated,
    routinePrefs.customItems,
    routinePrefs.hiddenItems,
    routinePrefs.iconOverrides,
    routinePrefs.labelOverrides,
    routinePrefs.timeOverrides,
    state
  ]);

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

  useEffect(() => {
    if (!hydrated) return;

    const progressDates = getProgressReportDates("monthly");
    const firstDate = progressDates[0];
    const lastDate = progressDates.at(-1);
    if (!firstDate || !lastDate) return;
    const start = dateKey(firstDate);
    const end = dateKey(lastDate);

    let alive = true;

    async function loadCalendarProgress() {
      try {
        const response = await fetch(`/api/calendar/progress?start=${start}&end=${end}`, {
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          configured?: boolean;
          authRequired?: boolean;
          days?: CalendarProgressDays;
        };

        if (!alive || !response.ok || !payload.configured || payload.authRequired || !payload.days) return;
        setCalendarProgressDays(payload.days);
      } catch {
        if (alive) setCalendarProgressDays({});
      }
    }

    loadCalendarProgress();
    return () => {
      alive = false;
    };
  }, [hydrated]);

  const isTodayProgressDay = isProgressTrackingDate(new Date());
  const todaySectionViews = useMemo(() => {
    const today = new Date();
    return trackedRoutineSections.map((section) => {
      const items = getPersonalizedItems(section, today);
      const visibleKeys = new Set(items.map((item) => item.key));
      const doneItems = new Set(
        (state[section.key] ?? []).filter((key) => visibleKeys.has(String(key))).map(String)
      );
      return { section, items, doneItems };
    });
  }, [
    routinePrefs.customItems,
    routinePrefs.hiddenItems,
    routinePrefs.iconOverrides,
    routinePrefs.labelOverrides,
    state
  ]);

  const totals = useMemo(() => {
    if (!isTodayProgressDay) return { total: 0, done: 0, pending: 0, pct: 0 };
    const routineTotal = todaySectionViews.reduce((sum, view) => sum + view.items.length, 0);
    const routineDone = todaySectionViews.reduce((sum, view) => sum + view.doneItems.size, 0);
    const total = routineTotal;
    const done = routineDone;
    return { total, done, pending: total - done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [isTodayProgressDay, todaySectionViews]);

  const evolution = useMemo(
    () => ({
      weekly: getProgressReportDates("weekly").map(buildProgressPoint),
      monthly: getProgressReportDates("monthly").map(buildProgressPoint)
    }),
    [calendarProgressDays, routinePrefs, state]
  );
  const stackPreview = profileStacks.length ? profileStacks.slice(0, 4) : ["React", "Java", "System design"];
  const dayModeLabel = isTodayProgressDay ? "Rotina de programação" : "Fluxo opcional";

  const manualEvents = useMemo(() => getManualMeetingEvents(manualMeetings), [manualMeetings]);
  const visibleAgendaEvents = useMemo(
    () => [...manualEvents, ...(calendar?.events ?? [])].filter((event) => Boolean(event.meetingUrl)),
    [calendar?.events, manualEvents]
  );
  const routineNotificationSections = useMemo<RoutineNotificationSection[]>(() => {
    const today = new Date();

    return todaySectionViews
      .map(({ section, items: personalizedItems }) => {
        const startsAt = getSectionStartDate(getSectionTime(section.key, section.time), today);
        const items = personalizedItems.map((item) => item.label);
        if (!startsAt || items.length === 0) return null;
        return { key: section.key, label: section.label, startsAt, items };
      })
      .filter((section): section is RoutineNotificationSection => Boolean(section));
  }, [routinePrefs.timeOverrides, todaySectionViews]);

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
          icon: "/minha-rotina-logo-192.png",
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
    if (!hydrated || !syncReady) return;
    const calendarCompletedDates = Object.entries(calendarProgressDays)
      .filter(([date, progress]) => date < todayKey() && progress.total > 0 && progress.done >= progress.total)
      .map(([date]) => date);
    const storedDates = [...new Set([...readCompletedDates(), ...calendarCompletedDates])]
      .filter((date) => date >= progressTrackingStartDate);
    const isComplete = totals.total > 0 && totals.done === totals.total;
    const today = todayKey();
    const nextDates = new Set(storedDates);

    if (isComplete && today >= progressTrackingStartDate) nextDates.add(today);
    else nextDates.delete(today);

    const sortedDates = [...nextDates].sort();
    localStorage.setItem("rotina_completed_dates", JSON.stringify(sortedDates));
    setStreak(calculateProgressStreak(sortedDates));
  }, [calendarProgressDays, hydrated, syncReady, totals.done, totals.total]);

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

  function addProfileStack() {
    const stack = newStack.trim();
    if (!stack) return;
    setProfileStacks((current) => [...new Set([...current, stack])].slice(0, 20));
    setNewStack("");
  }

  function deleteProfileStack(stack: string) {
    setProfileStacks((current) => current.filter((item) => item !== stack));
  }

  function getSectionTime(sectionKey: string, fallback: string) {
    return routinePrefs.timeOverrides[sectionKey] ?? fallback;
  }

  function getPersonalizedItems(section: (typeof routineSections)[number], date = new Date()): PersonalizedRoutineItem[] {
    const hidden = new Set(routinePrefs.hiddenItems[section.key] ?? []);
    const defaultItems = getVisibleItems(section, date)
      .filter(({ index }) => !hidden.has(index))
      .map(({ item, index }) => ({
        key: String(index),
        label: routinePrefs.labelOverrides[section.key]?.[String(index)] ?? item.label,
        icon: routinePrefs.iconOverrides[section.key]?.[String(index)],
        defaultIndex: index
      }));
    const custom = (routinePrefs.customItems[section.key] ?? []).map((item) => ({
      key: item.id,
      label: routinePrefs.labelOverrides[section.key]?.[item.id] ?? item.label,
      icon: routinePrefs.iconOverrides[section.key]?.[item.id],
      customId: item.id
    }));

    if (section.days && !section.days.includes(date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
      return defaultItems;
    }

    return [...defaultItems, ...custom];
  }

  function getProgressItems(section: (typeof routineSections)[number], date = new Date()) {
    if (!isProgressTrackingDate(date) || isReferenceSection(section)) return [];
    return getPersonalizedItems(section, date);
  }

  function deleteRoutineItem(sectionKey: string, item: { key: string; defaultIndex?: number; customId?: string }) {
    setRoutinePrefs((current) => {
      const nextSectionLabels = { ...(current.labelOverrides[sectionKey] ?? {}) };
      const nextSectionIcons = { ...(current.iconOverrides[sectionKey] ?? {}) };
      delete nextSectionLabels[item.key];
      delete nextSectionIcons[item.key];
      const labelOverrides = {
        ...current.labelOverrides,
        [sectionKey]: nextSectionLabels
      };
      const iconOverrides = {
        ...current.iconOverrides,
        [sectionKey]: nextSectionIcons
      };

      if (typeof item.defaultIndex === "number") {
        return {
          ...current,
          labelOverrides,
          iconOverrides,
          hiddenItems: {
            ...current.hiddenItems,
            [sectionKey]: [...new Set([...(current.hiddenItems[sectionKey] ?? []), item.defaultIndex])]
          }
        };
      }

      return {
        ...current,
        labelOverrides,
        iconOverrides,
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

  function updateRoutineItem(sectionKey: string, itemKey: string, label: string, icon: TaskIconName) {
    const nextLabel = label.trim();
    if (!nextLabel) return;

    setRoutinePrefs((current) => ({
      ...current,
      labelOverrides: {
        ...current.labelOverrides,
        [sectionKey]: {
          ...(current.labelOverrides[sectionKey] ?? {}),
          [itemKey]: nextLabel
        }
      },
      iconOverrides: {
        ...current.iconOverrides,
        [sectionKey]: {
          ...(current.iconOverrides[sectionKey] ?? {}),
          [itemKey]: icon
        }
      }
    }));
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

  function toggleGuideItem(sectionKey: string, itemKey: string) {
    setRoutinePrefs((current) => {
      const checked = new Set(current.guideChecks[sectionKey] ?? []);
      if (checked.has(itemKey)) checked.delete(itemKey);
      else checked.add(itemKey);

      return {
        ...current,
        guideChecks: {
          ...current.guideChecks,
          [sectionKey]: [...checked]
        }
      };
    });
  }

  function buildCalendarSections() {
    return trackedRoutineSections.map((section) => {
      const completedKeys = new Set((state[section.key] ?? []).map(String));
      return {
        ...section,
        time: getSectionTime(section.key, section.time),
        items: [
          ...section.items
            .map((item, index) => ({ ...item, key: String(index), index }))
            .filter((item) => !(routinePrefs.hiddenItems[section.key] ?? []).includes(item.index)),
          ...(routinePrefs.customItems[section.key] ?? []).map((item) => ({ ...item, key: item.id }))
        ].map((item) => ({
          label: routinePrefs.labelOverrides[section.key]?.[item.key] ?? item.label,
          icon: routinePrefs.iconOverrides[section.key]?.[item.key],
          days: "days" in item ? item.days : undefined,
          completed: completedKeys.has(item.key)
        }))
      };
    });
  }

  function buildTelegramReport(period: TelegramReportPeriod): TelegramRoutineReport {
    const days = getProgressReportDates(period).flatMap((date) => {
      const key = dateKey(date);
      const storageKey = `${routineStatePrefix}${key}`;
      const isToday = key === todayKey();
      const storedState = isToday ? state : readStorageJson<RoutineState | null>(storageKey, null);
      const calendarDay = !isToday ? calendarProgressDays[key] : undefined;
      if (!isToday && storedState === null && !calendarDay) return [];
      const dayState = storedState ?? {};
      const sections = trackedRoutineSections
        .map((section) => {
          const items = getProgressItems(section, date);
          const visibleKeys = new Set(items.map((item) => item.key));
          const localDone = (dayState[section.key] ?? []).filter((itemKey) => visibleKeys.has(String(itemKey))).length;
          const calendarSection = calendarDay?.sections[section.label];
          const done = calendarSection && calendarSection.done > localDone ? calendarSection.done : localDone;
          const total = calendarSection && calendarSection.total > items.length ? calendarSection.total : items.length;
          return { label: section.label, done, total };
        })
        .filter((section) => section.total > 0);

      return [{
        date: key,
        done: sections.reduce((sum, section) => sum + section.done, 0),
        total: sections.reduce((sum, section) => sum + section.total, 0),
        sections
      }];
    });

    return { period, streak, generatedAt: new Date().toISOString(), days };
  }

  function buildProgressPoint(date: Date): ProgressPoint {
    const key = dateKey(date);
    const isToday = key === todayKey();
    const dayState = isToday ? state : readStorageJson<RoutineState>(`${routineStatePrefix}${key}`, {});
    const localTotals = trackedRoutineSections.reduce(
      (result, section) => {
        const items = getProgressItems(section, date);
        const visibleKeys = new Set(items.map((item) => item.key));
        const done = (dayState[section.key] ?? []).filter((itemKey) => visibleKeys.has(String(itemKey))).length;
        return { done: result.done + done, total: result.total + items.length };
      },
      { done: 0, total: 0 }
    );
    const calendarTotals = !isToday ? calendarProgressDays[key] : undefined;
    const totals = calendarTotals && calendarTotals.done > localTotals.done ? calendarTotals : localTotals;

    return {
      date: key,
      label: formatShortDate(date),
      shortLabel: new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", ""),
      done: totals.done,
      total: totals.total,
      pct: totals.total ? Math.round((totals.done / totals.total) * 100) : 0
    };
  }

  async function sendTelegramReport(period: TelegramReportPeriod) {
    if (todayKey() < progressTrackingStartDate) {
      setTelegramMessage("Os relatórios começam em 29 de junho de 2026.");
      return false;
    }
    if (telegramSendingInProgress.current) return false;
    telegramSendingInProgress.current = true;
    setTelegramSending(period);
    setTelegramMessage("");

    try {
      const response = await fetch("/api/reports/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildTelegramReport(period))
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Não consegui enviar o relatório.");
      setTelegramMessage(`Relatório ${period === "daily" ? "diário" : period === "weekly" ? "semanal" : "mensal"} enviado.`);
      return true;
    } catch (error) {
      setTelegramMessage(error instanceof Error ? error.message : "Não consegui enviar o relatório.");
      return false;
    } finally {
      telegramSendingInProgress.current = false;
      setTelegramSending(null);
    }
  }

  function toggleTelegramAutomaticReports() {
    setTelegramAutomaticEnabled((current) => {
      const next = !current;
      localStorage.setItem(telegramAutomaticKey, String(next));
      return next;
    });
  }

  async function saveRoutineSyncSnapshot(snapshot: RoutineSyncSnapshot) {
    if (applyingRemoteSync.current) return false;
    const sanitizedSnapshot = sanitizeRoutineSyncSnapshot(snapshot);

    try {
      const response = await fetch("/api/routine-sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedSnapshot)
      });
      const payload = (await response.json()) as { configured?: boolean; message?: string };
      if (!payload.configured) {
        setSyncMessage("Sincronização local ativa.");
        return false;
      }
      if (!response.ok) throw new Error(payload.message ?? "Não consegui sincronizar.");
      lastRoutineSyncAt.current = sanitizedSnapshot.updatedAt;
      setSyncMessage("Dados sincronizados entre seus dispositivos.");
      return true;
    } catch {
      setSyncMessage("Não consegui salvar no banco agora. Seus dados continuam salvos neste aparelho.");
      return false;
    }
  }

  async function refreshRoutineSync({ mergeLocal = false } = {}) {
    try {
      const response = await fetch("/api/routine-sync", { cache: "no-store" });
      const payload = (await response.json()) as {
        configured?: boolean;
        authRequired?: boolean;
        data?: RoutineSyncSnapshot;
        message?: string;
      };

      if (!response.ok || !payload.configured || payload.authRequired) {
        setSyncMessage(payload.message ?? "Sincronização local ativa.");
        return false;
      }

      const remote = payload.data;
      if (!remote) return false;

      if (!mergeLocal && remote.updatedAt && remote.updatedAt === lastRoutineSyncAt.current) {
        setSyncMessage("Dados sincronizados entre seus dispositivos.");
        return true;
      }

      const initialSync = mergeLocal
        ? resolveInitialSyncSnapshot(buildLocalSyncSnapshot(), remote)
        : { snapshot: remote, shouldSave: false };
      const nextSnapshot = sanitizeRoutineSyncSnapshot(initialSync.snapshot);
      applyingRemoteSync.current = !mergeLocal;
      writeSyncSnapshotToStorage(nextSnapshot);
      setState(nextSnapshot.states[todayKey()] ?? {});
      setManualMeetings(nextSnapshot.manualMeetings);
      setProfileStacks(nextSnapshot.profileStacks);
      setRoutinePrefs(nextSnapshot.routinePrefs);
      setTelegramAutomaticEnabled(nextSnapshot.telegramAutomaticEnabled);
      lastRoutineSyncAt.current = nextSnapshot.updatedAt;
      setSyncMessage("Dados sincronizados entre seus dispositivos.");
      if (!mergeLocal) {
        window.setTimeout(() => {
          applyingRemoteSync.current = false;
        }, 0);
      }

      if (initialSync.shouldSave) {
        await saveRoutineSyncSnapshot(nextSnapshot);
      }
      return true;
    } catch {
      setSyncMessage("Não consegui buscar o banco agora. Seus dados continuam salvos neste aparelho.");
      return false;
    }
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
        <img src="/minha-rotina-logo-192.png" alt="Minha Rotina" width={58} height={58} />
        <Loader2 className="spin" size={20} aria-hidden />
        <span>Carregando sua rotina</span>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brandHeader">
          <img src="/minha-rotina-logo-192.png" alt="Minha Rotina" width={54} height={54} />
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
              <div className="streakStat" aria-label={`${streak} dias de sequência`}>
                <strong>
                  <Flame size={19} aria-hidden />
                  {streak}
                </strong>
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
              getReminderSections={buildCalendarSections}
              calendarSyncInProgress={calendarSyncInProgress}
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

          <section className="sideBlock">
            <p className="sideLabel">telegram</p>
            <TelegramReports
              automaticEnabled={telegramAutomaticEnabled}
              sending={telegramSending}
              message={telegramMessage}
              onSend={sendTelegramReport}
              onToggleAutomatic={toggleTelegramAutomaticReports}
            />
          </section>

          <section className="sideBlock">
            <p className="sideLabel">sincronização</p>
            <p className="syncStatus">{syncMessage || "Preparando sincronização..."}</p>
          </section>

          <ProfileStacksCard
            stacks={profileStacks}
            newStack={newStack}
            onNewStackChange={setNewStack}
            onAddStack={addProfileStack}
            onDeleteStack={deleteProfileStack}
          />

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
            {todaySectionViews.map(({ section, items, doneItems }) => {
              const done = doneItems.size;
              const total = items.length;
              const pct = total ? Math.round((done / total) * 100) : 0;

              return (
                <a key={section.key} href={`#${section.key}`} className="navItem">
                  <RoutineIcon name={section.icon} />
                  <span>{section.shortLabel}</span>
                  <i>
                    <b style={{ width: `${pct}%`, background: section.color }} />
                  </i>
                  <em>{total ? `${done}/${total}` : "fora"}</em>
                </a>
              );
            })}
          </section>

          {routineReferenceSections.length > 0 && (
            <section className="sideBlock navList">
              <p className="sideLabel">referências</p>
              {routineReferenceSections.map((section) => (
                <a key={section.key} href={`#${section.key}`} className="navItem">
                  <RoutineIcon name={section.icon} />
                  <span>{section.shortLabel}</span>
                  <i />
                  <em>guia</em>
                </a>
              ))}
            </section>
          )}
        </aside>

        <section className="content" aria-label="Checklist da rotina">
          <div className="dayCard">
            <div className="dayCardHeader">
              <div>
                <p className="eyebrow">{formatShortDate(new Date())}</p>
                <h2>{isTodayProgressDay ? `${totals.done} itens concluídos hoje` : "Fim de semana opcional"}</h2>
              </div>
              <span className={isTodayProgressDay ? "dayMode" : "dayMode optional"}>{dayModeLabel}</span>
            </div>
            <div className="wideProgress">
              <span style={{ width: `${totals.pct}%` }} />
            </div>
            <div className="dayStackRow" aria-label="Contexto da rotina">
              {stackPreview.map((stack) => (
                <span key={stack}>{stack}</span>
              ))}
            </div>
          </div>

          {!isTodayProgressDay && <WeekendFlowPanel stacks={profileStacks} />}

          <ProgressCharts weekly={evolution.weekly} monthly={evolution.monthly} />

          <div className="sections">
            <ManualMeetingsCard
              meetings={manualMeetings}
              todayCount={manualEvents.length}
              form={newMeeting}
              setForm={setNewMeeting}
              onToggleDay={toggleMeetingDay}
              onCreate={addManualMeeting}
              onDelete={deleteManualMeeting}
            />

            {todaySectionViews.map(({ section, items, doneItems }) => {
              const isOpen = openSections.has(section.key);

              return (
                <RoutineSectionCard
                  key={section.key}
                  section={section}
                  items={items}
                  doneItems={doneItems}
                  guideDoneItems={emptyItemKeys}
                  isOpen={isOpen}
                  time={getSectionTime(section.key, section.time)}
                  newItem={newRoutineItems[section.key] ?? ""}
                  onToggleSection={() => toggleSection(section.key)}
                  onToggleItem={(key) => toggleItem(section.key, key)}
                  onToggleGuideItem={(key) => toggleGuideItem(section.key, key)}
                  onDeleteItem={(item) => deleteRoutineItem(section.key, item)}
                  onEditItem={(item, label, icon) => updateRoutineItem(section.key, item.key, label, icon)}
                  onNewItemChange={(value) => setNewRoutineItems((current) => ({ ...current, [section.key]: value }))}
                  onAddItem={() => addRoutineItem(section.key)}
                  onTimeChange={(value) => updateSectionTime(section.key, value)}
                  onClear={() => clearSection(section.key)}
                />
              );
            })}
          </div>

          {routineReferenceSections.length > 0 && (
            <section className="referenceArea" aria-labelledby="reference-area-title">
              <div className="referenceAreaHeader">
                <p className="eyebrow">referências</p>
                <h2 id="reference-area-title">Guias para consultar</h2>
                <span>Não entram na sua rotina, progresso, streak ou relatórios.</span>
              </div>
              <div className="sections">
                {routineReferenceSections.map((section) => (
                  <RoutineSectionCard
                    key={section.key}
                    section={section}
                    items={[]}
                    doneItems={emptyItemKeys}
                    guideDoneItems={new Set(routinePrefs.guideChecks[section.key] ?? [])}
                    isOpen={openSections.has(section.key)}
                    time={section.time}
                    newItem=""
                    onToggleSection={() => toggleSection(section.key)}
                    onToggleItem={() => undefined}
                    onToggleGuideItem={(key) => toggleGuideItem(section.key, key)}
                    onDeleteItem={() => undefined}
                    onEditItem={() => undefined}
                    onNewItemChange={() => undefined}
                    onAddItem={() => undefined}
                    onTimeChange={() => undefined}
                    onClear={() => undefined}
                  />
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
