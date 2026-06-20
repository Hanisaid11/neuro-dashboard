import React from 'react';
import { LayoutDashboard, Wallet, Scissors, CalendarRange, CloudCog, Brain, TableProperties } from 'lucide-react';

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { key: 'monthly', label: 'المدخولات الشهرية', icon: TableProperties },
  { key: 'income', label: 'إدخال المدخولات', icon: Wallet },
  { key: 'operations', label: 'العمليات', icon: Scissors },
  { key: 'leave', label: 'الإجازات والإعدادات', icon: CalendarRange },
  { key: 'sync', label: 'المزامنة والنسخ الاحتياطي', icon: CloudCog }
];

export default function Layout({ active, onNavigate, children }) {
  const activeItem = NAV_ITEMS.find((i) => i.key === active);

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-72 bg-primary-700 text-white sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/10">
            <Brain size={22} />
          </span>
          <div>
            <p className="font-extrabold text-lg leading-tight">لوحة المالية</p>
            <p className="text-xs text-primary-100/80">جراحة الأعصاب</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive ? 'bg-white text-primary-700 shadow-card' : 'text-primary-50 hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-6 py-4 text-xs text-primary-100/70 border-t border-white/10 flex items-center justify-between">
          <span>السنة المالية: ١ أبريل – ٣١ مارس</span>
          <span className="bg-white/10 px-2 py-0.5 rounded-full font-bold">v1</span>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-primary-100/60 px-4 sm:px-6 py-4 flex items-center gap-3 md:hidden">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50 text-primary-600">
            <Brain size={18} />
          </span>
          <div>
            <p className="font-bold text-ink leading-tight">{activeItem?.label}</p>
            <p className="text-xs text-muted">لوحة المالية - جراحة الأعصاب</p>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-5 pb-28 md:pb-8 max-w-6xl w-full mx-auto">{children}</main>

        {/* Mobile bottom nav — 6 items, so use tiny labels */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-primary-100/60 flex justify-between px-0.5 py-1 z-20">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            // Short labels for the cramped mobile bar
            const SHORT = {
              dashboard: 'الرئيسية',
              monthly: 'الشهري',
              income: 'إدخال',
              operations: 'العمليات',
              leave: 'الإجازات',
              sync: 'المزامنة'
            };
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-semibold ${
                  isActive ? 'text-primary-600' : 'text-muted'
                }`}
              >
                <Icon size={17} />
                <span className="leading-tight text-center">{SHORT[item.key]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
