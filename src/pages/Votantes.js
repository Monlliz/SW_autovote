import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Importa estilos de Bootstrap
import "bootstrap-icons/font/bootstrap-icons.css"; // Importa íconos de Bootstrap
import InternalNavbar from "../components/InternalNavbar"; // Barra de navegación interna
import { apiClient } from "../api/client"; // Cliente API para hacer solicitudes al backend

const Votantes = () => {
  // Estado para guardar la lista de candidatos/votantes
  const [candidates, setCandidates] = useState([]);
  // Estado para controlar si está cargando la información
  const [loading, setLoading] = useState(true);
  // Estado para guardar cualquier error ocurrido al obtener datos
  const [error, setError] = useState(null);
  // Estado para controlar el término de búsqueda ingresado por el usuario
  const [searchTerm, setSearchTerm] = useState("");

  // useEffect para cargar los candidatos apenas se monta el componente
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true); // Activa el indicador de carga
        const response = await apiClient.get("/votante"); // Petición GET para obtener votantes
        setCandidates(response.data); // Guarda los datos recibidos
      } catch (err) {
        setError(err.message); // Guarda el error si ocurre alguno
      } finally {
        setLoading(false); // Desactiva el indicador de carga
      }
    };

    fetchCandidates(); // Ejecuta la función para obtener datos
  }, []); // Se ejecuta solo una vez al montar el componente

  // Función para eliminar un votante dado su ID
  const eliminarCandidato = async (candidate_id) => {
    // Confirmar acción con el usuario
    if (window.confirm("¿Estás seguro de que deseas eliminar este votante?")) {
      try {
        // Petición DELETE para eliminar el votante
        const response = await apiClient.delete(`/votante/${candidate_id}`);
        if (response.data.message) {
          alert("Votante eliminado correctamente.");
          // Actualiza la lista local removiendo el candidato eliminado
          setCandidates((prevCandidates) =>
            prevCandidates.filter((candidate) => candidate._id !== candidate_id)
          );
        }
      } catch (err) {
        alert("Error al eliminar votante: " + err.message);
      }
    }
  };

  // Filtra los candidatos según el término de búsqueda en múltiples campos
  const filteredCandidates = candidates.filter((candidate) => {
    // Concatenar campos relevantes en una cadena para búsqueda
    const matchesSearch =
      `${candidate.nombre} ${candidate.apellido} ${candidate.correo} ${candidate.ciudad} ${candidate.colonia} ${candidate.estado} ${candidate.codigo_postal}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()); // Comparación insensible a mayúsculas

    return matchesSearch;
  });

  // Mostrar spinner mientras se cargan los datos
  if (loading)
    return (
      <>
        <InternalNavbar />
        <div className="container mt-5 text-center">
          <div
            className="spinner-border text-primary"
            style={{ width: "2rem", height: "2rem" }}
            role="status"
          >
            <span className="visually-hidden">Cargando...</span>
          </div>
          <h4 className="mt-3">Cargando votantes...</h4>
          <p>Esto puede tomar unos momentos</p>
        </div>
      </>
    );

  // Mostrar mensaje de error si ocurrió alguno
  if (error)
    return <div className="alert alert-danger my-5">Error: {error}</div>;

  // Renderizado principal con tabla y controles
  return (
    <>
      <InternalNavbar />
      <div className="container-fluid p-4">
        <div className="card shadow-sm">
          {/* Header con título y contador */}
          <div className="card-header bg-primary text-white">
            <h3 className="mb-0">
              {candidates.length}
              <i className="bi bi-people-fill me-2"></i>
              Lista de Votantes
            </h3>
          </div>

          {/* Cuerpo de la tarjeta */}
          <div className="card-body">
            {/* Campo de búsqueda */}
            <div className="row mb-4">
              <div className="col-md-12">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tabla responsive para mostrar resultados */}
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Candidato</th>
                    <th>Contacto</th>
                    <th>Ubicación</th>
                    <th>Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <tr key={candidate._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="symbol symbol-40px symbol-circle me-3">
                              {/* Mostrar foto si existe, si no iniciales */}
                              {candidate.photoURL ? (
                                <img
                                  loading="lazy"
                                  src={candidate.photoURL}
                                  alt={
                                    candidate.nombre.charAt(0) +
                                    candidate.apellido.charAt(0)
                                  }
                                  className="img-fluid rounded-circle"
                                  style={{ width: "40px", height: "40px" }}
                                />
                              ) : (
                                <span className="symbol-label bg-light-primary text-primary fs-6 fw-bold">
                                  {candidate.nombre.charAt(0)}
                                  {candidate.apellido.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="fw-bold">
                                {candidate.nombre} {candidate.apellido}
                              </div>
                              <div className="text-muted">
                                {candidate.edad} años
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Email de contacto */}
                        <td>
                          <a
                            href={`mailto:${candidate.correo}`}
                            className="text-primary"
                          >
                            {candidate.correo}
                          </a>
                        </td>
                        {/* Ubicación */}
                        <td>
                          <div>{candidate.colonia}</div>
                          <div className="text-muted">
                            {candidate.ciudad}, {candidate.estado}
                          </div>
                          <div className="text-muted">
                            CP: {candidate.codigo_postal}
                          </div>
                        </td>
                        {/* Botón para eliminar */}
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarCandidato(candidate._id)}
                            title="Eliminar candidato"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Mensaje si no hay resultados
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <i className="bi bi-emoji-frown display-6 text-muted"></i>
                        <h5 className="mt-2">No se encontraron candidatos</h5>
                        <p className="text-muted">
                          Intenta con otros términos de búsqueda
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer con contador y botones de paginación (sin funcionalidad aún) */}
          <div className="card-footer d-flex justify-content-between align-items-center">
            <div className="text-muted">
              Mostrando {filteredCandidates.length} de {candidates.length}{" "}
              votantes
            </div>
            <div>
              <button className="btn btn-sm btn-outline-primary me-2">
                <i className="bi bi-arrow-left"></i>
              </button>
              <button className="btn btn-sm btn-outline-primary">
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Votantes;
