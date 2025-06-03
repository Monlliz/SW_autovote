import React, { useState, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import InternalNavbar from "../components/InternalNavbar";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// Paletas de colores para los gráficos (descomenta la que prefieras)
// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6384', '#36A2EB']; // Coloridos
const COLORS = ['#2E5A88', '#4B77BE', '#6B8FD4', '#8FA7D9', '#B5C4E3', '#D6E0F0', '#1E3F66']; // Azules y grises
// Otras paletas comentadas para referencia
// const COLORS = ['#0B3D91', '#1A56B5', '#296FD9', '#4A89E8', '#6BA3F0', '#8CBDEF', '#ADD7F6'];
// const COLORS = ['#3A1D6E', '#4B2D7F', '#5C3D90', '#6D4DA1', '#7E5DB2', '#8F6DC3', '#A07DD4'];
// const COLORS = ['#4527A0', '#5E35B1', '#7E57C2', '#9575CD', '#B39DDB', '#283593', '#3949AB'];
// const COLORS = ['#2C3E50', '#3D4F61', '#4E6072', '#5F7183', '#708294', '#8193A5', '#92A4B6'];
// const COLORS = ['#005F73', '#0A7086', '#158199', '#2092AC', '#2BA3BF', '#36B4D2', '#41C5E5'];

const CHART_HEIGHT = 400; // Altura estándar para los gráficos

const Estadisticas = () => {
    // Contexto de autenticación para obtener usuario y estado de carga
    const { user, isLoading } = useAuth();

    // Estados locales para control de carga, error y datos crudos obtenidos desde API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rawData, setRawData] = useState({
        votantes: [],       // Lista de votantes
        candidatos: [],     // Lista de candidatos
        categorias: [],     // Categorías de preguntas o temas
        miCandidato: null,  // Datos del candidato si el usuario es candidato
        misPropuestas: []   // Propuestas del candidato actual
    });

    // Hook para cargar datos desde el backend cuando el usuario esté disponible
    useEffect(() => {
        const fetchDatos = async () => {
            try {
                setLoading(true);

                // Espera a que el usuario exista antes de hacer peticiones
                if (!user) return;

                // Peticiones básicas para votantes, candidatos y categorías de preguntas
                const requests = [
                    apiClient.get("/votante"),
                    apiClient.get("/politico"),
                    apiClient.get("/votante/preguntas")
                ];

                // Si el usuario es candidato, se agregan peticiones para obtener sus datos y propuestas
                if (user?.tipo === "candidato") {
                    requests.push(apiClient.get(`/politico/${user.uid}`));
                    requests.push(apiClient.get(`/propuesta/politico/${user.uid}`));
                }

                // Espera a todas las peticiones simultáneamente
                const [votantesRes, candidatosRes, preguntas, miCandidatoRes, misPropuestasRes] = await Promise.all(requests);

                // Guarda los datos crudos en estado para procesar después
                setRawData({
                    votantes: votantesRes.data,
                    candidatos: candidatosRes.data,
                    categorias: preguntas.data.categorias,
                    miCandidato: miCandidatoRes?.data || null,
                    misPropuestas: misPropuestasRes?.data || []
                });

            } catch (err) {
                // Manejo de error simple mostrando mensaje en consola y en UI
                console.error("Error al obtener datos: ", err);
                setError("Error al cargar los datos. Por favor intente más tarde.");
            } finally {
                setLoading(false);
            }
        };

        // Ejecutar la carga solo cuando el usuario y la carga inicial terminen
        if (user && !isLoading) {
            fetchDatos();
        }
    }, [user, isLoading]);

    // Función para agrupar edades en intervalos predefinidos para facilitar la visualización
    const agruparEdades = (edades) => {
        const grupos = {
            '18-25': { min: 18, max: 25, total: 0 },
            '26-35': { min: 26, max: 35, total: 0 },
            '36-45': { min: 36, max: 45, total: 0 },
            '46-55': { min: 46, max: 55, total: 0 },
            '56-65': { min: 56, max: 65, total: 0 },
            '66+': { min: 66, max: 200, total: 0 }
        };

        edades.forEach(edad => {
            for (const [grupo, rango] of Object.entries(grupos)) {
                if (edad >= rango.min && edad <= rango.max) {
                    grupos[grupo].total += 1;
                    break; // Ya encontrada la categoría, sale del loop
                }
            }
        });

        // Convertir objeto a array y filtrar solo grupos con datos positivos
        return Object.entries(grupos).map(([nombre, datos]) => ({
            name: nombre,
            value: datos.total,
            min: datos.min,
            max: datos.max
        })).filter(item => item.value > 0);
    };

    // Función para normalizar nombres de ubicaciones: elimina mayúsculas, acentos y espacios extras
    const normalizarUbicacion = (ubicacion) => {
        if (!ubicacion) return "Sin ciudad";
        return ubicacion
            .trim()
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
            .replace(/\s+/g, ' '); // Unificar espacios múltiples
    };

    // Datos procesados para vista de administrador, usando useMemo para memorizar resultado
    const adminData = useMemo(() => {
        // Unir votantes y candidatos en un solo array con propiedad 'tipo' para distinguirlos
        const votantes = rawData.votantes.map(v => ({ ...v, tipo: "votante" }));
        const candidatos = rawData.candidatos.map(c => ({ ...c, tipo: "candidato" }));
        const todos = [...votantes, ...candidatos];

        // Preparar arrays de edades según tipo de usuario
        const edadesVotantes = [];
        const edadesCandidatos = [];

        todos.forEach(u => {
            if (u.tipo === "votante") {
                edadesVotantes.push(u.edad);
            } else {
                edadesCandidatos.push(u.edad);
            }
        });

        // Crear estructura para intervalos de edad con contadores separados
        const edadData = [
            { grupo: '18-25', min: 18, max: 25, votantes: 0, candidatos: 0 },
            { grupo: '26-35', min: 26, max: 35, votantes: 0, candidatos: 0 },
            { grupo: '36-45', min: 36, max: 45, votantes: 0, candidatos: 0 },
            { grupo: '46-55', min: 46, max: 55, votantes: 0, candidatos: 0 },
            { grupo: '56-65', min: 56, max: 65, votantes: 0, candidatos: 0 },
            { grupo: '66+', min: 66, max: 200, votantes: 0, candidatos: 0 }
        ];

        // Contar votantes y candidatos por grupo de edad
        todos.forEach(u => {
            const edad = u.edad;
            for (const grupo of edadData) {
                if (edad >= grupo.min && edad <= grupo.max) {
                    if (u.tipo === "votante") {
                        grupo.votantes += 1;
                    } else {
                        grupo.candidatos += 1;
                    }
                    break;
                }
            }
        });

        // Filtrar grupos que tienen datos (al menos un votante o candidato)
        const edadDataFiltrada = edadData.filter(g => g.votantes > 0 || g.candidatos > 0);

        // Normalizar y contar ubicaciones
        const ciudades = {};
        todos.forEach(u => {
            const key = normalizarUbicacion(u.ciudad);
            ciudades[key] = (ciudades[key] || 0) + 1;
        });

        // Convertir objeto a array y capitalizar la primera letra
        const ubicacionData = Object.entries(ciudades).map(([name, total]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            total
        })).sort((a, b) => b.total - a.total); // Orden descendente

        // Contar valoraciones por categoría sumando valoracion de cada preferencia
        const categorias = {};
        rawData.votantes.forEach(v => {
            if (Array.isArray(v.preferencias)) {
                v.preferencias.forEach(p => {
                    const catId = p.categoria_id;
                    // Buscar nombre de la categoría en rawData.categorias
                    const nombreCategoria = rawData.categorias.find(c => c.id === catId)?.nombre || "Sin categoría";
                    categorias[nombreCategoria] = (categorias[nombreCategoria] || 0) + p.valoracion;
                });
            }
        });

        // Convertir categorías a array para gráfico y ordenarlas
        const categoriasData = Object.entries(categorias).map(([name, valoracion]) => ({
            categoria: name,
            valoracion
        })).sort((a, b) => b.valoracion - a.valoracion);

        return {
            edadData: edadDataFiltrada,
            ubicacionData,
            categoriasData
        };
    }, [rawData]);

    // Datos procesados para vista de candidato
    const candidateData = useMemo(() => {
        if (!rawData.miCandidato) return null;

        // Filtrar votantes que votaron por este candidato
        const votos = rawData.votantes.filter(v => v.votoPoliticoId === rawData.miCandidato.id);

        // Contar votos por categoría
        const votosPorCategoria = {};
        votos.forEach(voto => {
            if (Array.isArray(voto.preferencias)) {
                voto.preferencias.forEach(pref => {
                    const cat = rawData.categorias.find(c => c.id === pref.categoria_id)?.nombre || "Sin categoría";
                    votosPorCategoria[cat] = (votosPorCategoria[cat] || 0) + 1;
                });
            }
        });

        // Convertir a array para gráfico de barras
        const votosCategoriaArray = Object.entries(votosPorCategoria).map(([categoria, votos]) => ({
            categoria,
            votos
        }));

        // Crear array de edades de los votantes que votaron por el candidato
        const edadesVotantes = votos.map(v => v.edad);

        // Agrupar edades para gráfico de barras
        const edadesAgrupadas = agruparEdades(edadesVotantes);

        return {
            votosPorCategoria: votosCategoriaArray,
            edadesVotantes: edadesAgrupadas,
            tieneDatos: votos.length > 0
        };
    }, [rawData]);

    // Renderizado condicional: si está cargando datos mostrar spinner
  if (loading) {
    // Mientras los datos están cargándose, muestra un spinner y un mensaje de espera
    return (
        <>
            <InternalNavbar />
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <h4 className="mt-3">Cargando tus estadísticas...</h4>
                <p>Esto puede tomar unos momentos</p>
            </div>
        </>
    );
}

if (error) {
    // Si ocurre un error al cargar las estadísticas, muestra un mensaje de error y un botón para recargar la página
    return (
        <>
            <InternalNavbar />
            <div className="container mt-5">
                <div className="alert alert-danger">
                    <h4>Error al cargar las estadísticas</h4>
                    <p>{error}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Intentar nuevamente
                    </button>
                </div>
            </div>
        </>
    );
}

// Renderizado para usuarios tipo "administrador"
if (user.tipo === "administrador") {
    return (
        <>
            <InternalNavbar />
            <div className="container-fluid p-4">
                <div className="row g-4 mb-4">

                    {/* Gráfico de barras para edad de usuarios */}
                    <div className="col-lg-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-primary text-white">
                                <h3 className="mb-0">
                                    <i className="bi bi-bar-chart-fill me-2"></i>
                                    Edad de usuarios
                                </h3>
                            </div>
                            <div className="card-body">
                                <div style={{ height: CHART_HEIGHT }}>
                                    <ResponsiveContainer>
                                        <BarChart data={adminData.edadData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="grupo" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value, name) => [`${value} usuario(s)`, name === 'Votantes' ? 'Votantes' : 'Candidatos']}
                                                labelFormatter={(value) => `Edad: ${value}`}
                                            />
                                            <Legend />
                                            <Bar dataKey="votantes" fill={COLORS[4]} name="Votantes" />
                                            <Bar dataKey="candidatos" fill={COLORS[0]} name="Candidatos" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráfico circular para ubicación de usuarios */}
                    <div className="col-lg-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-primary text-white">
                                <h3 className="mb-0">
                                    <i className="bi bi-pie-chart-fill me-2"></i>
                                    Ubicación de usuarios
                                </h3>
                            </div>
                            <div className="card-body">
                                <div style={{ height: CHART_HEIGHT }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={adminData.ubicacionData}
                                                dataKey="total"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={150}
                                                innerRadius={80}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {adminData.ubicacionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name, props) => [
                                                    value + " usuario(s)",
                                                    name
                                                ]}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gráfico de barras para votos por categoría */}
                <div className="row">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-header bg-primary text-white">
                                <h3 className="mb-0">
                                    <i className="bi bi-bar-chart-fill me-2"></i>
                                    Votos por categoría (valoraciones)
                                </h3>
                            </div>
                            <div className="card-body">
                                <div style={{ height: 500 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={adminData.categoriaData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="categoria"
                                                angle={-45}
                                                textAnchor="end"
                                                height={170}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="total" name="Valoraciones Totales">
                                                {adminData.categoriaData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Renderizado para usuarios tipo "candidato" cuando hay datos disponibles
if (user.tipo === "candidato" && candidateData) {
    return (
        <>
            <InternalNavbar />
            <div className="container-fluid p-4">

                {/* Resumen de votos y progreso */}
                <div className="row mb-4">
                    <div>
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-success text-white">
                                <h3 className="mb-0">
                                    <i className="bi bi-people-fill me-2"></i>
                                    Resumen de votantes
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <h5>Total en plataforma:</h5>
                                            <h3 className="text-primary">{candidateData.totalVotantes}</h3>
                                        </div>
                                        <div className="mb-3">
                                            <h5>Mis votantes:</h5>
                                            <h3 className="text-success">{candidateData.misVotantes}</h3>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <h5>Mis propuestas:</h5>
                                            <h3 className="text-info">{candidateData.misPropuestas}</h3>
                                        </div>
                                        <div className="progress mt-3" style={{ height: "30px" }}>
                                            <div
                                                className="progress-bar bg-info"
                                                role="progressbar"
                                                style={{ width: `${candidateData.porcentajeVotantes}%` }}
                                            >
                                                {candidateData.porcentajeVotantes}%
                                            </div>
                                        </div>
                                        <p className="mt-2 text-muted">Porcentaje de apoyo</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4 mb-4">

                    {/* Gráfico de barras votos por categoría */}
                    <div className="col-lg-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-primary text-white">
                                <h3 className="mb-0">
                                    <i className="bi bi-bar-chart-fill me-2"></i>
                                    Votos por categoría
                                </h3>
                                {candidateData?.votosPorCategoria?.length > 0 && (
                                    <small className="text-white-50">
                                        Total votos: {candidateData.votosPorCategoria.reduce((sum, item) => sum + item.votos, 0)}
                                    </small>
                                )}
                            </div>
                            <div className="card-body">
                                {candidateData?.votosPorCategoria?.length > 0 ? (
                                    <div style={{ height: CHART_HEIGHT }}>
                                        <ResponsiveContainer>
                                            <BarChart
                                                data={candidateData.votosPorCategoria}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="categoria"
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={70}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis
                                                    label={{
                                                        value: 'Número de votos',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        fontSize: 12
                                                    }}
                                                />
                                                <Tooltip
                                                    formatter={(value, name, props) => [
                                                        value,
                                                        props.payload.categoria
                                                    ]}
                                                    labelFormatter={() => 'Total votos'}
                                                />
                                                <Legend />
                                                <Bar
                                                    dataKey="votos"
                                                    name="Votos por categoría"
                                                    fill={COLORS[0]}
                                                    animationDuration={1500}
                                                >
                                                    {candidateData.votosPorCategoria.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={COLORS[index % COLORS.length]}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    // Mensajes si no hay votos o propuestas
                                    <div className="text-center py-4">
                                        {rawData.misPropuestas?.length > 0 ? (
                                            <p>No hay votos registrados para tus propuestas</p>
                                        ) : (
                                            <p>No tienes propuestas registradas</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Gráfico circular edad de votantes */}
                    <div className="col-lg-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-primary text-white">
                                <h3 className="mb-0">
                                    <i className="bi bi-pie-chart-fill me-2"></i>
                                    Edad de mis votantes
                                </h3>
                            </div>
                            <div className="card-body">
                                {candidateData.tieneDatos ? (
                                    <div style={{ height: CHART_HEIGHT }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={candidateData.edadesVotantes}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={150}
                                                    innerRadius={80}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {candidateData.edadesVotantes.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value, name, props) => [
                                                        value + " votante(s)",
                                                        props.payload.name
                                                    ]}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p>No hay datos de edades disponibles</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Gráfico circular ubicación de votantes */}
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-header bg-primary text-white">
                                <h3 className="mb-0">
                                    <i className="bi bi-pie-chart-fill me-2"></i>
                                    Ubicación de mis votantes
                                </h3>
                            </div>
                            <div className="card-body">
                                {candidateData.tieneDatos ? (
                                    <div style={{ height: CHART_HEIGHT }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={candidateData.ubicacionVotantes}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={150}
                                                    innerRadius={80}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {candidateData.ubicacionVotantes.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value, name, props) => [
                                                        value,
                                                        props.payload.name
                                                    ]}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p>No hay datos de ubicación disponibles</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
    // Default view for other user types
    return (
        <>
            <InternalNavbar />
            <div className="container mt-5">
                <div className="alert alert-warning">
                    No tienes permisos para ver estadísticas.
                </div>
            </div>
        </>
    );
};

export default Estadisticas;