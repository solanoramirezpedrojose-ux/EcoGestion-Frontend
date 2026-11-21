import axios from 'axios';

//Obtenemos la direccion de la API desde las variables de entorno
const baseURL = (import.meta.env.VITE_API_URL || 'http:127.0.0.1:8000/api').replace(/\/$/,'');

//Se configura axios para realizarle las peticiones al backend
export const api = axios.create({
    baseURL,
    timeout: 12000
});

//Agregamos el token del usuario a las peticiones cuando este disponible
api.interceptors.request.use(config => {
    const token = sessionStorage.getItem('ecogestion_token');

    if(token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

//Funcion para mostrar mensajes de error provenientes de Django
export function getError(error) {
    //Verificamos si existe un error de conexion con el servidor
    if(!error.response) {
        return 'No se puede conectar con Django, compruebe el servidor';
    }
    
    //Obtenemos la informacion del error
    const data = error.response.data;

    //Si el error es texto se devuelve directamente
    if (typeof data == 'string') {
        return data;
    }

    //Mostrar errores generales de validacion
    if(data?.non_field_errors) {
        return data.non_field_errors.join('');
    }

    //Mostramos mensajes de error enviados por Django
    if(data?.detail) {
        return data.detail;
    }

    // Mostramos el mensaje de Django o convertimos el error en texto
    return data?.detail || JSON.stringify(data) || `Error HTTP ${error.response.status}`;
}