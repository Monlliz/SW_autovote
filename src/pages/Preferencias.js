import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext"; // Hook para obtener datos del usuario autenticado
import { useNavigate } from "react-router-dom"; // Para redirigir a otra ruta
import "../style/Preferencias.css"; // Estilos para esta página
import { apiClient } from "../api/client"; // Cliente axios configurado para hacer llamadas a API
import InternalNavbar from "../components/InternalNavbar"; // Barra de navegación interna
import { toast } from "react-toastify"; // Para mostrar notificaciones al usuario

const Preferencias = () => {
  // Obtener el usuario actual desde el contexto de autenticación
  const { user } = useAuth();
  // Hook para redireccionar páginas
  const navigate = useNavigate();

  // Estado para almacenar las categorías y preguntas que vienen de la API
  const [categorias, setCategorias] = useState([]);
  // Estado para almacenar las respuestas seleccionadas por el usuario, con clave "categoria-pregunta"
  const [respuestas, setRespuestas] = useState({});

  // useEffect que se ejecuta cuando cambia el usuario (cuando se carga o cambia sesión)
  useEffect(() => {
    if (user?.correo) {
      const fetchData = async () => {
        try {
          // 1. Obtener las preguntas desde la API
          const preguntasResponse = await apiClient.get("votante/preguntas");
          setCategorias(preguntasResponse.data.categorias);

          // 2. Crear un objeto para almacenar las respuestas iniciales (vacías)
          const respuestasIniciales = {};
          preguntasResponse.data.categorias.forEach((categoria) => {
            categoria.preguntas.forEach((_, indexPregunta) => {
              respuestasIniciales[`${categoria.numero}-${indexPregunta}`] = null;
            });
          });

          // 3. Intentar obtener respuestas previas del usuario desde la API
          try {
            const respuestasResponse = await apiClient.get(`votante/${user.uid}`);

            // Mapear las respuestas del backend al formato esperado en el estado
            const respuestasAPI = respuestasResponse.data.preferencias?.reduce(
              (acc, { categoria_id, pregunta_id, valoracion }) => {
                acc[`${categoria_id}-${pregunta_id - 1}`] = valoracion;
                return acc;
              },
              { ...respuestasIniciales } // Partir de las respuestas vacías para no perder preguntas sin respuesta
            );

            // Guardar las respuestas en el estado
            setRespuestas(respuestasAPI || respuestasIniciales);
          } catch (err) {
            // Si falla obtener respuestas previas, usar respuestas vacías
            console.error("Error al obtener respuestas:", err);
            setRespuestas(respuestasIniciales);
          }
        } catch (err) {
          // Si falla obtener preguntas, mostrar error en consola
          console.error("Error al obtener preguntas:", err);
        }
      };

      fetchData();
    }
  }, [user]); // Se ejecuta cuando cambia el usuario

  // Función que actualiza la respuesta seleccionada para una pregunta específica
  const handleRatingChange = (categoriaNum, preguntaIndex, valor) => {
    setRespuestas((prev) => ({
      ...prev,
      [`${categoriaNum}-${preguntaIndex}`]: valor,
    }));
  };

  // Función que maneja el envío del formulario con todas las respuestas
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Verificar que todas las preguntas tengan respuesta (no haya valores null)
    const todasRespondidas = Object.values(respuestas).every(
      (val) => val !== null
    );
    if (!todasRespondidas) {
      // Si falta responder alguna, no enviar y salir
      return;
    }

    try {
      // 2. Transformar las respuestas al formato esperado por la API
      const datosParaAPI = {
        preferencias: Object.entries(respuestas).map(([key, valor]) => {
          const [categoriaNum, preguntaIndex] = key.split("-");
          return {
            categoria_id: parseInt(categoriaNum),
            pregunta_id: parseInt(preguntaIndex) + 1, // Los IDs de preguntas comienzan en 1
            valoracion: valor,
          };
        }),
      };

      const usuario_id = user.uid;

      // 3. Enviar las respuestas a la API con método PUT
      await apiClient.put(`votante/${usuario_id}`, datosParaAPI, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Mostrar notificación de éxito
      toast.success("Preferencias guardadas correctamente");

      // Redirigir al dashboard después de guardar
      navigate("/dashboard");
    } catch (err) {
      // Mostrar error detallado si falla el envío
      console.error("Error detallado:", err.response);
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="encuesta-container">
        <h1 className="encuesta-title">Encuesta de Opinión</h1>
        <p className="encuesta-description">
          Por favor, califique cada afirmación del 1 (Totalmente en desacuerdo)
          al 5 (Totalmente de acuerdo)
        </p>

        <form onSubmit={handleSubmit}>
          {/* Recorrer cada categoría */}
          {categorias.map((categoria) => (
            <div key={categoria.numero} className="categoria-card">
              <h2 className="categoria-title">
                {categoria.numero}. {categoria.nombre}
              </h2>

              <div className="preguntas-container">
                {/* Recorrer las preguntas dentro de la categoría */}
                {categoria.preguntas.map((pregunta, indexPregunta) => (
                  <div key={indexPregunta} className="pregunta-item">
                    <p className="pregunta-text">{pregunta}</p>

                    {/* Opciones de rating del 1 al 5 */}
                    <div className="rating-options">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <label key={num} className="rating-label">
                          <input
                            type="radio"
                            name={`pregunta-${categoria.numero}-${indexPregunta}`} // Mismo name para radio button por pregunta
                            checked={
                              respuestas[`${categoria.numero}-${indexPregunta}`] === num
                            }
                            onChange={() =>
                              handleRatingChange(categoria.numero, indexPregunta, num)
                            }
                            className="rating-input"
                          />
                          <span className="rating-number">{num}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Botón para enviar el formulario */}
          <button type="submit" className="submit-button">
            Enviar Respuestas
          </button>
        </form>
      </div>
    </>
  );
};

export default Preferencias;
