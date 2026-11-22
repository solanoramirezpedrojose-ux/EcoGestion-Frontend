import { useEffect, useState } from 'react';
import { getError } from '../api/client.js';
import { listMateriales } from '../services/inventarioService.js';
import { listDetallesRecoleccion, addDetalleRecoleccion, updateDetalleRecoleccion, deleteDetalleRecoleccion } from '../services/recoleccionesService.js';

// Componente para administrar los materiales de una recolección
export default function DetallesRecoleccion({recoleccion}) {
    // Estados para almacenar materiales y detalles
    const [detalles, setDetalles] = useState([]);
    const [materiales, setMateriales] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados para controlar el formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [detalleEditando, setDetalleEditando] = useState(null);
    const [materialId, setMaterialId] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [guardando, setGuardando] = useState(false);

    // Estados para mostrar mensajes
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [recargar, setRecargar] = useState(0);

    // Consultamos los detalles y materiales desde Django
    useEffect(() => {
        let vigente = true;
        async function cargarDatos() {
            setCargando(true);
            try {
                // Consultamos los detalles de esta recolección
                const listaDetalles = await listDetallesRecoleccion(recoleccion.id);

                // Consultamos todas las páginas de materiales de Inventario
                let listaMateriales = [];
                let pagina = 1;
                let continuar = true;

                while(continuar) {
                    const datos = await listMateriales({page: pagina});
                    listaMateriales = [...listaMateriales, ...datos.results];

                    continuar = Boolean(datos.next);
                    pagina++;
                }

                if(vigente) {
                    setDetalles(listaDetalles);
                    setMateriales(listaMateriales);
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
    }, [recoleccion.id, recargar]);

    // Buscamos el nombre de un material por su ID
    function nombreMaterial(id) {
        const material = materiales.find(item => item.id === Number(id));
        return material ? material.nombre : `Material #${id}`;
    }

    // Abrimos el formulario para agregar un material
    function nuevoDetalle() {
        setDetalleEditando(null);
        setMaterialId('');
        setCantidad('');
        setError('');
        setMensaje('');
        setMostrarFormulario(true);
    }

    // Cargamos los datos de un detalle para editarlo
    function editarDetalle(detalle) {
        setDetalleEditando(detalle);
        setMaterialId(String(detalle.material));
        setCantidad(String(detalle.cantidad_kg));
        setError('');
        setMensaje('');
        setMostrarFormulario(true);
    }

    // Cancelamos la edición o el registro
    function cancelarFormulario() {
        setMostrarFormulario(false);
        setDetalleEditando(null);
        setMaterialId('');
        setCantidad('');
    }

    // Guardamos un nuevo detalle o actualizamos uno existente
    async function guardarDetalle(event) {
        event.preventDefault();
        setError('');
        setMensaje('');

        // Validamos el material y la cantidad
        if(!materialId) {
            setError('Debe seleccionar un material.');
            return;
        }

        if(!cantidad || !Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0) {
            setError('La cantidad debe ser mayor que cero.');
            return;
        }

        // Preparamos los datos que espera Django
        const datos = {
            recoleccion: recoleccion.id,
            material: Number(materialId),
            cantidad_kg: cantidad
        };

        setGuardando(true);

        try {
            if(detalleEditando) {
                // Actualizamos un detalle existente
                await updateDetalleRecoleccion(detalleEditando.id, datos);
                setMensaje('Material actualizado correctamente.');
            }else {
                // Agregamos un material a la recolección
                await addDetalleRecoleccion(datos);
                setMensaje('Material agregado correctamente.');
            }

            cancelarFormulario();
            setRecargar(valor => valor + 1);
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }finally {
            setGuardando(false);
        }
    }

    // Eliminamos un material de la recolección
    async function eliminarDetalle(id) {
        if(!window.confirm('¿Desea eliminar este material de la recolección?')) {
            return;
        }

        try {
            setError('');
            setMensaje('');

            await deleteDetalleRecoleccion(id);

            setMensaje('Material eliminado correctamente.');
            setRecargar(valor => valor + 1);
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Verificamos si todavía se pueden modificar los materiales
    const pendiente = recoleccion.estado === 'PENDIENTE';

    // Mostramos solo materiales activos para agregar o seleccionar
    const materialesDisponibles = materiales.filter(material =>
        material.activo || material.id === detalleEditando?.material
    );

    return (
        <div className="mt-4">
            {/* Encabezado de los materiales */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <h3 className="h6 fw-bold mb-0">
                    <i className="bi bi-recycle me-2"/>
                    Materiales de la recolección
                </h3>

                {pendiente && (
                    <button type="button" className="btn btn-success btn-sm" onClick={nuevoDetalle}>
                        <i className="bi bi-plus-lg me-2"/>
                        Agregar material
                    </button>
                )}
            </div>

            {/* Mensajes de éxito y error */}
            {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
            )}

            {mensaje && (
                <div className="alert alert-success" role="status">{mensaje}</div>
            )}

            {/* Formulario para agregar o editar materiales */}
            {mostrarFormulario && pendiente && (
                <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#F3F8F5' }}>
                    <h4 className="h6 fw-bold mb-3">
                        {detalleEditando ? 'Editar material' : 'Agregar material'}
                    </h4>

                    <form onSubmit={guardarDetalle}>
                        <div className="row g-3">
                            {/* Selección del material */}
                            <div className="col-md-6">
                                <label htmlFor="detalle-material" className="form-label">Material</label>
                                <select id="detalle-material" className="form-select" value={materialId} onChange={event => setMaterialId(event.target.value)} required>
                                    <option value="">Seleccione un material</option>

                                    {materialesDisponibles.map(material => (
                                        <option key={material.id} value={material.id}>
                                            {material.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Cantidad en kilogramos */}
                            <div className="col-md-6">
                                <label htmlFor="detalle-cantidad" className="form-label">Cantidad (kg)</label>
                                <input id="detalle-cantidad" type="number" className="form-control" min="0.01" step="0.01" placeholder="Ejemplo: 10.50" value={cantidad} onChange={event => setCantidad(event.target.value)} required/>
                            </div>

                            {/* Botones del formulario */}
                            <div className="col-12 d-flex gap-2">
                                <button type="submit" className="btn btn-success" disabled={guardando}>
                                    <i className="bi bi-check-lg me-2"/>
                                    {guardando ? 'Guardando...' : 'Guardar material'}
                                </button>
                                <button type="button" className="btn btn-outline-secondary" onClick={cancelarFormulario} disabled={guardando}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabla de materiales registrados */}
            {cargando ? (
                <p>Cargando materiales...</p>

            ) : detalles.length === 0 ? (
                <div className="alert alert-info">
                    Esta recolección todavía no tiene materiales registrados.
                </div>

            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Cantidad (kg)</th>
                                {pendiente && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {detalles.map(detalle => (
                                <tr key={detalle.id}>
                                    <td>{nombreMaterial(detalle.material)}</td>
                                    <td>{detalle.cantidad_kg} kg</td>

                                    {/* Solo permitimos editar o eliminar si está pendiente */}
                                    {pendiente && (
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button type="button" className="btn btn-sm btn-outline-primary"
                                                    title="Editar material" onClick={() => editarDetalle(detalle)}>
                                                    <i className="bi bi-pencil"/>
                                                </button>

                                                <button type="button" className="btn btn-sm btn-outline-danger"
                                                    title="Eliminar material" onClick={() => eliminarDetalle(detalle.id)}>
                                                    <i className="bi bi-trash"/>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Información sobre el estado de la recolección */}
            {pendiente ? (
                <p className="text-secondary small mb-0">
                    Agregue los materiales necesarios antes de confirmar la recolección.
                </p>
            ) : (
                <p className="text-secondary small mb-0">
                    Esta recolección está finalizada y sus materiales son de solo lectura.
                </p>
            )}
        </div>
    );
}