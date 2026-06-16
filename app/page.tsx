"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarDays, Flame, Loader2 } from "lucide-react";
import { getVisibleItems, routineSections } from "@/lib/routine";
import { dateKey, formatDate, formatShortDate, todayKey } from "@/lib/date";
import { defaultMeetingForm, getManualMeetingEvents } from "@/lib/manual-meetings";
import {
  calculateProgressStreak,
  getProgressReportDates,
  progressTrackingStartDate,
  resetProgressHistory
} from "@/lib/progress-history";
import {
  buildLocalSyncSnapshot,
  mergeSyncSnapshots,
  normalizeRoutinePrefs,
  notificationPreferenceKey,
  notifiedSectionsKey,
  profileStacksKey,
  readCompletedDates,
  readRoutineStatesFromStorage,
  routineStatePrefix,
  telegramAutomaticKey,
  telegramReportSentKey,
  writeSyncSnapshotToStorage
} from "@/lib/routine-dashboard-storage";
import { readStorageJson } from "@/lib/storage";
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
import { RoutineIcon } from "./components/RoutineIcon";

const syncSaveDelay = 900;
const syncRefreshInterval = 60_000;

function isLastDayOfMonth(date: Date) {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.getMonth() !== date.getMonth();
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

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [state, setState] = useState<RoutineState>({});
  const [openSections, setOpenSections] = useState(() => new Set(routineSections.map((item) => item.key)));
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");
  const notificationTimers = useRef<number[]>([]);
  const calendarSyncTimer = useRef<number | undefined>(undefined);
  const routineSyncTimer = useRef<number | undefined>(undefined);
  const lastRoutineSyncAt = useRef("");
  const applyingRemoteSync = useRef(false);
  const calendarSyncInProgress = useRef(false);
  const telegramAutoCheckDone = useRef(false);
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
    labelOverrides: {}
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

    window.clearTimeout(calendarSyncTimer.current);
    calendarSyncTimer.current = window.setTimeout(() => {
      if (calendarSyncInProgress.current) return;
      calendarSyncInProgress.current = true;
      fetch("/api/calendar/routine-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: buildCalendarSections() })
      })
        .catch(() => undefined)
        .finally(() => {
          calendarSyncInProgress.current = false;
        });
    }, 800);

    return () => window.clearTimeout(calendarSyncTimer.current);
  }, [calendar?.source, hydrated, routinePrefs, state]);

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

  const evolution = useMemo(
    () => ({
      weekly: getProgressReportDates("weekly").map(buildProgressPoint),
      monthly: getProgressReportDates("monthly").map(buildProgressPoint)
    }),
    [routinePrefs, state]
  );

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
    if (!hydrated || !syncReady) return;
    const storedDates = readCompletedDates().filter((date) => date >= progressTrackingStartDate);
    const isComplete = totals.total > 0 && totals.done === totals.total;
    const today = todayKey();
    const nextDates = new Set(storedDates);

    if (isComplete && today >= progressTrackingStartDate) nextDates.add(today);
    else nextDates.delete(today);

    const sortedDates = [...nextDates].sort();
    localStorage.setItem("rotina_completed_dates", JSON.stringify(sortedDates));
    setStreak(calculateProgressStreak(sortedDates));
  }, [hydrated, syncReady, totals.done, totals.total]);

  useEffect(() => {
    if (!hydrated || !telegramAutomaticEnabled || telegramAutoCheckDone.current) return;
    telegramAutoCheckDone.current = true;

    const timer = window.setTimeout(async () => {
      const now = new Date();
      if (todayKey() < progressTrackingStartDate || now.getHours() < 20) return;

      const sent = readStorageJson<Record<string, boolean>>(telegramReportSentKey, {});
      const dueReports: TelegramReportPeriod[] = ["daily"];
      if (now.getDay() === 0) dueReports.push("weekly");
      if (isLastDayOfMonth(now)) dueReports.push("monthly");

      for (const period of dueReports) {
        const key = `${period}-${todayKey()}`;
        if (sent[key]) continue;
        const wasSent = await sendTelegramReport(period, true);
        if (wasSent) {
          sent[key] = true;
          localStorage.setItem(telegramReportSentKey, JSON.stringify(sent));
        }
      }
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [hydrated, telegramAutomaticEnabled]);

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
        defaultIndex: index
      }));
    const custom = (routinePrefs.customItems[section.key] ?? []).map((item) => ({
      key: item.id,
      label: routinePrefs.labelOverrides[section.key]?.[item.id] ?? item.label,
      customId: item.id
    }));

    if (section.days && !section.days.includes(date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
      return defaultItems;
    }

    return [...defaultItems, ...custom];
  }

  function deleteRoutineItem(sectionKey: string, item: { key: string; defaultIndex?: number; customId?: string }) {
    setRoutinePrefs((current) => {
      const nextSectionLabels = { ...(current.labelOverrides[sectionKey] ?? {}) };
      delete nextSectionLabels[item.key];
      const labelOverrides = {
        ...current.labelOverrides,
        [sectionKey]: nextSectionLabels
      };

      if (typeof item.defaultIndex === "number") {
        return {
          ...current,
          labelOverrides,
          hiddenItems: {
            ...current.hiddenItems,
            [sectionKey]: [...new Set([...(current.hiddenItems[sectionKey] ?? []), item.defaultIndex])]
          }
        };
      }

      return {
        ...current,
        labelOverrides,
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

  function updateRoutineItemLabel(sectionKey: string, itemKey: string, label: string) {
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

  function buildCalendarSections() {
    return routineSections.map((section) => ({
      ...section,
      time: getSectionTime(section.key, section.time),
      items: [
        ...section.items
          .map((item, index) => ({ ...item, key: String(index), index }))
          .filter((item) => !(routinePrefs.hiddenItems[section.key] ?? []).includes(item.index)),
        ...(routinePrefs.customItems[section.key] ?? []).map((item) => ({ ...item, key: item.id }))
      ].map((item) => ({
        label: routinePrefs.labelOverrides[section.key]?.[item.key] ?? item.label,
        days: "days" in item ? item.days : undefined,
        completed: (state[section.key] ?? []).map(String).includes(item.key)
      }))
    }));
  }

  function buildTelegramReport(period: TelegramReportPeriod): TelegramRoutineReport {
    const days = getProgressReportDates(period).flatMap((date) => {
      const key = dateKey(date);
      const storageKey = `${routineStatePrefix}${key}`;
      const isToday = key === todayKey();
      const storedState = isToday ? state : readStorageJson<RoutineState | null>(storageKey, null);
      if (!isToday && storedState === null) return [];
      const dayState = storedState ?? {};
      const sections = routineSections
        .map((section) => {
          const items = getPersonalizedItems(section, date);
          const visibleKeys = new Set(items.map((item) => item.key));
          const done = (dayState[section.key] ?? []).filter((itemKey) => visibleKeys.has(String(itemKey))).length;
          return { label: section.label, done, total: items.length };
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
    const totals = routineSections.reduce(
      (result, section) => {
        const items = getPersonalizedItems(section, date);
        const visibleKeys = new Set(items.map((item) => item.key));
        const done = (dayState[section.key] ?? []).filter((itemKey) => visibleKeys.has(String(itemKey))).length;
        return { done: result.done + done, total: result.total + items.length };
      },
      { done: 0, total: 0 }
    );

    return {
      date: key,
      label: formatShortDate(date),
      shortLabel: new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", ""),
      done: totals.done,
      total: totals.total,
      pct: totals.total ? Math.round((totals.done / totals.total) * 100) : 0
    };
  }

  async function sendTelegramReport(period: TelegramReportPeriod, automatic = false) {
    if (todayKey() < progressTrackingStartDate) {
      setTelegramMessage("Os relatórios começam em 15 de junho de 2026.");
      return false;
    }
    if (telegramSendingInProgress.current) return false;
    telegramSendingInProgress.current = true;
    setTelegramSending(period);
    if (!automatic) setTelegramMessage("");

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

    try {
      const response = await fetch("/api/routine-sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot)
      });
      const payload = (await response.json()) as { configured?: boolean; message?: string };
      if (!payload.configured) {
        setSyncMessage("Sincronização local ativa.");
        return false;
      }
      if (!response.ok) throw new Error(payload.message ?? "Não consegui sincronizar.");
      lastRoutineSyncAt.current = snapshot.updatedAt;
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

      const nextSnapshot = mergeLocal ? mergeSyncSnapshots(buildLocalSyncSnapshot(), remote) : remote;
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

      if (mergeLocal) await saveRoutineSyncSnapshot(nextSnapshot);
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
            {routineSections.map((section) => {
              const visibleItems = getPersonalizedItems(section);
              const visibleKeys = new Set(visibleItems.map((item) => item.key));
              const done = (state[section.key] ?? []).filter((key) => visibleKeys.has(String(key))).length;
              const total = visibleItems.length;
              const pct = total ? Math.round((done / total) * 100) : 0;

              return (
                <a key={section.key} href={`#${section.key}`} className="navItem">
                  <RoutineIcon name={section.icon} />
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

            {routineSections.map((section) => {
              const visibleItems = getPersonalizedItems(section);
              const visibleKeys = new Set(visibleItems.map((item) => item.key));
              const doneItems = new Set((state[section.key] ?? []).filter((key) => visibleKeys.has(String(key))).map(String));
              const isOpen = openSections.has(section.key);

              return (
                <RoutineSectionCard
                  key={section.key}
                  section={section}
                  items={visibleItems}
                  doneItems={doneItems}
                  isOpen={isOpen}
                  time={getSectionTime(section.key, section.time)}
                  newItem={newRoutineItems[section.key] ?? ""}
                  onToggleSection={() => toggleSection(section.key)}
                  onToggleItem={(key) => toggleItem(section.key, key)}
                  onDeleteItem={(item) => deleteRoutineItem(section.key, item)}
                  onEditItem={(item, label) => updateRoutineItemLabel(section.key, item.key, label)}
                  onNewItemChange={(value) => setNewRoutineItems((current) => ({ ...current, [section.key]: value }))}
                  onAddItem={() => addRoutineItem(section.key)}
                  onTimeChange={(value) => updateSectionTime(section.key, value)}
                  onClear={() => clearSection(section.key)}
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
