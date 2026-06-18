import React, { useEffect, useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData.js';
import { upsertOnCallDay } from '../../db/actions.js';
import { daysInMonth, arabicMonthName } from '../../db/fiscalYear.js';
import { Field, NumberInput, Button, MonthYearPicker, formatYER } from '../ui/Controls.jsx';

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function OnCallMonthTable() {
  const { onCallEntries } = useFinanceData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cells, setCells] = useState({});
  const [bulkOld, setBulkOld] = useState('');
  const [bulkNew, setBulkNew] = useState('');
  const [applying, setApplying] = useState(false);

  const total = daysInMonth(year, month);

  // rebuild the editable grid whenever the month or underlying data changes
  useEffect(() => {
    const next = {};
    for (let day = 1; day <= total; day++) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      const oldEntry = onCallEntries.find((e) => e.date === dateStr && e.hospital === 'old' && !e.isBulk);
      const newEntry = onCallEntries.find((e) => e.date === dateStr && e.hospital === 'new' && !e.isBulk);
      next[day] = {
        old: oldEntry ? String(oldEntry.amount) : '',
        new: newEntry ? String(newEntry.amount) : ''
      };
    }
    setCells(next);
  }, [year, month, total, onCallEntries]);

  async function commitCell(day, hospital, value) {
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    setCells((prev) => ({ ...prev, [day]: { ...prev[day], [hospital]: value } }));
    await upsertOnCallDay(dateStr, hospital, value);
  }

  async function applyToWholeMonth() {
    setApplying(true);
    for (let day = 1; day <= total; day++) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      if (bulkOld !== '') await upsertOnCallDay(dateStr, 'old', bulkOld);
      if (bulkNew !== '') await upsertOnCallDay(dateStr, 'new', bulkNew);
    }
    setApplying(false);
    setBulkOld('');
    setBulkNew('');
  }

  const monthTotal = useMemo(
    () =>
      Object.values(cells).reduce(
        (sum, c) => sum + (Number(c.old) || 0) + (Number(c.new) || 0),
        0
      ),
    [cells]
  );

  return (
    <div className="space-y-4">
      <MonthYearPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <div className="bg-canvas rounded-xl p-3 sm:p-4">
        <p className="text-sm font-semibold text-ink mb-2 flex items-center gap-1.5">
          <Zap size={14} className="text-accent-500" /> تطبيق قيمة واحدة على كل أيام الشهر
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="مستشفى قديم (لكل يوم)">
            <NumberInput value={bulkOld} onChange={(e) => setBulkOld(e.target.value)} placeholder="اتركه فارغًا للتجاهل" />
          </Field>
          <Field label="مستشفى جديد (لكل يوم)">
            <NumberInput value={bulkNew} onChange={(e) => setBulkNew(e.target.value)} placeholder="اتركه فارغًا للتجاهل" />
          </Field>
        </div>
        <Button size="sm" className="mt-3" onClick={applyToWholeMonth} disabled={applying || (!bulkOld && !bulkNew)}>
          تطبيق على شهر {arabicMonthName(month)} {year} كامل
        </Button>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted">
          {arabicMonthName(month)} {year} - {total} يوم
        </p>
        <p className="text-sm font-bold text-primary-700 tnum">{formatYER(monthTotal)}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-primary-100/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-50 text-primary-700">
              <th className="py-2 px-3 text-right font-semibold whitespace-nowrap">اليوم</th>
              <th className="py-2 px-2 text-right font-semibold whitespace-nowrap">مستشفى قديم</th>
              <th className="py-2 px-2 text-right font-semibold whitespace-nowrap">مستشفى جديد</th>
              <th className="py-2 px-3 text-right font-semibold whitespace-nowrap">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100/60">
            {Array.from({ length: total }, (_, i) => i + 1).map((day) => {
              const date = new Date(year, month - 1, day);
              const weekday = WEEKDAYS_AR[date.getDay()];
              const cell = cells[day] || { old: '', new: '' };
              const rowTotal = (Number(cell.old) || 0) + (Number(cell.new) || 0);
              const isToday =
                year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
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
                      className="py-1.5 text-xs min-w-[5.5rem]"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <NumberInput
                      value={cell.new}
                      onChange={(e) => setCells((prev) => ({ ...prev, [day]: { ...prev[day], new: e.target.value } }))}
                      onBlur={(e) => commitCell(day, 'new', e.target.value)}
                      className="py-1.5 text-xs min-w-[5.5rem]"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1.5 px-3 font-semibold text-primary-700 tnum whitespace-nowrap">
                    {rowTotal > 0 ? formatYER(rowTotal) : '—'}
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
