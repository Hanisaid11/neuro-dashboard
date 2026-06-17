// ---------------------------------------------------------------------------
// The fiscal year for this practice always runs 1 April -> 31 March.
// All annual aggregation, filtering and the dashboard cycle ring rely on the
// helpers below so the "April -> March" rule only has to be encoded once.
// ---------------------------------------------------------------------------

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function arabicMonthName(month1to12) {
  return ARABIC_MONTHS[month1to12 - 1];
}

// "2024/2025" style label for any JS Date or ISO string
export function getFiscalYearLabel(dateLike) {
  const d = new Date(dateLike);
  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1-12
  return m >= 4 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

// fiscal label for an explicit calendar (year, month1to12) pair
export function fiscalLabelFromYearMonth(year, month) {
  return month >= 4 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

// { start: Date, end: Date } covering 1 April -> 31 March for a given label
export function getFiscalYearRange(label) {
  const [startYear] = label.split('/').map(Number);
  const start = new Date(startYear, 3, 1); // April is month index 3
  const end = new Date(startYear + 1, 2, 31); // March is month index 2
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// 0 = April ... 11 = March, used to keep charts/cycle-ring in fiscal order
export function fiscalMonthIndex(month1to12) {
  return month1to12 >= 4 ? month1to12 - 4 : month1to12 + 8;
}

// returns the 12 {year, month, fiscalIndex} entries for a fiscal year label,
// in April -> March order
export function listFiscalMonths(label) {
  const [startYear] = label.split('/').map(Number);
  const months = [];
  for (let i = 0; i < 12; i++) {
    const calMonth = ((3 + i) % 12) + 1;
    const calYear = calMonth >= 4 ? startYear : startYear + 1;
    months.push({ year: calYear, month: calMonth, fiscalIndex: i });
  }
  return months;
}

// builds a descending list of fiscal year labels, most recent first,
// based on the earliest/latest dates seen across the data (with sensible
// fallbacks so a brand-new install still shows the current fiscal year)
export function fiscalYearOptions(referenceDates = []) {
  const now = new Date();
  let minYear = now.getFullYear() - 1;
  let maxYear = now.getFullYear() + 1;
  referenceDates.forEach((d) => {
    const dt = new Date(d);
    if (!isNaN(dt)) {
      const fy = parseInt(getFiscalYearLabel(dt).split('/')[0], 10);
      minYear = Math.min(minYear, fy);
      maxYear = Math.max(maxYear, fy);
    }
  });
  const labels = [];
  for (let y = maxYear; y >= minYear; y--) {
    labels.push(`${y}/${y + 1}`);
  }
  return labels;
}

export function isDateInRange(dateLike, start, end) {
  const d = new Date(dateLike).getTime();
  return d >= new Date(start).getTime() && d <= new Date(end).getTime();
}

export function daysInMonth(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}

export function formatArabicDate(dateLike) {
  const d = new Date(dateLike);
  if (isNaN(d)) return '';
  return `${d.getDate()} ${arabicMonthName(d.getMonth() + 1)} ${d.getFullYear()}`;
}
