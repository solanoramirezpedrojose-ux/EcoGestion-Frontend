import { useEffect, useState } from 'react';
import { getError } from '../api/client.js';
import { listMateriales } from '../services/inventarioService.js';
import { listDetallesVenta, addDetalleVenta, updateDetalleVenta, deleteDetalleVenta } from '../services/ventasService.js';
import { useAuth } from '../auth/AuthContext.jsx';

// Componente para administrar los materiales de una venta
export default function DetallesVenta({venta, onActualizado}) {
    //Consultar los permisos del usuario
    const { tienePermiso } = useAuth();

    // Estados para almacenar los materiales y detalles
    const [detalles, setDetalles] = useState([]);
    const [materiales, setMateriales] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados para el formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [detalleEditando, setDetalleEditando] = useState(null);
    const [materialId, setMaterialId] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [precio, setPrecio] = useState('');
    const [guardando, setGuardando] = useState(false);

    // Estados para mensajes y actualización
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [recargar, setRecargar] = useState(0);

    // Consultamos los detalles y los materiales desde Django
    useEffect(() => {
        let vigente = true;

        async function cargarDatos() {
            setCargando(true);
            try {
                // Consultamos los detalles de la venta seleccionada
                const listaDetalles = await listDetallesVenta(venta.id);

                // Consultamos todas las páginas del Inventario
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

    }, [venta.id, recargar]);

    // Buscamos un material por su ID
    function obtenerMaterial(id) {
        return materiales.find(material => material.id === Number(id));
    }

    // Abrimos el formulario para agregar un material
    function nuevoDetalle() {
        setDetalleEditando(null);
        setMaterialId('');
        setCantidad('');
        setPrecio('');
        setError('');
        setMensaje('');
        setMostrarFormulario(true);
    }

    // Cargamos un detalle existente para editarlo
    function editarDetalle(detalle) {
        setDetalleEditando(detalle);
        setMaterialId(String(detalle.material));
        setCantidad(String(detalle.cantidad_kg));
        setPrecio(String(detalle.precio_unitario));
        setError('');
        setMensaje('');
        setMostrarFormulario(true);
    }

    // Colocamos el precio del Inventario al seleccionar un material
    function cambiarMaterial(event) {
        const id = event.target.value;
        const material = obtenerMaterial(id);

        setMaterialId(id);
        setPrecio(material ? String(material.precio_venta_kg) : '');
    }

    // Cerramos y limpiamos el formulario
    function cancelarFormulario() {
        setMostrarFormulario(false);
        setDetalleEditando(null);
        setMaterialId('');
        setCantidad('');
        setPrecio('');
    }

    // Registramos o actualizamos el detalle de una venta
    async function guardarDetalle(event) {
        event.preventDefault();
        setError('');
        setMensaje('');

        // Validamos que se haya seleccionado un material
        if(!materialId) {
            setError('Debe seleccionar un material.');
            return;
        }

        // La cantidad debe ser mayor que cero
        if(!cantidad || !Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0) {
            setError('La cantidad debe ser mayor que cero.');
            return;
        }

        // El precio unitario debe ser mayor que cero
        if(!precio || !Number.isFinite(Number(precio)) || Number(precio) <= 0) {
            setError('El precio debe ser mayor que cero.');
            return;
        }

        // Preparamos los datos que espera Django
        const datos = {
            venta: venta.id,
            material: Number(materialId),
            cantidad_kg: cantidad,
            precio_unitario: precio
        };

        setGuardando(true);

        try {
            if(detalleEditando) {
                // Actualizamos un material de la venta
                await updateDetalleVenta(detalleEditando.id, datos);
                setMensaje('Material actualizado correctamente.');
            }else {
                // Agregamos un nuevo material a la venta
                await addDetalleVenta(datos);
                setMensaje('Material agregado correctamente.');
            }

            cancelarFormulario();

            // Actualizamos los detalles y el total de la venta
            setRecargar(valor => valor + 1);
            await onActualizado();
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }finally {
            setGuardando(false);
        }
    }

    // Eliminamos un material de una venta pendiente
    async function eliminarDetalle(id) {
        if(!window.confirm('¿Desea eliminar este material de la venta?')) {
            return;
        }

        try {
            setError('');
            setMensaje('');

            await deleteDetalleVenta(id);

            setMensaje('Material eliminado correctamente.');

            // Actualizamos los detalles y el total calculado por Django
            setRecargar(valor => valor + 1);
            await onActualizado();
        }catch(err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Solo se pueden modificar detalles de ventas pendientes
    const pendiente = venta.estado === 'PENDIENTE';
    
    // Comprobamos los permisos para administrar materiales
    const puedeAgregar = pendiente && tienePermiso('ventas.add_detalleventa');
    const puedeEditar = pendiente && tienePermiso('ventas.change_detalleventa');
    const puedeEliminar = pendiente && tienePermiso('ventas.delete_detalleventa');
    const mostrarAcciones = puedeEditar || puedeEliminar;

    // Mostramos materiales activos y el material que estamos editando
    const materialesDisponibles = materiales.filter(material =>
        material.activo || material.id === Number(detalleEditando?.material)
    );

    return (
        <div className="mt-4">

            {/* Encabezado de los materiales de la venta */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <h3 className="h6 fw-bold mb-0">
                    <i className="bi bi-box-seam me-2"/>
                    Materiales de la venta
                </h3>

                {/* Solo mostramos Agregar material si tiene permiso */}
                {puedeAgregar && (
                    <button type="button" className="btn btn-success btn-sm" onClick={nuevoDetalle}>
                        <i className="bi bi-plus-lg me-2"/>
                        Agregar material
                    </button>
                )}
            </div>

            {/* Mensajes de error y éxito */}
            {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
            )}

            {mensaje && (
                <div className="alert alert-success" role="status">{mensaje}</div>
            )}

            {/* Formulario para agregar o editar materiales */}
            {mostrarFormulario && pendiente && (
                <div className="border rounded p-3 mb-3" style={{backgroundColor: '#F3F8F5'}}>

                    <h4 className="h6 fw-bold mb-3">
                        {detalleEditando ? 'Editar material' : 'Agregar material a la venta'}
                    </h4>

                    <form onSubmit={guardarDetalle}>
                        <div className="row g-3">

                            {/* Selección del material */}
                            <div className="col-md-6">
                                <label htmlFor="venta-material" className="form-label">Material</label>

                                <select id="venta-material" className="form-select" value={materialId} onChange={cambiarMaterial} required>
                                    <option value="">Seleccione un material</option>

                                    {materialesDisponibles.map(material => (
                                        <option key={material.id} value={material.id}>
                                            {material.nombre} - Stock: {material.stock_kg} kg
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Cantidad del material */}
                            <div className="col-md-6">
                                <label htmlFor="venta-cantidad" className="form-label">Cantidad (kg)</label>

                                <input id="venta-cantidad" type="number" className="form-control" min="0.01" step="0.01"
                                    placeholder="Ejemplo: 5.50" value={cantidad} onChange={event => setCantidad(event.target.value)} required/>
                            </div>

                            {/* Precio por kilogramo */}
                            <div className="col-md-6">
                                <label htmlFor="venta-precio" className="form-label">Precio por kg</label>

                                <div className="input-group">
                                    <span className="input-group-text">₡</span>

                                    <input id="venta-precio" type="number" className="form-control" min="0.01" step="0.01"
                                        placeholder="Ejemplo: 200.00" value={precio} onChange={event => setPrecio(event.target.value)} required/>
                                </div>
                            </div>

                            {/* Subtotal estimado mientras llenamos el formulario */}
                            <div className="col-md-6">
                                <label className="form-label">Subtotal estimado</label>

                                <div className="form-control bg-light">
                                    ₡{(Number(cantidad || 0) * Number(precio || 0)).toFixed(2)}
                                </div>
                            </div>

                            {/* Botones del formulario */}
                            <div className="col-12 d-flex flex-wrap gap-2 mt-2">
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

            {/* Tabla de materiales de la venta */}
            {cargando ? (
                <p>Cargando materiales...</p>

            ) : detalles.length === 0 ? (
                <div className="alert alert-info">
                    Esta venta todavía no tiene materiales registrados.
                </div>

            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">

                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Cantidad (kg)</th>
                                <th>Precio/kg</th>
                                <th>Subtotal</th>
                                {/* Mostramos la columna únicamente si hay acciones permitidas */}
                                {mostrarAcciones && <th>Acciones</th>}
                            </tr>
                        </thead>

                        <tbody>
                            {detalles.map(detalle => (
                                <tr key={detalle.id}>
                                    <td>{obtenerMaterial(detalle.material)?.nombre || `Material #${detalle.material}`}</td>
                                    <td>{detalle.cantidad_kg} kg</td>
                                    <td>₡{detalle.precio_unitario}</td>
                                    <td className="fw-semibold">₡{detalle.subtotal}</td>

                                    {/* Solo mostramos acciones si la venta está pendiente */}
                                    {/* Mostramos únicamente las acciones autorizadas */}
                                    {mostrarAcciones && (
                                        <td>
                                            <div className="d-flex gap-2">

                                                {/* Editar material de la venta */}
                                                {puedeEditar && (
                                                    <button type="button" className="btn btn-sm btn-outline-primary" title="Editar material" onClick={() => editarDetalle(detalle)}>
                                                        <i className="bi bi-pencil"/>
                                                    </button>
                                                )}

                                                {/* Eliminar material de la venta */}
                                                {puedeEliminar && (
                                                    <button type="button" className="btn btn-sm btn-outline-danger" title="Eliminar material" onClick={() => eliminarDetalle(detalle.id)}>
                                                        <i className="bi bi-trash"/>
                                                    </button>
                                                )}

                                            </div>
                                        </td>
                                    )}

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Total calculado por Django */}
            <div className="d-flex justify-content-end mt-3">
                <div className="border rounded p-3" style={{backgroundColor: '#E8F3ED'}}>
                    <span className="text-secondary me-3">Total de la venta:</span>
                    <strong style={{color: '#143D32'}}>₡{venta.total}</strong>
                </div>
            </div>

            {/* Indicaciones según el estado de la venta */}
            {pendiente ? (
                <p className="text-secondary small mt-3 mb-0">
                    Agregue los materiales necesarios antes de confirmar. Django verificará el stock disponible.
                </p>
            ) : (
                <p className="text-secondary small mt-3 mb-0">
                    Esta venta está finalizada y sus materiales son de solo lectura.
                </p>
            )}
        </div>
    );
}