import Dexie from 'dexie';

// ---------------------------------------------------------------------------
// Dexie.js wraps IndexedDB, which lives in the browser/device's own storage
// engine rather than LocalStorage. It survives "clear cache" actions far more
// reliably than LocalStorage and has no realistic size ceiling for this app.
// ---------------------------------------------------------------------------

export const db = new Dexie('NeuroFinanceDB');

db.version(1).stores({
  monthlySalaries: '++id, &[year+month], year',
  onCallEntries: '++id, date, hospital, isBulk',
  medicationEntries: '++id, date, isBulk',
  fixedPercentages: '++id, &[year+month], year',
  operations: '++id, date, operationType, patientName',
  operationTypes: '++id, &name',
  leavePeriods: '++id, startDate, endDate',
  appMeta: '++id, &key'
});

// v2: operations support optional photoBase64
db.version(2).stores({
  monthlySalaries: '++id, &[year+month], year',
  onCallEntries: '++id, date, hospital, isBulk',
  medicationEntries: '++id, date, isBulk',
  fixedPercentages: '++id, &[year+month], year',
  operations: '++id, date, operationType, patientName',
  operationTypes: '++id, &name',
  leavePeriods: '++id, startDate, endDate',
  appMeta: '++id, &key'
});

// v3: fixedPercentages gains note fields (hospitalPctNote etc.)
//     new monthlyPhotos table for per-month photo attachments
db.version(3).stores({
  monthlySalaries: '++id, &[year+month], year',
  onCallEntries: '++id, date, hospital, isBulk',
  medicationEntries: '++id, date, isBulk',
  fixedPercentages: '++id, &[year+month], year',
  operations: '++id, date, operationType, patientName',
  operationTypes: '++id, &name',
  leavePeriods: '++id, startDate, endDate',
  monthlyPhotos: '++id, [year+month]',
  appMeta: '++id, &key'
});

export default db;
