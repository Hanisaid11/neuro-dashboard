import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { Wallet, Stethoscope, Pill, Percent, Gift, Scissors, TrendingUp, Plane } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData.js';
import { computeFiscalYearSummary, operationsStats } from '../db/calculations.js';
import { fiscalYearOptions, arabicMonthName, getFiscalYearLabel } from '../db/fiscalYear.js';
import { Card, SectionTitle, Select, Badge, formatUSD, formatYER, EmptyState } from '../components/ui/Controls.jsx';
import FiscalCycleRing from '../components/charts/FiscalCycleRing.jsx';

// YER income streams only - salary/bonus are USD and never mixed in here
const STREAM_COLORS = {
  'استدعاءات - مستشفى قديم': '#4C8C8B',
  'استدعاءات - مستشفى جديد': '#7FB3B0',
  'نسب أدوية': '#C9962C',
  'نسب مستشفى': '#6B5CA5',
  'نسب رنين': '#3D7DB0',
  'نسب تخطيط أعصاب': '#4F9D69',
  'نسب تخطيط دماغ': '#B0563D',
  'نسب براغي وشنتات': '#8A8F45'
};

const TONE_CLASSES = {
  primary: 'bg-primary-50 text-primary-600',
  accent: 'bg-accent-400/15 text-accent-600',
  success: 'bg-success-100 text-success-500'
};

function StatCard({ icon: Icon, label, value, currency = 'yer', tone = 'primary' }) {
  const formatted = currency === 'usd' ? formatUSD(value) : formatYER(value);
  return (
    <Card className="flex items-center gap-3" padded>
      <span className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${TONE_CLASSES[tone] || TONE_CLASSES.primary}`}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted truncate">{label}</p>
        <p className="text-lg font-extrabold text-ink tnum truncate">{formatted}</p>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const data = useFinanceData();
  const allDates = useMemo(
    () => [
      ...data.monthlySalaries.map((s) => new Date(s.year, s.month - 1, 1)),
      ...data.onCallEntries.map((e) => e.date),
      ...data.operations.map((o) => o.date)
    ],
    [data]
  );
  const options = useMemo(() => fiscalYearOptions(allDates), [allDates]);
  const [fiscalYear, setFiscalYear] = useState(getFiscalYearLabel(new Date()));
  const [selectedIndex, setSelectedIndex] = useState(null);

  const summary = useMemo(() => computeFiscalYearSummary(fiscalYear, data), [fiscalYear, data]);
  const opsStats = useMemo(() => operationsStats(data.operations, null), [data.operations]);

  const monthlyChartData = summary.months.map((m) => ({
    name: arabicMonthName(m.month).slice(0, 4),
    'الاستدعاءات': m.onCallTotal,
    'نسب أدوية': m.medicationsTotal,
    'نسب ثابتة': m.fixedTotal
  }));

  const salaryChartData = summary.months.map((m) => ({
    name: arabicMonthName(m.month).slice(0, 4),
    'الراتب': m.salaryUSD
  }));

  const pieData = [
    { name: 'استدعاءات - مستشفى قديم', value: summary.subtotals.oldHospitalTotal },
    { name: 'استدعاءات - مستشفى جديد', value: summary.subtotals.newHospitalTotal },
    { name: 'نسب أدوية', value: summary.subtotals.medicationsTotal },
    { name: 'نسب مستشفى', value: summary.subtotals.hospitalPct },
    { name: 'نسب رنين', value: summary.subtotals.mriPct },
    { name: 'نسب تخطيط أعصاب', value: summary.subtotals.nervePct },
    { name: 'نسب تخطيط دماغ', value: summary.subtotals.eegPct },
    { name: 'نسب براغي وشنتات', value: summary.subtotals.implantsPct }
  ].filter((d) => d.value > 0);

  const opsTypeData = opsStats.typeBreakdown.slice(0, 8).map((t) => ({ name: t.type, عدد: t.count }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-ink">نظرة عامة - السنة المالية</h1>
          <p className="text-sm text-muted mt-0.5">من ١ أبريل إلى ٣١ مارس</p>
        </div>
        <Select value={fiscalYear} onChange={(e) => { setFiscalYear(e.target.value); setSelectedIndex(null); }} className="w-44">
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {summary.hasLeaveOverlap ? (
          <Badge tone="leave"><Plane size={12} /> تم تسجيل إجازة في هذه السنة</Badge>
        ) : summary.bonusEligible ? (
          <Badge tone="success"><Gift size={12} /> مكافأة شهر إضافي مستحقة لعدم وجود إجازات</Badge>
        ) : (
          <Badge tone="muted">السنة المالية لم تكتمل بعد</Badge>
        )}
      </div>

      <Card>
        <FiscalCycleRing
          months={summary.months}
          label={summary.label}
          grandTotalYER={summary.grandTotalYER}
          grandTotalUSD={summary.grandTotalUSD}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard icon={Wallet} label="الراتب الأساسي" value={summary.subtotals.salaryUSD} currency="usd" tone="accent" />
        {summary.bonusUSD > 0 && <StatCard icon={Gift} label="مكافأة عدم السفر" value={summary.bonusUSD} currency="usd" tone="success" />}
        <StatCard icon={Stethoscope} label="إجمالي الاستدعاءات" value={summary.subtotals.onCallTotal} tone="primary" />
        <StatCard icon={Pill} label="نسب الأدوية" value={summary.subtotals.medicationsTotal} tone="accent" />
        <StatCard icon={Percent} label="النسب الثابتة" value={summary.subtotals.fixedTotal} tone="primary" />
        <StatCard icon={TrendingUp} label="إجمالي باقي الدخل" value={summary.grandTotalYER} tone="primary" />
      </div>

      <Card>
        <SectionTitle icon={TrendingUp} title="الدخل الشهري بالريال" subtitle="مقارنة بين الاستدعاءات ونسب الأدوية والنسب الثابتة" />
        <div className="overflow-x-auto">
          <div className="min-w-[640px] h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF3F2" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v) => formatYER(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="الاستدعاءات" stackId="a" fill="#4C8C8B" />
                <Bar dataKey="نسب أدوية" stackId="a" fill="#C9962C" />
                <Bar dataKey="نسب ثابتة" stackId="a" fill="#6B5CA5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={Wallet} title="الراتب الشهري بالدولار" subtitle="عبر السنة المالية المحددة" />
        <div className="overflow-x-auto">
          <div className="min-w-[640px] h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salaryChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF3F2" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v) => formatUSD(v)} />
                <Line type="monotone" dataKey="الراتب" stroke="#C9962C" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <SectionTitle icon={Percent} title="توزيع الدخل السنوي بالريال" subtitle="حسب مصدر الدخل" />
          {pieData.length === 0 ? (
            <EmptyState icon={Percent} title="لا توجد بيانات كافية" hint="أضف مدخولات هذه السنة لعرض التوزيع" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STREAM_COLORS[entry.name] || '#A0AEC0'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatYER(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon={Scissors} title="إحصائيات العمليات" subtitle={`إجمالي ${opsStats.total} عملية مسجّلة`} />
          {opsTypeData.length === 0 ? (
            <EmptyState icon={Scissors} title="لا توجد عمليات مسجلة" hint="سجّل أول عملية من قسم العمليات" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={opsTypeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAF3F2" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="عدد" fill="#0F6B68" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {opsStats.mostFrequent && (
            <p className="text-sm text-muted mt-2">
              العملية الأكثر تكرارًا: <span className="font-bold text-ink">{opsStats.mostFrequent.type}</span> ({opsStats.mostFrequent.count} مرة)
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
