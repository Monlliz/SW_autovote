import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Configuración de Firebase extraída de variables de entorno
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

/**
 * Inicializa la aplicación Firebase con la configuración proporcionada
 */
const app = initializeApp(firebaseConfig);

/**
 * Instancia de autenticación Firebase para manejar usuarios
 */
const auth = getAuth(app);

/**
 * Proveedor de autenticación para inicio de sesión con Google
 */
const googleProvider = new GoogleAuthProvider();

/**
 * Instancia para manejo de almacenamiento en Firebase Storage
 */
const storage = getStorage(app);

/**
 * Inicia sesión con Google usando un popup
 * @async
 * @returns {Promise<Object|null>} Retorna el usuario autenticado o null si falla
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // console.log("Usuario autenticado: ", user);
    return user;
  } catch (error) {
    // console.error("Error al iniciar sesión con Google: ", error);
    return null;
  }
};

/**
 * Cierra sesión del usuario autenticado actualmente
 * @async
 * @returns {Promise<void>}
 */
export const handleLogout = async () => {
  try {
    await signOut(auth);
    console.log("Cerrado sesión con éxito");
  } catch (error) {
    console.error("Error al cerrar sesión: ", error);
  }
};

// Exporta utilidades para Firebase Storage
export { storage, ref, uploadBytes, getDownloadURL };

/**
 * Registra un usuario nuevo con correo electrónico y contraseña
 * @async
 * @param {string} email - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object|null>} Usuario registrado o null si falla el registro
 */
export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Usuario registrado con correo:", user);
    return user;
  } catch (error) {
    console.error("Error en el registro con correo:", error);
    return null;
  }
};

/**
 * Inicia sesión con correo electrónico y contraseña
 * @async
 * @param {string} email - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object|null>} Usuario autenticado o null si falla la autenticación
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Usuario inició sesión con correo:", user);
    return user;
  } catch (error) {
    console.error("Error al iniciar sesión con correo:", error);
    return null;
  }
};
