import { useEffect, useState } from 'react';
import { getError } from '../api/client.js';
import { listPersonas } from '../services/personasService.js';
import { listVentas, getVenta, addVenta, updateVenta, deleteVenta, confirmarVenta, anularVenta, listDetallesVenta } from '../services/ventasService.js';
import FormVenta from '../components/FormVenta.jsx';
import './Ventas.css';
import DetallesVenta from '../components/DetallesVenta.jsx';

// Pantalla principal del módulo de Ventas
export default function Ventas() {
    // Estados para almacenar los registros
    const [ventas, setVentas] = useState([]);
    const [compradores, setCompradores] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados para mostrar mensajes
    const [error, setError] = useState('');
    const [errorCompradores, setErrorCompradores] = useState('');
    const [mensaje, setMensaje] = useState('');

    // Estados para filtrar las ventas
    const [estado, setEstado] = useState('');
    const [comprador, setComprador] = useState('');
    const [recargar, setRecargar] = useState(0);

    // Estados para registrar, editar y consultar
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [ventaEditando, setVentaEditando] = useState(null);
    const [ventaDetalle, setVentaDetalle] = useState(null);

    // Consultamos los compradores registrados
    useEffect(() => {
        let vigente = true;

        async function cargarCompradores() {
            try {
                const personas = await listPersonas();
                // Incluimos compradores y personas de ambos tipos
                const lista = personas.filter(persona =>
                    persona.tipo_persona === 'COMPRADOR' || persona.tipo_persona === 'AMBOS'
                );

                if(vigente) {
                    setCompradores(lista);
                }
            }catch(err) {
                if(vigente) {
                    setErrorCompradores(err.response ? getError(err) : err.message);
                }
            }
        }

        cargarCompradores();

        return () => {
            vigente = false;
        };
    }, []);

    // Consultamos las ventas utilizando los filtros de Django
    useEffect(() => {
        let vigente = true;
        async function cargarVentas() {
            setCargando(true);
            setError('');

            try {
                const datos = await listVentas({estado: estado, comprador: comprador});

                if(vigente) {
                    setVentas(datos);
                }
            }catch(err) {
                if(vigente) {
                    setError(err.response ? getError(err) : err.message);
                    setVentas([]);
                }
            }finally {
                if(vigente) {
                    setCargando(false);
                }
            }
        }

        cargarVentas();

        return () => {
            vigente = false;
        };
    }, [estado, comprador, recargar]);

    // Buscamos el nombre del comprador utilizando su ID
    function nombreComprador(id) {
        const persona = compradores.find(persona => persona.id === Number(id));
        return persona ? persona.nombre : `Comprador #${id}`;
    }

    // Abrimos el formulario para registrar una venta
    function nuevaVenta() {
        setVentaEditando(null);
        setVentaDetalle(null);
        setMostrarFormulario(true);
        setError('');
        setMensaje('');
    }

    // Consultamos una venta para editarla
    async function editarVenta(id) {
        try {
            setError('');
            const datos = await getVenta(id);
            setVentaEditando(datos);
            setVentaDetalle(null);
            setMostrarFormulario(true);
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Consultamos los datos de una venta
    async function verVenta(id) {
        try {
            setError('');
            const datos = await getVenta(id);
            setVentaDetalle(datos);
            setMostrarFormulario(false);
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }
    
    //Actualizamos el total de la venta y su listado
    async function actualizarDatosVenta() {
        const datos = await getVenta(ventaDetalle.id);

        //Guardamos el total actualizado por Django
        setVentaDetalle(datos);

        //Actualizamos tambien la tabla princpal de Ventas
        setRecargar(valor => valor+1);
    }

    // Registramos o actualizamos una venta
    async function guardarVenta(datos) {
        setError('');
        setMensaje('');

        let ventaGuardada;

        if(ventaEditando) {
            // Actualizamos una venta pendiente
            ventaGuardada = await updateVenta(ventaEditando.id, datos);
            setMensaje('Venta actualizada correctamente.');
        }else {
            // Registramos una nueva venta
            ventaGuardada = await addVenta(datos);
            setMensaje('Venta registrada correctamente. Ahora puede agregar materiales.');

            // Limpiamos los filtros para mostrar las ventas registradas
            setEstado('');
            setComprador('');
        }

        // Cerramos el formulario y mostramos la venta guardada
        setMostrarFormulario(false);
        setVentaEditando(null);
        setVentaDetalle(ventaGuardada);

        // Actualizamos el listado desde Django
        setRecargar(valor => valor + 1);
    }

    // Eliminamos una venta pendiente
    async function eliminarVenta(id) {
        if(!window.confirm('¿Desea eliminar esta venta?')) {
            return;
        }

        try {
            setError('');
            setMensaje('');
            await deleteVenta(id);
            setVentaDetalle(null);
            setMensaje('Venta eliminada correctamente.');
            setRecargar(valor => valor + 1);
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Confirmamos una venta y descontamos las existencias
    async function confirmar(id) {
        try {
            setError('');
            setMensaje('');

            // Verificamos que la venta tenga materiales registrados
            const detalles = await listDetallesVenta(id);

            if(detalles.length === 0) {
                setError('Primero debe agregar materiales a la venta.');
                return;
            }

            const aceptar = window.confirm('¿Desea confirmar esta venta? Se descontarán los materiales del inventario.');

            if(!aceptar) {
                return;
            }

            // Django comprueba el stock antes de confirmar
            await confirmarVenta(id);

            setVentaDetalle(null);
            setMensaje('Venta confirmada correctamente.');
            setRecargar(valor => valor + 1);

        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Anulamos una venta pendiente
    async function anular(id) {
        if(!window.confirm('¿Desea anular esta venta?')) {
            return;
        }

        try {
            setError('');
            setMensaje('');

            await anularVenta(id);

            setVentaDetalle(null);
            setMensaje('Venta anulada correctamente.');
            setRecargar(valor => valor + 1);

        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Definimos el color de los estados
    function claseEstado(estadoActual) {
        if(estadoActual === 'CONFIRMADA') return 'text-bg-success';
        if(estadoActual === 'ANULADA') return 'text-bg-danger';
        return 'text-bg-warning';
    }

    // Contamos los registros según los filtros aplicados
    const ventasPendientes = ventas.filter(venta => venta.estado === 'PENDIENTE').length;
    const ventasConfirmadas = ventas.filter(venta => venta.estado === 'CONFIRMADA').length;

    return (
        <section className="ventas-page">

            {/* Encabezado principal del módulo */}
            <div className="ventas-hero">
                <div>
                    <h1 className="h3 fw-bold mb-2">
                        <i className="bi bi-cart-check me-2"/>
                        Gestión de ventas
                    </h1>
                    <p className="mb-0">Registro y control de ventas de materiales reciclables</p>
                </div>

                <button type="button" className="btn ventas-btn-nueva" onClick={nuevaVenta}>
                    <i className="bi bi-plus-lg me-2"/>
                    Nueva venta
                </button>
            </div>

            {/* Tarjetas con información de las ventas */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="ventas-resumen">
                        <i className="bi bi-cart3"/>
                        <div>
                            <span>Ventas encontradas</span>
                            <h2>{cargando ? '...' : ventas.length}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="ventas-resumen">
                        <i className="bi bi-clock-history"/>
                        <div>
                            <span>Ventas pendientes</span>
                            <h2>{cargando ? '...' : ventasPendientes}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="ventas-resumen">
                        <i className="bi bi-check-circle"/>
                        <div>
                            <span>Ventas confirmadas</span>
                            <h2>{cargando ? '...' : ventasConfirmadas}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mensajes de error y éxito */}
            {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
            )}

            {errorCompradores && (
                <div className="alert alert-warning" role="alert">{errorCompradores}</div>
            )}

            {mensaje && (
                <div className="alert alert-success" role="status">{mensaje}</div>
            )}

            {/* Formulario para registrar o editar */}
            {mostrarFormulario && (
                <FormVenta key={ventaEditando?.id ?? 'nueva'} venta={ventaEditando}
                    onGuardar={guardarVenta}
                    onCancelar={() => {
                        setMostrarFormulario(false);
                        setVentaEditando(null);
                    }}
                />
            )}

            {/* Información de la venta seleccionada */}
            {ventaDetalle && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="h5 fw-bold mb-0">Venta #{ventaDetalle.id}</h2>
                            <button type="button" className="btn-close" aria-label="Cerrar detalle" onClick={() => setVentaDetalle(null)}/>
                        </div>

                        <p><strong>Comprador:</strong> {nombreComprador(ventaDetalle.comprador)}</p>
                        <p><strong>Fecha:</strong> {new Date(ventaDetalle.fecha).toLocaleString('es-CR')}</p>
                        <p>
                            <strong>Estado:</strong>{' '}
                            <span className={`badge ${claseEstado(ventaDetalle.estado)}`}>
                                {ventaDetalle.estado}
                            </span>
                        </p>
                        <p><strong>Total:</strong> ₡{ventaDetalle.total}</p>

                        {/* Mostramos los materiales de la venta seleccionada */}
                        <DetallesVenta key={ventaDetalle.id} venta={ventaDetalle} onActualizado={actualizarDatosVenta}/>
                    </div>
                </div>
            )}

            {/* Filtros para consultar las ventas */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">

                    <h2 className="h5 fw-bold mb-3">
                        <i className="bi bi-funnel me-2"/>
                        Filtrar ventas
                    </h2>

                    <div className="row g-3">

                        {/* Filtro por estado */}
                        <div className="col-md-6">
                            <label htmlFor="venta-filtro-estado" className="form-label">Estado</label>
                            <select id="venta-filtro-estado" className="form-select" value={estado}
                                onChange={event => setEstado(event.target.value)}>
                                <option value="">Todos los estados</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="CONFIRMADA">Confirmada</option>
                                <option value="ANULADA">Anulada</option>
                            </select>
                        </div>

                        {/* Filtro por comprador */}
                        <div className="col-md-6">
                            <label htmlFor="venta-filtro-comprador" className="form-label">Comprador</label>
                            <select id="venta-filtro-comprador" className="form-select" value={comprador}
                                onChange={event => setComprador(event.target.value)}>
                                <option value="">Todos los compradores</option>
                                {compradores.map(persona => (
                                    <option key={persona.id} value={persona.id}>
                                        {persona.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla principal de ventas */}
            <div className="card border-0 shadow-sm ventas-tabla">
                <div className="card-body p-4">

                    <h2 className="h5 fw-bold mb-3">Ventas registradas</h2>

                    {cargando ? (
                        <p>Cargando ventas...</p>

                    ) : ventas.length === 0 ? (
                        <p className="text-secondary">No se encontraron ventas.</p>

                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>N.º</th>
                                        <th>Comprador</th>
                                        <th>Fecha</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {ventas.map(venta => (
                                        <tr key={venta.id}>
                                            <td className="fw-semibold">#{venta.id}</td>
                                            <td>{nombreComprador(venta.comprador)}</td>
                                            <td>{new Date(venta.fecha).toLocaleString('es-CR')}</td>
                                            <td>₡{venta.total}</td>

                                            <td>
                                                <span className={`badge ${claseEstado(venta.estado)}`}>
                                                    {venta.estado}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="d-flex flex-wrap gap-2">

                                                    {/* Consultar la venta */}
                                                    <button type="button" className="btn btn-sm btn-outline-success" title="Consultar" onClick={() => verVenta(venta.id)}>
                                                        <i className="bi bi-eye"/>
                                                    </button>

                                                    {/* Las demás acciones solo aplican a ventas pendientes */}
                                                    {venta.estado === 'PENDIENTE' && (
                                                        <>
                                                            {/* Editar */}
                                                            <button type="button" className="btn btn-sm btn-outline-primary" title="Editar" onClick={() => editarVenta(venta.id)}>
                                                                <i className="bi bi-pencil"/>
                                                            </button>

                                                            {/* Eliminar */}
                                                            <button type="button" className="btn btn-sm btn-outline-danger" title="Eliminar" onClick={() => eliminarVenta(venta.id)}>
                                                                <i className="bi bi-trash"/>
                                                            </button>

                                                            {/* Confirmar */}
                                                            <button type="button" className="btn btn-sm btn-success" title="Confirmar" onClick={() => confirmar(venta.id)}>
                                                                <i className="bi bi-check-lg"/>
                                                            </button>

                                                            {/* Anular */}
                                                            <button type="button" className="btn btn-sm btn-outline-secondary" title="Anular" onClick={() => anular(venta.id)}>
                                                                <i className="bi bi-x-lg"/>
                                                            </button>
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

                    {/* Información general del listado */}
                    {!cargando && (
                        <p className="text-secondary small mb-0 mt-3">
                            Total de ventas encontradas: {ventas.length}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}