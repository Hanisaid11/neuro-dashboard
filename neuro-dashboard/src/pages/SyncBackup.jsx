import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  KeyRound, UploadCloud, DownloadCloud, FileJson, CloudCog, CheckCircle2,
  AlertTriangle, LogOut, RefreshCw
} from 'lucide-react';
import { db } from '../db/db.js';
import {
  buildEncryptedBackup, readEncryptedBackup, downloadBackupFile, readFileAsJSON, restoreAllData
} from '../services/backup.js';
import { setAppMeta } from '../db/actions.js';
import {
  isGoogleConfigured, requestAccessToken, revokeAccessToken, findBackupFile,
  uploadBackupFile, downloadBackupFile as driveDownload
} from '../services/googleDrive.js';
import { Card, SectionTitle, Field, TextInput, Button, Badge } from '../components/ui/Controls.jsx';

function StatusBanner({ status }) {
  if (!status) return null;
  const isError = status.type === 'error';
  return (
    <div
      className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
        isError ? 'bg-leave-100 text-leave-500' : 'bg-success-100 text-success-500'
      }`}
    >
      {isError ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
      <span>{status.message}</span>
    </div>
  );
}

export default function SyncBackup() {
  const [passphrase, setPassphrase] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const [driveToken, setDriveToken] = useState(null);
  const lastSyncMeta = useLiveQuery(() => db.appMeta.where('key').equals('lastDriveSync').first(), []);

  function requirePassphrase() {
    if (!passphrase || passphrase.length < 4) {
      setStatus({ type: 'error', message: 'أدخل كلمة مرور لا تقل عن 4 أحرف لتشفير/فتح النسخة الاحتياطية' });
      return false;
    }
    return true;
  }

  async function handleExport() {
    if (!requirePassphrase()) return;
    setBusy(true);
    try {
      const payload = await buildEncryptedBackup(passphrase);
      downloadBackupFile(payload, `neuro-finance-backup-${new Date().toISOString().slice(0, 10)}.json`);
      setStatus({ type: 'success', message: 'تم تحميل النسخة الاحتياطية المشفّرة بنجاح' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !requirePassphrase()) return;
    setBusy(true);
    try {
      const raw = await readFileAsJSON(file);
      const data = await readEncryptedBackup(raw, passphrase);
      await restoreAllData(data);
      setStatus({ type: 'success', message: 'تم استعادة البيانات من الملف بنجاح' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleConnectDrive() {
    setBusy(true);
    try {
      const token = await requestAccessToken();
      setDriveToken(token.access_token);
      setStatus({ type: 'success', message: 'تم الاتصال بـ Google Drive بنجاح' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  function handleDisconnectDrive() {
    revokeAccessToken(driveToken);
    setDriveToken(null);
  }

  async function handleUploadToDrive() {
    if (!requirePassphrase()) return;
    setBusy(true);
    try {
      const payload = await buildEncryptedBackup(passphrase);
      const existing = await findBackupFile(driveToken);
      await uploadBackupFile(driveToken, payload, existing?.id);
      await setAppMeta('lastDriveSync', new Date().toISOString());
      setStatus({ type: 'success', message: 'تم رفع النسخة الاحتياطية إلى Google Drive' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleRestoreFromDrive() {
    if (!requirePassphrase()) return;
    setBusy(true);
    try {
      const existing = await findBackupFile(driveToken);
      if (!existing) throw new Error('لا توجد نسخة احتياطية محفوظة على Google Drive بعد');
      const raw = await driveDownload(driveToken, existing.id);
      const data = await readEncryptedBackup(raw, passphrase);
      await restoreAllData(data);
      setStatus({ type: 'success', message: 'تم استرجاع البيانات من Google Drive بنجاح' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">المزامنة والنسخ الاحتياطي</h1>
        <p className="text-sm text-muted mt-0.5">البيانات محفوظة على جهازك عبر Dexie/IndexedDB، ويمكنك تأمينها بنسخة مشفّرة محلية أو على Google Drive</p>
      </div>

      <StatusBanner status={status} />

      <Card>
        <SectionTitle icon={KeyRound} title="كلمة مرور التشفير" subtitle="تُستخدم لتشفير وفتح كل النسخ الاحتياطية" />
        <Field label="كلمة المرور" required hint="احتفظ بها في مكان آمن - بدونها لا يمكن فتح النسخة الاحتياطية">
          <TextInput
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="كلمة مرور قوية"
          />
        </Field>
      </Card>

      <Card>
        <SectionTitle icon={FileJson} title="نسخة احتياطية محلية" subtitle="ملف JSON مشفّر يُحفظ مباشرة على جهازك" />
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} disabled={busy}>
            <DownloadCloud size={16} /> تحميل نسخة احتياطية
          </Button>
          <label className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors px-4 py-2.5 text-sm bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 cursor-pointer">
            <input type="file" accept="application/json" className="hidden" onChange={handleImportFile} disabled={busy} />
            <UploadCloud size={16} /> استيراد من ملف
          </label>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={CloudCog} title="المزامنة مع Google Drive" subtitle="نسخة احتياطية إضافية في حساب Google الخاص بك" />
        {!isGoogleConfigured() ? (
          <div className="bg-canvas rounded-xl p-4 text-sm text-muted">
            لتفعيل هذه الميزة، أضف معرّف Google OAuth الخاص بك (VITE_GOOGLE_CLIENT_ID) في ملف <code className="tnum">.env</code> كما هو مشروح في README.
          </div>
        ) : !driveToken ? (
          <Button onClick={handleConnectDrive} disabled={busy}>
            <CloudCog size={16} /> الاتصال بـ Google Drive
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge tone="success"><CheckCircle2 size={12} /> متصل بـ Google Drive</Badge>
              <button onClick={handleDisconnectDrive} className="text-sm text-muted flex items-center gap-1 hover:text-leave-500">
                <LogOut size={14} /> قطع الاتصال
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleUploadToDrive} disabled={busy}>
                <UploadCloud size={16} /> رفع نسخة الآن
              </Button>
              <Button variant="outline" onClick={handleRestoreFromDrive} disabled={busy}>
                <DownloadCloud size={16} /> استرجاع من Drive
              </Button>
            </div>
            {lastSyncMeta?.value && (
              <p className="text-xs text-muted flex items-center gap-1.5">
                <RefreshCw size={12} /> آخر مزامنة: {new Date(lastSyncMeta.value).toLocaleString('ar-EG')}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
