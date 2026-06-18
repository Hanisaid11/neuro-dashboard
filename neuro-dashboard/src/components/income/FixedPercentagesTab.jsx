import React, { useMemo, useState } from 'react';
import { Save, Trash2, Percent } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData.js';
import { upsertFixedPercentages, deleteFixedPercentages } from '../../db/actions.js';
import { arabicMonthName } from '../../db/fiscalYear.js';
import { Card, SectionTitle, Field, NumberInput, Button, MonthYearPicker, formatYER, EmptyState } from '../ui/Controls.jsx';

const FIELDS = [
  { key: 'hospitalPct', label: 'نسب مستشفى' },
  { key: 'mriPct', label: 'نسب من الرنين (MRI)' },
  { key: 'nervePct', label: 'نسب تخطيط الأعصاب' },
  { key: 'eegPct', label: 'نسب تخطيط الدماغ (EEG)' },
  { key: 'implantsPct', label: 'نسب البراغي والشنتات' }
];

const emptyForm = () => ({ hospitalPct: '', mriPct: '', nervePct: '', eegPct: '', implantsPct: '' });

export default function FixedPercentagesTab() {
  const { fixedPercentages } = useFinanceData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const fields = {};
    FIELDS.forEach(({ key }) => { fields[key] = Number(form[key]) || 0; });
    await upsertFixedPercentages(year, month, fields);
    setSaving(false);
    setForm(emptyForm());
  }

  function loadRow(row) {
    setYear(row.year);
    setMonth(row.month);
    setForm({
      hospitalPct: row.hospitalPct || '',
      mriPct: row.mriPct || '',
      nervePct: row.nervePct || '',
      eegPct: row.eegPct || '',
      implantsPct: row.implantsPct || ''
    });
  }

  const sorted = useMemo(
    () => [...fixedPercentages].sort((a, b) => b.year - a.year || b.month - a.month),
    [fixedPercentages]
  );

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={Percent} title="النسب الثابتة الشهرية" subtitle="مستشفى، رنين، تخطيط أعصاب، تخطيط دماغ، براغي وشنتات" />
        <form onSubmit={handleSave} className="space-y-4">
          <MonthYearPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
          <div className="grid sm:grid-cols-2 gap-3">
            {FIELDS.map(({ key, label }) => (
              <Field key={key} label={label}>
                <NumberInput
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="0"
                />
              </Field>
            ))}
          </div>
          <Button type="submit" disabled={saving}>
            <Save size={16} /> حفظ النسب
          </Button>
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
              return (
                <div key={row.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <button onClick={() => loadRow(row)} className="text-right flex-1">
                      <p className="font-semibold text-ink">{arabicMonthName(row.month)} {row.year}</p>
                      <p className="text-sm text-primary-600 font-bold tnum">{formatYER(rowTotal)} إجمالي</p>
                    </button>
                    <button
                      onClick={() => deleteFixedPercentages(row.id)}
                      className="text-leave-500 p-2 hover:bg-leave-100 rounded-lg"
                      aria-label="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted">
                    {FIELDS.map(({ key, label }) => (
                      <span key={key}>{label}: <span className="font-semibold text-ink tnum">{formatYER(row[key])}</span></span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
