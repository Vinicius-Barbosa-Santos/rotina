import assert from "node:assert/strict";
import test from "node:test";
import { budgetRow, createFinanceMonth, investment, isFinanceData, summarizeFinance } from "../lib/finance.ts";

test("distinguishes planned yield, recorded earnings and withdrawals used as cash", () => {
  const month = createFinanceMonth();
  month.income = [{ ...budgetRow("Receita"), planned: 1000, actual: 950 }];
  month.expenses = [{
    ...budgetRow("Mercado"), planned: 300, actual: 100,
    transactions: [{ date: "2026-11-04", description: "Compras", amount: 230.15 }]
  }];
  month.investments = [{
    ...investment("Caixinha"), opening: 7000, contribution: 200, gross: 80, taxes: 15, withdrawal: 40
  }];
  month.plannedContribution = 250;
  month.estimatedYield = 60;

  const summary = summarizeFinance(month);
  assert.equal(summary.expenseDifference, 30.15);
  assert.equal(summary.beforeContributions, 619.85);
  assert.equal(summary.free, 419.85);
  assert.equal(summary.plannedFree, 450);
  assert.equal(summary.portfolio, 7225);
  assert.equal(summary.netYield, 65);

  const withWithdrawals = summarizeFinance({ ...month, useWithdrawals: true });
  assert.equal(withWithdrawals.free, 459.85);
  assert.equal(withWithdrawals.plannedFree, 510);
  assert.equal(withWithdrawals.portfolio, summary.portfolio);

  const nextMonth = createFinanceMonth(month);
  assert.equal(nextMonth.investments[0].opening, 7225);
  assert.equal(summarizeFinance(nextMonth).free, 0);
  assert.equal(nextMonth.expenses[0].planned, 300);
  assert.deepEqual(nextMonth.expenses[0].transactions, []);
});

test("validates backup data and transaction dates", () => {
  const month = createFinanceMonth();
  const backup = { version: 1, goal: 5000, months: { "2027-02": month } };

  assert.equal(isFinanceData(backup), true);
  assert.equal(isFinanceData({ ...backup, goal: -400 }), false);
  assert.equal(isFinanceData({ ...backup, months: { "2027-13": month } }), false);
  month.expenses[0].transactions.push({ date: "2027-02-29", description: "", amount: 1 });
  assert.equal(isFinanceData(backup), false);
  month.expenses[0].transactions[0].date = "2027-02-28";
  assert.equal(isFinanceData(backup), true);
});
