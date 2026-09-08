import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, TenantStatus } from '../types';
import { dbInit, getLocalData, saveLocalData } from '../services/localDatabase';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  user: { email: string; name: string; photoURL?: string } | null;
  tenant: Tenant | null;
  authLoading: boolean;
  isSuperAdmin: boolean;
  isSubscriptionActive: boolean;
  isPendingApproval: boolean;
  needsRegistration: boolean;
  trialDaysRemaining: number;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  registerTenant: (data: { name: string; ownerName: string; phone: string }) => void;
  updateTenantStatus: (tenantId: string, newStatus: TenantStatus, trialDays?: number) => void;
  allTenantsForSuperadmin: Tenant[];
}

const SUPERADMIN_EMAIL = 'omanjrvasquez@gmail.com';

const DEFAULT_TENANTS_LIST: Tenant[] = [
  {
    id: 'tenant_cojedes_01',
    name: 'Bodega y Víveres Don Pedro',
    ownerName: 'Oman Vásquez',
    ownerEmail: 'omanjrvasquez@gmail.com',
    phone: '04124169949',
    status: 'activo',
    trialEndsAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
  },
  {
    id: 'tenant_tinaco_02',
    name: 'Abasto La Bendición (Tinaco)',
    ownerName: 'José Gregorio Silva',
    ownerEmail: 'abastolabendicion@gmail.com',
    phone: '04145892211',
    status: 'activo',
    trialEndsAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 35 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'tenant_sancarlos_03',
    name: 'Minimarket Los Samanes (San Carlos)',
    ownerName: 'Mariángel González',
    ownerEmail: 'lossamanes.sc@gmail.com',
    phone: '04245551234',
    status: 'trial',
    trialEndsAt: Date.now() + 6 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'tenant_tinaquillo_04',
    name: 'Bodega Central Tinaquillo',
    ownerName: 'Ramón Castillo',
    ownerEmail: 'bodegacentralt@gmail.com',
    phone: '04126789012',
    status: 'inactivo',
    trialEndsAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado de usuario inicialmente NULL (nadie entra logueado por defecto)
  const [user, setUser] = useState<{ email: string; name: string; photoURL?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  const [tenantsList, setTenantsList] = useState<Tenant[]>(() =>
    getLocalData<Tenant[]>('tenants_registry', DEFAULT_TENANTS_LIST)
  );

  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  const saveTenants = (updated: Tenant[]) => {
    setTenantsList(updated);
    saveLocalData('tenants_registry', updated);
  };

  // Escuchar estado real de autenticación de Firebase
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        if (firebaseUser && firebaseUser.email) {
          const email = firebaseUser.email.toLowerCase();
          const currentUserObj = {
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Comerciante',
            photoURL: firebaseUser.photoURL || undefined,
          };
          setUser(currentUserObj);

          // Buscar si ya tiene bodega registrada
          const existingTenant = tenantsList.find((t) => t.ownerEmail.toLowerCase() === email);
          if (existingTenant) {
            setCurrentTenant(existingTenant);
          } else if (email === SUPERADMIN_EMAIL.toLowerCase()) {
            // El superadmin tiene su bodega base
            const adminTenant = tenantsList[0];
            setCurrentTenant(adminTenant);
          } else {
            setCurrentTenant(null);
          }
        } else {
          setUser(null);
          setCurrentTenant(null);
        }
        setAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, [tenantsList]);

  const isSuperAdmin = Boolean(user && user.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase());

  // ¿Necesita registrar su bodega?
  const needsRegistration = Boolean(user && !isSuperAdmin && !currentTenant);

  // ¿Está pendiente de aprobación por Oman?
  const isPendingApproval = Boolean(currentTenant && currentTenant.status === 'pendiente');

  // Días de prueba restantes
  const trialDaysRemaining = currentTenant?.trialEndsAt
    ? Math.max(0, Math.ceil((currentTenant.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Acceso activo al sistema
  const isSubscriptionActive = Boolean(
    isSuperAdmin ||
    (currentTenant && currentTenant.status === 'activo') ||
    (currentTenant && currentTenant.status === 'trial' && trialDaysRemaining > 0)
  );

  const loginWithGoogle = async () => {
    if (auth && googleProvider) {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user && res.user.email) {
        const email = res.user.email.toLowerCase();
        const userObj = {
          email: res.user.email,
          name: res.user.displayName || 'Comerciante',
          photoURL: res.user.photoURL || undefined,
        };
        setUser(userObj);

        const existing = tenantsList.find((t) => t.ownerEmail.toLowerCase() === email);
        if (existing) {
          setCurrentTenant(existing);
        }
      }
    } else {
      // Fallback si no hay auth
      throw new Error('Firebase Auth no está configurado.');
    }
  };

  const logout = async () => {
    if (auth) {
      await fbSignOut(auth);
    }
    setUser(null);
    setCurrentTenant(null);
  };

  // Registrar nueva bodega (queda en estado PENDIENTE)
  const registerTenant = (data: { name: string; ownerName: string; phone: string }) => {
    if (!user) return;

    const newTenant: Tenant = {
      id: 'tenant_' + Date.now().toString(36),
      name: data.name,
      ownerName: data.ownerName,
      ownerEmail: user.email,
      phone: data.phone,
      status: 'pendiente', // Requiere que Oman le dé acceso
      trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    };

    const updated = [newTenant, ...tenantsList];
    saveTenants(updated);
    setCurrentTenant(newTenant);
  };

  // Superadmin activa/suspende o asigna prueba a cualquier tenant
  const updateTenantStatus = (
    tenantId: string,
    newStatus: TenantStatus,
    trialDays: number = 14
  ) => {
    const updated = tenantsList.map((t) => {
      if (t.id === tenantId) {
        return {
          ...t,
          status: newStatus,
          trialEndsAt:
            newStatus === 'trial'
              ? Date.now() + trialDays * 24 * 60 * 60 * 1000
              : t.trialEndsAt,
        };
      }
      return t;
    });

    saveTenants(updated);

    if (currentTenant?.id === tenantId) {
      const activeObj = updated.find((t) => t.id === tenantId) || null;
      setCurrentTenant(activeObj);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant: currentTenant,
        authLoading,
        isSuperAdmin,
        isSubscriptionActive,
        isPendingApproval,
        needsRegistration,
        trialDaysRemaining,
        loginWithGoogle,
        logout,
        registerTenant,
        updateTenantStatus,
        allTenantsForSuperadmin: tenantsList,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
