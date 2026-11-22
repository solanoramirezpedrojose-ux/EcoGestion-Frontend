import { api } from '../api/client.js';

//Funcion para obtener los indicadores del dashboard
export async function obtenerIndicadores() {
    //Consultamos personas, materiales y ventas de Django
    const respuestaPersonas = await api.get('/personas/');
    const respuestaMateriales = await api.get('/materiales/');
    const respuestaVentas = await api.get('/ventas/');

    //Guardamos los datos recibidos de cada endpoint
    const personas = respuestaPersonas.data;
    const materiales = respuestaMateriales.data;
    const ventas = respuestaVentas.data;

    //Verificamos que Django haya devuelto los datos que esperamos
    if (!Array.isArray(personas) || typeof materiales?.count !== 'number' || !Array.isArray(ventas)) {
        throw new Error('La API no devolvio los datos esperados');
    }

    //Devolvemos los totales para mostrarlos en el dashboard
    return {
        totalPersonas: personas.length,
        totalMateriales: materiales.count,
        totalVentas: ventas.length
    };
}