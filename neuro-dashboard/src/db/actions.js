import { db } from './db.js';

export async function upsertMonthlySalary(year, month, amount) {
  const existing = await db.monthlySalaries.where({ year, month }).first();
  if (existing) {
    await db.monthlySalaries.update(existing.id, { amount });
    return existing.id;
  }
  return db.monthlySalaries.add({ year, month, amount });
}

export async function upsertFixedPercentages(year, month, fields) {
  const existing = await db.fixedPercentages.where({ year, month }).first();
  if (existing) {
    await db.fixedPercentages.update(existing.id, fields);
    return existing.id;
  }
  return db.fixedPercentages.add({ year, month, ...fields });
}

export function deleteFixedPercentages(id) {
  return db.fixedPercentages.delete(id);
}

// One-time historical salary seed, as specified by the user:
//   1/4/2023 - 31/3/2025 -> $2500/month
//   1/4/2025 - 31/3/2026 -> $3000/month
//   1/4/2026 - current month -> $3500/month
// Runs automatically once (guarded by an appMeta flag) and never overwrites
// a month that already has a value, so it is always safe to re-run.
const HISTORICAL_SALARY_PLAN = [
  { from: { year: 2023, month: 4 }, to: { year: 2025, month: 3 }, amount: 2500 },
  { from: { year: 2025, month: 4 }, to: { year: 2026, month: 3 }, amount: 3000 },
  { from: { year: 2026, month: 4 }, to: null, amount: 3500 }
];

export async function seedHistoricalSalaryIfNeeded() {
  const already = await getAppMeta('seededHistoricalSalary', false);
  if (already) return false;

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  for (const plan of HISTORICAL_SALARY_PLAN) {
    let y = plan.from.year;
    let m = plan.from.month;
    const toY = plan.to ? plan.to.year : curYear;
    const toM = plan.to ? plan.to.month : curMonth;
    while (y < toY || (y === toY && m <= toM)) {
      const existing = await db.monthlySalaries.where({ year: y, month: m }).first();
      if (!existing) {
        await db.monthlySalaries.add({ year: y, month: m, amount: plan.amount });
      }
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  }

  await setAppMeta('seededHistoricalSalary', true);
  return true;
}

export async function upsertOnCallDay(date, hospital, amount) {
  const existing = await db.onCallEntries
    .where({ date, hospital })
    .filter((e) => !e.isBulk)
    .first();
  const num = Number(amount) || 0;
  if (num === 0) {
    if (existing) await db.onCallEntries.delete(existing.id);
    return null;
  }
  if (existing) {
    await db.onCallEntries.update(existing.id, { amount: num });
    return existing.id;
  }
  return db.onCallEntries.add({ date, hospital, amount: num, isBulk: false });
}

export function addOnCallEntry(entry) {
  return db.onCallEntries.add(entry);
}

export function deleteOnCallEntry(id) {
  return db.onCallEntries.delete(id);
}

export function addMedicationEntry(entry) {
  return db.medicationEntries.add(entry);
}

export function deleteMedicationEntry(id) {
  return db.medicationEntries.delete(id);
}

export async function addOperation(entry) {
  if (entry.operationType) await ensureOperationType(entry.operationType);
  return db.operations.add(entry);
}

export function deleteOperation(id) {
  return db.operations.delete(id);
}

export async function ensureOperationType(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = await db.operationTypes.where('name').equalsIgnoreCase(trimmed).first();
  if (!existing) {
    await db.operationTypes.add({ name: trimmed });
  }
}

export function deleteOperationType(id) {
  return db.operationTypes.delete(id);
}

export async function clearAllData() {
  const tables = [
    'monthlySalaries', 'onCallEntries', 'medicationEntries', 'fixedPercentages',
    'operations', 'operationTypes', 'leavePeriods', 'appMeta'
  ];
  await db.transaction('rw', tables, async () => {
    for (const t of tables) await db.table(t).clear();
  });
}

export function addLeavePeriod(period) {
  return db.leavePeriods.add(period);
}

export function deleteLeavePeriod(id) {
  return db.leavePeriods.delete(id);
}

export async function setAppMeta(key, value) {
  const existing = await db.appMeta.where('key').equals(key).first();
  if (existing) {
    await db.appMeta.update(existing.id, { value });
  } else {
    await db.appMeta.add({ key, value });
  }
}

export async function getAppMeta(key, fallback = null) {
  const row = await db.appMeta.where('key').equals(key).first();
  return row ? row.value : fallback;
}
