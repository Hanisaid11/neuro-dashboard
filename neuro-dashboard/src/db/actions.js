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
