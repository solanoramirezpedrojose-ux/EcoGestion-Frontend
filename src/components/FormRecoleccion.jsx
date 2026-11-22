import { useEffect, useState } from 'react';
import { getError } from '../api/client.js';
import { listPersonas } from '../services/personasService.js';

// Convertimos una fecha a un formato que acepta el input
function prepararFecha(fecha) {
    const valor = fecha ? new Date(fecha) : new Date();

    // Ajustamos la fecha a la hora local del navegador
    const fechaLocal = new Date(
        valor.getTime() - valor.getTimezoneOffset() * 60000
    );
    return fechaLocal.toISOString().slice(0, 16);
}

// Formulario para registrar o editar recolecciones
export default function FormRecoleccion({recoleccion, onGuardar, onCancelar}) {

    // Guardamos los datos iniciales del formulario
    const [datos, setDatos] = useState({
        proveedor: recoleccion?.proveedor
            ? String(recoleccion.proveedor)
            : '',
        fecha: prepararFecha(recoleccion?.fecha),
        observaciones: recoleccion?.observaciones || ''
    });

    // Estados para los proveedores disponibles
    const [proveedores, setProveedores] = useState([]);
    const [cargandoProveedores, setCargandoProveedores] = useState(true);

    // Estados para errores y guardado
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    // Consultamos los proveedores registrados en Django
    useEffect(() => {
        let vigente = true;

        async function cargarProveedores() {
            try {
                const personas = await listPersonas();

                // Solo mostramos personas activas que pueden ser proveedoras
                const lista = personas.filter(persona =>
                    persona.activo &&
                    (persona.tipo_persona === 'PROVEEDOR' ||
                     persona.tipo_persona === 'AMBOS')
                );

                if(vigente) {
                    setProveedores(lista);
                }

            }catch(err) {
                if(vigente) {
                    setError(getError(err));
                }

            }finally {
                if(vigente) {
                    setCargandoProveedores(false);
                }
            }
        }

        cargarProveedores();

        return() => {
            vigente = false;
        };

    }, []);

    // Actualizamos el campo que modifica el usuario
    function cambiar(event) {
        setDatos({...datos, [event.target.name]: event.target.value});
    }

    // Validamos y enviamos los datos del formulario
    async function guardar(event) {
        event.preventDefault();
        setError('');

        // Verificamos que se haya seleccionado un proveedor
        if(!datos.proveedor) {
            setError('Debe seleccionar un proveedor');
            return;
        }

        // Verificamos que exista una fecha válida
        if(!datos.fecha || isNaN(new Date(datos.fecha).getTime())) {
            setError('Debe ingresar una fecha válida');
            return;
        }

        setGuardando(true);

        try {
            // Preparamos los datos que recibirá Django
            const recoleccionGuardar = {
                proveedor: Number(datos.proveedor),
                fecha: new Date(datos.fecha).toISOString(),
                observaciones: datos.observaciones.trim()
            };

            // El componente principal realizará la solicitud a la API
            await onGuardar(recoleccionGuardar);

        }catch(err) {
            // Mostramos los errores enviados por Django
            setError(err.response ? getError(err) : err.message);

        }finally {
            setGuardando(false);
        }
    }

    return (
        <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

                {/* Encabezado del formulario */}
                <h2 className="h5 fw-bold mb-2" style={{ color: '#143D32' }}>
                    <i className="bi bi-truck me-2"/>
                    {recoleccion ? 'Editar recolección' : 'Registrar nueva recolección'}
                </h2>

                <p className="text-secondary mb-4">
                    Complete los datos de la recolección.
                </p>

                {/* Mensajes de error */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={guardar}>
                    <div className="row g-3">
                        {/* Selección del proveedor */}
                        <div className="col-md-6">
                            <label htmlFor="recoleccion-proveedor" className="form-label">
                                Proveedor
                            </label>
                            <select
                                id="recoleccion-proveedor"
                                name="proveedor"
                                className="form-select"
                                value={datos.proveedor}
                                onChange={cambiar}
                                disabled={cargandoProveedores}
                                required
                            >
                                <option value="">
                                    {cargandoProveedores ? 'Cargando proveedores...' : 'Seleccione un proveedor'}
                                </option>
                                {proveedores.map(proveedor => (
                                    <option key={proveedor.id} value={String(proveedor.id)}>
                                        {proveedor.nombre} - {proveedor.identificacion}
                                    </option>
                                ))}
                            </select>

                            {/* Avisamos si no existen proveedores disponibles */}
                            {!cargandoProveedores && proveedores.length === 0 && !error && (
                                    <small className="text-warning">
                                        No hay proveedores activos disponibles.
                                    </small>
                                )}
                        </div>

                        {/* Fecha y hora */}
                        <div className="col-md-6">
                            <label htmlFor="recoleccion-fecha" className="form-label">
                                Fecha y hora
                            </label>
                            <input
                                id="recoleccion-fecha"
                                name="fecha"
                                type="datetime-local"
                                className="form-control"
                                value={datos.fecha}
                                onChange={cambiar}
                                required
                            />
                        </div>

                        {/* Observaciones de la recolección */}
                        <div className="col-12">
                            <label htmlFor="recoleccion-observaciones" className="form-label">
                                Observaciones
                            </label>

                            <textarea
                                id="recoleccion-observaciones"
                                name="observaciones"
                                className="form-control"
                                rows={3}
                                placeholder="Escriba alguna observación sobre la recolección..."
                                value={datos.observaciones}
                                onChange={cambiar}
                            />

                            <small className="text-secondary">
                                Este campo es opcional.
                            </small>
                        </div>

                        {/* Información sobre el estado inicial */}
                        {!recoleccion && (
                            <div className="col-12">
                                <div className="alert alert-info mb-0">
                                    <i className="bi bi-info-circle me-2"/>
                                    La recolección se registrará como
                                    <strong> PENDIENTE</strong>.
                                    Después podrá agregar materiales y confirmarla.
                                </div>
                            </div>
                        )}

                        {/* Botones del formulario */}
                        <div className="col-12 d-flex flex-wrap gap-2 mt-4">
                            <button type="submit" className="btn btn-success"
                                disabled={
                                    guardando ||
                                    cargandoProveedores ||
                                    proveedores.length === 0
                                }
                            >
                                <i className="bi bi-check-lg me-2"/>
                                {guardando ? 'Guardando...' : 'Guardar recolección'}
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