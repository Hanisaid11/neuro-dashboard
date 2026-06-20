import React, { useEffect, useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData.js';
import { upsertOnCallDay } from '../../db/actions.js';
import { daysInMonth, arabicMonthName } from '../../db/fiscalYear.js';
import { Field, NumberInput, Button, MonthYearPicker, formatYER, toYERDisplay, fromYERDisplay } from '../ui/Controls.jsx';

// Input unit: ألف ريال (thousands). User types 7 → stored as 7000.
// Display: existing stored value 7000 → shown as 7 in input, "7 ألف ر.ي" in totals.

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const pad = (n) => String(n).padStart(2, '0');

export default function OnCallMonthTable() {
  const { onCallEntries } = useFinanceData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  // cells store DISPLAY values (in thousands) for the inputs
  const [cells, setCells] = useState({});
  const [bulkOld, setBulkOld] = useState('');
  const [bulkNew, setBulkNew] = useState('');
  const [applying, setApplying] = useState(false);

  const total = daysInMonth(year, month);

  useEffect(() => {
    const next = {};
    for (let day = 1; day <= total; day++) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      const oldEntry = onCallEntries.find((e) => e.date === dateStr && e.hospital === 'old' && !e.isBulk);
      const newEntry = onCallEntries.find((e) => e.date === dateStr && e.hospital === 'new' && !e.isBulk);
      next[day] = {
        old: oldEntry ? toYERDisplay(oldEntry.amount) : '',
        new: newEntry ? toYERDisplay(newEntry.amount) : ''
      };
    }
    setCells(next);
  }, [year, month, total, onCallEntries]);

  async function commitCell(day, hospital, displayVal) {
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    await upsertOnCallDay(dateStr, hospital, fromYERDisplay(displayVal));
  }

  async function applyToWholeMonth() {
    setApplying(true);
    for (let day = 1; day <= total; day++) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      if (bulkOld !== '') await upsertOnCallDay(dateStr, 'old', fromYERDisplay(bulkOld));
      if (bulkNew !== '') await upsertOnCallDay(dateStr, 'new', fromYERDisplay(bulkNew));
    }
    setApplying(false);
    setBulkOld('');
    setBulkNew('');
  }

  // monthTotal in actual YER (sum of display values × 1000)
  const monthTotal = useMemo(
    () => Object.values(cells).reduce((sum, c) => sum + fromYERDisplay(c.old) + fromYERDisplay(c.new), 0),
    [cells]
  );

  return (
    <div className="space-y-4">
      <MonthYearPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <div className="bg-canvas rounded-xl p-3 sm:p-4">
        <p className="text-sm font-semibold text-ink mb-2 flex items-center gap-1.5">
          <Zap size={14} className="text-accent-500" /> تطبيق قيمة واحدة على كل أيام الشهر
        </p>
        <p className="text-xs text-muted mb-2">الوحدة: ألف ريال (اكتب 7 = 7000 ر.ي)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="مستشفى قديم (ألف ر.ي / يوم)">
            <NumberInput value={bulkOld} onChange={(e) => setBulkOld(e.target.value)} placeholder="مثال: 7 = 7000 ر.ي" />
          </Field>
          <Field label="مستشفى جديد (ألف ر.ي / يوم)">
            <NumberInput value={bulkNew} onChange={(e) => setBulkNew(e.target.value)} placeholder="مثال: 7 = 7000 ر.ي" />
          </Field>
        </div>
        <Button size="sm" className="mt-3" onClick={applyToWholeMonth} disabled={applying || (!bulkOld && !bulkNew)}>
          تطبيق على شهر {arabicMonthName(month)} {year} كامل
        </Button>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted">{arabicMonthName(month)} {year} - {total} يوم</p>
        <p className="text-sm font-bold text-primary-700 tnum">{formatYER(monthTotal)}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-primary-100/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-50 text-primary-700">
              <th className="py-2 px-3 text-right font-semibold whitespace-nowrap">اليوم</th>
              <th className="py-2 px-2 text-right font-semibold whitespace-nowrap">قديم (ألف)</th>
              <th className="py-2 px-2 text-right font-semibold whitespace-nowrap">جديد (ألف)</th>
              <th className="py-2 px-3 text-right font-semibold whitespace-nowrap">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100/60">
            {Array.from({ length: total }, (_, i) => i + 1).map((day) => {
              const date = new Date(year, month - 1, day);
              const weekday = WEEKDAYS_AR[date.getDay()];
              const cell = cells[day] || { old: '', new: '' };
              const rowTotalYER = fromYERDisplay(cell.old) + fromYERDisplay(cell.new);
              const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
              return (
                <tr key={day} className={isToday ? 'bg-accent-400/10' : 'bg-white'}>
                  <td className="py-1.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-ink tnum">{day}</span>
                    <span className="text-xs text-muted ms-1">{weekday}</span>
                  </td>
                  <td className="py-1.5 px-2">
                    <NumberInput
                      value={cell.old}
                      onChange={(e) => setCells((prev) => ({ ...prev, [day]: { ...prev[day], old: e.target.value } }))}
                      onBlur={(e) => commitCell(day, 'old', e.target.value)}
                      className="py-1.5 text-xs min-w-[4.5rem]"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <NumberInput
                      value={cell.new}
                      onChange={(e) => setCells((prev) => ({ ...prev, [day]: { ...prev[day], new: e.target.value } }))}
                      onBlur={(e) => commitCell(day, 'new', e.target.value)}
                      className="py-1.5 text-xs min-w-[4.5rem]"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1.5 px-3 font-semibold text-primary-700 tnum whitespace-nowrap">
                    {rowTotalYER > 0 ? formatYER(rowTotalYER) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
