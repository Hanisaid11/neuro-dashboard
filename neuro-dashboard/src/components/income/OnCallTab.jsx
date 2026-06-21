import React, { useMemo, useState } from 'react';
import { Save, Trash2, Stethoscope, CalendarDays, CalendarRange, Table2 } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData.js';
import { addOnCallEntry, deleteOnCallEntry } from '../../db/actions.js';
import { arabicMonthName, formatArabicDate } from '../../db/fiscalYear.js';
import {
  Card, SectionTitle, Field, NumberInput, DateInput, TextInput, Select, Button,
  MonthYearPicker, Badge, formatYER, EmptyState
} from '../ui/Controls.jsx';
import OnCallMonthTable from './OnCallMonthTable.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function OnCallTab({ initialScrollToday = false }) {
  const { onCallEntries } = useFinanceData();
  const [mode, setMode] = useState('table'); // table | daily | bulk
  const now = new Date();

  // daily form state
  const [date, setDate] = useState(todayISO());
  const [hospital, setHospital] = useState('old');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // bulk form state
  const [bulkYear, setBulkYear] = useState(now.getFullYear());
  const [bulkMonth, setBulkMonth] = useState(now.getMonth() + 1);
  const [bulkHospital, setBulkHospital] = useState('old');
  const [bulkAmount, setBulkAmount] = useState('');

  async function handleDailySave(e) {
    e.preventDefault();
    if (!amount) return;
    await addOnCallEntry({ date, hospital, amount: Number(amount), note, isBulk: false });
    setAmount('');
    setNote('');
  }

  async function handleBulkSave(e) {
    e.preventDefault();
    if (!bulkAmount) return;
    const entryDate = new Date(bulkYear, bulkMonth - 1, 1).toISOString().slice(0, 10);
    await addOnCallEntry({
      date: entryDate,
      hospital: bulkHospital,
      amount: Number(bulkAmount),
      note: `إجمالي شهر ${arabicMonthName(bulkMonth)} ${bulkYear}`,
      isBulk: true
    });
    setBulkAmount('');
  }

  const sorted = useMemo(
    () => [...onCallEntries].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [onCallEntries]
  );
  const oldTotal = onCallEntries.filter((e) => e.hospital === 'old').reduce((s, e) => s + Number(e.amount || 0), 0);
  const newTotal = onCallEntries.filter((e) => e.hospital === 'new').reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-xs text-muted">المستشفى القديم</p>
          <p className="text-xl font-extrabold text-primary-700 tnum mt-1">{formatYER(oldTotal)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-muted">المستشفى الجديد</p>
          <p className="text-xl font-extrabold text-primary-700 tnum mt-1">{formatYER(newTotal)}</p>
        </Card>
      </div>

      <Card>
        <SectionTitle icon={Stethoscope} title="الاستدعاءات / الاستشارات" subtitle={`إجمالي عام: ${formatYER(oldTotal + newTotal)}`} />
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <Button variant={mode === 'table' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('table')}>
            <Table2 size={14} /> جدول الشهر كامل
          </Button>
          <Button variant={mode === 'daily' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('daily')}>
            <CalendarDays size={14} /> إدخال يوم واحد
          </Button>
          <Button variant={mode === 'bulk' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('bulk')}>
            <CalendarRange size={14} /> إجمالي شهر سابق
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
              <Field label="المستشفى" required>
                <Select value={hospital} onChange={(e) => setHospital(e.target.value)}>
                  <option value="old">مستشفى قديم</option>
                  <option value="new">مستشفى جديد</option>
                </Select>
              </Field>
            </div>
            <Field label="المبلغ (ريال)" required>
              <NumberInput value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Field>
            <Field label="ملاحظة (اختياري)">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="تفاصيل إضافية" />
            </Field>
            <Button type="submit"><Save size={16} /> حفظ الإدخال</Button>
          </form>
        ) : (
          <form onSubmit={handleBulkSave} className="space-y-4">
            <MonthYearPicker year={bulkYear} month={bulkMonth} onYearChange={setBulkYear} onMonthChange={setBulkMonth} />
            <Field label="المستشفى" required>
              <Select value={bulkHospital} onChange={(e) => setBulkHospital(e.target.value)}>
                <option value="old">مستشفى قديم</option>
                <option value="new">مستشفى جديد</option>
              </Select>
            </Field>
            <Field label="إجمالي الشهر (ريال)" hint="لتسجيل بيانات تاريخية بسرعة بدون تفاصيل يومية" required>
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
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{formatArabicDate(row.date)}</p>
                    <Badge tone={row.hospital === 'old' ? 'primary' : 'accent'}>
                      {row.hospital === 'old' ? 'قديم' : 'جديد'}
                    </Badge>
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
