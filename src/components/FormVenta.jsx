import { useEffect, useState } from 'react';
import { getError } from '../api/client.js';
import { listPersonas } from '../services/personasService.js';

// Convertimos la fecha al formato que utiliza el input
function prepararFecha(fecha) {
    const valor = fecha ? new Date(fecha) : new Date();

    // Ajustamos la fecha a la hora local
    const fechaLocal = new Date(
        valor.getTime() - valor.getTimezoneOffset() * 60000
    );

    return fechaLocal.toISOString().slice(0, 16);
}

// Formulario para registrar o editar ventas
export default function FormVenta({ venta, onGuardar, onCancelar }) {

    // Guardamos los datos iniciales de la venta
    const [datos, setDatos] = useState({
        comprador: venta?.comprador ? String(venta.comprador) : '',
        fecha: prepararFecha(venta?.fecha)
    });

    // Estados para consultar compradores
    const [compradores, setCompradores] = useState([]);
    const [cargandoCompradores, setCargandoCompradores] = useState(true);

    // Estados para controlar errores y guardado
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    // Consultamos las personas registradas en Django
    useEffect(() => {
        let vigente = true;

        async function cargarCompradores() {
            try {
                const personas = await listPersonas();

                // Mostramos personas activas de tipo comprador o ambos
                const lista = personas.filter(persona =>
                    persona.activo &&
                    (persona.tipo_persona === 'COMPRADOR' ||
                        persona.tipo_persona === 'AMBOS')
                );

                if (vigente) {
                    setCompradores(lista);
                }
            } catch (err) {
                if (vigente) {
                    setError(getError(err));
                }
            } finally {
                if (vigente) {
                    setCargandoCompradores(false);
                }
            }
        }

        cargarCompradores();

        return () => {
            vigente = false;
        };
    }, []);

    // Actualizamos los datos cuando el usuario modifica un campo
    function cambiar(event) {
        setDatos({ ...datos, [event.target.name]: event.target.value });
    }

    // Validamos y enviamos la información de la venta
    async function guardar(event) {
        event.preventDefault();
        setError('');

        // Verificamos que se haya seleccionado un comprador
        if (!datos.comprador) {
            setError('Debe seleccionar un comprador.');
            return;
        }

        // Verificamos que la fecha sea válida
        if (!datos.fecha || isNaN(new Date(datos.fecha).getTime())) {
            setError('Debe ingresar una fecha válida.');
            return;
        }

        setGuardando(true);

        try {
            // Preparamos los datos que necesita Django
            const ventaGuardar = {
                comprador: Number(datos.comprador),
                fecha: new Date(datos.fecha).toISOString()
            };

            // Enviamos los datos al componente principal de Ventas
            await onGuardar(ventaGuardar);
        } catch (err) {
            // Mostramos los errores devueltos por Django
            setError(err.response ? getError(err) : err.message);
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">

                {/* Encabezado del formulario */}
                <h2 className="h5 fw-bold mb-2" style={{ color: '#143D32' }}>
                    <i className="bi bi-cart-check me-2" />
                    {venta ? 'Editar venta' : 'Registrar nueva venta'}
                </h2>

                <p className="text-secondary mb-4">
                    Complete la información para registrar la venta.
                </p>

                {/* Mensajes de error */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={guardar}>
                    <div className="row g-3">

                        {/* Selección del comprador */}
                        <div className="col-md-6">
                            <label htmlFor="venta-comprador" className="form-label">
                                Comprador
                            </label>

                            <select id="venta-comprador" name="comprador" className="form-select"
                                value={datos.comprador} onChange={cambiar} disabled={cargandoCompradores} required>
                                <option value="">
                                    {cargandoCompradores ? 'Cargando compradores...' : 'Seleccione un comprador'}
                                </option>

                                {compradores.map(comprador => (
                                    <option key={comprador.id} value={String(comprador.id)}>
                                        {comprador.nombre} - {comprador.identificacion}
                                    </option>
                                ))}
                            </select>

                            {/* Avisamos si no hay compradores disponibles */}
                            {!cargandoCompradores && compradores.length === 0 && !error && (
                                <small className="text-warning">
                                    No hay compradores activos disponibles.
                                </small>
                            )}
                        </div>

                        {/* Fecha de la venta */}
                        <div className="col-md-6">
                            <label htmlFor="venta-fecha" className="form-label">
                                Fecha y hora
                            </label>

                            <input id="venta-fecha" name="fecha" type="datetime-local"
                                className="form-control" value={datos.fecha} onChange={cambiar} required />
                        </div>

                        {/* Información sobre el estado inicial */}
                        {!venta && (
                            <div className="col-12">
                                <div className="alert alert-info mb-0">
                                    <i className="bi bi-info-circle me-2" />
                                    La venta se registrará como <strong>PENDIENTE</strong>.
                                    Después podrá agregar materiales y confirmarla.
                                </div>
                            </div>
                        )}

                        {/* Información del total al editar */}
                        {venta && (
                            <div className="col-12">
                                <div className="alert alert-light border mb-0">
                                    <strong>Total actual:</strong> ₡{venta.total}
                                    <p className="text-secondary small mb-0">
                                        El total se calcula automáticamente según los materiales de la venta.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Botones para guardar o cancelar */}
                        <div className="col-12 d-flex flex-wrap gap-2 mt-4">
                            <button type="submit" className="btn btn-success" disabled={guardando || cargandoCompradores || compradores.length === 0}>
                                <i className="bi bi-check-lg me-2" />
                                {guardando ? 'Guardando...' : 'Guardar venta'}
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