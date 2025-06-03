import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// Importación de iconos de react-icons/fa para diferentes roles y acciones
import {
  FaShieldAlt,    // Icono para Administrador
  FaUserTie,      // Icono para Candidato
  FaUser,         // Icono para Votante
  FaSignOutAlt,   // Icono para Cerrar sesión
  FaUserCog,      // Icono para Preferencias
  FaUserEdit,     // Icono para Perfil
  FaChartLine,    // Icono para Estadísticas
  FaSearch,       // Icono para Buscar
  FaHome,         // Icono para Dashboard
  FaPlus,         // Icono para Crear propuesta
  FaCheckCircle,  // Icono para Validación
  FaPoll,         // Icono para Encuesta de satisfacción
  FaUsers,        // Icono para lista de Votantes
} from "react-icons/fa";

const InternalNavbar = () => {
  // Obtiene el usuario autenticado y función para cerrar sesión desde el contexto
  const { user, logout } = useAuth();
  // Hook para navegación programática
  const navigate = useNavigate();

  // Función para cerrar sesión y redirigir a la página principal
  const handleLogoutClick = async () => {
    await logout();
    navigate("/");
  };

  // Componente para mostrar el icono correspondiente al tipo de usuario
  const UserTypeIcon = ({ type }) => {
    const iconClass = "text-lg me-2"; // clases comunes para los iconos

    switch (type) {
      case "administrador":
        return <FaShieldAlt className={`${iconClass} text-purple-500`} />;
      case "candidato":
        return <FaUserTie className={`${iconClass} text-blue-500`} />;
      case "votante":
        return <FaUser className={`${iconClass} text-green-500`} />;
      default:
        return <FaUser className={iconClass} />;
    }
  };

  return (
    // Barra de navegación principal con estilo Bootstrap y sombra
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary py-1 shadow-sm">
      <div className="container-fluid">
        {/* Logo o marca con link a la raíz */}
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <FaShieldAlt className="me-2" />
          AutoVote
        </Link>

        {/* Botón para colapsar menú en dispositivos móviles */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Contenido colapsable de la barra */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Menú principal alineado a la izquierda */}
          <ul className="navbar-nav me-auto">
            {/* Enlace a Dashboard */}
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" to="/dashboard">
                <FaHome className="me-1" />
                Dashboard
              </Link>
            </li>

            {/* Enlace a Buscar */}
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" to="/buscar">
                <FaSearch className="me-1" />
                Buscar
              </Link>
            </li>

            {/* Mostrar Estadísticas solo si no es votante */}
            {user?.tipo !== "votante" && (
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center" to="/estadisticas">
                  <FaChartLine className="me-1" />
                  Estadísticas
                </Link>
              </li>
            )}

            {/* Mostrar Crear propuesta solo si es candidato */}
            {user?.tipo === "candidato" && (
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center" to="/crearpropuesta">
                  <FaPlus className="me-1" />
                  Crear propuesta
                </Link>
              </li>
            )}

            {/* Opciones exclusivas para administrador */}
            {user?.tipo === "administrador" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link d-flex align-items-center" to="/validacion">
                    <FaCheckCircle className="me-1" />
                    Validación
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link d-flex align-items-center" to="/votantes">
                    <FaUsers className="me-1" />
                    Votantes
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Menú de usuario alineado a la derecha */}
          <ul className="navbar-nav ms-auto">
            {/* Si hay usuario autenticado */}
            {user ? (
              <li className="nav-item dropdown">
                {/* Botón desplegable con nombre, icono y foto (si existe) */}
                <Link
                  className="nav-link dropdown-toggle d-flex align-items-center"
                  to="#"
                  id="userDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {/* Icono según tipo de usuario */}
                  <UserTypeIcon type={user.tipo} />

                  {/* Nombre completo concatenado */}
                  <span className="me-2">
                    {[user.nombre, user.apellido].filter(Boolean).join(" ")}
                  </span>

                  {/* Foto de perfil o iniciales */}
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      className="img-fluid rounded-circle"
                      style={{
                        width: "30px",
                        height: "30px",
                        objectFit: "cover",
                      }}
                      loading="lazy"
                      alt="Foto de perfil"
                    />
                  ) : (
                    // Si no hay foto, mostrar iniciales en un círculo
                    <span
                      className="symbol-label bg-light text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "30px", height: "30px" }}
                    >
                      {user.nombre?.charAt(0)}
                      {user.apellido?.charAt(0)}
                    </span>
                  )}
                </Link>

                {/* Menú desplegable con opciones del usuario */}
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  {/* Enlace a perfil */}
                  <li>
                    <Link className="dropdown-item d-flex align-items-center" to="/miperfil">
                      <FaUserEdit className="me-2" />
                      Mi Perfil
                    </Link>
                  </li>

                  {/* Opciones para votantes */}
                  {user?.tipo === "votante" && (
                    <>
                      <li>
                        <Link className="dropdown-item d-flex align-items-center" to="/preferencias">
                          <FaUserCog className="me-2" />
                          Preferencias
                        </Link>
                      </li>
                      <a
                        className="dropdown-item d-flex align-items-center"
                        href="https://forms.gle/uqyLpittpqKoygNTA"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaPoll className="me-1" />
                        Encuesta de satisfacción
                      </a>
                    </>
                  )}

                  {/* Opción encuesta para candidatos */}
                  {user?.tipo === "candidato" && (
                    <a
                      className="dropdown-item d-flex align-items-center"
                      href="https://forms.gle/5CccXPmDh3RMXJfu5"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaPoll className="me-1" />
                      Encuesta de satisfacción
                    </a>
                  )}

                  {/* Separador */}
                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  {/* Botón para cerrar sesión */}
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center text-danger"
                      onClick={handleLogoutClick}
                    >
                      <FaSignOutAlt className="me-2" />
                      Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              // Si no hay usuario, mostrar botón para iniciar sesión
              <li className="nav-item">
                <Link className="nav-link btn btn-outline-light" to="/">
                  Iniciar Sesión
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default InternalNavbar;
