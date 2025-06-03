import axios from 'axios';

// Cliente Axios básico para llamadas a la API sin autenticación
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_BACK, // URL base de la API desde variable de entorno
  headers: {
    'Content-Type': 'application/json' // Cabecera para indicar que enviamos JSON
  }
});

// Cliente Axios para llamadas a la API con autenticación (token JWT)
const authApiClient = axios.create({
  baseURL: process.env.REACT_APP_BACK,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor que agrega el token Bearer en el header Authorization para cada petición
authApiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // Obtiene token guardado en localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Agrega el token en la cabecera Authorization
  }
  return config;
});

export { apiClient, authApiClient }; // Exporta ambos clientes para uso en la app
