import React from 'react';

export function Card({ children, className = '', padded = true }) {
  return (
    <div className={`bg-white rounded-xl2 shadow-card border border-primary-100/60 ${padded ? 'p-4 sm:p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 text-primary-600">
            <Icon size={20} />
          </span>
        )}
        <div>
          <h2 className="font-bold text-ink text-lg leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Field({ label, hint, children, required }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-1.5">
        {label}
        {required && <span className="text-leave-500 ms-1">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}

const baseInputClasses =
  'w-full rounded-lg border border-primary-100 bg-canvas/40 px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:bg-white focus:border-primary-500 transition-colors tnum';

export function TextInput({ className = '', ...props }) {
  return <input className={`${baseInputClasses} ${className}`} {...props} />;
}

export function NumberInput({ className = '', ...props }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step="0.01"
      className={`${baseInputClasses} ${className}`}
      {...props}
    />
  );
}

export function DateInput({ className = '', ...props }) {
  return <input type="date" className={`${baseInputClasses} ${className}`} {...props} />;
}

export function TextArea({ className = '', ...props }) {
  return <textarea rows={3} className={`${baseInputClasses} resize-none ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${baseInputClasses} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300',
    accent: 'bg-accent-500 text-white hover:bg-accent-600',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50',
    danger: 'bg-leave-500/10 text-leave-500 hover:bg-leave-500/20',
    outline: 'bg-white border border-primary-200 text-primary-700 hover:bg-primary-50'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base'
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ tone = 'primary', children, className = '' }) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700',
    accent: 'bg-accent-400/15 text-accent-600',
    leave: 'bg-leave-100 text-leave-500',
    success: 'bg-success-100 text-success-500',
    muted: 'bg-canvas text-muted'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 text-muted">
      {Icon && <Icon size={32} className="mb-3 opacity-50" />}
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="text-sm mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}

export function formatMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Base salary currency
export function formatUSD(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString('en-US', { maximumFractionDigits: 0 })} $`;
}

// YER currency model:
// • Storage: actual YER value (e.g. 7000)
// • Input:   user types in thousands — typing "7" means 7,000 YER
//            typing "1000" means 1,000,000 YER (= 1 مليون)
// • Display: auto-selects best unit:
//     < 1,000,000 → "7 ألف ر.ي"
//     ≥ 1,000,000 → "1.5 مليون ر.ي"
export function formatYER(n) {
  const num = Number(n) || 0;
  if (num === 0) return '0 ر.ي';
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    const fmt = m % 1 === 0
      ? m.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : m.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return `${fmt} مليون ر.ي`;
  }
  const k = num / 1000;
  const fmt = k % 1 === 0
    ? k.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : k.toLocaleString('en-US', { maximumFractionDigits: 1 });
  return `${fmt} ألف ر.ي`;
}

// Input helpers: user always types in thousands (1 = 1,000 YER)
export function toYERDisplay(storedValue) {
  const n = Number(storedValue) || 0;
  return n === 0 ? '' : String(n / 1000);
}
export function fromYERDisplay(typedValue) {
  return (Number(typedValue) || 0) * 1000;
}

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function MonthYearPicker({ year, month, onYearChange, onMonthChange }) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= currentYear - 6; y--) years.push(y);
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="الشهر">
        <Select value={month} onChange={(e) => onMonthChange(Number(e.target.value))}>
          {MONTHS_AR.map((name, idx) => (
            <option key={idx + 1} value={idx + 1}>{name}</option>
          ))}
        </Select>
      </Field>
      <Field label="السنة">
        <Select value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
