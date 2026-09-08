import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, TenantStatus } from '../types';
import { dbInit } from '../services/localDatabase';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  user: { email: string; name: string; photoURL?: string } | null;
  tenant: Tenant;
  isSuperAdmin: boolean;
  isSubscriptionActive: boolean;
  trialDaysRemaining: number;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateTenantStatus: (tenantId: string, newStatus: TenantStatus) => void;
  allTenantsForSuperadmin: Tenant[];
}

const SUPERADMIN_EMAIL = 'omanjrvasquez@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant>(() => dbInit.getTenant());
  
  // Usuario inicial de sesión (por defecto Oman Vásquez en entorno de desarrollo/local)
  const [user, setUser] = useState<{ email: string; name: string; photoURL?: string } | null>({
    email: 'omanjrvasquez@gmail.com',
    name: 'Oman Vásquez',
  });

  // Lista simulada de tenants para la vista de Superadmin de Oman
  const [tenantsList, setTenantsList] = useState<Tenant[]>([
    tenant,
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
      status: 'inactivo', // Suscripción vencida
      trialEndsAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    }
  ]);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        if (firebaseUser) {
          setUser({
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Comerciante',
            photoURL: firebaseUser.photoURL || undefined,
          });
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const isSuperAdmin = user?.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();

  // Cálculo de días restantes de prueba
  const trialDaysRemaining = Math.max(
    0,
    Math.ceil((tenant.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24))
  );

  // La suscripción está activa si el status es 'activo', o si es 'trial' con días restantes, o si es superadmin
  const isSubscriptionActive =
    isSuperAdmin ||
    tenant.status === 'activo' ||
    (tenant.status === 'trial' && trialDaysRemaining > 0);

  const loginWithGoogle = async () => {
    if (auth && googleProvider) {
      try {
        const res = await signInWithPopup(auth, googleProvider);
        if (res.user) {
          setUser({
            email: res.user.email || '',
            name: res.user.displayName || 'Comerciante',
            photoURL: res.user.photoURL || undefined,
          });
        }
      } catch (err) {
        console.error('Error al iniciar sesión con Google:', err);
      }
    } else {
      // Modo demo/offline
      setUser({
        email: 'omanjrvasquez@gmail.com',
        name: 'Oman Vásquez',
      });
    }
  };

  const logout = async () => {
    if (auth) {
      await fbSignOut(auth);
    }
    setUser(null);
  };

  const updateTenantStatus = (tenantId: string, newStatus: TenantStatus) => {
    setTenantsList((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status: newStatus } : t))
    );
    if (tenant.id === tenantId) {
      const updated = { ...tenant, status: newStatus };
      setTenant(updated);
      dbInit.saveTenant(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isSuperAdmin,
        isSubscriptionActive,
        trialDaysRemaining,
        loginWithGoogle,
        logout,
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
