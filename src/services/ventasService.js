import { api } from '../api/client.js';

// Consultamos las ventas registradas con sus filtros
export async function listVentas(filtros = {}) {
    const { data } = await api.get('/ventas/', { params: filtros });

    // Django devuelve las ventas como una lista normal
    if (Array.isArray(data)) {
        return data;
    }
    throw new Error('La API no devolvió una lista de ventas');
}

// Consultamos una venta por su ID
export async function getVenta(id) {
    const { data } = await api.get(`/ventas/${id}/`);
    return data;
}

// Registramos una nueva venta
export async function addVenta(venta) {
    const { data } = await api.post('/ventas/', venta);
    return data;
}

// Actualizamos una venta pendiente
export async function updateVenta(id, venta) {
    const { data } = await api.put(`/ventas/${id}/`, venta);
    return data;
}

// Eliminamos una venta pendiente
export async function deleteVenta(id) {
    await api.delete(`/ventas/${id}/`);
}

// Confirmamos una venta y Django descuenta el stock
export async function confirmarVenta(id) {
    const { data } = await api.post(`/ventas/${id}/confirmar/`);
    return data;
}

// Anulamos una venta pendiente
export async function anularVenta(id) {
    const { data } = await api.post(`/ventas/${id}/anular/`);
    return data;
}

// SERVICIO DE DETALLES DE VENTA
// Cada detalle contiene material, cantidad y precio
// Consultamos los materiales de una venta
export async function listDetallesVenta(ventaId) {
    const { data } = await api.get('/ventas/detalles/', { params: { venta: ventaId } });

    if (Array.isArray(data)) {
        return data;
    }
    throw new Error('La API no devolvió los detalles de la venta.');
}

// Consultamos un detalle por su ID
export async function getDetalleVenta(id) {
    const { data } = await api.get(`/ventas/detalles/${id}/`);
    return data;
}

// Agregamos un material a una venta pendiente
export async function addDetalleVenta(detalle) {
    const { data } = await api.post('/ventas/detalles/', detalle);
    return data;
}

// Actualizamos el material, la cantidad o el precio
export async function updateDetalleVenta(id, detalle) {
    const { data } = await api.put(`/ventas/detalles/${id}/`, detalle);
    return data;
}

// Eliminamos un material de una venta pendiente
export async function deleteDetalleVenta(id) {
    await api.delete(`/ventas/detalles/${id}/`);
}