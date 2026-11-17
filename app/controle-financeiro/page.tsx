"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Plus, Trash2, Upload } from "lucide-react";
import { todayKey } from "@/lib/date";
import { readStorageJson } from "@/lib/storage";
import {
  budgetRow, createFinanceMonth, financeStorageKey, investment, investmentBalance, isFinanceData, money,
  rowActualCents, summarizeFinance, validMonth
} from "@/lib/finance";
import type { BudgetRow, FinanceData, FinanceMonth, Investment } from "@/lib/finance";

const initialData: FinanceData = { version: 1, goal: 0, months: {} };
const investmentFields = {
  opening: "Saldo inicial (R$)",
  cdi: "Percentual do CDI (%)",
  contribution: "Aporte efetivo (R$)",
  gross: "Rendimento bruto (R$)",
  taxes: "IR e IOF (R$)",
  withdrawal: "Resgate líquido (R$)"
} satisfies Record<Exclude<keyof Investment, "name">, string>;

function Amount({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>{label}
      <input type="number" min="0" max="1000000000000" step="0.01" inputMode="decimal"
        placeholder="0,00" value={value || ""} onChange={(event) => {
          const number = event.currentTarget.valueAsNumber;
          if (event.currentTarget.value === "") onChange(0);
          else if (Number.isFinite(number) && number >= 0 && number <= 1e12) onChange(number);
        }} />
    </label>
  );
}

function BudgetSection({ title, rows, onChange, month, expense }: {
  title: string;
  rows: BudgetRow[];
  onChange: (rows: BudgetRow[]) => void;
  month: string;
  expense?: boolean;
}) {
  function updateRow(index: number, patch: Partial<BudgetRow>) {
    onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();

  return (
    <section className="financePanel">
      <div className="financeHeading">
        <h2>{title}</h2>
        <button type="button" onClick={() => onChange([...rows, budgetRow()])}><Plus size={16} /> Categoria</button>
      </div>
      <p className="financeHint">O total realizado soma o valor avulso aos lançamentos da categoria.</p>
      {rows.map((row, index) => {
        const actual = rowActualCents(row) / 100;
        const difference = actual - row.planned;
        const percent = row.planned > 0 ? ` (${(difference / row.planned * 100).toFixed(1)}%)` : "";
        return (
          <div className="financeRow" key={index}>
            <div className="financeFields">
              <label>Categoria<input value={row.name} onChange={(event) => updateRow(index, { name: event.target.value })} /></label>
              <Amount label="Previsto (R$)" value={row.planned} onChange={(planned) => updateRow(index, { planned })} />
              <Amount label="Realizado avulso (R$)" value={row.actual} onChange={(actual) => updateRow(index, { actual })} />
              <button type="button" className="financeRemove" aria-label={`Remover ${row.name || "categoria"}`}
                onClick={() => {
                  if (row.transactions.length && !window.confirm("Remover a categoria e seus lançamentos deste mês?")) return;
                  onChange(rows.filter((_, rowIndex) => rowIndex !== index));
                }}><Trash2 size={16} /></button>
            </div>
            <details>
              <summary>
                Realizado {money.format(actual)} · {row.transactions.length} lançamentos
                <span className={expense && difference > 0 ? "financeWarning" : "financeHint"}>
                  {" · Diferença "}{money.format(difference)}{percent}
                </span>
              </summary>
              {row.transactions.map((entry, entryIndex) => {
                function updateEntry(patch: Partial<typeof entry>) {
                  updateRow(index, { transactions: row.transactions.map((item, i) => i === entryIndex ? { ...item, ...patch } : item) });
                }
                return (
                  <div className="financeFields financeTransaction" key={entryIndex}>
                    <label>Data
                      <input type="date" min={`${month}-01`} max={`${month}-${lastDay}`} value={entry.date}
                        onChange={(event) => {
                          if (event.currentTarget.value && event.currentTarget.validity.valid) updateEntry({ date: event.currentTarget.value });
                        }} />
                    </label>
                    <label>Descrição<input value={entry.description} onChange={(event) => updateEntry({ description: event.target.value })} /></label>
                    <Amount label="Valor (R$)" value={entry.amount} onChange={(amount) => updateEntry({ amount })} />
                    <button type="button" className="financeRemove" aria-label="Remover lançamento"
                      onClick={() => updateRow(index, { transactions: row.transactions.filter((_, i) => i !== entryIndex) })}><Trash2 size={16} /></button>
                  </div>
                );
              })}
              <button type="button" onClick={() => {
                const today = todayKey();
                updateRow(index, { transactions: [...row.transactions, {
                  date: today.startsWith(`${month}-`) ? today : `${month}-01`, description: "", amount: 0
                }] });
              }}><Plus size={16} /> Lançamento</button>
            </details>
          </div>
        );
      })}
    </section>
  );
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [month, setMonth] = useState("");
  const [monthInput, setMonthInput] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const stored = readStorageJson<unknown>(financeStorageKey, null);
    const current = isFinanceData(stored) ? stored : initialData;
    setData(current);
    const thisMonth = todayKey().slice(0, 7);
    const initialMonth = current.months[thisMonth] ? thisMonth : Object.keys(current.months).sort().pop() ?? thisMonth;
    setMonth(initialMonth);
    setMonthInput(initialMonth);
    if (stored !== null && !isFinanceData(stored)) setStatus("Os dados salvos estão em um formato inválido.");
  }, []);

  if (!data) return <main className="financePage"><p role="status">Carregando controle financeiro…</p></main>;

  const priorMonth = Object.keys(data.months).sort().filter((key) => key < month).pop();
  const savedMonth = data.months[month];
  const selected = savedMonth ?? createFinanceMonth(priorMonth ? data.months[priorMonth] : undefined);
  const summary = summarizeFinance(selected);
  const history = Object.entries(data.months).sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => ({ month: key, ...summarizeFinance(value) }));
  const maximumPortfolio = Math.max(1, ...history.map((entry) => entry.portfolio));
  const goalProgress = data.goal ? Math.max(0, summary.portfolio / data.goal * 100) : 0;
  const expenseBars = selected.expenses.map((row) => ({ name: row.name || "Sem nome", amount: rowActualCents(row) / 100 }))
    .filter((row) => row.amount > 0);

  const currentData = data;

  function selectMonth(key: string) {
    setMonth(key);
    setMonthInput(key);
  }

  function save(next: FinanceData, message = "") {
    setData(next);
    try {
      localStorage.setItem(financeStorageKey, JSON.stringify(next));
      setStatus(message);
    } catch {
      setStatus("O navegador não conseguiu salvar as alterações. Exporte um backup para guardar os dados.");
    }
  }

  function update(patch: Partial<FinanceMonth>) {
    save({ ...currentData, months: { ...currentData.months, [month]: { ...selected, ...patch } } });
  }

  function exportCsv() {
    const decimal = new Intl.NumberFormat("pt-BR", { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const rows = history.map((entry) => [
      entry.month, entry.plannedIncome, entry.income, entry.plannedExpenses, entry.expenses,
      entry.plannedFree, entry.free, entry.contributions, entry.netYield, entry.withdrawals, entry.portfolio
    ].map((value) => typeof value === "number" ? decimal.format(value) : value).join(";"));
    download("controle-financeiro-resumo.csv", "\uFEFF" + [
      "Mês;Receita prevista;Receita recebida;Despesas previstas;Despesas realizadas;Saldo livre previsto;Saldo livre realizado;Aportes;Rendimento líquido;Resgates;Patrimônio",
      ...rows
    ].join("\r\n"), "text/csv;charset=utf-8");
  }

  return (
    <main className="financePage">
      <Link className="financeBack" href="/"><ArrowLeft size={16} /> Minha rotina</Link>
      <header className="financeHeading financeTitle">
        <div>
          <h1>Controle financeiro</h1>
          <p className="financeHint">Seus dados ficam neste navegador. Exporte um backup para transferi-los ou guardá-los.</p>
        </div>
        <label>Mês de referência
          <input type="month" value={monthInput} placeholder="AAAA-MM" onBlur={() => setMonthInput(month)} onChange={(event) => {
            const key = event.target.value;
            setMonthInput(key);
            if (validMonth(key)) setMonth(key);
          }} />
        </label>
      </header>

      {!savedMonth && (
        <div className="financeHeading financePanel">
          <p>{priorMonth ? `O orçamento de ${priorMonth} está disponível como base para este mês.` : "Preencha os valores do seu planejamento para começar."}</p>
          <button type="button" onClick={() => update({})}>Salvar mês</button>
        </div>
      )}
      <section className="financeCards" aria-label="Resumo do mês">
        {[
          ["Receitas", summary.income, `Previsto ${money.format(summary.plannedIncome)}`],
          ["Despesas", summary.expenses, `Previsto ${money.format(summary.plannedExpenses)}`],
          ["Saldo antes dos aportes", summary.beforeContributions, ""],
          ["Aportes", summary.contributions, `Previsto ${money.format(selected.plannedContribution)}`],
          ["Saldo livre", summary.free, `Previsto ${money.format(summary.plannedFree)}`],
          ["Patrimônio investido", summary.portfolio, data.goal ? `Faltam ${money.format(Math.max(0, data.goal - summary.portfolio))} para a meta` : ""]
        ].map(([label, value, hint]) => (
          <div className="financePanel financeCard" key={label}>
            <span>{label}</span><strong className={Number(value) < 0 ? "financeWarning" : ""}>{money.format(Number(value))}</strong>
            {hint && <small>{hint}</small>}
          </div>
        ))}
      </section>
      {(summary.free < 0 || summary.plannedFree < 0 || summary.expenseDifference > 0) && (
        <div className="financePanel financeWarning" role="status">
          {summary.plannedFree < 0 && <p>O orçamento previsto fecha com saldo negativo.</p>}
          {summary.free < 0 && <p>O saldo livre realizado está negativo.</p>}
          {summary.expenseDifference > 0 && <p>As despesas realizadas passaram do previsto em {money.format(summary.expenseDifference)}.</p>}
        </div>
      )}

      <BudgetSection key={month + "-income"} title="Entradas" month={month} rows={selected.income}
        onChange={(income) => update({ income })} />
      <BudgetSection key={month + "-expenses"} title="Despesas" month={month} rows={selected.expenses} expense
        onChange={(expenses) => update({ expenses })} />

      <section className="financePanel">
        <div className="financeHeading">
          <h2>Investimentos e aportes</h2>
          <button type="button" onClick={() => update({ investments: [...selected.investments, investment()] })}><Plus size={16} /> Aplicação</button>
        </div>
        <div className="financeFields">
          <Amount label="Meta patrimonial (R$)" value={data.goal} onChange={(goal) => save({ ...data, goal })} />
          <Amount label="Aporte previsto (R$)" value={selected.plannedContribution} onChange={(plannedContribution) => update({ plannedContribution })} />
          <Amount label="Rendimento líquido estimado (R$)" value={selected.estimatedYield} onChange={(estimatedYield) => update({ estimatedYield })} />
          <label>Uso dos rendimentos
            <select value={selected.useWithdrawals ? "cash" : "reinvest"}
              onChange={(event) => update({ useWithdrawals: event.target.value === "cash" })}>
              <option value="reinvest">Reinvestir</option>
              <option value="cash">Usar resgates nas contas</option>
            </select>
          </label>
        </div>
        {data.goal > 0 && (
          <div className="financeGoal">
            <span>Progresso da meta · {goalProgress.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
            <progress aria-label="Progresso da meta patrimonial" max={100} value={Math.min(100, goalProgress)} />
          </div>
        )}
        <p className="financeHint">
          Bruto {money.format(summary.grossYield)} · Líquido contabilizado {money.format(summary.netYield)} · Resgatado {money.format(summary.withdrawals)}
        </p>
        {selected.investments.map((item, index) => (
          <div className="financeRow" key={index}>
            <div className="financeHeading">
              <label>Aplicação<input value={item.name} onChange={(event) => {
                const name = event.target.value;
                update({ investments: selected.investments.map((entry, i) => i === index ? { ...entry, name } : entry) });
              }} /></label>
              <button type="button" className="financeRemove" aria-label={`Remover ${item.name || "aplicação"}`}
                onClick={() => {
                  if (window.confirm("Remover esta aplicação do mês?")) {
                    update({ investments: selected.investments.filter((_, i) => i !== index) });
                  }
                }}><Trash2 size={16} /></button>
            </div>
            <div className="financeFields">
              {(Object.keys(investmentFields) as Array<keyof typeof investmentFields>).map((field) => (
                <Amount key={field} label={investmentFields[field]} value={item[field]} onChange={(value) =>
                  update({ investments: selected.investments.map((entry, i) => i === index ? { ...entry, [field]: value } : entry) })} />
              ))}
            </div>
            <span className={investmentBalance(item) < 0 ? "financeWarning" : "financeHint"}>Saldo final {money.format(investmentBalance(item))}</span>
          </div>
        ))}
      </section>

      <section className="financePanel">
        <h2>Despesas por categoria</h2>
        {expenseBars.length ? expenseBars.map((row, index) => (
          <div className="financeBar" key={index}>
            <span>{row.name}</span>
            <meter aria-label={row.name} min={0} max={summary.expenses} value={row.amount} />
            <span>{money.format(row.amount)}</span>
          </div>
        )) : <p className="financeHint">Adicione despesas realizadas para ver a distribuição.</p>}
      </section>

      <section className="financePanel">
        <h2>Histórico mensal</h2>
        {history.length ? (
          <div className="financeTable">
            <table>
              <thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Aportes</th><th>Saldo livre previsto</th><th>Saldo livre realizado</th><th>Patrimônio</th></tr></thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.month}>
                    <th scope="row"><button type="button" aria-label={`Abrir mês ${entry.month}`} onClick={() => {
                      selectMonth(entry.month);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}>{entry.month}</button></th>
                    <td>{money.format(entry.income)}</td><td>{money.format(entry.expenses)}</td>
                    <td>{money.format(entry.contributions)}</td><td>{money.format(entry.plannedFree)}</td>
                    <td>{money.format(entry.free)}</td>
                    <td>
                      {money.format(entry.portfolio)}
                      <meter aria-label={`Patrimônio em ${entry.month}`} min={0} max={maximumPortfolio} value={Math.max(0, entry.portfolio)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="financeHint">Os meses salvos aparecem aqui.</p>}
      </section>

      <section className="financePanel">
        <h2>Backup</h2>
        <div className="financeActions">
          <button type="button" onClick={() => download("controle-financeiro.json", JSON.stringify(data, null, 2), "application/json")}>
            <Download size={16} /> Exportar JSON
          </button>
          <button type="button" disabled={!history.length} onClick={exportCsv}><Download size={16} /> Resumo CSV</button>
          <label className="financeImport">
            <Upload size={16} /> Importar JSON
            <input type="file" accept=".json,application/json" onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!file) return;
              try {
                const imported: unknown = JSON.parse(await file.text());
                if (!isFinanceData(imported)) throw new Error("Formato inválido");
                if (!window.confirm("Substituir os dados financeiros deste navegador pelo conteúdo do backup?")) return;
                save(imported, "Backup importado.");
                selectMonth(Object.keys(imported.months).sort().pop() ?? todayKey().slice(0, 7));
              } catch {
                setStatus("Arquivo inválido. Selecione um backup JSON exportado pelo controle financeiro.");
              }
            }} />
          </label>
        </div>
        <p role="status" className="financeHint">{status}</p>
      </section>
    </main>
  );
}
