import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import LoginModal from "./LoginModal";

const Navbar = () => {
  // Obtiene el usuario actual y la función logout desde el contexto de autenticación
  const { user, logout } = useAuth();

  // Hook para navegación programática
  const navigate = useNavigate();

  // Estado para controlar la visibilidad del modal de login
  const [modalOpen, setModalOpen] = useState(false);

  // Efecto para suscribirse a cambios en el estado de autenticación de Firebase
  useEffect(() => {
    const auth = getAuth();

    // Se suscribe a cambios en el estado de autenticación, sin hacer nada cuando cambia
    const unsubscribe = onAuthStateChanged(auth, () => {});

    // Limpia la suscripción cuando el componente se desmonta
    return () => unsubscribe();
  }, []);

  // Función para cerrar sesión
  const handleLogoutClick = async () => {
    await logout();     // Llama a la función logout del contexto
    navigate("/");      // Redirige al usuario a la página principal
  };

  return (
    <>
      {/* Barra de navegación principal */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-black py-3">
        <div className="container">
          {/* Logo y nombre de la aplicación con link a la página principal */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <i className="bi bi-check2-circle me-2"></i>
            <span className="fw-bold">AutoVote</span>
          </Link>

          {/* Botón para colapsar la barra en pantallas pequeñas */}
          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Menú colapsable */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                {/* Si no hay usuario logueado, muestra botón para abrir modal de login */}
                {!user ? (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="btn btn-sm btn-light d-flex align-items-center gap-2 px-3"
                  >
                    <i className="bi bi-box-arrow-in-right"></i>
                    <span className="d-none d-sm-inline">Iniciar sesión</span>
                  </button>
                ) : (
                  // Si hay usuario logueado, muestra su nombre/correo y botón para cerrar sesión
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-light me-2 d-none d-lg-inline small">
                      {user?.nombre || user?.correo}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-light px-3"
                      onClick={handleLogoutClick}
                    >
                      <i className="bi bi-box-arrow-right me-1"></i>
                      <span className="d-none d-sm-inline">Salir</span>
                    </button>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Componente modal para iniciar sesión, controlado por el estado modalOpen */}
      <LoginModal show={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default Navbar;
