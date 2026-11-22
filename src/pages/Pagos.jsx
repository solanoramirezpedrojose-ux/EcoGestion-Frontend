import { useEffect, useState } from 'react';
import { getError } from '../api/client.js';
import { listVentas } from '../services/ventasService.js';
import { listPersonas } from '../services/personasService.js';
import { listPagos, getPago, addPago, updatePago, deletePago } from '../services/pagosService.js';
import FormPago from '../components/FormPago.jsx';
import './Pagos.css';

// Pantalla principal del módulo de Pagos
export default function Pagos() {
    // Estados para los pagos, ventas y compradores
    const [pagos, setPagos] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [compradores, setCompradores] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados para mostrar mensajes
    const [error, setError] = useState('');
    const [errorCatalogos, setErrorCatalogos] = useState('');
    const [mensaje, setMensaje] = useState('');

    // Estados para los filtros
    const [venta, setVenta] = useState('');
    const [comprador, setComprador] = useState('');
    const [metodoPago, setMetodoPago] = useState('');
    const [recargar, setRecargar] = useState(0);

    // Estados para registrar, editar y consultar pagos
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [pagoEditando, setPagoEditando] = useState(null);
    const [pagoDetalle, setPagoDetalle] = useState(null);

    // Guardamos todos los pagos para calcular los saldos
    const [todosPagos, setTodosPagos] = useState([]);
    const [cargandoSaldos, setCargandoSaldos] = useState(true);

    // Consultamos las ventas y personas registradas en Django
    useEffect(() => {
        let vigente = true;

        async function cargarDatos() {
            try {
                const listaVentas = await listVentas();
                const listaPersonas = await listPersonas();

                if(vigente) {
                    setVentas(listaVentas);

                    // Obtenemos los compradores registrados
                    const listaCompradores = listaPersonas.filter(persona =>
                        persona.tipo_persona === 'COMPRADOR' || persona.tipo_persona === 'AMBOS'
                    );

                    setCompradores(listaCompradores);
                }
            }catch(err) {
                if(vigente) {
                    setErrorCatalogos(err.response ? getError(err) : err.message);
                }
            }
        }

        cargarDatos();

        return () => {
            vigente = false;
        };
    }, []);

    // Consultamos los pagos aplicando los filtros de Django
    useEffect(() => {
        let vigente = true;

        async function cargarPagos() {
            setCargando(true);
            setError('');

            try {
                const datos = await listPagos({
                    venta: venta,
                    comprador: comprador,
                    metodo_pago: metodoPago
                });

                if(vigente) {
                    setPagos(datos);
                }
            }catch(err) {
                if(vigente) {
                    setError(err.response ? getError(err) : err.message);
                    setPagos([]);
                }
            }finally {
                if(vigente) {
                    setCargando(false);
                }
            }
        }

        cargarPagos();

        return () => {
            vigente = false;
        };

    }, [venta, comprador, metodoPago, recargar]);

    // Buscamos la venta relacionada con un pago
    function obtenerVenta(id) {
        return ventas.find(item => item.id === Number(id));
    }

    // Buscamos el nombre de un comprador
    function nombreComprador(id) {
        const persona = compradores.find(item => item.id === Number(id));
        return persona ? persona.nombre : `Comprador #${id}`;
    }

    // Abrimos el formulario para registrar un pago
    function nuevoPago() {
        setPagoEditando(null);
        setPagoDetalle(null);
        setMostrarFormulario(true);
        setError('');
        setMensaje('');
    }

    // Consultamos un pago para editarlo
    async function editarPago(id) {
        try {
            setError('');
            const datos = await getPago(id);

            setPagoEditando(datos);
            setPagoDetalle(null);
            setMostrarFormulario(true);
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Consultamos los datos completos de un pago
    async function verPago(id) {
        try {
            setError('');
            const datos = await getPago(id);

            setPagoDetalle(datos);
            setMostrarFormulario(false);
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Registramos un nuevo pago o actualizamos uno existente
    async function guardarPago(datos) {
        setError('');
        setMensaje('');

        let pagoGuardado;

        if(pagoEditando) {
            // Actualizamos un pago existente
            pagoGuardado = await updatePago(pagoEditando.id, datos);
            setMensaje('Pago actualizado correctamente.');
        }else {
            // Registramos un nuevo pago
            pagoGuardado = await addPago(datos);
            setMensaje('Pago registrado correctamente.');

            // Limpiamos los filtros para mostrar el nuevo pago
            setVenta('');
            setComprador('');
            setMetodoPago('');
        }

        // Cerramos el formulario y mostramos el pago guardado
        setMostrarFormulario(false);
        setPagoEditando(null);
        setPagoDetalle(pagoGuardado);

        // Actualizamos la tabla con los datos de Django
        setRecargar(valor => valor + 1);
    }

    // Eliminamos un pago después de solicitar confirmación
    async function eliminarPago(id) {
        if(!window.confirm('¿Está seguro de que desea eliminar este pago?')) {
            return;
        }

        try {
            setError('');
            setMensaje('');

            await deletePago(id);

            setPagoDetalle(null);
            setMensaje('Pago eliminado correctamente.');
            setRecargar(valor => valor + 1);
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Convertimos el método de pago a un nombre más fácil de leer
    function nombreMetodo(metodo) {
        if(metodo === 'EFECTIVO') return 'Efectivo';
        if(metodo === 'TRANSFERENCIA') return 'Transferencia';
        if(metodo === 'SINPE') return 'SINPE Móvil';
        return metodo;
    }

    // Calculamos el monto total de los pagos encontrados
    let totalPagado = 0;

    pagos.forEach(pago => {
        totalPagado += Number(pago.monto);
    });

    // Consultamos todos los pagos sin aplicar filtros
    useEffect(() => {
        let vigente = true;

        async function cargarTodosPagos() {
            setCargandoSaldos(true);

            try {
                const datos = await listPagos();

                if(vigente) {
                    setTodosPagos(datos);
                }
            }catch(err) {
                if(vigente) {
                    setError(err.response ? getError(err) : err.message);
                }
            }finally {
                if(vigente) {
                    setCargandoSaldos(false);
                }
            }
        }

        cargarTodosPagos();

        return () => {
            vigente = false;
        };
    }, [recargar]);

    // Calculamos el saldo pendiente de una venta
    function saldoVenta(ventaId) {
        const ventaEncontrada = ventas.find(item => item.id === Number(ventaId));

        if(!ventaEncontrada) {
            return 0;
        }

        // Sumamos todos los pagos de la venta
        let totalPagado = 0;

        todosPagos.forEach(pago => {
            if(Number(pago.venta) === Number(ventaId)) {
                totalPagado += Number(pago.monto);
            }
        });

        // Restamos los pagos al total original
        return Math.max(0, Number(ventaEncontrada.total) - totalPagado);
    }

    return (
        <section className="pagos-page">

            {/* Encabezado principal del módulo */}
            <div className="pagos-hero">
                <div>
                    <h1 className="h3 fw-bold mb-2">
                        <i className="bi bi-cash-coin me-2"/>
                        Gestión de pagos
                    </h1>
                    <p className="mb-0">Registro y control de los pagos de ventas</p>
                </div>

                <button type="button" className="btn pagos-btn-nuevo" onClick={nuevoPago}>
                    <i className="bi bi-plus-lg me-2"/>
                    Nuevo pago
                </button>
            </div>

            {/* Tarjetas con información de los pagos filtrados */}
            <div className="row g-3 mb-4">

                <div className="col-md-6">
                    <div className="pagos-resumen">
                        <i className="bi bi-receipt"/>
                        <div>
                            <span>Pagos encontrados</span>
                            <h2>{cargando ? '...' : pagos.length}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="pagos-resumen">
                        <i className="bi bi-wallet2"/>
                        <div>
                            <span>Monto total de los pagos encontrados</span>
                            <h2>₡{cargando ? '...' : totalPagado.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mensajes de error y éxito */}
            {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
            )}

            {errorCatalogos && (
                <div className="alert alert-warning" role="alert">{errorCatalogos}</div>
            )}

            {mensaje && (
                <div className="alert alert-success" role="status">{mensaje}</div>
            )}

            {/* Formulario para registrar o editar un pago */}
            {mostrarFormulario && (
                <FormPago key={pagoEditando?.id ?? 'nuevo'} pago={pagoEditando}
                    onGuardar={guardarPago}
                    onCancelar={() => {
                        setMostrarFormulario(false);
                        setPagoEditando(null);
                    }}
                />
            )}

            {/* Información completa del pago seleccionado */}
            {pagoDetalle && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="h5 fw-bold mb-0">Pago #{pagoDetalle.id}</h2>
                            <button type="button" className="btn-close" aria-label="Cerrar detalle" onClick={() => setPagoDetalle(null)}/>
                        </div>

                        <p><strong>Venta:</strong> #{pagoDetalle.venta}</p>

                        <p>
                            <strong>Comprador:</strong>{' '}
                            {obtenerVenta(pagoDetalle.venta)
                                ? nombreComprador(obtenerVenta(pagoDetalle.venta).comprador)
                                : 'No disponible'}
                        </p>

                        <p><strong>Monto:</strong> ₡{pagoDetalle.monto}</p>
                        {/* Mostramos cuánto falta por pagar de la venta */}
                        <p>
                            <strong>Saldo pendiente de la venta:</strong>{' '}
                            {cargandoSaldos ? 'Calculando...' : `₡${saldoVenta(pagoDetalle.venta).toFixed(2)}`}
                        </p>
                        <p><strong>Método:</strong> {nombreMetodo(pagoDetalle.metodo_pago)}</p>
                        <p><strong>Referencia:</strong> {pagoDetalle.referencia || 'Sin referencia'}</p>
                        <p className="mb-0">
                            <strong>Fecha:</strong> {new Date(pagoDetalle.fecha_pago).toLocaleString('es-CR')}
                        </p>
                    </div>
                </div>
            )}

            {/* Filtros para consultar los pagos */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">

                    <h2 className="h5 fw-bold mb-3">
                        <i className="bi bi-funnel me-2"/>
                        Filtrar pagos
                    </h2>

                    <div className="row g-3">

                        {/* Filtro por venta */}
                        <div className="col-md-4">
                            <label htmlFor="pago-filtro-venta" className="form-label">Venta</label>

                            <select id="pago-filtro-venta" className="form-select" value={venta} onChange={event => setVenta(event.target.value)}>
                                <option value="">Todas las ventas</option>
                                {ventas.map(item => (
                                    <option key={item.id} value={item.id}>
                                        Venta #{item.id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por comprador */}
                        <div className="col-md-4">
                            <label htmlFor="pago-filtro-comprador" className="form-label">Comprador</label>

                            <select id="pago-filtro-comprador" className="form-select" value={comprador} onChange={event => setComprador(event.target.value)}>
                                <option value="">Todos los compradores</option>
                                {compradores.map(persona => (
                                    <option key={persona.id} value={persona.id}>
                                        {persona.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por método de pago */}
                        <div className="col-md-4">
                            <label htmlFor="pago-filtro-metodo" className="form-label">Método de pago</label>

                            <select id="pago-filtro-metodo" className="form-select" value={metodoPago} onChange={event => setMetodoPago(event.target.value)}>
                                <option value="">Todos los métodos</option>
                                <option value="EFECTIVO">Efectivo</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="SINPE">SINPE Móvil</option>
                            </select>
                        </div>

                    </div>
                </div>
            </div>

            {/* Tabla principal de pagos */}
            <div className="card border-0 shadow-sm pagos-tabla">
                <div className="card-body p-4">

                    <h2 className="h5 fw-bold mb-3">Pagos registrados</h2>

                    {cargando ? (
                        <p>Cargando pagos...</p>

                    ) : pagos.length === 0 ? (
                        <p className="text-secondary">No se encontraron pagos.</p>

                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">

                                <thead>
                                    <tr>
                                        <th>N.º</th>
                                        <th>Venta</th>
                                        <th>Comprador</th>
                                        <th>Monto</th>
                                        <th>Método</th>
                                        <th>Fecha</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pagos.map(pago => (
                                        <tr key={pago.id}>
                                            <td className="fw-semibold">#{pago.id}</td>
                                            <td>Venta #{pago.venta}</td>

                                            <td>
                                                {obtenerVenta(pago.venta)
                                                    ? nombreComprador(obtenerVenta(pago.venta).comprador)
                                                    : 'No disponible'}
                                            </td>

                                            <td className="fw-semibold">₡{pago.monto}</td>

                                            <td>
                                                <span className="badge pagos-metodo">
                                                    {nombreMetodo(pago.metodo_pago)}
                                                </span>
                                            </td>

                                            <td>{new Date(pago.fecha_pago).toLocaleString('es-CR')}</td>

                                            <td>
                                                <div className="d-flex gap-2">

                                                    {/* Consultar pago */}
                                                    <button type="button" className="btn btn-sm btn-outline-success" title="Consultar" onClick={() => verPago(pago.id)}>
                                                        <i className="bi bi-eye"/>
                                                    </button>

                                                    {/* Editar pago */}
                                                    <button type="button" className="btn btn-sm btn-outline-primary" title="Editar" onClick={() => editarPago(pago.id)}>
                                                        <i className="bi bi-pencil"/>
                                                    </button>

                                                    {/* Eliminar pago */}
                                                    <button type="button" className="btn btn-sm btn-outline-danger" title="Eliminar" onClick={() => eliminarPago(pago.id)}>
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

                    {/* Cantidad total de pagos que coinciden con los filtros */}
                    {!cargando && !error && (
                        <p className="text-secondary small mb-0 mt-3">
                            Total de pagos encontrados: {pagos.length}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}