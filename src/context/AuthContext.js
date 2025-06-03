// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { handleLogout as firebaseLogout } from "../api/firebase.config";

const AuthContext = createContext();

/**
 * Proveedor del contexto de autenticación.
 * Maneja estado global de usuario, token, tipo de autenticación y carga.
 */
export const AuthProvider = ({ children }) => {
  // Estado para almacenar información del usuario autenticado
  const [user, setUser] = useState(null);
  // Estado para almacenar token JWT si es login manual
  const [token, setToken] = useState(null);
  // Estado para indicar tipo de autenticación: "google" o "manual"
  const [authType, setAuthType] = useState(null);
  // Estado para controlar si la carga de datos está en proceso
  const [isLoading, setIsLoading] = useState(true);

  // Efecto que se ejecuta al montar el componente para recuperar datos del localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');        // Recupera usuario guardado
    const savedToken = localStorage.getItem('token');      // Recupera token guardado
    const savedAuthType = localStorage.getItem('authType');// Recupera tipo de autenticación

    if (savedUser) setUser(JSON.parse(savedUser));         // Convierte y asigna usuario
    if (savedToken) setToken(savedToken);                  // Asigna token
    if (savedAuthType) setAuthType(savedAuthType);         // Asigna tipo de autenticación
    setIsLoading(false);                                    // Finaliza carga
  }, []);

  /**
   * Función para iniciar sesión.
   * Actualiza estados y guarda datos en localStorage.
   * 
   * @param {Object} userData - Datos del usuario autenticado
   * @param {string|null} token - Token JWT para login manual (opcional)
   * @param {string} type - Tipo de autenticación ("google" o "manual")
   */
  const login = (userData, token = null, type = 'google') => {
    setUser(userData);
    setAuthType(type);
    if (token) setToken(token);

    // Guardar en localStorage para persistencia
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authType', type);
    if (token) localStorage.setItem('token', token);
  };

  /**
   * Función para cerrar sesión.
   * Limpia estados y elimina datos del localStorage.
   * Si la autenticación fue por Google, llama a logout de Firebase.
   */
  const logout = () => {
    if (authType === "google") {
      firebaseLogout(); // Cierra sesión en Firebase
    }

    setUser(null);
    setToken(null);
    setAuthType(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('authType');
  };

  return (
    <AuthContext.Provider value={{ user, token, authType, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de autenticación.
 * Lanza error si no se usa dentro del proveedor AuthProvider.
 * 
 * @returns {Object} Valores y funciones del contexto Auth
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
