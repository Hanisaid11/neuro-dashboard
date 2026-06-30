import React, { useEffect, useMemo, useState } from 'react';
import { Save, Trash2, Pill, CalendarDays, CalendarRange } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData.js';
import { addMedicationEntry, deleteMedicationEntry } from '../../db/actions.js';
import { arabicMonthName, formatArabicDate } from '../../db/fiscalYear.js';
import {
  Card, SectionTitle, Field, NumberInput, DateInput, TextInput, Button,
  MonthYearPicker, Badge, formatYER, toYERDisplay, fromYERDisplay, EmptyState
} from '../ui/Controls.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function MedicationsTab() {
  const { medicationEntries } = useFinanceData();
  const [mode, setMode] = useState('daily');
  const now = new Date();

  const [date, setDate] = useState(todayISO());
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState(''); // display value in thousands

  const [bulkYear, setBulkYear] = useState(now.getFullYear());
  const [bulkMonth, setBulkMonth] = useState(now.getMonth() + 1);
  const [bulkItemName, setBulkItemName] = useState('');
  const [bulkAmount, setBulkAmount] = useState(''); // display value in thousands

  // Auto-load any existing bulk entry for this month so switching months
  // shows what was already saved instead of staying blank.
  useEffect(() => {
    const entryDate = new Date(bulkYear, bulkMonth - 1, 1).toISOString().slice(0, 10);
    const existing = medicationEntries.find((e) => e.date === entryDate && e.isBulk);
    setBulkAmount(existing ? toYERDisplay(existing.amount) : '');
    setBulkItemName(existing?.itemName || '');
  }, [bulkYear, bulkMonth, medicationEntries]);

  async function handleDailySave(e) {
    e.preventDefault();
    if (!amount) return;
    await addMedicationEntry({ date, itemName, amount: fromYERDisplay(amount), isBulk: false });
    setItemName('');
    setAmount('');
  }

  async function handleBulkSave(e) {
    e.preventDefault();
    if (!bulkAmount) return;
    const entryDate = new Date(bulkYear, bulkMonth - 1, 1).toISOString().slice(0, 10);
    // Update existing bulk entry for this month instead of duplicating it
    const existing = medicationEntries.find((e) => e.date === entryDate && e.isBulk);
    if (existing) await deleteMedicationEntry(existing.id);
    await addMedicationEntry({
      date: entryDate,
      itemName: bulkItemName || `إجمالي ${arabicMonthName(bulkMonth)} ${bulkYear}`,
      amount: fromYERDisplay(bulkAmount),
      isBulk: true
    });
  }

  const sorted = useMemo(
    () => [...medicationEntries].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [medicationEntries]
  );
  const total = medicationEntries.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={Pill} title="نسب الأدوية" subtitle={`إجمالي مسجّل: ${formatYER(total)}`} />
        <p className="text-xs text-muted mb-3">الوحدة: ألف ريال — اكتب 7 يعني 7000 ر.ي</p>
        <div className="flex gap-2 mb-4">
          <Button variant={mode === 'daily' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('daily')}>
            <CalendarDays size={14} /> إدخال يومي
          </Button>
          <Button variant={mode === 'bulk' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('bulk')}>
            <CalendarRange size={14} /> إجمالي شهر سابق
          </Button>
        </div>

        {mode === 'daily' ? (
          <form onSubmit={handleDailySave} className="space-y-4">
            <Field label="التاريخ" required>
              <DateInput value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <Field label="اسم العنصر / البند">
              <TextInput value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="مثال: دواء معين" />
            </Field>
            <Field label="القيمة (ألف ر.ي)" required>
              <NumberInput value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثال: 7 = 7000 ر.ي" required />
            </Field>
            <Button type="submit"><Save size={16} /> حفظ الإدخال</Button>
          </form>
        ) : (
          <form onSubmit={handleBulkSave} className="space-y-4">
            <MonthYearPicker year={bulkYear} month={bulkMonth} onYearChange={setBulkYear} onMonthChange={setBulkMonth} />
            <Field label="اسم العنصر / البند (اختياري)">
              <TextInput value={bulkItemName} onChange={(e) => setBulkItemName(e.target.value)} />
            </Field>
            <Field label="إجمالي الشهر (ألف ر.ي)" required>
              <NumberInput value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} placeholder="مثال: 150 = 150,000 ر.ي" required />
            </Field>
            <Button type="submit"><Save size={16} /> حفظ الإجمالي</Button>
          </form>
        )}
      </Card>

      <Card>
        <SectionTitle title="آخر الإدخالات" />
        {sorted.length === 0 ? (
          <EmptyState icon={Pill} title="لا توجد إدخالات أدوية" />
        ) : (
          <div className="divide-y divide-primary-100/60 max-h-96 overflow-auto">
            {sorted.map((row) => (
              <div key={row.id} className="flex items-center justify-between py-3 gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{formatArabicDate(row.date)}</p>
                    {row.isBulk && <Badge tone="muted">إجمالي شهري</Badge>}
                  </div>
                  {row.itemName && <p className="text-xs text-muted mt-0.5">{row.itemName}</p>}
                </div>
                <p className="font-bold text-accent-600 tnum">{formatYER(row.amount)}</p>
                <button onClick={() => deleteMedicationEntry(row.id)} className="text-leave-500 p-2 hover:bg-leave-100 rounded-lg" aria-label="حذف">
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
