// components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';

/**
 * Componente para proteger rutas según el tipo de usuario.
 * 
 * @param {Array} allowedRoles - Lista de tipos de usuarios permitidos para acceder a la ruta.
 * 
 * Funcionamiento:
 * - Si no hay usuario autenticado y no está cargando, redirige al inicio ("/").
 * - Si el usuario está autenticado pero su tipo no está permitido, muestra mensaje de acceso no autorizado.
 * - Si todo es válido, renderiza el contenido hijo usando <Outlet />.
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  // Hook para navegación programática
  const navigate = useNavigate();

  // Obtenemos usuario y estado de carga desde el contexto de autenticación
  const { user, isLoading } = useAuth();

  // Si no hay usuario y no estamos cargando (login completo), redirigimos al inicio de sesión
  if (!user && !isLoading) {
    return <Navigate to="/" replace />;
  }

  // Si hay usuario, pero no tiene permisos (tipo no incluido en allowedRoles)
  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.tipo)) {
    return (
      <div className="container text-center mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Acceso no autorizado</h4>
          <p>No tienes los permisos necesarios para acceder a esta página.</p>
          <hr />
          {/* Botón para redirigir al Dashboard */}
          <button
            className="btn btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Ir a Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Si todo es correcto, renderiza el contenido hijo (la ruta protegida)
  return <Outlet />;
};

export default ProtectedRoute;
