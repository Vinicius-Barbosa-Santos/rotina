import assert from "node:assert/strict";
import test from "node:test";
import { getSaoPauloHoliday, isSaoPauloHolidayDate } from "../lib/sao-paulo-holidays.ts";

test("identifies São Paulo fixed and moving holidays", () => {
  assert.equal(getSaoPauloHoliday(new Date("2026-01-25T12:00:00-03:00"))?.name, "Aniversário de São Paulo");
  assert.equal(getSaoPauloHoliday(new Date("2026-07-09T12:00:00-03:00"))?.name, "Revolução Constitucionalista");
  assert.equal(getSaoPauloHoliday(new Date("2026-06-04T12:00:00-03:00"))?.name, "Corpus Christi");
  assert.equal(isSaoPauloHolidayDate(new Date("2026-07-10T12:00:00-03:00")), false);
});
