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

import { LoginView } from './components/auth/LoginView';
import { RegisterTenantView } from './components/auth/RegisterTenantView';
import { PendingApprovalView } from './components/auth/PendingApprovalView';

import { POSView } from './components/pos/POSView';
import { InventoryView } from './components/inventory/InventoryView';
import { CustomersView } from './components/customers/CustomersView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

import { AboutModal } from './components/about/AboutModal';
import { SuperAdminModal } from './components/superadmin/SuperAdminModal';
import { InstallAppModal } from './components/common/InstallAppModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Store } from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    user, 
    authLoading, 
    isSubscriptionActive, 
    isPendingApproval, 
    needsRegistration 
  } = useAuth();

  const {
    isInstalled,
    isInstallable,
    triggerInstall,
    isInstallModalOpen,
    setIsInstallModalOpen,
    deferredPrompt,
  } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<TabType>('pos');
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState<boolean>(false);

  // 1. Pantalla de carga mientras se verifica el token
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-emerald-500 to-emerald-300 flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/30">
          <Store className="w-6 h-6 text-slate-950" />
        </div>
        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Cargando BodegaPro...
        </p>
      </div>
    );
  }

  // 2. Si no hay usuario logueado -> Pantalla de Inicio / Login
  if (!user) {
    return <LoginView />;
  }

  // 3. Si el usuario se logueó por primera vez y no ha registrado su bodega
  if (needsRegistration) {
    return <RegisterTenantView />;
  }

  // 4. Si la bodega está registrada pero en estado PENDIENTE de aprobación
  if (isPendingApproval) {
    return <PendingApprovalView />;
  }

  // 5. Si la suscripción expiró o está inactiva
  if (!isSubscriptionActive) {
    return <SubscriptionBlockedView />;
  }

  // 6. Acceso concedido al Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-brand-pearl selection:bg-brand-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSuperAdmin={() => setIsSuperAdminOpen(true)}
        onOpenInstall={triggerInstall}
        isInstalled={isInstalled}
      />

      {/* Main Layout (Desktop Sidebar + Mobile BottomNav) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSuperAdmin={() => setIsSuperAdminOpen(true)}
          onOpenInstall={triggerInstall}
          isInstalled={isInstalled}
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
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onDirectInstall={triggerInstall}
        hasPrompt={!!deferredPrompt}
      />
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
