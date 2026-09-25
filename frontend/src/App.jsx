import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { PredictorPage } from './pages/PredictorPage';
import { DataEntryPage } from './pages/DataEntryPage';
import { ModelCockpitPage } from './pages/ModelCockpitPage';
import { FeedbackReconciliationPage } from './pages/FeedbackReconciliationPage';
import { MenuPage } from './pages/MenuPage';
import { SustainabilityReportsPage } from './pages/SustainabilityReportsPage';
import { LoginPage } from './pages/LoginPage';

const MainLayout = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Initializing Smart Canteen Waste Predictor...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigateToPredictor={() => setActiveTab('predictor')} />;
      case 'predictor':
        return <PredictorPage />;
      case 'records':
        return <DataEntryPage />;
      case 'feedback':
        return <FeedbackReconciliationPage />;
      case 'model':
        return <ModelCockpitPage />;
      case 'menu':
        return <MenuPage />;
      case 'sustainability':
        return <SustainabilityReportsPage />;
      default:
        return <DashboardPage onNavigateToPredictor={() => setActiveTab('predictor')} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto px-8 py-6 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
