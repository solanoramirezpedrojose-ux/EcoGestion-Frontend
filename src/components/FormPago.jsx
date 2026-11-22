import { useEffect, useState } from 'react';
import { getError } from '../api/client.js';
import { listVentas } from '../services/ventasService.js';
import { listPagos } from '../services/pagosService.js';

// Convertimos la fecha al formato del input
function prepararFecha(fecha) {
    const valor = fecha ? new Date(fecha) : new Date();
    // Ajustamos la fecha a la hora local
    const fechaLocal = new Date(
        valor.getTime() - valor.getTimezoneOffset() * 60000
    );
    return fechaLocal.toISOString().slice(0, 16);
}

// Formulario para registrar o editar pagos
export default function FormPago({pago, onGuardar, onCancelar}) {
    // Guardamos los datos iniciales del formulario
    const [datos, setDatos] = useState({
        venta: pago?.venta ? String(pago.venta) : '',
        monto: pago?.monto ?? '',
        metodo_pago: pago?.metodo_pago || 'EFECTIVO',
        referencia: pago?.referencia || '',
        fecha_pago: prepararFecha(pago?.fecha_pago)
    });

    // Estados para consultar las ventas y pagos existentes
    const [ventas, setVentas] = useState([]);
    const [pagos, setPagos] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados para controlar errores y guardado
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    // Consultamos las ventas y pagos registrados en Django
    useEffect(() => {
        let vigente = true;
        async function cargarDatos() {
            try {
                const listaVentas = await listVentas();
                const listaPagos = await listPagos();

                if(vigente) {
                    setVentas(listaVentas);
                    setPagos(listaPagos);
                }
            }catch(err) {
                if(vigente) {
                    setError(err.response ? getError(err) : err.message);
                }
            }finally {
                if(vigente) {
                    setCargando(false);
                }
            }
        }

        cargarDatos();

        return () => {
            vigente = false;
        };
    }, []);

    // Calculamos cuánto dinero se ha pagado de una venta
    function calcularPagado(ventaId) {
        const pagosVenta = pagos.filter(item =>
            Number(item.venta) === Number(ventaId) &&
            item.id !== pago?.id
        );

        let totalPagado = 0;

        pagosVenta.forEach(item => {
            totalPagado += Number(item.monto);
        });

        return totalPagado;
    }

    // Calculamos todos los pagos realizados a una venta
    // Aquí sí incluimos el pago que estamos editando
    function calcularTotalPagado(ventaId) {
        let totalPagado = 0;

        pagos.forEach(item => {
            if(Number(item.venta) === Number(ventaId)) {
                totalPagado += Number(item.monto);
            }
        });

        return totalPagado;
    }


    // Buscamos la venta seleccionada
    const ventaSeleccionada = ventas.find(venta => venta.id === Number(datos.venta));

    // Calculamos cuánto se puede pagar sin superar el total
    const saldoDisponible = ventaSeleccionada
        ? Math.max(0, Number(ventaSeleccionada.total) - calcularPagado(ventaSeleccionada.id))
        : 0;

    // Calculamos el saldo pendiente real de la venta
    const saldoPendienteActual = ventaSeleccionada
        ? Math.max(0, Number(ventaSeleccionada.total) - calcularTotalPagado(ventaSeleccionada.id))
        : 0;

    // Calculamos cuánto quedará pendiente después de guardar
    // Este valor cambia automáticamente cuando escribimos el monto
    const saldoDespuesDeGuardar = saldoDisponible - Number(datos.monto || 0);

    // Mostramos ventas confirmadas que todavía pueden recibir pagos
    const ventasDisponibles = ventas.filter(venta =>
        venta.estado === 'CONFIRMADA' &&
        (Number(venta.total) > calcularPagado(venta.id) || Number(pago?.venta) === venta.id)
    );

    // Actualizamos los datos al modificar los campos
    function cambiar(event) {
        setDatos({...datos, [event.target.name]: event.target.value});
    }

    // Validamos y enviamos los datos del pago
    async function guardar(event) {
        event.preventDefault();
        setError('');

        // Verificamos que se haya seleccionado una venta confirmada
        if(!ventaSeleccionada || ventaSeleccionada.estado !== 'CONFIRMADA') {
            setError('Debe seleccionar una venta confirmada.');
            return;
        }

        // Validamos que el monto sea mayor que cero
        if(!datos.monto || !Number.isFinite(Number(datos.monto)) || Number(datos.monto) <= 0) {
            setError('El monto del pago debe ser mayor que cero.');
            return;
        }

        // Verificamos que el pago no supere el saldo disponible
        if(Number(datos.monto) > saldoDisponible + 0.001) {
            setError('El monto supera el saldo disponible de la venta.');
            return;
        }

        // Verificamos que la fecha sea válida
        if(!datos.fecha_pago || isNaN(new Date(datos.fecha_pago).getTime())) {
            setError('Debe ingresar una fecha válida.');
            return;
        }

        setGuardando(true);

        try {
            // Preparamos los campos que espera Django
            const pagoGuardar = {
                venta: Number(datos.venta),
                monto: datos.monto,
                metodo_pago: datos.metodo_pago,
                referencia: datos.referencia.trim(),
                fecha_pago: new Date(datos.fecha_pago).toISOString()
            };

            // El componente principal realizará la petición a Django
            await onGuardar(pagoGuardar);

        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }finally {
            setGuardando(false);
        }
    }

    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">

                {/* Encabezado del formulario */}
                <h2 className="h5 fw-bold mb-2" style={{color: '#143D32'}}>
                    <i className="bi bi-cash-coin me-2"/>
                    {pago ? 'Editar pago' : 'Registrar nuevo pago'}
                </h2>

                <p className="text-secondary mb-4">
                    Complete la información del pago.
                </p>

                {/* Mensajes de error */}
                {error && (
                    <div className="alert alert-danger" role="alert">{error}</div>
                )}

                <form onSubmit={guardar}>
                    <div className="row g-3">

                        {/* Seleccionamos una venta confirmada */}
                        <div className="col-md-6">
                            <label htmlFor="pago-venta" className="form-label">Venta</label>

                            <select id="pago-venta" name="venta" className="form-select" value={datos.venta}
                                onChange={event => setDatos({...datos, venta: event.target.value, monto: ''})}
                                disabled={cargando || Boolean(pago)} required>
                                <option value="">
                                    {cargando ? 'Cargando ventas...' : 'Seleccione una venta confirmada'}
                                </option>

                                {ventasDisponibles.map(venta => (
                                    <option key={venta.id} value={venta.id}>
                                        Venta #{venta.id} - Total: ₡{venta.total}
                                    </option>
                                ))}
                            </select>

                            {/* Al editar no permitimos cambiar la venta */}
                            {pago && (
                                <small className="text-secondary">
                                    No se puede cambiar la venta de un pago existente.
                                </small>
                            )}

                            {!cargando && ventasDisponibles.length === 0 && (
                                <small className="text-warning">
                                    No hay ventas confirmadas con saldo disponible.
                                </small>
                            )}
                        </div>

                        {/* Monto del pago */}
                        <div className="col-md-6">
                            <label htmlFor="pago-monto" className="form-label">Monto del pago</label>

                            <div className="input-group">
                                <span className="input-group-text">₡</span>
                                <input id="pago-monto" name="monto" type="number" className="form-control"
                                    min="0.01" step="0.01" placeholder="0.00"
                                    value={datos.monto} onChange={cambiar} required/>
                            </div>
                        </div>

                        
                        {/* Mostramos los saldos de la venta seleccionada */}
                        {ventaSeleccionada && (
                            <div className="col-12">
                                <div className="alert alert-success mb-0">

                                    <p className="mb-2">
                                        <strong>Total de la venta:</strong> ₡{Number(ventaSeleccionada.total).toFixed(2)}
                                    </p>

                                    <p className="mb-2">
                                        <strong>Saldo pendiente actual:</strong> ₡{saldoPendienteActual.toFixed(2)}
                                    </p>

                                    {/* Al editar mostramos cuánto se permite guardar */}
                                    {pago && (
                                        <p className="mb-2">
                                            <strong>Monto máximo al editar este pago:</strong> ₡{saldoDisponible.toFixed(2)}
                                        </p>
                                    )}

                                    {/* El saldo cambia mientras el usuario escribe */}
                                    <p className="mb-0">
                                        <strong>Saldo después de guardar:</strong>{' '}
                                        {saldoDespuesDeGuardar < 0
                                            ? `El pago supera el saldo en ₡${Math.abs(saldoDespuesDeGuardar).toFixed(2)}`
                                            : `₡${saldoDespuesDeGuardar.toFixed(2)}`}
                                    </p>

                                </div>
                            </div>
                        )}

                        {/* Método de pago */}
                        <div className="col-md-6">
                            <label htmlFor="pago-metodo" className="form-label">Método de pago</label>

                            <select id="pago-metodo" name="metodo_pago" className="form-select"
                                value={datos.metodo_pago} onChange={cambiar} required>
                                <option value="EFECTIVO">Efectivo</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="SINPE">SINPE Móvil</option>
                            </select>
                        </div>

                        {/* Referencia del pago */}
                        <div className="col-md-6">
                            <label htmlFor="pago-referencia" className="form-label">Referencia</label>

                            <input id="pago-referencia" name="referencia" type="text" className="form-control"
                                maxLength={100} placeholder="Número de referencia (opcional)"
                                value={datos.referencia} onChange={cambiar}/>

                            <small className="text-secondary">
                                Campo opcional.
                            </small>
                        </div>

                        {/* Fecha y hora del pago */}
                        <div className="col-md-6">
                            <label htmlFor="pago-fecha" className="form-label">Fecha y hora</label>

                            <input id="pago-fecha" name="fecha_pago" type="datetime-local" className="form-control"
                                value={datos.fecha_pago} onChange={cambiar} required/>
                        </div>

                        {/* Información para el registro */}
                        {!pago && (
                            <div className="col-12">
                                <div className="alert alert-info mb-0">
                                    <i className="bi bi-info-circle me-2"/>
                                    Solo se pueden registrar pagos de ventas confirmadas.
                                    El monto no puede superar el saldo pendiente.
                                </div>
                            </div>
                        )}

                        {/* Botones del formulario */}
                        <div className="col-12 d-flex flex-wrap gap-2 mt-4">
                            <button type="submit" className="btn btn-success" disabled={guardando || cargando || ventasDisponibles.length === 0}>
                                <i className="bi bi-check-lg me-2"/>
                                {guardando ? 'Guardando...' : 'Guardar pago'}
                            </button>

                            <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={guardando}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}