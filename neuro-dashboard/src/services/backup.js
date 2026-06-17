import { db } from '../db/db.js';
import { encryptJSON, decryptJSON } from '../utils/encryption.js';

const TABLES = [
  'monthlySalaries',
  'onCallEntries',
  'medicationEntries',
  'fixedPercentages',
  'operations',
  'operationTypes',
  'leavePeriods',
  'appMeta'
];

export async function collectAllData() {
  const data = {};
  for (const table of TABLES) {
    data[table] = await db.table(table).toArray();
  }
  data.exportedAt = new Date().toISOString();
  return data;
}

export async function restoreAllData(data) {
  await db.transaction('rw', TABLES, async () => {
    for (const table of TABLES) {
      await db.table(table).clear();
      if (Array.isArray(data[table]) && data[table].length) {
        // strip auto-increment ids so Dexie regenerates clean primary keys
        const rows = data[table].map(({ id, ...rest }) => rest);
        await db.table(table).bulkAdd(rows);
      }
    }
  });
}

export async function buildEncryptedBackup(passphrase) {
  const data = await collectAllData();
  return encryptJSON(data, passphrase);
}

export async function readEncryptedBackup(payload, passphrase) {
  return decryptJSON(payload, passphrase);
}

export function downloadBackupFile(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `neuro-finance-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function readFileAsJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (e) {
        reject(new Error('الملف ليس بصيغة JSON صالحة'));
      }
    };
    reader.onerror = () => reject(new Error('تعذرت قراءة الملف'));
    reader.readAsText(file);
  });
}
