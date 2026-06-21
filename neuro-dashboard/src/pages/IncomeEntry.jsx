import React, { useState } from 'react';
import { Wallet, Stethoscope, Pill, Percent, Camera } from 'lucide-react';
import SalaryTab from '../components/income/SalaryTab.jsx';
import OnCallTab from '../components/income/OnCallTab.jsx';
import MedicationsTab from '../components/income/MedicationsTab.jsx';
import FixedPercentagesTab from '../components/income/FixedPercentagesTab.jsx';
import IncomePhotoImport from '../components/income/IncomePhotoImport.jsx';

const TABS = [
  { key: 'oncall',      label: 'الاستدعاءات',      icon: Stethoscope, Component: OnCallTab },
  { key: 'salary',      label: 'الراتب',             icon: Wallet,      Component: SalaryTab },
  { key: 'medications', label: 'نسب أدوية',          icon: Pill,        Component: MedicationsTab },
  { key: 'fixed',       label: 'نسب ثابتة',          icon: Percent,     Component: FixedPercentagesTab },
  { key: 'photo',       label: 'استيراد بالصورة',    icon: Camera,      Component: IncomePhotoImport },
];

export default function IncomeEntry({ defaultTab = 'oncall', onTabChange }) {
  const [tab, setTab] = useState(defaultTab);

  function switchTab(key) {
    setTab(key);
    onTabChange?.(key);
  }

  const Active = TABS.find((t) => t.key === tab)?.Component ?? TABS[0].Component;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">المدخولات</h1>
        <p className="text-sm text-muted mt-0.5">سجّل كل مصادر الدخل بشكل يومي أو إجمالي شهري</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors snap-start ${
                isActive
                  ? 'bg-primary-600 text-white shadow-card'
                  : 'bg-white text-muted border border-primary-100 hover:border-primary-300'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Pass initialScrollToday only for the oncall table so it scrolls to today */}
      {tab === 'oncall'      && <OnCallTab initialScrollToday />}
      {tab === 'salary'      && <SalaryTab />}
      {tab === 'medications' && <MedicationsTab />}
      {tab === 'fixed'       && <FixedPercentagesTab />}
      {tab === 'photo'       && <IncomePhotoImport />}
    </div>
  );
}
