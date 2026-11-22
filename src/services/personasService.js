import { api } from "../api/client.js";

//Consultamos todas las personas registradas en django
export async function listPersonas() {
    const { data } = await api.get('/personas/');
    if(Array.isArray) {
        return data;
    }
    throw new Error('La API no devolvio una lista de personas');
}

//Consultamos los datos de una persona por su ID
export async function getPersona(id) {
    const { data } = await api.get(`/personas/${id}/`);
    return data;
}

//Registramos una nueva persona
export async function addPersona(persona) {
    const { data } = await api.post('/personas/', persona);
    return data;
}

//Actualizamos los datos de una persona
export async function updatePersona(id, persona) {
    const { data } = await api.put(`/personas/${id}/`, persona);
}

//Eliminamos una persona por su ID
export async function deletePersona(id) {
    await api.delete(`/personas/${id}/`);
}