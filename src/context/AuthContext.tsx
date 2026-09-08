import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, TenantStatus } from '../types';
import { dbInit, getLocalData, saveLocalData } from '../services/localDatabase';
import { auth, db, googleProvider } from '../services/firebase';
import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot 
} from 'firebase/firestore';

interface AuthContextType {
  user: { uid?: string; email: string; name: string; photoURL?: string } | null;
  tenant: Tenant | null;
  authLoading: boolean;
  isSuperAdmin: boolean;
  isSubscriptionActive: boolean;
  isPendingApproval: boolean;
  needsRegistration: boolean;
  trialDaysRemaining: number;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  registerTenant: (data: { name: string; ownerName: string; phone: string }) => Promise<void>;
  updateTenantProfile: (data: { name: string; ownerName: string; phone: string }) => Promise<void>;
  updateTenantStatus: (tenantId: string, newStatus: TenantStatus, trialDays?: number) => Promise<void>;
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
  const [user, setUser] = useState<{ uid?: string; email: string; name: string; photoURL?: string } | null>(null);
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
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    let unsubFirestoreTenants: (() => void) | null = null;
    let unsubMyTenant: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (unsubFirestoreTenants) {
        unsubFirestoreTenants();
        unsubFirestoreTenants = null;
      }
      if (unsubMyTenant) {
        unsubMyTenant();
        unsubMyTenant = null;
      }

      if (firebaseUser && firebaseUser.email) {
        const email = firebaseUser.email.toLowerCase();
        const currentUserObj = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'Comerciante',
          photoURL: firebaseUser.photoURL || undefined,
        };
        setUser(currentUserObj);

        // Caso 1: Es Superadmin (Oman)
        if (email === SUPERADMIN_EMAIL.toLowerCase()) {
          const localSavedTenant = dbInit.getTenant();
          const adminDefaultTenant: Tenant = {
            id: localSavedTenant?.id || 'tenant_cojedes_01',
            name: localSavedTenant?.name || 'Bodega y Víveres Don Pedro',
            ownerName: localSavedTenant?.ownerName || 'Oman Vásquez',
            ownerEmail: 'omanjrvasquez@gmail.com',
            phone: localSavedTenant?.phone || '04124169949',
            status: 'activo',
            trialEndsAt: localSavedTenant?.trialEndsAt || (Date.now() + 365 * 24 * 60 * 60 * 1000),
            createdAt: localSavedTenant?.createdAt || Date.now(),
          };
          setCurrentTenant(adminDefaultTenant);

          // Escuchar en TIEMPO REAL toda la colección 'tenants' desde Firestore
          if (db) {
            unsubFirestoreTenants = onSnapshot(collection(db, 'tenants'), (snapshot) => {
              const cloudTenants: Tenant[] = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data() as Tenant;
                cloudTenants.push(data);
              });

              // Si hay registros en Firestore, combinarlos con los locales
              if (cloudTenants.length > 0) {
                // Combinar sin duplicados
                const map = new Map<string, Tenant>();
                DEFAULT_TENANTS_LIST.forEach((t) => map.set(t.id, t));
                cloudTenants.forEach((t) => map.set(t.id, t));
                const merged = Array.from(map.values());
                saveTenants(merged);

                // Si existe el tenant del superadmin en cloud, sincronizarlo
                const adminCloud = cloudTenants.find(
                  (t) => t.ownerEmail.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() || t.id === 'tenant_cojedes_01'
                );
                if (adminCloud) {
                  setCurrentTenant(adminCloud);
                  dbInit.saveTenant(adminCloud);
                }
              }
            }, (error) => {
              console.warn('Error escuchando tenants en Firestore:', error);
            });
          }
        } else {
          // Caso 2: Es un comerciante regular
          // Escuchar su propio documento en Firestore en tiempo real (id = uid)
          if (db) {
            unsubMyTenant = onSnapshot(doc(db, 'tenants', firebaseUser.uid), (docSnap) => {
              if (docSnap.exists()) {
                const tenantData = docSnap.data() as Tenant;
                setCurrentTenant(tenantData);
              } else {
                // Si no está por uid, buscar en tenantsList local
                const existing = tenantsList.find((t) => t.ownerEmail.toLowerCase() === email);
                setCurrentTenant(existing || null);
              }
            }, (error) => {
              console.warn('Error al leer tenant personal en Firestore:', error);
              const existing = tenantsList.find((t) => t.ownerEmail.toLowerCase() === email);
              setCurrentTenant(existing || null);
            });
          } else {
            const existing = tenantsList.find((t) => t.ownerEmail.toLowerCase() === email);
            setCurrentTenant(existing || null);
          }
        }
      } else {
        setUser(null);
        setCurrentTenant(null);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubFirestoreTenants) unsubFirestoreTenants();
      if (unsubMyTenant) unsubMyTenant();
    };
  }, []);

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
      await signInWithPopup(auth, googleProvider);
    } else {
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

  // Registrar nueva bodega (se sube a Firestore en tiempo real y queda en estado PENDIENTE)
  const registerTenant = async (data: { name: string; ownerName: string; phone: string }) => {
    if (!user) return;

    // Usar el UID del usuario como ID del tenant para indexación directa y segura
    const tenantId = user.uid || ('tenant_' + Date.now().toString(36));

    const newTenant: Tenant = {
      id: tenantId,
      name: data.name,
      ownerName: data.ownerName,
      ownerEmail: user.email,
      phone: data.phone,
      status: 'pendiente', // Requiere que Oman le dé acceso
      trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    };

    // 1. Guardar en Firestore para que Oman lo vea en cualquier dispositivo al instante
    if (db) {
      try {
        await setDoc(doc(db, 'tenants', tenantId), newTenant);
      } catch (err) {
        console.error('Error guardando en Firestore tenants:', err);
      }
    }

    // 2. Guardar en caché local
    const updated = [newTenant, ...tenantsList.filter((t) => t.id !== tenantId)];
    saveTenants(updated);
    setCurrentTenant(newTenant);
  };

  // Superadmin activa/suspende o asigna prueba a cualquier tenant
  const updateTenantStatus = async (
    tenantId: string,
    newStatus: TenantStatus,
    trialDays: number = 14
  ) => {
    const newTrialEndsAt =
      newStatus === 'trial'
        ? Date.now() + trialDays * 24 * 60 * 60 * 1000
        : undefined;

    // 1. Actualizar en Firestore en la nube
    if (db) {
      try {
        const payload: any = { status: newStatus };
        if (newTrialEndsAt) payload.trialEndsAt = newTrialEndsAt;
        await updateDoc(doc(db, 'tenants', tenantId), payload);
      } catch (err) {
        console.error('Error actualizando status en Firestore:', err);
      }
    }

    // 2. Actualizar estado local inmediatamente
    const updated = tenantsList.map((t) => {
      if (t.id === tenantId) {
        return {
          ...t,
          status: newStatus,
          trialEndsAt: newTrialEndsAt || t.trialEndsAt,
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

  // Actualizar perfil de la bodega (nombre comercial, dueño, teléfono)
  const updateTenantProfile = async (data: { name: string; ownerName: string; phone: string }) => {
    if (!currentTenant) return;

    const updated: Tenant = {
      ...currentTenant,
      name: data.name.trim() || currentTenant.name,
      ownerName: data.ownerName.trim() || currentTenant.ownerName,
      phone: data.phone.trim() || currentTenant.phone,
    };

    // 1. Actualizar estado local inmediatamente
    setCurrentTenant(updated);
    dbInit.saveTenant(updated);

    // 2. Actualizar registro local de tenants
    const nextList = tenantsList.map((t) => (t.id === updated.id ? updated : t));
    if (!nextList.some((t) => t.id === updated.id)) {
      nextList.push(updated);
    }
    saveTenants(nextList);

    // 3. Persistir en Firestore en la nube
    if (db && updated.id) {
      try {
        await setDoc(doc(db, 'tenants', updated.id), updated, { merge: true });
      } catch (err) {
        console.warn('Error al persistir perfil de bodega en Firestore:', err);
      }
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
        updateTenantProfile,
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
