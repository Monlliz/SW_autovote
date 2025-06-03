import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { signInWithGoogle } from "../../api/firebase.config";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import { toast } from "react-toastify";

/**
 * Componente LoginModal
 * Modal que permite a los usuarios iniciar sesión con correo y contraseña,
 * registrarse, o iniciar sesión con Google.
 * @param {boolean} show - Controla si el modal se muestra o no.
 * @param {function} onClose - Función para cerrar el modal.
 */
const LoginModal = ({ show, onClose }) => {
    const { login } = useAuth(); // Contexto de autenticación para actualizar el estado del usuario
    const navigate = useNavigate(); // Hook para navegación programática
    const [view, setView] = useState("login"); // Controla la vista activa: 'login', 'register', etc.
    const [loading, setLoading] = useState(false); // Indica si hay una operación en proceso

    // Estado para almacenar los datos del formulario (login y registro)
    const [formData, setFormData] = useState({
        correo: "",
        password: "",
        nombre: "",
        apellido: "",
        edad: 18,
        codigo_postal: "",
        colonia: "",
        ciudad: "",
        estado: "",
    });

    // Actualiza los datos del formulario cuando el usuario escribe
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    /**
     * Resetea el formulario y la vista, luego cierra el modal.
     */
    const closeModal = () => {
        onClose();
        setView("login");
        setFormData({
            correo: "", password: "", nombre: "", apellido: "", edad: 18,
            codigo_postal: "",
            colonia: "",
            ciudad: "",
            estado: "",
        });
    };

    // ===== LOGIN CON GOOGLE =====

    /**
     * Busca al usuario en el backend por correo y retorna el objeto de usuario si existe.
     * Intenta en orden: votante, político, administrador.
     * @param {string} email - Correo electrónico a buscar
     * @param {string} photoURL - URL de la foto de perfil (de Firebase)
     * @returns {object|null} Usuario encontrado o null si no existe
     */
    async function searchUserByEmail(email, photoURL) {
        try {
            let tipo = "votante";
            let response = await apiClient.get(`votante/correo/${encodeURIComponent(email)}`);

            if (response.data.error) {
                response = await apiClient.get(`politico/correo/${encodeURIComponent(email)}`);
                tipo = "candidato";
            }
            if (response.data.error) {
                response = await apiClient.get(`administrador/correo/${encodeURIComponent(email)}`);
                tipo = "administrador";
            }

            if (response?.data?.correo) {
                // Construye el objeto usuario con los datos del backend
                const userk = {
                    uid: response.data._id,
                    photoURL,
                    nombre: response.data.nombre,
                    apellido: response.data.apellido,
                    correo: response.data.correo,
                    tipo,
                    edad: response.data.edad,
                    codigo_postal: response.data.codigo_postal,
                    colonia: response.data.colonia,
                    ciudad: response.data.ciudad,
                    estado: response.data.estado,
                };
                login(userk, "google"); // Actualiza el contexto de autenticación
                return userk;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error completo:", error);
        }
    }

    /**
     * Maneja el inicio de sesión con Google usando Firebase
     */
    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const loggedInUser = await signInWithGoogle();

            if (loggedInUser) {
                const userk = await searchUserByEmail(loggedInUser.email, loggedInUser.photoURL);
                setLoading(false);

                if (userk) {
                    login(userk, "google");
                    navigate("/dashboard");
                    closeModal();
                } else {
                    navigate("/login");
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            setLoading(false);
            console.error(error);
        }
    };

    // ===== LOGIN CON CORREO Y CONTRASEÑA =====

    /**
     * Maneja el inicio de sesión con correo y contraseña.
     * Valida y realiza la petición al backend.
     * @param {Event} e Evento submit del formulario
     */
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiClient.post("votante/login/", {
                correo: formData.correo,
                password: formData.password,
            });

            if (response?.data?.votante.password) {
                const data = response.data.votante;
                const tipo = "votante";
                const userk = {
                    uid: data._id,
                    nombre: data.nombre,
                    apellido: data.apellido,
                    correo: data.correo,
                    password: data.password,
                    tipo,
                    edad: data.edad,
                    codigo_postal: data.codigo_postal,
                    colonia: data.colonia,
                    ciudad: data.ciudad,
                    estado: data.estado,
                };

                login(userk, response.data.token, "manual");

                toast.success("Inicio de sesión exitoso");
                closeModal();
                navigate("/dashboard");
            }
        } catch (error) {
            toast.error("Correo o contraseña incorrectos.");
        }
        setLoading(false);
    };

    // ===== REGISTRO DE NUEVO USUARIO =====

    /**
     * Maneja el registro de un nuevo usuario.
     * Verifica si el usuario ya existe y si no, lo crea.
     * @param {Event} e Evento submit del formulario
     */
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const NewUser = {
                correo: formData.correo,
                password: formData.password,
                nombre: formData.nombre,
                apellido: formData.apellido,
                edad: formData.edad,
                codigo_postal: formData.codigo_postal,
                colonia: formData.colonia,
                ciudad: formData.ciudad,
                estado: formData.estado,
            };

            const response = await apiClient.get(`votante/correo/${encodeURIComponent(formData.correo)}`);
            if (response?.data?.error) {
                await apiClient.post("votante/", NewUser);
                toast.success("Registro exitoso. Ahora inicia sesión.");
            } else {
                toast.error("Ese usuario ya existe. Inicia sesión");
            }
        } catch (error) {
            toast.error("Error al registrar. Revisa los datos.");
        }
        setLoading(false);
    };

    return (
        <div className={`modal fade ${show ? "show d-block" : "d-none"}`} tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content p-3">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {view === "login"
                                ? "Iniciar sesión"
                                : view === "register"
                                    ? "Registrarse"
                                    : "Restablecer contraseña"}
                        </h5>
                        <button type="button" className="btn-close" onClick={closeModal}></button>
                    </div>
                    <div className="modal-body">
                        {view === "login" && (
                            <>
                                {/* Formulario de login con correo y contraseña */}
                                <form onSubmit={handleEmailLogin}>
                                    <input
                                        type="email"
                                        name="correo"
                                        className="form-control mb-2"
                                        placeholder="Correo electrónico"
                                        required
                                        value={formData.correo}
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-control mb-2"
                                        placeholder="Contraseña"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button type="submit" className="btn btn-primary w-100 mb-2" disabled={loading}>
                                        {loading ? "Ingresando..." : "Ingresar"}
                                    </button>
                                </form>

                                {/* Botón de login con Google */}
                                <button onClick={handleGoogleLogin} className="btn btn-light w-100 mb-2" disabled={loading}>
                                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" style={{ width: "16px", marginRight: "8px" }} />
                                    Iniciar sesión con Google
                                </button>

                                {/* Link para cambiar a vista de registro */}
                                <div className="text-center">
                                    <span>¿No tienes cuenta? </span>
                                    <button onClick={() => setView("register")} className="btn btn-link btn-sm">Regístrate aquí</button>
                                </div>
                            </>
                        )}

                        {view === "register" && (
                            // Formulario de registro de nuevo usuario
                            <form onSubmit={handleRegister}>
                                <input type="text" name="nombre" className="form-control mb-2" placeholder="Nombre" required value={formData.nombre} onChange={handleChange} />
                                <input type="text" name="apellido" className="form-control mb-2" placeholder="Apellido" required value={formData.apellido} onChange={handleChange} />
                                <input type="email" name="correo" className="form-control mb-2" placeholder="Correo electrónico" required value={formData.correo} onChange={handleChange} />
                                <input type="password" name="password" className="form-control mb-2" placeholder="Contraseña" required value={formData.password} onChange={handleChange} />
                                <input type="number" name="edad" className="form-control mb-2" placeholder="Edad" min={18} required value={formData.edad} onChange={handleChange} />
                                <input type="text" name="codigo_postal" className="form-control mb-2" placeholder="Código Postal" required value={formData.codigo_postal} onChange={handleChange} />
                                <input type="text" name="colonia" className="form-control mb-2" placeholder="Colonia" required value={formData.colonia} onChange={handleChange} />
                                <input type="text" name="ciudad" className="form-control mb-2" placeholder="Ciudad" required value={formData.ciudad} onChange={handleChange} />
                                <input type="text" name="estado" className="form-control mb-2" placeholder="Estado" required value={formData.estado} onChange={handleChange} />

                                <button type="submit" className="btn btn-primary w-100 mb-2" disabled={loading}>
                                    {loading ? "Registrando..." : "Registrarse"}
                                </button>

                                <div className="text-center">
                                    <span>¿Ya tienes cuenta? </span>
                                    <button onClick={() => setView("login")} className="btn btn-link btn-sm">Inicia sesión aquí</button>
                                </div>
                            </form>
                        )}

                        {/* Aquí podrías agregar la vista para restablecer contraseña si quieres */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
