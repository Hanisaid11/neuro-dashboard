import React, { useState } from 'react';
import { Save, Trash2, Wallet } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData.js';
import { upsertMonthlySalary } from '../../db/actions.js';
import { db } from '../../db/db.js';
import { arabicMonthName } from '../../db/fiscalYear.js';
import { Card, SectionTitle, Field, NumberInput, Button, MonthYearPicker, formatMoney, EmptyState } from '../ui/Controls.jsx';

export default function SalaryTab() {
  const { monthlySalaries } = useFinanceData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    await upsertMonthlySalary(year, month, Number(amount));
    setSaving(false);
    setAmount('');
  }

  function loadRow(row) {
    setYear(row.year);
    setMonth(row.month);
    setAmount(String(row.amount));
  }

  const sorted = [...monthlySalaries].sort((a, b) => b.year - a.year || b.month - a.month);

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={Wallet} title="الراتب الأساسي الشهري" subtitle="يمكن تعديله لكل شهر/سنة على حدة" />
        <form onSubmit={handleSave} className="space-y-4">
          <MonthYearPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
          <Field label="قيمة الراتب (ج.م)" required>
            <NumberInput value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثال: 15000" required />
          </Field>
          <Button type="submit" disabled={saving}>
            <Save size={16} /> حفظ الراتب
          </Button>
        </form>
      </Card>

      <Card>
        <SectionTitle title="سجل الرواتب المحفوظة" />
        {sorted.length === 0 ? (
          <EmptyState icon={Wallet} title="لا توجد رواتب محفوظة" hint="أضف راتب أول شهر من الأعلى" />
        ) : (
          <div className="divide-y divide-primary-100/60">
            {sorted.map((row) => (
              <div key={row.id} className="flex items-center justify-between py-3 gap-3">
                <button onClick={() => loadRow(row)} className="text-right flex-1">
                  <p className="font-semibold text-ink">{arabicMonthName(row.month)} {row.year}</p>
                  <p className="text-sm text-primary-600 font-bold tnum">{formatMoney(row.amount)} ج.م</p>
                </button>
                <button
                  onClick={() => db.monthlySalaries.delete(row.id)}
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
