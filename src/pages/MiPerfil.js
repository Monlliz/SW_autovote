import React, { useState, useEffect } from "react";
import InternalNavbar from "../components/InternalNavbar";
import { apiClient, authApiClient } from "../api/client"; // Cliente API para peticiones HTTP
import { useAuth } from "../context/AuthContext"; // Contexto de autenticación
import { toast } from "react-toastify"; // Para mostrar notificaciones

// Firebase para manejo de archivos
import {
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "../api/firebase.config";

const MiPerfil = () => {
  const { user, isLoading } = useAuth(); // Obtener usuario y estado de carga

  // Estado para almacenar datos del usuario
  const [usuario, setUsuario] = useState({
    _id: "",
    nombre: "",
    apellido: "",
    edad: 0,
    correo: "",
    codigo_postal: "",
    colonia: "",
    ciudad: "",
    estado: "",
    candidatura: "",
    cedula_politica: "",
  });

  // Estado de validación de cédula política (válida, inválida o pendiente)
  const [validacion, setValidacion] = useState(null);

  // Estado para controlar modo edición del formulario
  const [editando, setEditando] = useState(false);

  // Efecto para cargar datos del usuario dependiendo de su tipo
  useEffect(() => {
    if (!isLoading && user && user.uid) {
      const cargarDatos = async () => {
        try {
          let endpoint = "";
          if (user.tipo === "votante") endpoint = `votante/${user.uid}`;
          else if (user.tipo === "candidato") endpoint = `politico/${user.uid}`;
          else if (user.tipo === "administrador") endpoint = `administrador/${user.uid}`;

          const response = await apiClient.get(endpoint);
          setUsuario(response.data);
          setValidacion(response.data.validacion);
        } catch (error) {
          console.error("Error al cargar datos:", error);
        }
      };
      cargarDatos();
    }
  }, [isLoading, user]);

  // Maneja los cambios de inputs (conversión de edad a número si aplica)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsuario((prev) => ({
      ...prev,
      [name]: name === "edad" ? parseInt(value) || 0 : value,
    }));
  };

  const [file, setFile] = useState(null); // Archivo seleccionado para la cédula

  // Almacena archivo cuando el input tipo file cambia
  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  // Sube el archivo a Firebase y devuelve la URL pública
  const handleUpload = async () => {
    if (!file) return console.log("Por favor selecciona un archivo");

    try {
      const fileName = `files/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (err) {
      console.error("Error al subir archivo:", err);
    }
  };

  // Enviar formulario con los datos actualizados
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let cedulaUrl = usuario.cedula_politica;

      if (file) {
        cedulaUrl = await handleUpload(); // Subir archivo si hay uno nuevo
      }

      // Preparar payload dependiendo del tipo de usuario
      const datosActualizados = {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        edad: usuario.edad,
        ...(user.tipo !== "administrador" && {
          codigo_postal: usuario.codigo_postal,
          colonia: usuario.colonia,
          ciudad: usuario.ciudad,
          estado: usuario.estado,
        }),
        ...(user.tipo === "candidato" && {
          candidatura: usuario.candidatura,
          cedula_politica: cedulaUrl,
          validacion: "pendiente",
        }),
      };

      let response;

      // Si el usuario se registró manualmente, usar cliente autenticado
      if (user.password) {
        response = await authApiClient.put(`votante/manual/${user.uid}`, datosActualizados);
      } else {
        let endpoint = "";
        if (user.tipo === "votante") endpoint = `votante/${user.uid}`;
        else if (user.tipo === "candidato") endpoint = `politico/${user.uid}`;
        else if (user.tipo === "administrador") endpoint = `administrador/${user.uid}`;

        response = await apiClient.put(endpoint, datosActualizados);
      }

      // Si todo fue bien, salir de edición y mostrar mensaje
      if (response.data) {
        setEditando(false);
        setFile(null);
        toast.success("Datos guardados correctamente");

        if (file) {
          setUsuario((prev) => ({ ...prev, cedula_politica: cedulaUrl }));
          setValidacion("pendiente");
        }
      }
    } catch (error) {
      console.error("Error al guardar datos:", error);
      toast.error("Hubo un error al guardar los cambios");
    }
  };

  return (
    <>
      <InternalNavbar />

      <div className="container my-5">
        <form onSubmit={handleSubmit}>
          {/* === Datos Personales === */}
          <fieldset className="mb-4 border rounded p-3">
            <legend className="w-auto px-2">Datos Personales</legend>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Nombre</label>
                <input type="text" className="form-control" name="nombre" value={usuario.nombre} onChange={handleChange} readOnly={!editando} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Apellido</label>
                <input type="text" className="form-control" name="apellido" value={usuario.apellido} onChange={handleChange} readOnly={!editando} />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <label className="form-label">Edad</label>
                <input type="number" className="form-control" name="edad" value={usuario.edad} onChange={handleChange} readOnly={!editando} />
              </div>
              <div className="col-md-8">
                <label className="form-label">Correo</label>
                <input type="email" className="form-control" name="correo" value={usuario.correo} onChange={handleChange} readOnly />
              </div>
            </div>
          </fieldset>

          {/* === Datos de Ubicación (excepto para administradores) === */}
          {user?.tipo !== "administrador" && (
            <fieldset className="mb-4 border rounded p-3">
              <legend className="w-auto px-2">Datos de Ubicación</legend>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Código Postal</label>
                  <input type="text" className="form-control" name="codigo_postal" value={usuario.codigo_postal} onChange={handleChange} readOnly={!editando} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Colonia</label>
                  <input type="text" className="form-control" name="colonia" value={usuario.colonia} onChange={handleChange} readOnly={!editando} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Ciudad</label>
                  <input type="text" className="form-control" name="ciudad" value={usuario.ciudad} onChange={handleChange} readOnly={!editando} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <input type="text" className="form-control" name="estado" value={usuario.estado} onChange={handleChange} readOnly={!editando} />
                </div>
              </div>
            </fieldset>
          )}

          {/* === Datos de Candidatura (solo para candidatos) === */}
          {user?.tipo === "candidato" && (
            <fieldset className="mb-4 border rounded p-3">
              <legend className="w-auto px-2">Datos de Candidatura</legend>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Tipo de Candidato</label>
                  <select className="form-select" name="candidato" value={usuario.candidatura} onChange={handleChange} disabled={!editando}>
                    <option value="">Seleccione una opción</option>
                    <option value="presidente">Presidente</option>
                    <option value="gobernador">Gobernador</option>
                    <option value="presidente municipal">Presidente municipal</option>
                  </select>
                </div>

                {/* Cédula Política: subir o ver archivo */}
                <div className="col-md-6">
                  <label className="form-label">Cédula Política &nbsp;</label>
                  {validacion === "invalida" ? (
                    <>
                      <span className="badge bg-danger">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        Cédula no válida
                      </span>
                      <input type="file" name="cedula_politica" disabled={!editando} onChange={handleFileChange} className="form-control btn btn-sm btn-outline-primary me-2" required />
                    </>
                  ) : (
                    <>
                      {validacion === "valida" && (
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Cédula validada
                        </span>
                      )}
                      {validacion === "pendiente" && (
                        <span className="badge bg-warning text-dark">
                          <i className="bi bi-exclamation-triangle-fill me-1"></i>
                          Pendiente de validación
                        </span>
                      )}
                      <a className="form-control btn btn-sm btn-outline-primary me-2" href={usuario.cedula_politica} target="_blank" rel="noopener noreferrer">
                        Ver Cédula Política
                      </a>
                    </>
                  )}
                </div>
              </div>
            </fieldset>
          )}

          {/* === Botones de acción === */}
          {user?.tipo !== "administrador" && (
            <div className="d-flex justify-content-end gap-2">
              {!editando ? (
                <button type="button" className="btn btn-primary" onClick={() => setEditando(true)}>Editar</button>
              ) : (
                <>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-success">Guardar Cambios</button>
                </>
              )}
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default MiPerfil;
