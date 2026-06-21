import React, { useEffect, useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData.js';
import { upsertOnCallDay } from '../../db/actions.js';
import { daysInMonth, arabicMonthName } from '../../db/fiscalYear.js';
import { Field, NumberInput, Button, MonthYearPicker, formatYER, fromYERDisplay, toYERDisplay } from '../ui/Controls.jsx';

// 4 on-call types
const HOSPITALS = [
  { key: 'old',           label: 'قديم',       short: 'قديم'   },
  { key: 'new',           label: 'جديد',       short: 'جديد'   },
  { key: 'consultations', label: 'استشارات',   short: 'استش.'  },
  { key: 'others',        label: 'أخرى',       short: 'أخرى'   },
];

const WEEKDAYS_AR = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const pad = (n) => String(n).padStart(2, '0');
const emptyCell = () => Object.fromEntries(HOSPITALS.map((h) => [h.key, '']));

export default function OnCallMonthTable({ initialScrollToday = false }) {
  const { onCallEntries } = useFinanceData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cells, setCells] = useState({});
  const [bulk, setBulk] = useState(emptyCell());
  const [applying, setApplying] = useState(false);

  const total = daysInMonth(year, month);

  // Rebuild grid whenever month or data changes
  useEffect(() => {
    const next = {};
    for (let day = 1; day <= total; day++) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      const cell = {};
      HOSPITALS.forEach(({ key }) => {
        const entry = onCallEntries.find((e) => e.date === dateStr && e.hospital === key && !e.isBulk);
        cell[key] = entry ? toYERDisplay(entry.amount) : '';
      });
      next[day] = cell;
    }
    setCells(next);
  }, [year, month, total, onCallEntries]);

  // Scroll to today's row on first open
  useEffect(() => {
    if (!initialScrollToday) return;
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (!isCurrentMonth) return;
    setTimeout(() => {
      const el = document.getElementById(`oncall-day-${now.getDate()}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  }, [initialScrollToday, year, month]);

  async function commitCell(day, hospital, displayVal) {
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    await upsertOnCallDay(dateStr, hospital, fromYERDisplay(displayVal));
  }

  async function applyToWholeMonth() {
    setApplying(true);
    for (let day = 1; day <= total; day++) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      for (const { key } of HOSPITALS) {
        if (bulk[key] !== '') await upsertOnCallDay(dateStr, key, fromYERDisplay(bulk[key]));
      }
    }
    setApplying(false);
    setBulk(emptyCell());
  }

  const monthTotal = useMemo(
    () => Object.values(cells).reduce(
      (sum, cell) => sum + HOSPITALS.reduce((s, h) => s + fromYERDisplay(cell[h.key]), 0),
      0
    ),
    [cells]
  );

  const anyBulk = HOSPITALS.some((h) => bulk[h.key] !== '');

  return (
    <div className="space-y-4">
      <MonthYearPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      {/* Bulk fill */}
      <div className="bg-canvas rounded-xl p-3 space-y-2">
        <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
          <Zap size={14} className="text-accent-500" /> تطبيق على كل أيام الشهر
        </p>
        <p className="text-xs text-muted">الوحدة: ألف ريال (7 = 7,000 ر.ي)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {HOSPITALS.map(({ key, label }) => (
            <Field key={key} label={label}>
              <NumberInput
                value={bulk[key]}
                onChange={(e) => setBulk((b) => ({ ...b, [key]: e.target.value }))}
                placeholder="—"
              />
            </Field>
          ))}
        </div>
        <Button size="sm" onClick={applyToWholeMonth} disabled={applying || !anyBulk}>
          تطبيق على {arabicMonthName(month)} {year} كامل
        </Button>
      </div>

      {/* Month total */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted">{arabicMonthName(month)} {year} — {total} يوم</p>
        <p className="text-sm font-bold text-primary-700 tnum">{formatYER(monthTotal)}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-primary-100/60">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="bg-primary-50 text-primary-700">
              <th className="py-2 px-3 text-right font-semibold whitespace-nowrap sticky right-0 bg-primary-50">اليوم</th>
              {HOSPITALS.map((h) => (
                <th key={h.key} className="py-2 px-2 text-right font-semibold whitespace-nowrap">{h.short} (ألف)</th>
              ))}
              <th className="py-2 px-3 text-right font-semibold whitespace-nowrap">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100/60">
            {Array.from({ length: total }, (_, i) => i + 1).map((day) => {
              const date = new Date(year, month - 1, day);
              const weekday = WEEKDAYS_AR[date.getDay()];
              const cell = cells[day] || emptyCell();
              const rowTotalYER = HOSPITALS.reduce((s, h) => s + fromYERDisplay(cell[h.key]), 0);
              const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
              const isFriday = date.getDay() === 5;
              const isSaturday = date.getDay() === 6;
              return (
                <tr
                  key={day}
                  id={`oncall-day-${day}`}
                  className={
                    isToday
                      ? 'bg-accent-400/15 ring-1 ring-inset ring-accent-400/40'
                      : isFriday || isSaturday
                      ? 'bg-primary-50/40'
                      : 'bg-white'
                  }
                >
                  <td className={`py-2 px-3 whitespace-nowrap sticky right-0 ${isToday ? 'bg-accent-400/15' : isFriday || isSaturday ? 'bg-primary-50/60' : 'bg-white'}`}>
                    <span className={`font-bold tnum ${isToday ? 'text-accent-700' : 'text-ink'}`}>{day}</span>
                    <span className="text-xs text-muted ms-1">{weekday}</span>
                  </td>
                  {HOSPITALS.map(({ key }) => (
                    <td key={key} className="py-1.5 px-2">
                      <NumberInput
                        value={cell[key]}
                        onChange={(e) =>
                          setCells((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], [key]: e.target.value }
                          }))
                        }
                        onBlur={(e) => commitCell(day, key, e.target.value)}
                        className="py-1.5 text-xs w-16"
                        placeholder="0"
                      />
                    </td>
                  ))}
                  <td className="py-2 px-3 font-semibold text-primary-700 tnum whitespace-nowrap">
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
