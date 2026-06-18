import React, { useEffect, useState } from 'react';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import IncomeEntry from './pages/IncomeEntry.jsx';
import OperationsLog from './pages/OperationsLog.jsx';
import LeaveSettings from './pages/LeaveSettings.jsx';
import SyncBackup from './pages/SyncBackup.jsx';
import { seedHistoricalSalaryIfNeeded } from './db/actions.js';

export default function App() {
  const [page, setPage] = useState('dashboard');

  // Runs once ever (guarded by an appMeta flag inside the function itself)
  // to pre-fill the historical USD salary the user specified.
  useEffect(() => {
    seedHistoricalSalaryIfNeeded();
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }, []);

  return (
    <Layout active={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'income' && <IncomeEntry />}
      {page === 'operations' && <OperationsLog />}
      {page === 'leave' && <LeaveSettings />}
      {page === 'sync' && <SyncBackup />}
    </Layout>
  );
}
