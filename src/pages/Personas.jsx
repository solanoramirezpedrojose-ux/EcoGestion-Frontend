import { useEffect, useState } from "react";
import { getError } from "../api/client";
import { listPersonas, getPersona, addPersona, updatePersona, deletePersona } from "../services/personasService.js";
import FormPersona from "../components/FormPersona.jsx";

//Pantalla principal del modulo de personas
export default function Personas() {
    const [personas, setPersonas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    //Estados para el formulario y la consulta de detalles
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [personaEditando, setPersonaEditando] = useState(null);
    const [personaDetalle, setPersonaDetalle] = useState(null);

    //Cargamos las personas al entrar a esta pantallas
    useEffect(() => {
        async function cargar() {
            try {
                const datos = await listPersonas();
                setPersonas(datos);
            }catch(err) {
                setError(getError(err));
            }finally {
                setCargando(false);
            }
        }
        cargar();
    }, []);
   
    //Abrimos el formulario para registrar una persona
    function nuevaPersona() {
        setPersonaEditando(null);
        setPersonaDetalle(null);
        setMensaje('');
        setError('');
        setMostrarFormulario(true);
    }

    //Consultamos los datos de una persona para editarla
    async function editarPersona(id) {
        try {
            setError('');
            const datos = await getPersona(id);
            setPersonaEditando(datos);
            setPersonaDetalle(null);
            setMostrarFormulario(true);
        }catch(err) {
            setError(getError(err));
        }
    }

    //Consultamos la informacion completa de una persona
    async function verPersona(id) {
        try {
            setError('');
            const datos = await getPersona(id);
            setPersonaDetalle(datos);
            setMostrarFormulario(false);
        }catch(err) {
            setError(getError(err))
        }
    }

    //Guardamos los datos nuevos o modificamos en Django
    async function guardarPersona(datos) {
        if(personaEditando) {
            // Actualizamos una persona existente
            await updatePersona(personaEditando.id, datos);
            setMensaje('Persona actualizada correctamente');
        }else {
            // Registramos una nueva persona
            await addPersona(datos);
            setMensaje('Persona registrada correctamente');
        }

        // Actualizamos el listado con los datos reales
        const listaActualizada = await listPersonas();
        setPersonas(listaActualizada);

        // Cerramos el formulario
        setMostrarFormulario(false);
        setPersonaEditando(null);
    }

    // Eliminamos una persona después de solicitar confirmación
    async function eliminarPersona(id) {
        const confirmar = window.confirm('¿Está seguro de que desea eliminar esta persona?');

        if(!confirmar) {
            return;
        }

        try {
            setError('');
            setMensaje('');

            // Solicitamos la eliminación a Django
            await deletePersona(id);

            // Consultamos nuevamente los registros
            const datos = await listPersonas();
            setPersonas(datos);
            setPersonaDetalle(null);
            setMensaje('Persona eliminada correctamente');
        }catch(err) {
            // Django puede rechazar el borrado por permisos o relaciones
            setError(getError(err));
        }
    }

    //Calculamos las personas activas
    const totalActivas = personas.filter(persona => persona.activo).length;

    return (
        <section className="personas-page">

            {/* Encabezado del módulo */}
            <div className="personas-hero">
                <div>
                    <h1 className="h3 fw-bold mb-2">
                        <i className="bi bi-people me-2"/>
                        Gestión de personas
                    </h1>
                    <p className="mb-0">
                        Administración de proveedores y compradores
                    </p>
                </div>

                <button className="btn personas-btn-nueva" onClick={nuevaPersona}>
                    <i className="bi bi-plus-lg me-2"/>
                    Nueva persona
                </button>
            </div>

            {/* Indicadores calculados a partir de la API */}
            <div className="row g-3 mb-4">
                <div className="col-md-6">
                    <div className="personas-resumen">
                        <i className="bi bi-people"/>
                        <div>
                            <span>Personas registradas</span>
                            <h2>{cargando ? '...' : personas.length}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="personas-resumen">
                        <i className="bi bi-person-check"/>
                        <div>
                            <span>Personas activas</span>
                            <h2>{cargando ? '...' : totalActivas}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mensajes de éxito y error */}
            {mensaje && (
                <div className="alert alert-success" role="status">
                    {mensaje}
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Formulario para registrar o editar */}
            {mostrarFormulario && (
                <FormPersona key={personaEditando?.id ?? 'nueva'} persona={personaEditando} onGuardar={guardarPersona} onCancelar={() => setMostrarFormulario(false)}/>
            )}

            {/* Información de una persona seleccionada */}
            {personaDetalle && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between">
                            <h2 className="h5">Detalle de persona</h2>
                            <button className="btn-close" onClick={() => setPersonaDetalle(null)} aria-label="Cerrar detalle"/>
                        </div>

                        <p><strong>Nombre:</strong> {personaDetalle.nombre}</p>
                        <p><strong>Identificación:</strong> {personaDetalle.identificacion}</p>
                        <p><strong>Teléfono:</strong> {personaDetalle.telefono}</p>
                        <p><strong>Correo:</strong> {personaDetalle.correo}</p>
                        <p><strong>Dirección:</strong> {personaDetalle.direccion}</p>
                        <p><strong>Tipo:</strong> {personaDetalle.tipo_persona}</p>
                        <p><strong>Estado:</strong> {personaDetalle.activo ? 'Activa' : 'Inactiva'}</p>
                        <p className="mb-0">
                            <strong>Fecha de registro:</strong>{' '}
                            {personaDetalle.fecha_registro ? new Date(personaDetalle.fecha_registro).toLocaleDateString('es-CR') : 'Sin fecha'}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabla de personas */}
            <div className="card border-0 shadow-sm personas-tabla">
                <div className="card-body p-4">
                    <h2 className="h5 fw-bold mb-3">
                        Listado de personas
                    </h2>

                    {cargando ? (
                        <p>Cargando personas...</p>
                    ) : personas.length === 0 && !error ? (
                        <p className="text-secondary">
                            No hay personas registradas.
                        </p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Identificación</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {personas.map((persona) => (
                                        <tr key={persona.id}>
                                            <td>{persona.nombre}</td>
                                            <td>{persona.identificacion}</td>
                                            <td>{persona.tipo_persona}</td>
                                            <td>
                                                <span className={
                                                    persona.activo
                                                        ? 'badge text-bg-success'
                                                        : 'badge text-bg-secondary'
                                                }>
                                                    {persona.activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-sm btn-outline-success" title="Ver detalle" onClick={() => verPersona(persona.id)}>
                                                        <i className="bi bi-eye"/>
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-primary" title="Editar persona" onClick={() => editarPersona(persona.id)}>
                                                        <i className="bi bi-pencil"/>
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" title="Eliminar persona" onClick={() => eliminarPersona(persona.id)}>
                                                        <i className="bi bi-trash"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}