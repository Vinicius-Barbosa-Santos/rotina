import { dateKey } from "./date.ts";

const fixedSaoPauloHolidays: Record<string, string> = {
  "01-01": "Confraternização Universal",
  "01-25": "Aniversário de São Paulo",
  "04-21": "Tiradentes",
  "05-01": "Dia do Trabalho",
  "07-09": "Revolução Constitucionalista",
  "09-07": "Independência do Brasil",
  "10-12": "Nossa Senhora Aparecida",
  "11-02": "Finados",
  "11-15": "Proclamação da República",
  "11-20": "Consciência Negra",
  "12-25": "Natal"
};

export function getSaoPauloHoliday(date: Date) {
  const key = dateKey(date);
  const fixedHoliday = fixedSaoPauloHolidays[key.slice(5)];
  if (fixedHoliday) return { date: key, name: fixedHoliday };

  const movingHolidays = getMovingSaoPauloHolidays(date.getFullYear());
  const movingHoliday = movingHolidays[key];
  return movingHoliday ? { date: key, name: movingHoliday } : undefined;
}

export function isSaoPauloHolidayDate(date: Date) {
  return Boolean(getSaoPauloHoliday(date));
}

function getMovingSaoPauloHolidays(year: number) {
  const easter = getEasterDate(year);

  return {
    [offsetDateKey(easter, -48)]: "Carnaval",
    [offsetDateKey(easter, -47)]: "Carnaval",
    [offsetDateKey(easter, -2)]: "Sexta-feira Santa",
    [offsetDateKey(easter, 60)]: "Corpus Christi"
  };
}

function offsetDateKey(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return dateKey(next);
}

function getEasterDate(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12);
}
