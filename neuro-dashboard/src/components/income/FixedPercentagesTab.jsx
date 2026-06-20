import React, { useMemo, useState } from 'react';
import { Save, Trash2, Percent, ChevronDown, ChevronUp } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData.js';
import { upsertFixedPercentages, deleteFixedPercentages } from '../../db/actions.js';
import { arabicMonthName } from '../../db/fiscalYear.js';
import {
  Card, SectionTitle, Field, NumberInput, TextInput, Button,
  MonthYearPicker, formatYER, toYERDisplay, fromYERDisplay, EmptyState
} from '../ui/Controls.jsx';

const FIELDS = [
  { key: 'hospitalPct',  noteKey: 'hospitalPctNote',  label: 'نسب مستشفى' },
  { key: 'mriPct',       noteKey: 'mriPctNote',       label: 'نسب من الرنين (MRI)' },
  { key: 'nervePct',     noteKey: 'nervePctNote',      label: 'نسب تخطيط الأعصاب' },
  { key: 'eegPct',       noteKey: 'eegPctNote',       label: 'نسب تخطيط الدماغ (EEG)' },
  { key: 'implantsPct',  noteKey: 'implantsPctNote',  label: 'نسب البراغي والشنتات' }
];

const emptyForm = () =>
  Object.fromEntries(
    FIELDS.flatMap(({ key, noteKey }) => [[key, ''], [noteKey, '']])
  );

export default function FixedPercentagesTab() {
  const { fixedPercentages } = useFinanceData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const fields = {};
    FIELDS.forEach(({ key, noteKey }) => {
      fields[key] = fromYERDisplay(form[key]);
      fields[noteKey] = form[noteKey] || '';
    });
    await upsertFixedPercentages(year, month, fields);
    setSaving(false);
    setForm(emptyForm());
  }

  function loadRow(row) {
    setYear(row.year);
    setMonth(row.month);
    const f = {};
    FIELDS.forEach(({ key, noteKey }) => {
      f[key] = toYERDisplay(row[key]);
      f[noteKey] = row[noteKey] || '';
    });
    setForm(f);
  }

  const sorted = useMemo(
    () => [...fixedPercentages].sort((a, b) => b.year - a.year || b.month - a.month),
    [fixedPercentages]
  );

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={Percent} title="النسب الثابتة الشهرية" subtitle="مستشفى، رنين، تخطيط أعصاب، تخطيط دماغ، براغي وشنتات" />
        <p className="text-xs text-muted mb-4">الوحدة: ألف ريال — اكتب 7 يعني 7000 ر.ي</p>
        <form onSubmit={handleSave} className="space-y-5">
          <MonthYearPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
          {FIELDS.map(({ key, noteKey, label }) => (
            <div key={key} className="bg-canvas rounded-xl p-3 space-y-2">
              <p className="text-sm font-semibold text-ink">{label}</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="المبلغ (ألف ر.ي)">
                  <NumberInput
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    placeholder="0"
                  />
                </Field>
                <Field label="ملاحظات">
                  <TextInput
                    value={form[noteKey]}
                    onChange={(e) => setField(noteKey, e.target.value)}
                    placeholder="اختياري..."
                  />
                </Field>
              </div>
            </div>
          ))}
          <Button type="submit" disabled={saving}><Save size={16} /> حفظ النسب</Button>
        </form>
      </Card>

      <Card>
        <SectionTitle title="سجل النسب الشهرية" />
        {sorted.length === 0 ? (
          <EmptyState icon={Percent} title="لا توجد نسب محفوظة" />
        ) : (
          <div className="divide-y divide-primary-100/60">
            {sorted.map((row) => {
              const rowTotal = FIELDS.reduce((s, f) => s + (Number(row[f.key]) || 0), 0);
              const isOpen = !!expandedRows[row.id];
              return (
                <div key={row.id} className="py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => loadRow(row)} className="text-right flex-1 min-w-0">
                      <p className="font-semibold text-ink">{arabicMonthName(row.month)} {row.year}</p>
                      <p className="text-sm text-primary-600 font-bold tnum">{formatYER(rowTotal)} إجمالي</p>
                    </button>
                    <button
                      onClick={() => setExpandedRows((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                      className="p-2 rounded-lg hover:bg-primary-50 text-muted"
                      aria-label="تفاصيل"
                    >
                      {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <button
                      onClick={() => deleteFixedPercentages(row.id)}
                      className="text-leave-500 p-2 hover:bg-leave-100 rounded-lg"
                      aria-label="حذف"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="mt-2 space-y-1.5 ms-1">
                      {FIELDS.map(({ key, noteKey, label }) =>
                        row[key] > 0 ? (
                          <div key={key} className="flex items-start justify-between gap-2 text-sm">
                            <span className="text-muted">{label}</span>
                            <div className="text-end">
                              <span className="font-bold text-ink tnum">{formatYER(row[key])}</span>
                              {row[noteKey] && (
                                <p className="text-xs text-muted mt-0.5">{row[noteKey]}</p>
                              )}
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
