import axios from 'axios';

// Obtenemos la dirección de la API desde las variables de entorno
const baseURL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

// Configuramos Axios para realizar peticiones al backend
export const api = axios.create({
    baseURL,
    timeout: 12000
});

// Agregamos el token del usuario a las peticiones
api.interceptors.request.use(config => {
    const token = sessionStorage.getItem('ecogestion_token');

    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }

    return config;
});

// Traducimos los mensajes comunes que devuelve Django
function traducirMensaje(mensaje) {
    const texto = String(mensaje);
    const error = texto.toLowerCase();

    if (error.includes('already exists')) {
        return 'Ya existe un registro con ese valor.';
    }

    if (error.includes('required')) {
        return 'Este campo es obligatorio.';
    }

    if (error.includes('may not be blank')) {
        return 'Este campo no puede estar vacío.';
    }

    if (error.includes('valid email')) {
        return 'Ingrese un correo electrónico válido.';
    }

    if (error.includes('valid choice')) {
        return 'Seleccione una opción válida.';
    }

    if (error.includes('valid number') || error.includes('valid decimal')) {
        return 'Ingrese un número válido.';
    }

    if (error.includes('greater than or equal')) {
        return 'El valor es menor que el mínimo permitido.';
    }

    if (error.includes('less than or equal')) {
        return 'El valor supera el máximo permitido.';
    }

    // Si no conocemos el error, mostramos el mensaje de Django
    return texto;
}

// Función general para mostrar errores del backend
export function getError(error) {

    // Comprobamos si Django está disponible
    if (!error.response) {
        return 'No se puede conectar con Django. Compruebe que el servidor esté funcionando.';
    }

    const data = error.response.data;
    const codigo = error.response.status;

    // Evitamos mostrar páginas HTML de Django
    if (typeof data === 'string' && data.trim().startsWith('<')) {
        if (codigo === 404) {
            return 'No se encontró el registro o la dirección solicitada.';
        }

        return `Ocurrió un error en el servidor (${codigo}).`;
    }

    // Si Django devuelve un mensaje de texto
    if (typeof data === 'string') {
        return traducirMensaje(data);
    }

    // Si Django devuelve varios errores generales
    if (Array.isArray(data)) {
        return data.map(mensaje => traducirMensaje(mensaje)).join(' ');
    }

    // Procesamos cualquier campo que tenga errores
    if (data && typeof data === 'object') {
        const mensajes = [];

        for (const campo in data) {
            const errores = Array.isArray(data[campo]) ? data[campo] : [data[campo]];

            for (const mensaje of errores) {
                const mensajeFinal = traducirMensaje(mensaje);

                // Los errores generales no necesitan el nombre del campo
                if (campo === 'error' || campo === 'detail' || campo === 'non_field_errors') {
                    mensajes.push(mensajeFinal);
                } else {
                    // Mostramos el nombre del campo y su error
                    const nombreCampo = campo.replace(/_/g, ' ');
                    mensajes.push(`${nombreCampo}: ${mensajeFinal}`);
                }
            }
        }

        if (mensajes.length > 0) {
            return mensajes.join(' ');
        }
    }

    // Mensajes generales según el código HTTP
    if (codigo === 400) return 'Los datos ingresados no son válidos.';
    if (codigo === 401) return 'Debe iniciar sesión para continuar.';
    if (codigo === 403) return 'No tiene permiso para realizar esta operación.';
    if (codigo === 404) return 'No se encontró el registro solicitado.';
    if (codigo === 409) return 'No se puede completar la operación porque existen registros relacionados.';

    return `Ocurrió un error al realizar la operación (${codigo}).`;
}