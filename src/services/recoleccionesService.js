import { api } from '../api/client.js'

//Consultamos las recolecciones con filtros y paginacion
export async function listRecolecciones(filtros = {}) {
    const { data } = await api.get('/recolecciones/', { params: filtros });

    //Django devuelve los registros paginados
    if (Array.isArray(data?.results)) {
        return data;
    }
    throw new Error('La API no devolvio un lista de recolecciones')
}

//Consultamos una recoleccion por su ID
export async function getRecoleccion(id) {
    const { data } = await api.get(`/recolecciones/${id}/`);
    return data;
}

//Registramos una nueva recoleccion
export async function addRecoleccion(recoleccion) {
    const { data } = await api.post('/recolecciones/', recoleccion);
    return data;
}

//Actualizamos una recoleccion pendiente
export async function updateRecoleccion(id, recoleccion) {
    const { data } = await api.put(`/recolecciones/${id}/`, recoleccion);
    return data;
}

//Eliminamos una recoleccion pendiente
export async function deleteRecoleccion(id) {
    await api.delete(`/recolecciones/${id}/`);
}

//Confirmamos una recoleccion y Django suma las cantidades al inventario
export async function confirmarRecoleccion(id) {
    const { data } = await api.post(`/recolecciones/${id}/confirmar/`);
    return data;
}

//Cancelamos una recoleccion pendiente
export async function cancelarRecoleccion(id) {
    const { data } = await api.post(`/recolecciones/${id}/cancelar/`);
    return data;
}

//Detalles de recoleccion: cada detalle representa un material y su cantidad
//Consultamos los materiales de una recoleccion
export async function listDetallesRecoleccion(recoleccionId) {
    const { data } = await api.get('/recolecciones/detalles/', { params: { recoleccion: recoleccionId } });

    //Los detalles de devuelven como una lista normal
    if (Array.isArray(data)) {
        return data;
    }
    throw new Error('La API no devolvio los detalles de la recoleccion');
}

//Consulamos un detalle especifico
export async function getDetalleRecoleccion(id) {
    const { data } = await api.get(`/recolecciones/detalles/${id}/`);
    return data;
}

// Agregamos un material a una recolección pendiente
export async function addDetalleRecoleccion(detalle) {
    const { data } = await api.post('/recolecciones/detalles/', detalle);
    return data;
}

// Modificamos el material o la cantidad de un detalle
export async function updateDetalleRecoleccion(id, detalle) {
    const { data } = await api.put(`/recolecciones/detalles/${id}/`, detalle);
    return data;
}

// Eliminamos un detalle de una recolección pendiente
export async function deleteDetalleRecoleccion(id) {
    await api.delete(`/recolecciones/detalles/${id}/`);
}