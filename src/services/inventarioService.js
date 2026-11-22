import { api } from '../api/client.js';

// Función para consultar los materiales registrados
// Recibimos los filtros que el usuario seleccione
export async function listMateriales(filtros = {}) {
    // Enviamos los filtros como parámetros a Django
    const { data } = await api.get('/materiales/', {params: filtros});

    // Verificamos que Django devuelva los resultados paginados
    if (Array.isArray(data?.results)) {
        return data;
    }
    throw new Error('La API no devolvió una lista de materiales');
}

// Función para consultar un material por su ID
export async function getMaterial(id) {
    const { data } = await api.get(`/materiales/${id}/`);
    return data;
}

// Función para registrar un material nuevo
export async function addMaterial(material) {
    const { data } = await api.post('/materiales/', material);
    return data;
}

// Función para actualizar un material existente
export async function updateMaterial(id, material) {
    const { data } = await api.put(`/materiales/${id}/`, material);
    return data;
}

// Función para eliminar un material
export async function deleteMaterial(id) {
    await api.delete(`/materiales/${id}/`);
}