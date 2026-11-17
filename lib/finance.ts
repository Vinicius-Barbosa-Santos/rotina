export type Transaction = { date: string; description: string; amount: number };
export type BudgetRow = {
  name: string;
  planned: number;
  actual: number;
  transactions: Transaction[];
};
export type Investment = {
  name: string;
  opening: number;
  cdi: number;
  contribution: number;
  gross: number;
  taxes: number;
  withdrawal: number;
};
export type FinanceMonth = {
  income: BudgetRow[];
  expenses: BudgetRow[];
  investments: Investment[];
  plannedContribution: number;
  estimatedYield: number;
  useWithdrawals: boolean;
};
export type FinanceData = { version: 1; goal: number; months: Record<string, FinanceMonth> };

export const financeStorageKey = "rotina_finance_v1";
export const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const validMonth = (month: string) => /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month);
const cents = (value: number) => Math.round(value * 100);

export function budgetRow(name = ""): BudgetRow {
  return { name, planned: 0, actual: 0, transactions: [] };
}

export function investment(name = ""): Investment {
  return { name, opening: 0, cdi: 0, contribution: 0, gross: 0, taxes: 0, withdrawal: 0 };
}

function closingCents(item: Investment) {
  return cents(item.opening) + cents(item.contribution) + cents(item.gross)
    - cents(item.taxes) - cents(item.withdrawal);
}

export function investmentBalance(item: Investment) {
  return closingCents(item) / 100;
}

export function createFinanceMonth(previous?: FinanceMonth): FinanceMonth {
  if (previous) {
    const copyPlan = (row: BudgetRow) => ({ ...row, actual: 0, transactions: [] });
    return {
      ...previous,
      income: previous.income.map(copyPlan),
      expenses: previous.expenses.map(copyPlan),
      investments: previous.investments.map((item) => ({
        ...investment(item.name), opening: Math.max(0, investmentBalance(item)), cdi: item.cdi
      }))
    };
  }

  return {
    income: [budgetRow("Renda PJ"), budgetRow("Renda extra")],
    expenses: ["Aluguel", "Energia", "Internet", "Supermercado", "Lazer", "Cursos e gastos pessoais", "Academia"]
      .map(budgetRow),
    investments: [],
    plannedContribution: 0,
    estimatedYield: 0,
    useWithdrawals: false
  };
}

export function rowActualCents(row: BudgetRow) {
  return row.transactions.reduce((total, entry) => total + cents(entry.amount), cents(row.actual));
}

export function summarizeFinance(month: FinanceMonth) {
  const plannedIncome = month.income.reduce((sum, row) => sum + cents(row.planned), 0);
  const plannedExpenses = month.expenses.reduce((sum, row) => sum + cents(row.planned), 0);
  const income = month.income.reduce((sum, row) => sum + rowActualCents(row), 0);
  const expenses = month.expenses.reduce((sum, row) => sum + rowActualCents(row), 0);
  const portfolio = month.investments.reduce((sum, item) => sum + closingCents(item), 0);
  const contributions = month.investments.reduce((sum, item) => sum + cents(item.contribution), 0);
  const withdrawals = month.investments.reduce((sum, item) => sum + cents(item.withdrawal), 0);
  const grossYield = month.investments.reduce((sum, item) => sum + cents(item.gross), 0);
  const netYield = grossYield - month.investments.reduce((sum, item) => sum + cents(item.taxes), 0);
  const beforeContributions = income + (month.useWithdrawals ? withdrawals : 0) - expenses;
  const plannedFree = plannedIncome + (month.useWithdrawals ? cents(month.estimatedYield) : 0)
    - plannedExpenses - cents(month.plannedContribution);

  return {
    plannedIncome: plannedIncome / 100, plannedExpenses: plannedExpenses / 100,
    income: income / 100, expenses: expenses / 100, portfolio: portfolio / 100,
    contributions: contributions / 100, withdrawals: withdrawals / 100,
    grossYield: grossYield / 100, netYield: netYield / 100,
    beforeContributions: beforeContributions / 100,
    free: (beforeContributions - contributions) / 100, plannedFree: plannedFree / 100,
    expenseDifference: (expenses - plannedExpenses) / 100
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1e12;

function validTransaction(value: unknown, month: string) {
  if (!isRecord(value) || typeof value.date !== "string" || typeof value.description !== "string"
    || !isAmount(value.amount) || !new RegExp(`^${month}-\\d{2}$`).test(value.date)) return false;
  const date = new Date(`${value.date}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value.date;
}

function validRows(value: unknown, month: string) {
  return Array.isArray(value) && value.every((row) => isRecord(row)
    && typeof row.name === "string" && isAmount(row.planned) && isAmount(row.actual)
    && Array.isArray(row.transactions) && row.transactions.every((entry) => validTransaction(entry, month)));
}

function validInvestment(value: unknown) {
  return isRecord(value) && typeof value.name === "string"
    && ["opening", "cdi", "contribution", "gross", "taxes", "withdrawal"].every((field) => isAmount(value[field]));
}

export function isFinanceData(value: unknown): value is FinanceData {
  if (!isRecord(value) || value.version !== 1 || !isAmount(value.goal) || !isRecord(value.months)) return false;

  return Object.entries(value.months).every(([key, month]) => validMonth(key) && isRecord(month)
    && typeof month.useWithdrawals === "boolean" && isAmount(month.plannedContribution) && isAmount(month.estimatedYield)
    && validRows(month.income, key) && validRows(month.expenses, key)
    && Array.isArray(month.investments) && month.investments.every(validInvestment));
}
