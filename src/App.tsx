import React, { useState, useMemo } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { ImportDataTab } from './components/ImportDataTab';
import { FinancialAnalysisTab } from './components/FinancialAnalysisTab';
import { AskFinSightTab } from './components/AskFinSightTab';
import { ScenarioLabTab } from './components/ScenarioLabTab';
import { ForecastsTab } from './components/ForecastsTab';
import { ReportsTab } from './components/ReportsTab';
import { TransactionDrilldownModal } from './components/TransactionDrilldownModal';
import { generateHarbourStackTransactions, HARBOURSTACK_COMPANY_NAME } from './data/harbourstackData';
import { Transaction } from './types/financial';

export default function App() {
  // Global Transactions State (Browser-based state for MVP)
  const [transactions, setTransactions] = useState<Transaction[]>(() => generateHarbourStackTransactions());
  const [companyName, setCompanyName] = useState<string>(HARBOURSTACK_COMPANY_NAME);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // Drilldown modal state
  const [drilldown, setDrilldown] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    transactions: Transaction[];
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    transactions: [],
  });

  // Calculate reporting period string
  const activePeriod = useMemo(() => {
    const years = Array.from(new Set(transactions.map(t => t.year))).sort((a, b) => a - b);
    if (years.length === 0) return 'FY 2024 – FY 2025';
    if (years.length === 1) return `FY ${years[0]}`;
    return `FY ${years[0]} – FY ${years[years.length - 1]}`;
  }, [transactions]);

  // Handle drilldown opening from any tab or chart
  const handleOpenDrilldown = (title: string, subtitle: string, txs: Transaction[]) => {
    setDrilldown({
      isOpen: true,
      title,
      subtitle,
      transactions: txs,
    });
  };

  const handleCloseDrilldown = () => {
    setDrilldown(prev => ({ ...prev, isOpen: false }));
  };

  // Reset to default HarbourStack data
  const handleResetData = () => {
    setTransactions(generateHarbourStackTransactions());
    setCompanyName(HARBOURSTACK_COMPANY_NAME);
  };

  // New import handler
  const handleImportComplete = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    setActiveTab('overview');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Deep Navy Sidebar with "Built by The Fintechs" attribution */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        recordCount={transactions.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <Header
          companyName={companyName}
          setCompanyName={setCompanyName}
          activePeriod={activePeriod}
          transactions={transactions}
          onResetData={handleResetData}
          onNavigateToImport={() => setActiveTab('import')}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              transactions={transactions}
              onDrilldown={handleOpenDrilldown}
            />
          )}

          {activeTab === 'import' && (
            <ImportDataTab
              currentTransactions={transactions}
              onImportComplete={handleImportComplete}
              onDrilldown={handleOpenDrilldown}
            />
          )}

          {activeTab === 'analysis' && (
            <FinancialAnalysisTab
              transactions={transactions}
              onDrilldown={handleOpenDrilldown}
            />
          )}

          {activeTab === 'ask' && (
            <AskFinSightTab
              transactions={transactions}
              companyName={companyName}
            />
          )}

          {activeTab === 'scenario' && (
            <ScenarioLabTab
              transactions={transactions}
              companyName={companyName}
            />
          )}

          {activeTab === 'forecast' && (
            <ForecastsTab
              transactions={transactions}
              companyName={companyName}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              transactions={transactions}
              companyName={companyName}
              activePeriod={activePeriod}
            />
          )}
        </main>
      </div>

      {/* Audit & Transaction Drill-down Modal */}
      <TransactionDrilldownModal
        isOpen={drilldown.isOpen}
        onClose={handleCloseDrilldown}
        title={drilldown.title}
        subtitle={drilldown.subtitle}
        transactions={drilldown.transactions}
      />
    </div>
  );
}
