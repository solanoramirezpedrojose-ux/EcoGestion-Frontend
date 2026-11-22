import { useEffect, useState } from 'react';
import { getError } from '../api/client.js';
import { listPersonas } from '../services/personasService.js';
import { listRecolecciones, getRecoleccion, addRecoleccion, updateRecoleccion, deleteRecoleccion, confirmarRecoleccion, cancelarRecoleccion } from '../services/recoleccionesService.js';
import FormRecoleccion from '../components/FormRecoleccion.jsx';
import DetallesRecoleccion from '../components/DetallesRecoleccion.jsx';
import { useAuth } from '../auth/AuthContext.jsx'
import './Recolecciones.css';

// Pantalla principal del módulo de Recolecciones
export default function Recolecciones() {
    const { tienePermiso } = useAuth();
    // Estados para almacenar las recolecciones y proveedores
    const [recolecciones, setRecolecciones] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados para mostrar mensajes
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    // Estados para filtros y paginación
    const [estado, setEstado] = useState('');
    const [proveedor, setProveedor] = useState('');
    const [pagina, setPagina] = useState(1);
    const [total, setTotal] = useState(0);
    const [siguiente, setSiguiente] = useState(null);
    const [anterior, setAnterior] = useState(null);
    const [recargar, setRecargar] = useState(0);

    // Estados para el formulario y el detalle
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [recoleccionEditando, setRecoleccionEditando] = useState(null);
    const [recoleccionDetalle, setRecoleccionDetalle] = useState(null);

    // Consultamos los proveedores registrados en Django
    useEffect(() => {
        let vigente = true;
        async function cargarProveedores() {
            try {
                const personas = await listPersonas();

                // Filtramos las personas que pueden ser proveedoras
                const lista = personas.filter(persona => persona.tipo_persona === 'PROVEEDOR' || persona.tipo_persona === 'AMBOS');

                if(vigente) {
                    setProveedores(lista);
                }
            }catch(err) {
                if(vigente) {
                    setError(err.response ? getError(err) : err.message);
                }
            }
        }

        cargarProveedores();

        return () => {
            vigente = false;
        };
    }, []);

    // Consultamos las recolecciones utilizando los filtros de Django
    useEffect(() => {
        let vigente = true;
        async function cargarRecolecciones() {
            setCargando(true);
            setError('');

            try {
                const datos = await listRecolecciones({
                    estado: estado,
                    proveedor: proveedor,
                    page: pagina
                });

                if(vigente) {
                    setRecolecciones(datos.results);
                    setTotal(datos.count);
                    setSiguiente(datos.next);
                    setAnterior(datos.previous);
                }
            }catch(err) {
                if(vigente) {
                    setError(err.response ? getError(err) : err.message);
                    setRecolecciones([]);
                }
            }finally {
                if(vigente) {
                    setCargando(false);
                }
            }
        }

        cargarRecolecciones();

        return () => {
            vigente = false;
        };

    }, [estado, proveedor, pagina, recargar]);

    // Buscamos el nombre del proveedor según su ID
    function nombreProveedor(id) {
        const persona = proveedores.find(proveedor => proveedor.id === Number(id));
        return persona ? persona.nombre : `Proveedor #${id}`;
    }

    // Abrimos el formulario para registrar una recolección
    function nuevaRecoleccion() {
        setRecoleccionEditando(null);
        setRecoleccionDetalle(null);
        setMostrarFormulario(true);
        setError('');
        setMensaje('');
    }

    // Consultamos los datos de una recolección para editarla
    async function editarRecoleccion(id) {
        try {
            setError('');
            const datos = await getRecoleccion(id);

            setRecoleccionEditando(datos);
            setRecoleccionDetalle(null);
            setMostrarFormulario(true);

        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Consultamos la información de una recolección
    async function verRecoleccion(id) {
        try {
            setError('');
            const datos = await getRecoleccion(id);

            setRecoleccionDetalle(datos);
            setMostrarFormulario(false);

        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Registramos una nueva recolección o actualizamos una existente
    async function guardarRecoleccion(datos) {
        if(recoleccionEditando) {
            // Actualizamos una recolección existente
            await updateRecoleccion(recoleccionEditando.id, datos);
            setMensaje('Recolección actualizada correctamente.');
        }else {
            // Registramos una nueva recolección
            await addRecoleccion(datos);
            setMensaje('Recolección registrada correctamente.');

            // Limpiamos los filtros para mostrar la nueva recolección
            setEstado('');
            setProveedor('');
            setPagina(1);
        }

        // Cerramos el formulario
        setMostrarFormulario(false);
        setRecoleccionEditando(null);

        // Actualizamos el listado con los datos de Django
        setRecargar(valor => valor + 1);
    }

    // Eliminamos una recolección pendiente
    async function eliminarRecoleccion(id) {

        if(!window.confirm('¿Desea eliminar esta recolección?')) {
            return;
        }

        try {
            setError('');
            setMensaje('');
            await deleteRecoleccion(id);
            setRecoleccionDetalle(null);
            setMensaje('Recolección eliminada correctamente.');

            // Si eliminamos el último registro, regresamos de página
            if(recolecciones.length === 1 && pagina > 1) {
                setPagina(pagina - 1);
            }else {
                setRecargar(valor => valor + 1);
            }

        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Confirmamos una recolección para sumar materiales al inventario
    async function confirmar(id) {
        const aceptar = window.confirm('¿Desea confirmar esta recolección? Las cantidades se sumarán al inventario');

        if(!aceptar) {
            return;
        }

        try {
            setError('');
            setMensaje('');
            await confirmarRecoleccion(id);
            setRecoleccionDetalle(null);
            setMensaje('Recolección confirmada correctamente.');
            setRecargar(valor => valor + 1);
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Cancelamos una recolección pendiente
    async function cancelar(id) {
        if(!window.confirm('¿Desea cancelar esta recolección?')) {
            return;
        }

        try {
            setError('');
            setMensaje('');
            await cancelarRecoleccion(id);
            setRecoleccionDetalle(null);
            setMensaje('Recolección cancelada correctamente.');
            setRecargar(valor => valor + 1);
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Definimos el color de cada estado
    function claseEstado(estadoActual) {
        if(estadoActual === 'RECIBIDA') return 'text-bg-success';
        if(estadoActual === 'CANCELADA') return 'text-bg-danger';
        return 'text-bg-warning';
    }

    // Calculamos la cantidad de páginas según Django
    const totalPaginas = Math.max(1, Math.ceil(total / 5));

    return (
        <section className="recolecciones-page">
            {/* Encabezado del módulo */}
            <div className="recolecciones-hero">
                <div>
                    <h1 className="h3 fw-bold mb-2">
                        <i className="bi bi-truck me-2"/>
                        Gestión de recolecciones
                    </h1>
                    <p className="mb-0">Registro y seguimiento de materiales recibidos</p>
                </div>
                {/* Registrar */}
                {/* Mostramos el botón únicamente si puede registrar recolecciones */}
                {tienePermiso('recolecciones.add_recoleccion') && (
                    <button className="btn recolecciones-btn-nueva" onClick={nuevaRecoleccion}>
                        <i className="bi bi-plus-lg me-2"/>
                        Nueva recolección
                    </button>
                )}
            </div>

            {/* Total de recolecciones encontradas */}
            <div className="recolecciones-resumen mb-4">
                <i className="bi bi-clipboard-check"/>
                <div>
                    <span>Recolecciones encontradas</span>
                    <h2>{cargando ? '...' : total}</h2>
                </div>
            </div>

            {/* Mensajes de error y éxito */}
            {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
            )}

            {mensaje && (
                <div className="alert alert-success" role="status">{mensaje}</div>
            )}

            {/* Formulario para registrar o editar */}
            {mostrarFormulario && (
                <FormRecoleccion
                    key={recoleccionEditando?.id ?? 'nueva'}
                    recoleccion={recoleccionEditando}
                    onGuardar={guardarRecoleccion}
                    onCancelar={() => {
                        setMostrarFormulario(false);
                        setRecoleccionEditando(null);
                    }}
                />
            )}

            {/* Información individual de una recolección */}
            {recoleccionDetalle && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">

                        <div className="d-flex justify-content-between">
                            <h2 className="h5 fw-bold">Recolección #{recoleccionDetalle.id}</h2>
                            <button type="button" className="btn-close" aria-label="Cerrar detalle" onClick={() => setRecoleccionDetalle(null)}/>
                        </div>

                        <p>
                            <strong>Proveedor:</strong> {nombreProveedor(recoleccionDetalle.proveedor)}
                        </p>

                        <p>
                            <strong>Fecha:</strong> {new Date(recoleccionDetalle.fecha).toLocaleString('es-CR')}
                        </p>

                        <p>
                            <strong>Estado:</strong> {recoleccionDetalle.estado}
                        </p>

                        <p className="mb-0">
                            <strong>Observaciones:</strong> {recoleccionDetalle.observaciones || 'Sin observaciones'}
                        </p>

                        {/* Solo mostramos detalles si el usuario puede consultarlos */}
                        {tienePermiso('recolecciones.view_detallerecoleccion') && (
                            <DetallesRecoleccion key={recoleccionDetalle.id} recoleccion={recoleccionDetalle}/>
                        )}
                    </div>
                </div>
            )}

            {/* Filtros para consultar las recolecciones */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">

                    <h2 className="h5 fw-bold mb-3">
                        <i className="bi bi-funnel me-2"/>
                        Filtrar recolecciones
                    </h2>

                    <div className="row g-3">

                        {/* Filtro por estado */}
                        <div className="col-md-6">
                            <label htmlFor="recoleccion-estado" className="form-label">Estado</label>
                            <select id="recoleccion-estado" className="form-select" value={estado}
                                onChange={event => {
                                    setEstado(event.target.value);
                                    setPagina(1);
                                }}
                            >
                                <option value="">Todos los estados</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="RECIBIDA">Recibida</option>
                                <option value="CANCELADA">Cancelada</option>
                            </select>
                        </div>

                        {/* Filtro por proveedor */}
                        <div className="col-md-6">
                            <label htmlFor="recoleccion-filtro-proveedor" className="form-label">Proveedor</label>
                            <select id="recoleccion-filtro-proveedor" className="form-select" value={proveedor}
                                onChange={event => {
                                    setProveedor(event.target.value);
                                    setPagina(1);
                                }}
                            >
                                <option value="">Todos los proveedores</option>

                                {proveedores.map(persona => (
                                    <option key={persona.id} value={persona.id}>
                                        {persona.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla principal de recolecciones */}
            <div className="card border-0 shadow-sm recolecciones-tabla">
                <div className="card-body p-4">

                    <h2 className="h5 fw-bold mb-3">Recolecciones registradas</h2>

                    {cargando ? (
                        <p>Cargando recolecciones...</p>

                    ) : recolecciones.length === 0 ? (
                        <p className="text-secondary">No se encontraron recolecciones.</p>

                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">

                                <thead>
                                    <tr>
                                        <th>N.º</th>
                                        <th>Proveedor</th>
                                        <th>Fecha</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recolecciones.map(recoleccion => (
                                        <tr key={recoleccion.id}>

                                            <td className="fw-semibold">#{recoleccion.id}</td>
                                            <td>{nombreProveedor(recoleccion.proveedor)}</td>
                                            <td>{new Date(recoleccion.fecha).toLocaleString('es-CR')}</td>

                                            <td>
                                                <span className={`badge ${claseEstado(recoleccion.estado)}`}>
                                                    {recoleccion.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-wrap gap-2">

                                                    {/* Consultar recolección */}
                                                    <button className="btn btn-sm btn-outline-success" title="Consultar" onClick={() => verRecoleccion(recoleccion.id)}>
                                                        <i className="bi bi-eye"/>
                                                    </button>

                                                    {/* Las operaciones de modificación solo aplican a pendientes */}
                                                    {recoleccion.estado === 'PENDIENTE' && (
                                                        <>
                                                            {/* Editar recolección */}
                                                            {tienePermiso('recolecciones.change_recoleccion') && (
                                                                <button className="btn btn-sm btn-outline-primary" title="Editar" onClick={() => editarRecoleccion(recoleccion.id)}>
                                                                    <i className="bi bi-pencil"/>
                                                                </button>
                                                            )}

                                                            {/* Eliminar recolección */}
                                                            {tienePermiso('recolecciones.delete_recoleccion') && (
                                                                <button className="btn btn-sm btn-outline-danger" title="Eliminar" onClick={() => eliminarRecoleccion(recoleccion.id)}>
                                                                    <i className="bi bi-trash"/>
                                                                </button>
                                                            )}

                                                            {/* Confirmar recolección */}
                                                            {tienePermiso('recolecciones.change_recoleccion') && (
                                                                <button className="btn btn-sm btn-success" title="Confirmar" onClick={() => confirmar(recoleccion.id)}>
                                                                    <i className="bi bi-check-lg"/>
                                                                </button>
                                                            )}

                                                            {/* Cancelar recolección */}
                                                            {tienePermiso('recolecciones.change_recoleccion') && (
                                                                <button className="btn btn-sm btn-outline-secondary" title="Cancelar" onClick={() => cancelar(recoleccion.id)}>
                                                                    <i className="bi bi-x-lg"/>
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Paginación controlada por Django */}
                    {!cargando && !error && (
                        <div className="recolecciones-paginacion">
                            <span>
                                Página {pagina} de {totalPaginas} — {total} recolecciones
                            </span>

                            <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-outline-success" disabled={!anterior} onClick={() => setPagina(pagina - 1)}>
                                    Anterior
                                </button>

                                <button className="btn btn-sm btn-outline-success" disabled={!siguiente} onClick={() => setPagina(pagina + 1)}>
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}