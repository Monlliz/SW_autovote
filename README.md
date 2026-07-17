# 🗳️ Autovote — Frontend

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Ant Design](https://img.shields.io/badge/UI-Ant%20Design-1677FF?logo=antdesign&logoColor=white)
![Bootstrap](https://img.shields.io/badge/UI-Bootstrap%205-7952B3?logo=bootstrap&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Integrado-FFCA28?logo=firebase&logoColor=black)

Interfaz web de **Autovote**, una plataforma que ayuda a los ciudadanos a tomar decisiones electorales informadas: responde un cuestionario de preferencias, compara automáticamente tus posturas con las propuestas reales de los candidatos y visualiza los resultados.

🔗 **Backend / API:** [SW_autovote_back](https://github.com/Monlliz/SW_autovote_back)

## ✨ Funcionalidades

- Cuestionario interactivo de preferencias ideológicas (10 categorías)
- Comparación automática entre el perfil del votante y las propuestas de los políticos
- Paneles y gráficas de estadísticas con **Recharts**
- Gestión de sesión y notificaciones (toasts, modales)
- Diseño responsive con componentes de **Ant Design** y **React-Bootstrap**

## 🛠️ Stack técnico

| Categoría | Tecnología |
|---|---|
| Librería UI | React 19 |
| Componentes | Ant Design, React-Bootstrap, Bootswatch |
| Enrutamiento | React Router DOM |
| Peticiones HTTP | Axios |
| Backend as a Service | Firebase |
| Gráficas | Recharts |
| Notificaciones / UI extra | React Toastify, React Modal, React Icons |
| Build tool | Create React App |
| Despliegue | Vercel |

## 🚀 Cómo correrlo localmente

### 1. Clonar el repositorio

```bash
git clone https://github.com/Monlliz/SW_autovote.git
cd SW_autovote
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

Crea un archivo `.env` en la raíz con la URL del backend y tus credenciales de Firebase, por ejemplo:

```
REACT_APP_API_URL=http://127.0.0.1:5000
REACT_APP_FIREBASE_API_KEY=tu_api_key
```

### 4. Levantar en modo desarrollo

```bash
npm start
```

Se abrirá en <http://localhost:3000>

### Otros scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Corre la app en modo desarrollo |
| `npm test` | Corre las pruebas en modo interactivo |
| `npm run build` | Genera el build de producción en `/build` |

## 🔗 Proyecto relacionado

Este frontend consume la API de [`SW_autovote_back`](https://github.com/Monlliz/SW_autovote_back) (Flask + MongoDB), donde vive toda la lógica de negocio, autenticación y valoración de propuestas con IA.

## 🎬 Demo

[Ver video de demostración](https://drive.google.com/file/d/1Kp-um5qzvAoLxq6xPny1_KGjSqg-aI2E/view?usp=sharing)

## 👩‍💻 Autora

Desarrollado por [Monlliz](https://github.com/Monlliz) como parte de un proyecto académico de sistemas web.

