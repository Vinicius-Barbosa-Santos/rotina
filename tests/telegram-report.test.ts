import assert from "node:assert/strict";
import test from "node:test";
import { formatTelegramReport, isRoutineReport } from "../lib/telegram-report.ts";

test("formats a daily Telegram report with section progress", () => {
  const message = formatTelegramReport({
    period: "daily",
    streak: 4,
    generatedAt: "2026-06-14T23:00:00.000Z",
    days: [
      {
        date: "2026-06-14",
        done: 3,
        total: 4,
        sections: [{ label: "Inglês", done: 3, total: 4 }]
      }
    ]
  });

  assert.match(message, /Relatório diário/);
  assert.match(message, /3 de 4 tarefas concluídas \(75%\)/);
  assert.match(message, /Inglês: 3\/4/);
  assert.match(message, /Streak atual: 4 dias/);
});

test("formats an aggregated weekly Telegram report", () => {
  const message = formatTelegramReport({
    period: "weekly",
    streak: 1,
    generatedAt: "2026-06-14T23:00:00.000Z",
    days: [
      {
        date: "2026-06-13",
        done: 2,
        total: 2,
        sections: [{ label: "Saúde", done: 2, total: 2 }]
      },
      {
        date: "2026-06-14",
        done: 1,
        total: 2,
        sections: [{ label: "Saúde", done: 1, total: 2 }]
      }
    ]
  });

  assert.match(message, /Relatório semanal/);
  assert.match(message, /3 de 4 tarefas concluídas \(75%\)/);
  assert.match(message, /1 dia com a rotina completa/);
  assert.match(message, /Saúde: 3\/4 \(75%\)/);
});

test("rejects malformed Telegram reports", () => {
  assert.equal(
    isRoutineReport({
      period: "daily",
      streak: 1,
      generatedAt: "2026-06-14T23:00:00.000Z",
      days: [{ date: "invalid", done: 10, total: 2, sections: [] }]
    }),
    false
  );
});
