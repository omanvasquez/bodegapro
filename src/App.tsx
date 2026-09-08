import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { InventoryProvider } from './context/InventoryContext';
import { CartProvider } from './context/CartContext';
import { CustomersProvider } from './context/CustomersContext';
import { ReportsProvider } from './context/ReportsContext';

import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav, TabType } from './components/common/BottomNav';
import { SubscriptionBlockedView } from './components/common/SubscriptionBlockedView';

import { POSView } from './components/pos/POSView';
import { InventoryView } from './components/inventory/InventoryView';
import { CustomersView } from './components/customers/CustomersView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

import { AboutModal } from './components/about/AboutModal';
import { SuperAdminModal } from './components/superadmin/SuperAdminModal';

const AppContent: React.FC = () => {
  const { isSubscriptionActive } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pos');
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState<boolean>(false);

  // Si la suscripción expiró y no está activa
  if (!isSubscriptionActive) {
    return <SubscriptionBlockedView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-pearl selection:bg-brand-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSuperAdmin={() => setIsSuperAdminOpen(true)}
      />

      {/* Main Layout (Desktop Sidebar + Mobile BottomNav) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSuperAdmin={() => setIsSuperAdminOpen(true)}
        />

        {/* Center Content View */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'pos' && <POSView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && (
            <SettingsView
              onOpenAbout={() => setIsAboutOpen(true)}
              onOpenSuperAdmin={() => setIsSuperAdminOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <SuperAdminModal isOpen={isSuperAdminOpen} onClose={() => setIsSuperAdminOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <InventoryProvider>
          <CartProvider>
            <CustomersProvider>
              <ReportsProvider>
                <AppContent />
              </ReportsProvider>
            </CustomersProvider>
          </CartProvider>
        </InventoryProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
