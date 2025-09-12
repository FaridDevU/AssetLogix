// 🚫 FIREBASE BLOCKER - Intercepta y previene cualquier inicialización de Firebase
// Este archivo debe ser importado ANTES que cualquier otro código Firebase

console.warn("🚫 Firebase Blocker activado - interceptando inicializaciones");

// Interceptar imports de Firebase en el objeto global
if (typeof window !== 'undefined') {
  // Bloquear Firebase en el objeto window
  (window as any).firebase = undefined;
  
  // Interceptar cualquier intento de cargar Firebase
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0] as string;
    if (typeof url === 'string' && url.includes('firebase')) {
      console.warn('🚫 Blocked Firebase fetch:', url);
      return Promise.reject(new Error('Firebase blocked by firebase-blocker.ts'));
    }
    return originalFetch.apply(this, args);
  };
}

// Crear un proxy para interceptar cualquier import de Firebase
const createFirebaseBlocker = () => {
  return new Proxy({}, {
    get(target, prop) {
      console.warn(`🚫 Attempted to access Firebase property: ${String(prop)}`);
      throw new Error(`Firebase is disabled. Attempted to access: ${String(prop)}`);
    }
  });
};

// Exportar stubs para todas las funciones de Firebase
export const initializeApp = () => {
  throw new Error("🚫 Firebase initializeApp blocked by firebase-blocker.ts");
};

export const getAuth = () => {
  throw new Error("🚫 Firebase getAuth blocked by firebase-blocker.ts");
};

export const getApp = () => {
  throw new Error("🚫 Firebase getApp blocked by firebase-blocker.ts");
};

export const getApps = () => {
  throw new Error("🚫 Firebase getApps blocked by firebase-blocker.ts");
};

export const GoogleAuthProvider = function() {
  throw new Error("🚫 Firebase GoogleAuthProvider blocked by firebase-blocker.ts");
};

export const signInWithPopup = () => {
  throw new Error("🚫 Firebase signInWithPopup blocked by firebase-blocker.ts");
};

// Interceptor para module.exports si es CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = createFirebaseBlocker();
}

// Interceptor para export default si es ES modules
export default createFirebaseBlocker();
