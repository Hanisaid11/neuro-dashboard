import React, { useState } from 'react';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import IncomeEntry from './pages/IncomeEntry.jsx';
import OperationsLog from './pages/OperationsLog.jsx';
import LeaveSettings from './pages/LeaveSettings.jsx';
import SyncBackup from './pages/SyncBackup.jsx';

export default function App() {
  const [page, setPage] = useState('dashboard');

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
