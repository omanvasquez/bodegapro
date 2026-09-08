import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  browserLocalPersistence, 
  setPersistence,
  Auth
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore';

// Configuración cargada desde variables de entorno .env
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "bodegapro-app.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "bodegapro-app",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "bodegapro-app.appspot.com",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "TU_API_KEY" && 
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Persistencia local estricta para que no cierre sesión offline
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("No se pudo establecer persistencia de auth local", err);
    });

    // Firestore con persistencia IndexedDB multi-pestaña para modo offline continuo
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.error("Error inicializando Firebase:", err);
  }
}

export { app, auth, db, googleProvider };
