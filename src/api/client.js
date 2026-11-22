import axios from 'axios';

// Obtenemos la dirección de la API desde las variables de entorno
const baseURL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

// Se configura Axios para realizar las peticiones al backend
export const api = axios.create({
    baseURL,
    timeout: 12000
});

// Agregamos el token del usuario a las peticiones cuando esté disponible
api.interceptors.request.use(config => {
    const token = sessionStorage.getItem('ecogestion_token');

    if(token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

// Función para mostrar mensajes de error provenientes de Django
export function getError(error) {

    // Verificamos si existe un error de conexión con el servidor
    if(!error.response) {
        return 'No se puede conectar con Django, compruebe el servidor';
    }

    // Obtenemos la información del error
    const data = error.response.data;

    // Evitamos mostrar páginas HTML completas de Django
    if(typeof data === 'string' && data.trim().startsWith('<')) {
        return `Error HTTP ${error.response.status}. Verifique la ruta de la API.`;
    }

    // Si el error es texto normal, lo mostramos
    if(typeof data === 'string') {
        return data;
    }

    // Mostramos errores generales de validación
    if(data?.non_field_errors) {
        return data.non_field_errors.join(', ');
    }

    // Mostramos mensajes de error enviados por Django
    if(data?.detail) {
        return data.detail;
    }

    // Mostramos los errores personalizados de nuestro backend
    if(data?.error) {
        return data.error;
    }

    // Mostramos errores de campos o un mensaje general
    return JSON.stringify(data) || `Error HTTP ${error.response.status}`;
}