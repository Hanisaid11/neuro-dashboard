import React, { useEffect, useMemo, useState } from 'react';
import { Save, Trash2, Stethoscope, CalendarDays, CalendarRange, Table2 } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData.js';
import { addOnCallEntry, deleteOnCallEntry } from '../../db/actions.js';
import { arabicMonthName, formatArabicDate } from '../../db/fiscalYear.js';
import {
  Card, SectionTitle, Field, NumberInput, DateInput, TextInput, Select, Button,
  MonthYearPicker, Badge, formatYER, toYERDisplay, fromYERDisplay, EmptyState
} from '../ui/Controls.jsx';
import OnCallMonthTable from './OnCallMonthTable.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

const HOSPITAL_LABELS = {
  old: 'مستشفى قديم',
  new: 'مستشفى جديد',
  consultations: 'استشارات',
  others: 'أخرى',
  combined: 'إجمالي الشهر (بدون تفصيل)'
};

export default function OnCallTab({ initialScrollToday = false }) {
  const { onCallEntries } = useFinanceData();
  const [mode, setMode] = useState('table'); // table | daily | bulk
  const now = new Date();

  // ── Daily single-entry form ──────────────────────────────────────────────
  const [date, setDate] = useState(todayISO());
  const [hospital, setHospital] = useState('old');
  const [amount, setAmount] = useState(''); // display value (thousands)
  const [note, setNote] = useState('');

  // Auto-load any existing (non-bulk) entry for this exact date+type so the
  // form shows what was already saved instead of staying blank.
  useEffect(() => {
    const existing = onCallEntries.find((e) => e.date === date && e.hospital === hospital && !e.isBulk);
    setAmount(existing ? toYERDisplay(existing.amount) : '');
    setNote(existing?.note || '');
  }, [date, hospital, onCallEntries]);

  async function handleDailySave(e) {
    e.preventDefault();
    if (!amount) return;
    await addOnCallEntry({ date, hospital, amount: fromYERDisplay(amount), note, isBulk: false });
  }

  // ── Bulk monthly-total form ───────────────────────────────────────────────
  const [bulkYear, setBulkYear] = useState(now.getFullYear());
  const [bulkMonth, setBulkMonth] = useState(now.getMonth() + 1);
  const [bulkHospital, setBulkHospital] = useState('combined');
  const [bulkAmount, setBulkAmount] = useState(''); // display value (thousands)

  // Auto-load any existing bulk entry for this month+type
  useEffect(() => {
    const entryDate = new Date(bulkYear, bulkMonth - 1, 1).toISOString().slice(0, 10);
    const existing = onCallEntries.find((e) => e.date === entryDate && e.hospital === bulkHospital && e.isBulk);
    setBulkAmount(existing ? toYERDisplay(existing.amount) : '');
  }, [bulkYear, bulkMonth, bulkHospital, onCallEntries]);

  async function handleBulkSave(e) {
    e.preventDefault();
    if (!bulkAmount) return;
    const entryDate = new Date(bulkYear, bulkMonth - 1, 1).toISOString().slice(0, 10);
    // Remove any previous bulk entry for this exact month+type before adding,
    // so re-saving updates the value instead of creating duplicates.
    const existing = onCallEntries.find((e) => e.date === entryDate && e.hospital === bulkHospital && e.isBulk);
    if (existing) await deleteOnCallEntry(existing.id);
    await addOnCallEntry({
      date: entryDate,
      hospital: bulkHospital,
      amount: fromYERDisplay(bulkAmount),
      note: `إجمالي شهر ${arabicMonthName(bulkMonth)} ${bulkYear}`,
      isBulk: true
    });
  }

  const sorted = useMemo(
    () => [...onCallEntries].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [onCallEntries]
  );

  const totals = useMemo(() => {
    const sum = (h) => onCallEntries.filter((e) => e.hospital === h).reduce((s, e) => s + Number(e.amount || 0), 0);
    return {
      old: sum('old'),
      new: sum('new'),
      consultations: sum('consultations'),
      others: sum('others'),
      combined: sum('combined')
    };
  }, [onCallEntries]);
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="text-center"><p className="text-xs text-muted">قديم</p><p className="text-lg font-extrabold text-primary-700 tnum mt-1">{formatYER(totals.old)}</p></Card>
        <Card className="text-center"><p className="text-xs text-muted">جديد</p><p className="text-lg font-extrabold text-primary-700 tnum mt-1">{formatYER(totals.new)}</p></Card>
        <Card className="text-center"><p className="text-xs text-muted">استشارات</p><p className="text-lg font-extrabold text-primary-700 tnum mt-1">{formatYER(totals.consultations)}</p></Card>
        <Card className="text-center"><p className="text-xs text-muted">أخرى</p><p className="text-lg font-extrabold text-primary-700 tnum mt-1">{formatYER(totals.others)}</p></Card>
        <Card className="text-center"><p className="text-xs text-muted">إجمالي بدون تفصيل</p><p className="text-lg font-extrabold text-primary-700 tnum mt-1">{formatYER(totals.combined)}</p></Card>
        <Card className="text-center bg-primary-50"><p className="text-xs text-muted">الإجمالي الكلي</p><p className="text-lg font-extrabold text-primary-700 tnum mt-1">{formatYER(grandTotal)}</p></Card>
      </div>

      <Card>
        <SectionTitle icon={Stethoscope} title="الاستدعاءات / الاستشارات" subtitle={`إجمالي عام: ${formatYER(grandTotal)}`} />
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <Button variant={mode === 'table' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('table')}>
            <Table2 size={14} /> جدول الشهر كامل
          </Button>
          <Button variant={mode === 'daily' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('daily')}>
            <CalendarDays size={14} /> إدخال يوم واحد
          </Button>
          <Button variant={mode === 'bulk' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('bulk')}>
            <CalendarRange size={14} /> إجمالي الشهر دفعة واحدة
          </Button>
        </div>

        {mode === 'table' ? (
          <OnCallMonthTable initialScrollToday={initialScrollToday} />
        ) : mode === 'daily' ? (
          <form onSubmit={handleDailySave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="التاريخ" required>
                <DateInput value={date} onChange={(e) => setDate(e.target.value)} required />
              </Field>
              <Field label="النوع" required>
                <Select value={hospital} onChange={(e) => setHospital(e.target.value)}>
                  <option value="old">مستشفى قديم</option>
                  <option value="new">مستشفى جديد</option>
                  <option value="consultations">استشارات</option>
                  <option value="others">أخرى</option>
                </Select>
              </Field>
            </div>
            <Field label="المبلغ (ألف ر.ي)" required hint="اكتب 7 يعني 7000 ر.ي">
              <NumberInput value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Field>
            <Field label="ملاحظة (اختياري)">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="تفاصيل إضافية" />
            </Field>
            <Button type="submit"><Save size={16} /> حفظ الإدخال</Button>
          </form>
        ) : (
          <form onSubmit={handleBulkSave} className="space-y-4">
            <p className="text-xs text-muted -mt-1">
              لتسجيل دخل الشهر كرقم واحد بدون الدخول في تفاصيل كل يوم — اختر "إجمالي الشهر بدون تفصيل" لتسجيل مبلغ واحد فقط، أو اختر نوعًا محددًا لتسجيل إجماليه وحده.
            </p>
            <MonthYearPicker year={bulkYear} month={bulkMonth} onYearChange={setBulkYear} onMonthChange={setBulkMonth} />
            <Field label="النوع" required>
              <Select value={bulkHospital} onChange={(e) => setBulkHospital(e.target.value)}>
                <option value="combined">إجمالي الشهر (بدون تفصيل)</option>
                <option value="old">مستشفى قديم فقط</option>
                <option value="new">مستشفى جديد فقط</option>
                <option value="consultations">استشارات فقط</option>
                <option value="others">أخرى فقط</option>
              </Select>
            </Field>
            <Field label="إجمالي الشهر (ألف ر.ي)" required hint="اكتب 150 يعني 150,000 ر.ي">
              <NumberInput value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} required />
            </Field>
            <Button type="submit"><Save size={16} /> حفظ الإجمالي</Button>
          </form>
        )}
      </Card>

      <Card>
        <SectionTitle title="آخر الإدخالات" />
        {sorted.length === 0 ? (
          <EmptyState icon={Stethoscope} title="لا توجد إدخالات استدعاءات" />
        ) : (
          <div className="divide-y divide-primary-100/60 max-h-96 overflow-auto">
            {sorted.map((row) => (
              <div key={row.id} className="flex items-center justify-between py-3 gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-ink">{formatArabicDate(row.date)}</p>
                    <Badge tone={row.hospital === 'combined' ? 'accent' : 'primary'}>{HOSPITAL_LABELS[row.hospital] || row.hospital}</Badge>
                    {row.isBulk && <Badge tone="muted">إجمالي شهري</Badge>}
                  </div>
                  {row.note && <p className="text-xs text-muted mt-0.5">{row.note}</p>}
                </div>
                <p className="font-bold text-primary-700 tnum">{formatYER(row.amount)}</p>
                <button
                  onClick={() => deleteOnCallEntry(row.id)}
                  className="text-leave-500 p-2 hover:bg-leave-100 rounded-lg"
                  aria-label="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
