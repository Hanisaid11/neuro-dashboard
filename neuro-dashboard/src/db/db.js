import Dexie from 'dexie';

// ---------------------------------------------------------------------------
// Dexie.js wraps IndexedDB, which lives in the browser/device's own storage
// engine rather than LocalStorage. It survives "clear cache" actions far more
// reliably than LocalStorage and has no realistic size ceiling for this app.
// ---------------------------------------------------------------------------

export const db = new Dexie('NeuroFinanceDB');

db.version(1).stores({
  // one row per (calendar year, calendar month) holding the base salary
  monthlySalaries: '++id, &[year+month], year',

  // daily on-call / consultation entries, split by hospital
  // hospital: 'old' | 'new'
  onCallEntries: '++id, date, hospital, isBulk',

  // نسب أدوية - date + item name + amount, also supports bulk monthly rows
  medicationEntries: '++id, date, isBulk',

  // one row per (year, month) holding the five fixed monthly percentage fields
  fixedPercentages: '++id, &[year+month], year',

  // قسم العمليات
  operations: '++id, date, operationType, patientName',

  // global creatable list of operation types for the smart autocomplete
  operationTypes: '++id, &name',

  // إجازات سنوية / سفر
  leavePeriods: '++id, startDate, endDate',

  // small generic key/value store: google drive file id, last sync time,
  // backup passphrase hint, UI prefs, etc.
  appMeta: '++id, &key'
});

export default db;
