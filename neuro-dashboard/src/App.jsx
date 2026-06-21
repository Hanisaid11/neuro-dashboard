import React, { useEffect, useState } from 'react';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MonthlyBreakdown from './pages/MonthlyBreakdown.jsx';
import IncomeEntry from './pages/IncomeEntry.jsx';
import OperationsLog from './pages/OperationsLog.jsx';
import LeaveSettings from './pages/LeaveSettings.jsx';
import SyncBackup from './pages/SyncBackup.jsx';
import { seedHistoricalSalaryIfNeeded } from './db/actions.js';

export default function App() {
  // Open directly on income/oncall so the doctor can record a call-out immediately
  const [page, setPage] = useState('income');
  const [incomeTab, setIncomeTab] = useState('oncall');

  useEffect(() => { seedHistoricalSalaryIfNeeded(); }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }, []);

  function navigateTo(p, tab) {
    setPage(p);
    if (p === 'income' && tab) setIncomeTab(tab);
  }

  return (
    <Layout active={page} onNavigate={navigateTo}>
      {page === 'dashboard'   && <Dashboard onNavigate={navigateTo} />}
      {page === 'monthly'     && <MonthlyBreakdown />}
      {page === 'income'      && <IncomeEntry defaultTab={incomeTab} onTabChange={setIncomeTab} />}
      {page === 'operations'  && <OperationsLog />}
      {page === 'leave'       && <LeaveSettings />}
      {page === 'sync'        && <SyncBackup />}
    </Layout>
  );
}
