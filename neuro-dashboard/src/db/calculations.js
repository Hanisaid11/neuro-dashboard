import {
  listFiscalMonths,
  getFiscalYearRange,
  isDateInRange,
  daysInMonth
} from './fiscalYear.js';

// ---------------------------------------------------------------------------
// Rule 1: any day that falls inside a recorded leave period contributes ONLY
// the base salary - daily entries (on-call, medications) dated inside a
// leave period are excluded from totals, and a month that is *entirely*
// covered by leave also drops its fixed monthly percentages to zero.
//
// Rule 2: a fiscal year that closes with zero recorded leave automatically
// receives one extra month of salary as a bonus.
// ---------------------------------------------------------------------------

export function isDateOnLeave(dateLike, leavePeriods = []) {
  const t = new Date(dateLike).setHours(12, 0, 0, 0);
  return leavePeriods.some((p) => {
    const start = new Date(p.startDate).setHours(0, 0, 0, 0);
    const end = new Date(p.endDate).setHours(23, 59, 59, 999);
    return t >= start && t <= end;
  });
}

export function isMonthFullyOnLeave(year, month, leavePeriods = []) {
  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day++) {
    const d = new Date(year, month - 1, day);
    if (!isDateOnLeave(d, leavePeriods)) return false;
  }
  return true;
}

export function fiscalYearOverlapsLeave(label, leavePeriods = []) {
  const { start, end } = getFiscalYearRange(label);
  return leavePeriods.some((p) => {
    const pStart = new Date(p.startDate);
    const pEnd = new Date(p.endDate);
    return pStart <= end && pEnd >= start;
  });
}

const emptyFixed = () => ({
  hospitalPct: 0,
  mriPct: 0,
  nervePct: 0,
  eegPct: 0,
  implantsPct: 0
});

export function computeMonthData(year, month, data) {
  const { onCallEntries = [], medicationEntries = [], fixedPercentages = [], monthlySalaries = [], leavePeriods = [] } = data;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const salaryRow = monthlySalaries.find((s) => s.year === year && s.month === month);
  const salary = salaryRow ? Number(salaryRow.amount) || 0 : 0;

  const monthOnCall = onCallEntries.filter((e) => isDateInRange(e.date, monthStart, monthEnd));
  const onCallCounted = monthOnCall.filter((e) => !isDateOnLeave(e.date, leavePeriods));
  const oldHospitalTotal = onCallCounted
    .filter((e) => e.hospital === 'old')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const newHospitalTotal = onCallCounted
    .filter((e) => e.hospital === 'new')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const onCallTotal = oldHospitalTotal + newHospitalTotal;

  const monthMeds = medicationEntries.filter((e) => isDateInRange(e.date, monthStart, monthEnd));
  const medsCounted = monthMeds.filter((e) => !isDateOnLeave(e.date, leavePeriods));
  const medicationsTotal = medsCounted.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const fullyOnLeave = isMonthFullyOnLeave(year, month, leavePeriods);
  const fixedRow = fixedPercentages.find((f) => f.year === year && f.month === month);
  const fixed = fullyOnLeave ? emptyFixed() : { ...emptyFixed(), ...(fixedRow || {}) };
  const fixedTotal = Object.values(fixed).reduce((s, v) => s + (Number(v) || 0), 0);

  const excludedCount =
    (monthOnCall.length - onCallCounted.length) + (monthMeds.length - medsCounted.length);

  const total = salary + onCallTotal + medicationsTotal + fixedTotal;

  return {
    year,
    month,
    salary,
    oldHospitalTotal,
    newHospitalTotal,
    onCallTotal,
    medicationsTotal,
    fixed,
    fixedTotal,
    total,
    fullyOnLeave,
    excludedCount
  };
}

export function computeFiscalYearSummary(label, data) {
  const months = listFiscalMonths(label).map((m) => computeMonthData(m.year, m.month, data));
  const hasLeaveOverlap = fiscalYearOverlapsLeave(label, data.leavePeriods || []);

  const sumField = (key) => months.reduce((s, m) => s + m[key], 0);
  const subtotals = {
    salary: sumField('salary'),
    oldHospitalTotal: sumField('oldHospitalTotal'),
    newHospitalTotal: sumField('newHospitalTotal'),
    onCallTotal: sumField('onCallTotal'),
    medicationsTotal: sumField('medicationsTotal'),
    fixedTotal: sumField('fixedTotal'),
    hospitalPct: months.reduce((s, m) => s + m.fixed.hospitalPct, 0),
    mriPct: months.reduce((s, m) => s + m.fixed.mriPct, 0),
    nervePct: months.reduce((s, m) => s + m.fixed.nervePct, 0),
    eegPct: months.reduce((s, m) => s + m.fixed.eegPct, 0),
    implantsPct: months.reduce((s, m) => s + m.fixed.implantsPct, 0)
  };

  let bonus = 0;
  let bonusEligible = false;
  if (!hasLeaveOverlap) {
    const { end } = getFiscalYearRange(label);
    const isComplete = new Date() > end;
    const salaryValues = months.map((m) => m.salary).filter((s) => s > 0);
    const avgSalary = salaryValues.length
      ? salaryValues.reduce((a, b) => a + b, 0) / salaryValues.length
      : 0;
    bonusEligible = isComplete && avgSalary > 0;
    if (bonusEligible) bonus = avgSalary;
  }

  const grandTotal = months.reduce((s, m) => s + m.total, 0) + bonus;

  return { label, months, hasLeaveOverlap, bonus, bonusEligible, grandTotal, subtotals };
}

export function operationsStats(operations = [], range = null) {
  const filtered = range
    ? operations.filter((o) => isDateInRange(o.date, range.start, range.end))
    : operations;

  const byType = {};
  const byMonth = {};
  filtered.forEach((o) => {
    byType[o.operationType] = (byType[o.operationType] || 0) + 1;
    const d = new Date(o.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  });

  const typeBreakdown = Object.entries(byType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: filtered.length,
    typeBreakdown,
    mostFrequent: typeBreakdown[0] || null,
    byMonth
  };
}
