import assert from "node:assert/strict";
import test from "node:test";
import {
  getSectionScheduleLabel,
  getVisibleItems,
  routineReferenceSections,
  routineSections,
  trackedRoutineSections,
  type RoutineSection,
} from "../lib/routine.ts";

const section: RoutineSection = {
  key: "test",
  label: "Teste",
  shortLabel: "Teste",
  icon: "Target",
  color: "#fff",
  bg: "#000",
  time: "09:00-10:00",
  days: [1, 2, 3, 4, 5],
  items: [{ label: "Todo dia útil" }, { label: "Somente sexta", days: [5] }],
};

test("getVisibleItems respects section and item weekdays", () => {
  assert.deepEqual(
    getVisibleItems(section, new Date(2026, 5, 12)).map(
      ({ item }) => item.label,
    ),
    ["Todo dia útil", "Somente sexta"],
  );
  assert.deepEqual(getVisibleItems(section, new Date(2026, 5, 13)), []);
});

test("getSectionScheduleLabel describes weekdays", () => {
  assert.equal(getSectionScheduleLabel(section), "segunda a sexta");
});

test("tracked routine is displayed in chronological order", () => {
  const weekdaySections = trackedRoutineSections.filter((item) => item.days?.includes(1));
  const workIndex = weekdaySections.findIndex((item) => item.key === "work");
  const breakfastIndex = weekdaySections.findIndex((item) => item.key === "personal");
  const englishIndex = weekdaySections.findIndex((item) => item.key === "english");
  const technicalStudyIndex = weekdaySections.findIndex((item) => item.key === "technical-study");
  const cleaningIndex = weekdaySections.findIndex((item) => item.key === "house-cleaning");
  const growthIndex = weekdaySections.findIndex((item) => item.key === "growth");
  const projectsIndex = weekdaySections.findIndex((item) => item.key === "projects-meetings");
  const transitionIndex = weekdaySections.findIndex((item) => item.key === "transition");
  const codersIndex = weekdaySections.findIndex((item) => item.key === "programming-study");
  const gymIndex = weekdaySections.findIndex((item) => item.key === "health");
  const eveningIndex = weekdaySections.findIndex((item) => item.key === "evening");
  const sleepIndex = weekdaySections.findIndex((item) => item.key === "sleep");

  assert.equal(workIndex, 0);
  assert.ok(workIndex < breakfastIndex);
  assert.ok(breakfastIndex < englishIndex);
  assert.ok(englishIndex < technicalStudyIndex);
  assert.ok(technicalStudyIndex < cleaningIndex);
  assert.ok(cleaningIndex < growthIndex);
  assert.ok(growthIndex < projectsIndex);
  assert.ok(projectsIndex < transitionIndex);
  assert.ok(transitionIndex < codersIndex);
  assert.ok(codersIndex < gymIndex);
  assert.ok(gymIndex < eveningIndex);
  assert.ok(eveningIndex < sleepIndex);
});

test("weekday work runs from 03:00 to 07:00", () => {
  const programming = routineSections.find((item) => item.key === "work");

  assert.ok(programming);
  assert.equal(programming.label, "Programação");
  assert.equal(programming.time, "03:00-07:00");
  assert.deepEqual(
    programming.items.map((item) => item.label).slice(0, 5),
    [
      "Daily técnica",
      "Priorizar tasks do sprint",
      "Implementar feature ou correção",
      "Revisar pull requests",
      "Escrever ou ajustar testes",
    ],
  );
});

test("English habits count toward progress while the complete guide remains below", () => {
  const english = routineSections.find((item) => item.key === "english");

  assert.ok(english);
  assert.equal(english.label, "Inglês");
  assert.equal(english.guideLabel, "Guia de Inglês");
  assert.equal(getSectionScheduleLabel(english), "segunda a sexta");
  assert.deepEqual(
    getVisibleItems(english, new Date(2026, 5, 22)).map(({ item }) => item.label),
    ["Duolingo", "Leitura em inglês", "Vocabulário", "Conversação", "Listening"],
  );
  assert.ok(english.referenceGroups?.some((group) => group.title === "Present Simple e Present Continuous"));
  assert.ok(english.referenceGroups?.some((group) => group.title === "Inglês para desenvolvimento de software"));
  assert.equal(trackedRoutineSections.some((section) => section.key === english.key), true);
  assert.equal(routineReferenceSections.some((section) => section.key === english.key), false);
  const englishGuide = routineReferenceSections.find((section) => section.key === "english-guide");
  assert.ok(englishGuide);
  assert.equal(englishGuide.label, "Guia de Inglês");
  assert.equal(getSectionScheduleLabel(englishGuide), "referência");
  assert.equal(englishGuide.referenceGroups, english.referenceGroups);
});

test("developer curriculum is a permanent guide and does not count toward routine progress", () => {
  const career = routineSections.find((item) => item.key === "career");

  assert.ok(career);
  assert.equal(career.label, "Guia do Desenvolvedor");
  assert.equal(getSectionScheduleLabel(career), "referência");
  assert.deepEqual(getVisibleItems(career, new Date(2026, 5, 25)), []);
  assert.ok(career.referenceGroups?.some((group) => group.title === "Frontend com React"));
  assert.ok(career.referenceGroups?.some((group) => group.title === "Backend com Spring"));
  assert.ok(career.referenceGroups?.some((group) => group.title === "System design e sistemas distribuídos"));
  assert.equal(trackedRoutineSections.some((section) => section.key === career.key), false);
  assert.equal(routineReferenceSections.some((section) => section.key === career.key), true);
});

test("Coders is a tracked technical English course at 17:00", () => {
  const study = routineSections.find((item) => item.key === "programming-study");

  assert.ok(study);
  assert.equal(study.label, "Coders — Inglês Técnico");
  assert.equal(study.time, "17:00-18:00");
  assert.equal(getSectionScheduleLabel(study), "segunda a sexta");
  assert.deepEqual(
    getVisibleItems(study, new Date(2026, 6, 22)).map(({ item }) => item.label),
    [
      "Assistir à aula diária do curso Coders",
      "Anotar e fichar novos termos de vocabulário técnico",
      "Praticar pronúncia e simular contextos técnicos de trabalho",
    ],
  );
  assert.equal(trackedRoutineSections.some((section) => section.key === study.key), true);
  assert.equal(routineReferenceSections.some((section) => section.key === study.key), false);
});

test("house cleaning is distributed from Monday to Friday", () => {
  const cleaning = routineSections.find((item) => item.key === "house-cleaning");

  assert.ok(cleaning);
  assert.equal(cleaning.label, "Limpeza da Casa");
  assert.equal(cleaning.time, "11:00-12:30");
  assert.deepEqual(
    getVisibleItems(cleaning, new Date(2026, 5, 22)).map(({ item }) => item.label),
    [
      "Manutenção diária: guardar o que está fora do lugar (10 min)",
      "Manutenção diária: lavar louça e limpar pia e bancada",
      "Segunda — Cozinha: fogão, mesa, geladeira por fora e lixo",
    ],
  );
  assert.deepEqual(
    getVisibleItems(cleaning, new Date(2026, 5, 26)).map(({ item }) => item.label),
    [
      "Manutenção diária: guardar o que está fora do lugar (10 min)",
      "Manutenção diária: lavar louça e limpar pia e bancada",
      "Sexta — Pisos, roupa de cama e revisão geral da casa",
    ],
  );
});

test("gym routine alternates muscle groups, cardio and recovery", () => {
  const health = routineSections.find((item) => item.key === "health");

  assert.ok(health);
  assert.equal(health.label, "Academia");
  assert.equal(health.time, "18:00-20:30");
  assert.match(health.note ?? "", /baixo impacto/i);
  assert.ok(getVisibleItems(health, new Date(2026, 5, 22)).some(({ item }) => item.label.includes("Peito")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 23)).some(({ item }) => item.label.includes("Costas")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 24)).some(({ item }) => item.label.includes("Cardio de baixo impacto")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 25)).some(({ item }) => item.label.includes("Glúteos")));
  assert.ok(getVisibleItems(health, new Date(2026, 5, 26)).some(({ item }) => item.label.includes("Ombros")));
});

test("growth combines lunch, recovery and three daily classes", () => {
  const growth = routineSections.find((item) => item.key === "growth");

  assert.ok(growth);
  assert.equal(growth.time, "12:30-14:00");
  assert.deepEqual(
    getVisibleItems(growth, new Date(2026, 5, 22)).map(({ item }) => item.label),
    [
      "Almoçar com tranquilidade",
      "Descansar e desacelerar após a refeição",
      "Assistir a uma aula de YouTube e criação de conteúdo",
      "Assistir a uma aula de investimentos e finanças pessoais",
      "Assistir a uma aula de marketing digital e posicionamento",
    ],
  );
});

test("optimized routine includes dedicated study, projects, transition, evening and sleep blocks", () => {
  const expectedTimes = {
    "technical-study": "09:00-11:00",
    "projects-meetings": "14:00-16:30",
    transition: "16:30-17:00",
    evening: "20:30-21:30",
    sleep: "21:30-03:00",
  };

  for (const [key, time] of Object.entries(expectedTimes)) {
    const section = trackedRoutineSections.find((item) => item.key === key);
    assert.ok(section);
    assert.equal(section.time, time);
    assert.equal(getSectionScheduleLabel(section), "segunda a sexta");
  }
});

test("active courses are a permanent eight-track guide totaling 430 hours", () => {
  const courses = routineReferenceSections.find((section) => section.key === "active-courses");

  assert.ok(courses);
  assert.equal(getSectionScheduleLabel(courses), "referência");
  assert.equal(courses.referenceGroups?.length, 8);
  assert.match(courses.note ?? "", /430 horas/);
});

test("functional adult section is a permanent, categorized reference guide", () => {
  const functional = routineSections.find((item) => item.key === "functional-life");

  assert.ok(functional);
  assert.equal(functional.label, "Adulto Funcional");
  assert.equal(getSectionScheduleLabel(functional), "referência");
  assert.deepEqual(getVisibleItems(functional, new Date(2026, 5, 23)), []);
  assert.ok(functional.referenceGroups?.some((group) => group.title === "Relacionamentos e convivência"));
  assert.ok(functional.referenceGroups?.some((group) => group.title === "Carro, moto e transporte"));
  assert.ok(functional.referenceGroups?.some((group) => group.title === "Cozinha e alimentação"));
  assert.equal(trackedRoutineSections.some((section) => section.key === functional.key), false);
  assert.equal(routineReferenceSections.some((section) => section.key === functional.key), true);
});

test("removed optional sections are no longer part of the routine", () => {
  for (const key of ["saturday", "finance", "relationships", "sunday-review"]) {
    assert.equal(routineSections.some((item) => item.key === key), false);
  }
});
