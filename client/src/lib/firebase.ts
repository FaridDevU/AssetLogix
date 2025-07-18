import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  User as FirebaseUser 
} from "firebase/auth";

// Extendemos el tipo FirebaseUser para asegurar que email no es nulo
export interface GoogleUser extends FirebaseUser {
  email: string; // Hacemos que email sea siempre string, no null
  displayName: string | null; // Mantenemos displayName como posiblemente nulo
  uid: string; // Aseguramos que uid siempre está presente
}

// 🔍 Verificar los secrets de Firebase
if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID || !import.meta.env.VITE_FIREBASE_APP_ID) {
  console.warn("Faltan variables de entorno de Firebase. Configuración incompleta.");
}

// Configuración completa de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAd4wlsvevu_J4plq-FTEpjLfGUJpFA8Cg", // Configurado manualmente para evitar errores
  authDomain: "managerivumsa.firebaseapp.com", // Configurado manualmente para garantizar exactitud
  projectId: "managerivumsa", // Configurado manualmente
  storageBucket: "managerivumsa.firebasestorage.app", // Configurado manualmente
  messagingSenderId: "811975573778", // Configurado manualmente
  appId: "1:811975573778:web:38eb6ebf18663f9b3a33cb", // Configurado manualmente
  measurementId: "G-1XYBPK6X9Q" // Configurado manualmente
};

// ✅ Inicializar Firebase (comprobando que no exista ya una instancia inicializada)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Obtener la instancia de autenticación
const auth = getAuth(app);

// ✅ Proveedor de Google - Creado correctamente con new GoogleAuthProvider() y sin params
const provider = new GoogleAuthProvider();
// ✅ Eliminamos los addScope() y setCustomParameters() que pueden causar problemas

// Función para autenticar con Google usando Popup
export const signInWithGoogle = async (): Promise<GoogleUser> => {
  try {
    // Ya no es necesario verificar las variables de entorno porque están hardcodeadas
    
    // Verificar que auth y provider existan antes de usarlos
    console.log({ auth, provider });
    
    if (!auth || !provider) {
      throw new Error("Auth o provider no disponibles");
    }
    
    // Mostrar el dominio actual para configuración
    const currentDomain = window.location.hostname;
    console.log("Dominio actual para agregar a Firebase Console:", currentDomain);
    
    // ✅ Usamos la instancia correcta de provider - corregido con el objeto auth correcto
    const result = await signInWithPopup(auth, provider);
    
    // Verificar que tengamos un usuario con email
    if (!result.user || !result.user.email) {
      throw new Error("No se pudo obtener un correo electrónico válido de Google");
    }
    
    console.log("Usuario autenticado con éxito:", result.user);
    return result.user as GoogleUser;
  } catch (error) {
    console.error("Login Google falló:", error);
    
    // Mejoramos el manejo de errores para depuración
    if (error instanceof Error) {
      const errorObj = error as any; // Para acceder al código de error
      console.error("Código de error Firebase:", errorObj.code);
      
      if (errorObj.code === "auth/operation-not-allowed") {
        console.error("ERROR: El proveedor de autenticación de Google no está habilitado en Firebase");
        console.error("Solución: Ve a Firebase Console > Authentication > Sign-in method > Google y habilítalo");
      } else if (error.message.includes("unauthorized_domain") || errorObj.code === "auth/unauthorized-domain") {
        console.error("ERROR DE DOMINIO: El dominio actual no está autorizado en Firebase Console");
        console.error(`Agrega '${window.location.hostname}' a Firebase Console > Authentication > Settings > Authorized domains`);
      } else if (error.message.includes("popup_closed") || error.message.includes("popup_blocked") || 
                errorObj.code === "auth/popup-blocked" || errorObj.code === "auth/popup-closed-by-user") {
        console.error("ERROR DE POPUP: El popup fue bloqueado o cerrado por el usuario");
      } else if (error.message.includes("configuration") || error.message.includes("api-key-not-valid") || 
                errorObj.code === "auth/invalid-api-key") {
        console.error("ERROR DE CONFIGURACIÓN: Firebase no está configurado correctamente");
        console.error("Revisar que API Key y demás valores sean correctos en firebase.ts");
      }
    }
    
    throw error;
  }
};

// Función para autenticar con Google usando Redirect
export const signInWithGoogleRedirect = async () => {
  try {
    // Verificar que auth y provider existan antes de usarlos
    console.log({ auth, provider });
    
    if (!auth || !provider) {
      throw new Error("Auth o provider no disponibles para redirect");
    }
    
    // ✅ Usamos la instancia correcta de provider
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Login Google con redirect falló:", error);
    throw error;
  }
};

// Función para manejar el resultado de la redirección
export const handleGoogleRedirect = async (): Promise<GoogleUser | null> => {
  try {
    // Verificar que auth exista antes de usarlo
    console.log({ auth });
    
    if (!auth) {
      throw new Error("Auth no disponible para handleRedirect");
    }
    
    const result = await getRedirectResult(auth);
    if (result && result.user && result.user.email) {
      console.log("Usuario (redirect):", result.user);
      return result.user as GoogleUser;
    }
    return null;
  } catch (error) {
    console.error("Error al procesar redirección de Google:", error);
    throw error;
  }
};

// Función para obtener la información del usuario actual
export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Función para cerrar sesión
export const signOut = () => auth.signOut();

// Exportamos la instancia de auth
export { auth };