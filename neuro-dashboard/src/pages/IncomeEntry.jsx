import React, { useState } from 'react';
import { Wallet, Stethoscope, Pill, Percent, Camera } from 'lucide-react';
import SalaryTab from '../components/income/SalaryTab.jsx';
import OnCallTab from '../components/income/OnCallTab.jsx';
import MedicationsTab from '../components/income/MedicationsTab.jsx';
import FixedPercentagesTab from '../components/income/FixedPercentagesTab.jsx';
import IncomePhotoImport from '../components/income/IncomePhotoImport.jsx';

const TABS = [
  { key: 'salary', label: 'الراتب', icon: Wallet, Component: SalaryTab },
  { key: 'oncall', label: 'الاستدعاءات', icon: Stethoscope, Component: OnCallTab },
  { key: 'medications', label: 'نسب أدوية', icon: Pill, Component: MedicationsTab },
  { key: 'fixed', label: 'نسب ثابتة', icon: Percent, Component: FixedPercentagesTab },
  { key: 'photo', label: 'استيراد بالصورة', icon: Camera, Component: IncomePhotoImport }
];

export default function IncomeEntry() {
  const [tab, setTab] = useState('salary');
  const Active = TABS.find((t) => t.key === tab).Component;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">المدخولات</h1>
        <p className="text-sm text-muted mt-0.5">سجّل كل مصادر الدخل بشكل يومي أو إجمالي شهري</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                isActive ? 'bg-primary-600 text-white shadow-card' : 'bg-white text-muted border border-primary-100'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      <Active />
    </div>
  );
}
