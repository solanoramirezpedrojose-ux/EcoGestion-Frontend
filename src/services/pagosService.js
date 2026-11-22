import { api } from '../api/client.js';

// Consultamos los pagos registrados con sus filtros
export async function listPagos(filtros = {}) {
    const { data } = await api.get('/pagos/', { params: filtros });

    // Django devuelve los pagos como una lista normal
    if (Array.isArray(data)) {
        return data;
    }
    throw new Error('La API no devolvió una lista de pagos');
}

// Consultamos un pago por su ID
export async function getPago(id) {
    const { data } = await api.get(`/pagos/${id}/`);
    return data;
}

// Registramos un nuevo pago
export async function addPago(pago) {
    const { data } = await api.post('/pagos/', pago);
    return data;
}

// Actualizamos los datos de un pago existente
export async function updatePago(id, pago) {
    const { data } = await api.put(`/pagos/${id}/`, pago);
    return data;
}

// Eliminamos un pago por su ID
export async function deletePago(id) {
    await api.delete(`/pagos/${id}/`);
}