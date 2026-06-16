import "server-only";

type GeminiUsageKind = "chat" | "summary" | "transcribe";

type GeminiUsageData = {
  date: string;
  chat: number;
  summary: number;
  transcribe: number;
  updatedAt: string;
};

const tableName = "routine_sync";
const fallbackWindows = new Map<string, GeminiUsageData>();

export async function recordGeminiUsage(kind: GeminiUsageKind) {
  const limit = getGeminiDailyLimit(kind);
  if (limit <= 0) return { allowed: false, limit, used: 0 };

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return recordFallbackUsage(kind, limit);
  }

  const id = getGeminiUsageId();
  const current = await readUsage(id);
  const used = current[kind];

  if (used >= limit) return { allowed: false, limit, used };

  const next = {
    ...current,
    [kind]: used + 1,
    updatedAt: new Date().toISOString()
  };

  await writeUsage(id, next);
  return { allowed: true, limit, used: next[kind] };
}

export function getGeminiUsageLimitMessage(kind: GeminiUsageKind, limit: number) {
  if (kind === "summary") {
    return `Limite diário de relatórios atingido (${limit}/dia). Volte amanhã para gerar novos relatórios.`;
  }

  if (kind === "transcribe") {
    return `Limite diário de gravações atingido (${limit}/dia). Volte amanhã para praticar por voz.`;
  }

  return `Limite diário de mensagens atingido (${limit}/dia). Volte amanhã para continuar praticando.`;
}

function getGeminiDailyLimit(kind: GeminiUsageKind) {
  const envKey = {
    chat: "GEMINI_DAILY_CHAT_LIMIT",
    summary: "GEMINI_DAILY_SUMMARY_LIMIT",
    transcribe: "GEMINI_DAILY_TRANSCRIPTION_LIMIT"
  }[kind];

  const fallback = kind === "summary" ? 3 : 30;
  const value = Number(process.env[envKey] ?? fallback);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

async function readUsage(id: string): Promise<GeminiUsageData> {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${id}&select=data`, {
    cache: "no-store",
    headers: getSupabaseHeaders(serviceRoleKey)
  });

  if (!response.ok) throw new Error(`Não consegui consultar seu limite diário (${response.status}).`);

  const rows = (await response.json()) as Array<{ data?: Partial<GeminiUsageData> }>;
  return normalizeUsage(rows[0]?.data);
}

async function writeUsage(id: string, data: GeminiUsageData) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?on_conflict=id`, {
    method: "POST",
    headers: {
      ...getSupabaseHeaders(serviceRoleKey),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({ id, data })
  });

  if (!response.ok) throw new Error(`Não consegui atualizar seu limite diário (${response.status}).`);
}

function recordFallbackUsage(kind: GeminiUsageKind, limit: number) {
  const id = getGeminiUsageId();
  const current = fallbackWindows.get(id) ?? normalizeUsage();
  const used = current[kind];

  if (used >= limit) return { allowed: false, limit, used };

  const next = {
    ...current,
    [kind]: used + 1,
    updatedAt: new Date().toISOString()
  };
  fallbackWindows.set(id, next);
  return { allowed: true, limit, used: next[kind] };
}

function getGeminiUsageId() {
  return `${process.env.ROUTINE_SYNC_ID || "vinicius-main"}-gemini-${getLocalDateKey()}`;
}

function normalizeUsage(data?: Partial<GeminiUsageData>): GeminiUsageData {
  return {
    date: getLocalDateKey(),
    chat: toCount(data?.chat),
    summary: toCount(data?.summary),
    transcribe: toCount(data?.transcribe),
    updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : new Date(0).toISOString()
  };
}

function toCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function getSupabaseHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`
  };
}

function getLocalDateKey() {
  const timeZone = process.env.CALENDAR_TIMEZONE || "America/Sao_Paulo";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
