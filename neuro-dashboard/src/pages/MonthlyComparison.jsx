import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData.js';
import { computeMonthData } from '../db/calculations.js';
import {
  fiscalYearOptions, getFiscalYearLabel, listFiscalMonths, arabicMonthName
} from '../db/fiscalYear.js';
import {
  Card, SectionTitle, Select, formatUSD, formatYER, NumberInput, Field, Badge
} from '../components/ui/Controls.jsx';
import { setAppMeta, getAppMeta } from '../db/actions.js';

// ── Exchange rate row: per-month rate stored in appMeta ───────────────────────
function useMonthlyRates(months) {
  const [rates, setRates] = useState({});

  // Load all rates for the visible months on mount or when months change
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = {};
      for (const m of months) {
        const key = `exRate_${m.year}_${m.month}`;
        const v = await getAppMeta(key, '');
        result[key] = v ?? '';
      }
      if (!cancelled) setRates(result);
    })();
    return () => { cancelled = true; };
  }, [months.map((m) => `${m.year}-${m.month}`).join(',')]);

  async function setRate(year, month, value) {
    const key = `exRate_${year}_${month}`;
    setRates((prev) => ({ ...prev, [key]: value }));
    await setAppMeta(key, value);
  }

  function getRate(year, month) {
    return Number(rates[`exRate_${year}_${month}`]) || 0;
  }

  return { getRate, setRate };
}

export default function MonthlyComparison() {
  const data = useFinanceData();
  const allDates = useMemo(
    () => [
      ...data.monthlySalaries.map((s) => new Date(s.year, s.month - 1, 1)),
      ...data.onCallEntries.map((e) => e.date),
    ],
    [data]
  );
  const options = useMemo(() => fiscalYearOptions(allDates), [allDates]);
  const [fiscalYear, setFiscalYear] = useState(getFiscalYearLabel(new Date()));
  const [currency, setCurrency] = useState('yer'); // 'yer' | 'usd'

  const months = useMemo(
    () => listFiscalMonths(fiscalYear).map((fm) => computeMonthData(fm.year, fm.month, data)),
    [fiscalYear, data]
  );

  const { getRate, setRate } = useMonthlyRates(months);

  // Build chart data
  const chartData = useMemo(() => {
    return months.map((m) => {
      const rate = getRate(m.year, m.month);
      const salaryYER = rate > 0 ? m.salaryUSD * rate : 0;
      const totalYERConverted = m.totalYER + salaryYER;
      const totalUSD = rate > 0
        ? m.salaryUSD + (m.totalYER / rate)
        : m.salaryUSD;

      return {
        name: arabicMonthName(m.month).slice(0, 4),
        month: m.month,
        year: m.year,
        // YER mode
        استدعاءات: m.onCallTotal,
        أدوية: m.medicationsTotal,
        'نسب ثابتة': m.fixedTotal,
        'راتب (محوّل)': salaryYER,
        إجمالي_YER: totalYERConverted,
        // USD mode
        'راتب $': m.salaryUSD,
        'دخل آخر $': rate > 0 ? m.totalYER / rate : 0,
        إجمالي_USD: totalUSD,
        rate,
        hasRate: rate > 0
      };
    });
  }, [months, getRate]);

  const grandTotalYER = chartData.reduce((s, m) => s + m.إجمالي_YER, 0);
  const grandTotalUSD = chartData.reduce((s, m) => s + m.إجمالي_USD, 0);
  const monthsWithRate = chartData.filter((m) => m.hasRate).length;

  const isUSD = currency === 'usd';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-ink">مقارنة الشهور</h1>
          <p className="text-sm text-muted mt-0.5">مجموع ومقارنة الدخل الشهري مع تحويل العملة</p>
        </div>
        <Select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-44">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
      </div>

      {/* Currency toggle */}
      <div className="flex items-center gap-3 bg-white rounded-xl p-1 border border-primary-100 w-fit">
        <button
          onClick={() => setCurrency('yer')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${!isUSD ? 'bg-primary-600 text-white' : 'text-muted hover:text-ink'}`}
        >
          ريال يمني
        </button>
        <button
          onClick={() => setCurrency('usd')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${isUSD ? 'bg-accent-500 text-white' : 'text-muted hover:text-ink'}`}
        >
          <DollarSign size={14} /> دولار
        </button>
      </div>

      {/* Annual totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-4 text-center ${!isUSD ? 'bg-primary-50' : 'bg-primary-50/40'}`}>
          <p className="text-xs text-muted mb-1">إجمالي السنة (ريال)</p>
          <p className="text-lg font-extrabold text-primary-700 tnum">{formatYER(grandTotalYER)}</p>
          {monthsWithRate < 12 && (
            <p className="text-xs text-muted mt-0.5">({monthsWithRate} شهر بسعر صرف)</p>
          )}
        </div>
        <div className={`rounded-xl p-4 text-center ${isUSD ? 'bg-accent-400/15' : 'bg-accent-400/5'}`}>
          <p className="text-xs text-muted mb-1">إجمالي السنة (دولار تقريبي)</p>
          <p className="text-lg font-extrabold text-accent-600 tnum">{formatUSD(grandTotalUSD)}</p>
          {monthsWithRate === 0 && <p className="text-xs text-muted mt-0.5">راتب فقط (لا يوجد سعر صرف)</p>}
        </div>
      </div>

      {/* Chart */}
      <Card>
        <SectionTitle icon={TrendingUp} title={isUSD ? 'الدخل الشهري بالدولار' : 'الدخل الشهري بالريال'} />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAF3F2" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} width={45} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v} />
              <Tooltip formatter={(v, name) => isUSD ? formatUSD(v) : formatYER(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {isUSD ? (
                <>
                  <Bar dataKey="راتب $" stackId="a" fill="#C9962C" />
                  <Bar dataKey="دخل آخر $" stackId="a" fill="#4C8C8B" radius={[4, 4, 0, 0]} />
                </>
              ) : (
                <>
                  <Bar dataKey="استدعاءات" stackId="a" fill="#4C8C8B" />
                  <Bar dataKey="أدوية" stackId="a" fill="#C9962C" />
                  <Bar dataKey="نسب ثابتة" stackId="a" fill="#6B5CA5" />
                  <Bar dataKey="راتب (محوّل)" stackId="a" fill="#E8A838" radius={[4, 4, 0, 0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Monthly table with exchange rate input */}
      <Card>
        <SectionTitle icon={RefreshCw} title="سعر الصرف الشهري" subtitle="أدخل سعر صرف الريال مقابل الدولار لكل شهر للحصول على الإجمالي بالدولار" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-primary-50 text-primary-700">
                <th className="py-2 px-3 text-right font-semibold">الشهر</th>
                <th className="py-2 px-3 text-right font-semibold">دخل ريال</th>
                <th className="py-2 px-3 text-right font-semibold">راتب $</th>
                <th className="py-2 px-3 text-right font-semibold whitespace-nowrap">سعر الصرف (ر.ي/$)</th>
                <th className="py-2 px-3 text-right font-semibold">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100/60">
              {chartData.map((row) => {
                const totalDisplay = isUSD
                  ? formatUSD(row.إجمالي_USD)
                  : formatYER(row.إجمالي_YER);
                return (
                  <tr key={`${row.year}-${row.month}`} className="bg-white">
                    <td className="py-2 px-3 font-semibold text-ink whitespace-nowrap">
                      {arabicMonthName(row.month)} {row.year}
                    </td>
                    <td className="py-2 px-3 tnum text-primary-700 text-xs">
                      {formatYER(months.find((m) => m.year === row.year && m.month === row.month)?.totalYER || 0)}
                    </td>
                    <td className="py-2 px-3 tnum text-accent-600 text-xs font-semibold">
                      {formatUSD(months.find((m) => m.year === row.year && m.month === row.month)?.salaryUSD || 0)}
                    </td>
                    <td className="py-2 px-2">
                      <NumberInput
                        value={row.rate || ''}
                        onChange={(e) => setRate(row.year, row.month, e.target.value)}
                        placeholder="مثال: 530"
                        className="py-1.5 text-xs w-24"
                      />
                    </td>
                    <td className="py-2 px-3 font-bold tnum whitespace-nowrap">
                      {row.hasRate || !isUSD
                        ? <span className={isUSD ? 'text-accent-600' : 'text-primary-700'}>{totalDisplay}</span>
                        : <span className="text-muted text-xs">أدخل سعر الصرف</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
