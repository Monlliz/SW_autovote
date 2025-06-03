import { useState, useEffect } from "react"; // Importa los hooks useState y useEffect
import "../style/Login.css"; // Importa el archivo de estilos CSS para el componente Login
import { useAuth } from "../context/AuthContext"; // Importa el hook personalizado para autenticación
import { useNavigate } from "react-router-dom"; // Importa useNavigate para redirección en React Router
import axios from "axios"; // Cliente HTTP para realizar peticiones a la API
import {apiClient} from "../api/client"; // Cliente personalizado de la API
import {
  handleLogout,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "../api/firebase.config"; // Funciones para manejo de archivos en Firebase Storage
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Firebase Auth para verificar el estado del usuario

// Función para separar el nombre y apellido del usuario
function obtenerNombreApellido(displayName) {
  const partes = displayName.trim().split(" ");
  if (partes.length < 2) {
    return {
      nombres: displayName,
      apellidos: "",
    };
  }
  const nombres = partes.slice(0, partes.length - 2).join(" ");
  const apellidos = partes.slice(-2).join(" ");
  return {
    nombres,
    apellidos,
  };
}

const Login = () => {
  // Estado para almacenar el archivo cargado
  const [file, setFile] = useState(null);

  // Maneja el cambio de archivo (cuando se selecciona uno nuevo)
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Sube el archivo a Firebase Storage y guarda la URL en formData
  const handleUpload = async () => {
    if (!file) {
      console.log("Por favor selecciona un archivo");
      return;
    }

    try {
      const fileName = `files/${Date.now()}_${file.name}`; // Nombre único para el archivo
      const storageRef = ref(storage, fileName); // Referencia al almacenamiento en Firebase
      const snapshot = await uploadBytes(storageRef, file); // Subir archivo
      const url = await getDownloadURL(snapshot.ref); // Obtener URL del archivo subido
      formData.cedula_politica = url; // Asignar la URL al campo correspondiente
    } catch (err) {
      console.error("Error completo:", err);
    }
  };

  const [userg, setUserg] = useState(null); // Estado para almacenar el usuario logueado
  const navigate = useNavigate(); // Hook para redirigir

  // Estado del formulario
  const [formData, setFormData] = useState({
    user: "Votante",
    nombre: "",
    apellido: "",
    edad: 18,
    correo: "",
    codigo_postal: "",
    colonia: "",
    ciudad: "",
    estado: "",
    candidatura: "",
    cedula_politica: "",
  });

  // Obtiene el usuario logueado de Firebase
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/"); // Redirige si no hay usuario
      }
      setUserg(currentUser);
    });

    return () => {
      unsubscribe(); // Cancela la suscripción al desmontar
    };
  }, [navigate, userg]);

  const { login } = useAuth(); // Hook de contexto de autenticación

  // Establece nombre, apellido y correo en el formulario a partir del usuario
  useEffect(() => {
    if (userg !== null) {
      const resultado = obtenerNombreApellido(userg.displayName);
      setFormData((prevFormData) => ({
        ...prevFormData,
        nombre: resultado.nombres,
        apellido: resultado.apellidos,
        correo: userg.email,
      }));
    }
  }, [userg]);

  // Maneja cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si cambia a "Candidato", limpiar campos específicos
    if (name === "user" && value === "Candidato") {
      setFormData({
        ...formData,
        candidatura: "",
        cedula_politica: "",
      });
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Determina si el tipo de usuario es votante
  const tipoUsuario = (usuario) => {
    if (usuario === "Votante") return true;
    if (usuario === "Candidato") return false;
    return true;
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const requestData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        edad: formData.edad,
        correo: formData.correo,
        codigo_postal: formData.codigo_postal,
        colonia: formData.colonia,
        ciudad: formData.ciudad,
        estado: formData.estado,
        photoURL: userg.photoURL,
        ...(formData.user === "Votante"
          ? { preferencias: [], propuestas_votadas: [] }
          : {
              candidatura: formData.candidatura,
              cedula_politica: formData.cedula_politica,
              validacion: "pendiente",
            }),
      };

      let response;

      if (formData.user === "Candidato") {
        try {
          await handleUpload(); // Sube el archivo si es candidato
          requestData.cedula_politica = formData.cedula_politica;
          response = await apiClient.post("politico", requestData); // Registra candidato
        } catch (error) {
          console.error("Error al crear politico: ", error);
          return;
        }
      } else {
        try {
          response = await apiClient.post("votante", requestData); // Registra votante
        } catch (error) {
          console.error("Error al crear votante: ", error);
          return;
        }
      }

      if (response.status === 201) {
        const userk = {
          uid: response.data._id,
          nombre: response.data.nombre,
          apellido: response.data.apellido,
          edad: response.data.edad,
          correo: response.data.correo,
          codigo_postal: response.data.codigo_postal,
          colonia: response.data.colonia,
          ciudad: response.data.ciudad,
          estado: response.data.estado,
          photoURL: response.data.photoURL,
          tipo: formData.user.toLowerCase(),
        };

        await login(userk); // Guarda la sesión del usuario

        const redirectPath =
          formData.user === "Candidato" ? "/crearpropuesta" : "/preferencias";
        console.log(`${formData.user} creado correctamente`);
        navigate(redirectPath); // Redirige según el tipo de usuario
      }
    } catch (error) {
      console.error("Error completo:", error);
      alert("Error en el registro: " + error.message);
    }
  };

  // Cierra la sesión del usuario
  const handleLogoutClick = async () => {
    await handleLogout();
    navigate("/");
  };

  // Estados para búsqueda de dirección por código postal
  const [postalCode, setPostalCode] = useState("");
  const [addressData, setAddressData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Busca información del código postal ingresado
  const handlePostalCodeChange = async (e) => {
    const cp = e.target.value.replace(/\D/g, "");
    setPostalCode(cp);
    setError(null);

    if (cp.length === 5) {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.copomex.com/query/info_cp/${cp}?token=71732f81-82f5-423b-b002-0ed598deb0db`
        );

        const data = response.data;

        if (!data) throw new Error("No se recibieron datos");

        const addresses = data.error
          ? []
          : data.response
          ? data.response
          : Array.isArray(data)
          ? data
          : [];

        if (addresses.length === 0) {
          setError("No se encontraron resultados para este código postal");
        }

        setAddressData(addresses);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error al buscar el código postal. Intenta nuevamente.");
        setAddressData([]);
      } finally {
        setLoading(false);
      }
    } else {
      setAddressData([]);
    }
  };

  // Selecciona una dirección obtenida desde el código postal
  const handleAddressSelect = (address) => {
    setFormData({
      ...formData,
      codigo_postal: postalCode,
      colonia: address.response.asentamiento,
      ciudad: address.response.municipio,
      estado: address.response.estado,
    });
  };
  // --- PARA CODIGO POSTAL

  return (
    <form className="container py-4" onSubmit={handleSubmit}>
      {/* Header */}
      <div className="d-flex justify-content-center mb-4">
        <h1 className="m-0 text-center">
          <span className="text-primary">AutoVote</span>
        </h1>
      </div>

      {/* Contenido principal */}
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Sección de selección de tipo de usuario */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">Datos adicionales de registro</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Tipo de usuario</label>
                <select
                  className="form-select"
                  onChange={handleChange}
                  name="user"
                  value={formData.user}
                >
                  <option value="Votante">Votante</option>
                  <option value="Candidato">Candidato</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección de datos personales */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">Datos personales</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre</label>
                  <input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    type="text"
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Apellido</label>
                  <input
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    type="text"
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Edad</label>
                  <input
                    name="edad"
                    onChange={handleChange}
                    type="number"
                    min="18"
                    value={formData.edad}
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Correo</label>
                  <input
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    type="email"
                    className="form-control"
                    required
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección de ubicación */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">Ubicación</h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">Buscar por Código Postal</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    id="postalCode"
                    maxLength="5"
                    value={postalCode}
                    onChange={handlePostalCodeChange}
                    placeholder="Ej. 11520"
                  />
                  {loading && (
                    <span className="input-group-text">
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Buscando...
                    </span>
                  )}
                </div>
                {error && (
                  <div className="alert alert-danger mt-2">{error}</div>
                )}
              </div>

              {addressData.length > 0 && (
                <div className="mb-4">
                  <label className="form-label">Colonias disponibles</label>
                  <select
                    className="form-select"
                    onChange={(e) =>
                      handleAddressSelect(addressData[e.target.value])
                    }
                  >
                    <option value="">Selecciona una colonia</option>
                    {addressData.map((item, index) => (
                      <option key={index} value={index}>
                        {item.response.asentamiento ||
                          "Colonia no especificada"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Código postal</label>
                  <input
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleChange}
                    type="text"
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Colonia</label>
                  <input
                    name="colonia"
                    value={formData.colonia}
                    onChange={handleChange}
                    type="text"
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Ciudad</label>
                  <input
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    type="text"
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <input
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    type="text"
                    className="form-control"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección de candidato (condicional) */}
          {!tipoUsuario(formData.user) && (
            <div className="card mb-4 shadow-sm">
              <div className="card-header bg-light">
                <h5 className="mb-0">Información de candidato</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Candidatura</label>
                    <select
                      name="candidatura"
                      value={formData.candidatura}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Seleccione una opción</option>
                      <option value="presidente">Presidente</option>
                      <option value="gobernador">Gobernador</option>
                      <option value="presidente municipal">
                        Presidente Municipal
                      </option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Cédula política</label>
                    <input
                      name="cedula_politica"
                      onChange={handleFileChange}
                      type="file"
                      className="form-control"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones al final - mismo renglón, ancho completo */}
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex gap-3">
            <button
              className="btn btn-outline-secondary flex-fill py-2"
              onClick={handleLogoutClick}
              type="button"
            >
              <i className="bi bi-arrow-left me-2"></i>Cancelar
            </button>
            <button className="btn btn-primary flex-fill py-2" type="submit">
              Continuar <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Login;
