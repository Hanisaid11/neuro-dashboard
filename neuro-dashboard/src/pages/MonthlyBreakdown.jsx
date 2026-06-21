import React, { useMemo, useState } from 'react';
import {
  ChevronDown, ChevronUp, Wallet, Stethoscope, Pill, Percent, TrendingUp, Calendar
} from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData.js';
import { computeMonthData } from '../db/calculations.js';
import {
  fiscalYearOptions, getFiscalYearLabel, listFiscalMonths, arabicMonthName
} from '../db/fiscalYear.js';
import { Card, SectionTitle, Select, formatUSD, formatYER, Badge } from '../components/ui/Controls.jsx';
import MonthlyPhotos from '../components/MonthlyPhotos.jsx';

const FIXED_LABELS = {
  hospitalPct: 'نسب المستشفى',
  mriPct: 'نسب الرنين',
  nervePct: 'نسب تخطيط الأعصاب',
  eegPct: 'نسب تخطيط الدماغ',
  implantsPct: 'نسب براغي وشنتات'
};

const FIXED_NOTE_KEYS = {
  hospitalPct: 'hospitalPctNote',
  mriPct: 'mriPctNote',
  nervePct: 'nervePctNote',
  eegPct: 'eegPctNote',
  implantsPct: 'implantsPctNote'
};

function MonthRow({ m, fixedRow, monthlyPhotos, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasData = m.salaryUSD > 0 || m.totalYER > 0;

  return (
    <div className={`border rounded-xl overflow-hidden ${m.fullyOnLeave ? 'border-leave-200' : 'border-primary-100'}`}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${m.fullyOnLeave ? 'bg-leave-50 hover:bg-leave-100/60' : 'bg-primary-50/60 hover:bg-primary-50'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-ink">{arabicMonthName(m.month)} {m.year}</span>
          {m.fullyOnLeave && <Badge tone="leave">إجازة كاملة</Badge>}
          {m.excludedCount > 0 && !m.fullyOnLeave && <Badge tone="accent">{m.excludedCount} مستثنى</Badge>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-end hidden sm:block">
            {m.salaryUSD > 0 && <p className="text-xs font-bold text-accent-600">{formatUSD(m.salaryUSD)}</p>}
            {m.totalYER > 0 && <p className="text-xs font-bold text-primary-700">{formatYER(m.totalYER)}</p>}
            {!hasData && <p className="text-xs text-muted">لا توجد بيانات</p>}
          </div>
          {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
        </div>
      </button>

      {/* Mobile totals strip */}
      {!open && hasData && (
        <div className="flex gap-3 px-4 py-2 bg-white sm:hidden text-xs">
          {m.salaryUSD > 0 && <span className="font-bold text-accent-600">{formatUSD(m.salaryUSD)}</span>}
          {m.totalYER > 0 && <span className="font-bold text-primary-700">{formatYER(m.totalYER)}</span>}
        </div>
      )}

      {/* Breakdown */}
      {open && (
        <div className="bg-white px-4 py-3 space-y-2">
          {/* Salary */}
          <div className="flex items-center justify-between py-2 border-b border-primary-50">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Wallet size={14} className="text-accent-500" /> الراتب الأساسي
            </span>
            <span className="text-sm font-extrabold text-accent-600 tnum">{formatUSD(m.salaryUSD)}</span>
          </div>

          {/* On-call */}
          {m.onCallTotal > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Stethoscope size={14} className="text-primary-500" /> الاستدعاءات
                </span>
                <span className="text-sm font-bold text-primary-700 tnum">{formatYER(m.onCallTotal)}</span>
              </div>
              <div className="ms-6 space-y-0.5">
                {m.oldHospitalTotal > 0 && (
                  <div className="flex justify-between text-xs text-muted">
                    <span>مستشفى قديم</span><span className="tnum">{formatYER(m.oldHospitalTotal)}</span>
                  </div>
                )}
                {m.newHospitalTotal > 0 && (
                  <div className="flex justify-between text-xs text-muted">
                    <span>مستشفى جديد</span><span className="tnum">{formatYER(m.newHospitalTotal)}</span>
                  </div>
                )}
                {m.consultationsTotal > 0 && (
                  <div className="flex justify-between text-xs text-muted">
                    <span>استشارات</span><span className="tnum">{formatYER(m.consultationsTotal)}</span>
                  </div>
                )}
                {m.othersTotal > 0 && (
                  <div className="flex justify-between text-xs text-muted">
                    <span>أخرى</span><span className="tnum">{formatYER(m.othersTotal)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medications */}
          {m.medicationsTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Pill size={14} className="text-accent-500" /> نسب الأدوية
              </span>
              <span className="text-sm font-bold text-primary-700 tnum">{formatYER(m.medicationsTotal)}</span>
            </div>
          )}

          {/* Fixed pcts with notes */}
          {m.fixedTotal > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Percent size={14} className="text-primary-500" /> النسب الثابتة
                </span>
                <span className="text-sm font-bold text-primary-700 tnum">{formatYER(m.fixedTotal)}</span>
              </div>
              <div className="ms-6 space-y-1">
                {Object.entries(FIXED_LABELS).map(([key, label]) =>
                  m.fixed[key] > 0 ? (
                    <div key={key}>
                      <div className="flex justify-between text-xs text-muted">
                        <span>{label}</span>
                        <span className="tnum">{formatYER(m.fixed[key])}</span>
                      </div>
                      {fixedRow?.[FIXED_NOTE_KEYS[key]] && (
                        <p className="text-xs text-primary-500 ms-2 mt-0.5">
                          ↳ {fixedRow[FIXED_NOTE_KEYS[key]]}
                        </p>
                      )}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Month totals */}
          <div className="mt-2 pt-2 border-t border-primary-100 flex flex-col gap-1">
            {m.salaryUSD > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-bold text-ink">إجمالي الراتب</span>
                <span className="text-sm font-extrabold text-accent-600 tnum">{formatUSD(m.salaryUSD)}</span>
              </div>
            )}
            {m.totalYER > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-bold text-ink">إجمالي باقي الدخل</span>
                <span className="text-sm font-extrabold text-primary-700 tnum">{formatYER(m.totalYER)}</span>
              </div>
            )}
            {!hasData && <p className="text-sm text-muted text-center py-1">لا توجد مدخولات مسجّلة لهذا الشهر</p>}
          </div>

          {/* Monthly photos */}
          <MonthlyPhotos year={m.year} month={m.month} photos={monthlyPhotos} />
        </div>
      )}
    </div>
  );
}

export default function MonthlyBreakdown() {
  const data = useFinanceData();
  const allDates = useMemo(
    () => [
      ...data.monthlySalaries.map((s) => new Date(s.year, s.month - 1, 1)),
      ...data.onCallEntries.map((e) => e.date)
    ],
    [data]
  );
  const options = useMemo(() => fiscalYearOptions(allDates), [allDates]);
  const [fiscalYear, setFiscalYear] = useState(getFiscalYearLabel(new Date()));

  const months = useMemo(
    () =>
      listFiscalMonths(fiscalYear)
        .map((fm) => computeMonthData(fm.year, fm.month, data))
        .reverse(),
    [fiscalYear, data]
  );

  const totalUSD = months.reduce((s, m) => s + m.salaryUSD, 0);
  const totalYER = months.reduce((s, m) => s + m.totalYER, 0);

  function getFixedRow(year, month) {
    return data.fixedPercentages.find((f) => f.year === year && f.month === month) || null;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-ink">المدخولات الشهرية</h1>
          <p className="text-sm text-muted mt-0.5">تفصيل كامل لكل شهر</p>
        </div>
        <Select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-44">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
      </div>

      {/* Annual totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-accent-400/10 rounded-xl p-4 text-center">
          <p className="text-xs text-muted mb-1">إجمالي الرواتب السنوي</p>
          <p className="text-xl font-extrabold text-accent-600 tnum">{formatUSD(totalUSD)}</p>
        </div>
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <p className="text-xs text-muted mb-1">إجمالي باقي الدخل السنوي</p>
          <p className="text-xl font-extrabold text-primary-700 tnum">{formatYER(totalYER)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {months.map((m, i) => (
          <MonthRow
            key={`${m.year}-${m.month}`}
            m={m}
            fixedRow={getFixedRow(m.year, m.month)}
            monthlyPhotos={data.monthlyPhotos}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
