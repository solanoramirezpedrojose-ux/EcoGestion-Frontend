import { useEffect, useState } from 'react';
import { getError } from '../api/client.js';
import { listMateriales, getMaterial, addMaterial, updateMaterial, deleteMaterial } from '../services/inventarioService.js';
import FormMaterial from '../components/FormMaterial.jsx';
import { useAuth } from '../auth/AuthContext.jsx'
import './Inventario.css';

// Pantalla principal del módulo de Inventario
export default function Inventario() {
    // Obtenemos los permisos asignados por Django
    const { tienePermiso } = useAuth();

    // Estados para almacenar los materiales y controlar la carga
    const [materiales, setMateriales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    // Estados para los filtros y la búsqueda
    const [categoria, setCategoria] = useState('');
    const [activo, setActivo] = useState('');
    const [textoBuscar, setTextoBuscar] = useState('');
    const [buscar, setBuscar] = useState('');
    const [orden, setOrden] = useState('nombre');

    // Estados para controlar la paginación
    const [pagina, setPagina] = useState(1);
    const [total, setTotal] = useState(0);
    const [siguiente, setSiguiente] = useState(null);
    const [anterior, setAnterior] = useState(null);

    // Permite volver a consultar los materiales después de un cambio
    const [recargar, setRecargar] = useState(0);

    // Estados para registrar, editar y consultar materiales
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [materialEditando, setMaterialEditando] = useState(null);
    const [materialDetalle, setMaterialDetalle] = useState(null);

    // Consultamos los materiales cuando cambia un filtro o la página
    useEffect(() => {
        let vigente = true;
        async function cargarMateriales() {
            setCargando(true);
            setError('');

            try {
                // Enviamos los filtros directamente a Django
                const datos = await listMateriales({
                    categoria: categoria,
                    activo: activo,
                    buscar: buscar,
                    orden: orden,
                    page: pagina
                });

                if (vigente) {
                    // Guardamos los materiales y los datos de paginación
                    setMateriales(datos.results);
                    setTotal(datos.count);
                    setSiguiente(datos.next);
                    setAnterior(datos.previous);
                }

            } catch (err) {
                if (vigente) {
                    setError(err.response ? getError(err) : err.message);
                    setMateriales([]);
                }

            } finally {
                if (vigente) {
                    setCargando(false);
                }
            }
        }

        cargarMateriales();

        // Evitamos actualizar la pantalla después de salir del módulo
        return () => {
            vigente = false;
        };

    }, [categoria, activo, buscar, orden, pagina, recargar]);

    // Aplicamos la búsqueda cuando se envía el formulario
    function aplicarBusqueda(event) {
        event.preventDefault();
        setPagina(1);
        setBuscar(textoBuscar.trim());
    }

    // Abrimos el formulario para registrar un material
    function nuevoMaterial() {
        setMaterialEditando(null);
        setMaterialDetalle(null);
        setMostrarFormulario(true);
        setError('');
        setMensaje('');
    }

    // Consultamos un material para cargar sus datos en el formulario
    async function editarMaterial(id) {
        try {
            setError('');
            const datos = await getMaterial(id);
            setMaterialEditando(datos);
            setMaterialDetalle(null);
            setMostrarFormulario(true);
        } catch (err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Consultamos la información completa de un material
    async function verMaterial(id) {
        try {
            setError('');
            const datos = await getMaterial(id);
            setMaterialDetalle(datos);
            setMostrarFormulario(false);
        } catch (err) {
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Guardamos un material nuevo o actualizado
    async function guardarMaterial(datos) {
        if (materialEditando) {
            // Actualizamos el material existente
            await updateMaterial(materialEditando.id, datos);
            setMensaje('Material actualizado correctamente.');
        } else {
            // Registramos un material nuevo
            await addMaterial(datos);
            setMensaje('Material registrado correctamente.');
        }

        // Cerramos el formulario después de guardar
        setMostrarFormulario(false);
        setMaterialEditando(null);

        // Volvemos a consultar los datos reales de Django
        setRecargar(valor => valor + 1);
    }

    // Eliminamos un material después de confirmar la operación
    async function eliminarMaterial(id) {
        const confirmar = window.confirm('¿Está seguro de que desea eliminar este material?');

        if (!confirmar) {
            return;
        }

        try {
            setError('');
            setMensaje('');

            // Solicitamos la eliminación al backend
            await deleteMaterial(id);
            setMaterialDetalle(null);
            setMensaje('Material eliminado correctamente.');

            // Si eliminamos el último de la página, retrocedemos
            if (materiales.length === 1 && pagina > 1) {
                setPagina(pagina - 1);
            } else {
                setRecargar(valor => valor + 1);
            }

        } catch (err) {
            // Django puede rechazar la eliminación por permisos o relaciones
            setError(err.response ? getError(err) : err.message);
        }
    }

    // Nombres que mostramos para las categorías
    const categorias = {
        PLASTICO: 'Plástico',
        CARTON: 'Cartón',
        PAPEL: 'Papel',
        METAL: 'Metal',
        VIDRIO: 'Vidrio'
    };

    // Calculamos el total de páginas según la paginación de Django
    const totalPaginas = Math.max(1, Math.ceil(total / 5));

    return (
        <section className="inventario-page">
            {/* Encabezado principal de Inventario */}
            <div className="inventario-hero">
                <div>
                    <h1 className="h3 fw-bold mb-2">
                        <i className="bi bi-box-seam me-2" />
                        Gestión de inventario
                    </h1>
                    <p className="mb-0">
                        Administración de materiales reciclables
                    </p>
                </div>

                {/* Botón para registrar materiales */}
                {/* Solo permitimos registrar materiales con el permiso correspondiente */}
                {tienePermiso('inventario.add_material') && (
                    <button className="btn inventario-btn-nuevo" onClick={nuevoMaterial}>
                        <i className="bi bi-plus-lg me-2" />
                        Nuevo material
                    </button>
                )}
            </div>

            {/* Tarjeta que muestra el total de materiales encontrados */}
            <div className="inventario-resumen mb-4">
                <i className="bi bi-boxes" />
                <div>
                    <span>Materiales encontrados</span>
                    <h2>{cargando ? '...' : total}</h2>
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

            {/* Formulario para registrar o editar materiales */}
            {mostrarFormulario && (
                <FormMaterial
                    key={materialEditando?.id ?? 'nuevo'}
                    material={materialEditando}
                    onGuardar={guardarMaterial}
                    onCancelar={() => {
                        setMostrarFormulario(false);
                        setMaterialEditando(null);
                    }}
                />
            )}

            {/* Información completa del material seleccionado */}
            {materialDetalle && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between">
                            <h2 className="h5 fw-bold">Detalle del material</h2>
                            <button className="btn-close" aria-label="Cerrar detalle" onClick={() => setMaterialDetalle(null)} />
                        </div>

                        <p><strong>Nombre:</strong> {materialDetalle.nombre}</p>
                        <p>
                            <strong>Categoría:</strong>{' '}
                            {categorias[materialDetalle.categoria]}
                        </p>
                        <p>
                            <strong>Precio por kg:</strong> ₡
                            {materialDetalle.precio_venta_kg}
                        </p>
                        <p>
                            <strong>Stock disponible:</strong>{' '}
                            {materialDetalle.stock_kg} kg
                        </p>
                        <p className="mb-0">
                            <strong>Estado:</strong>{' '}
                            {materialDetalle.activo ? 'Activo' : 'Inactivo'}
                        </p>
                    </div>
                </div>
            )}

            {/* Buscador y filtros del inventario */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                    <h2 className="h5 fw-bold mb-3">
                        <i className="bi bi-funnel me-2"></i>
                        Buscar y filtrar materiales
                    </h2>

                    <form onSubmit={aplicarBusqueda}>
                        <div className="row g-3">
                            {/* Búsqueda por nombre */}
                            <div className="col-lg-4">
                                <label htmlFor="material-buscar" className="form-label">
                                    Buscar por nombre
                                </label>
                                <div className="input-group">
                                    <input
                                        id="material-buscar"
                                        type="text"
                                        className="form-control"
                                        placeholder="Nombre del material"
                                        value={textoBuscar}
                                        onChange={(event) =>
                                            setTextoBuscar(event.target.value)
                                        }
                                    />
                                    <button type="submit" className="btn btn-success" title="Buscar">
                                        <i className="bi bi-search" />
                                    </button>
                                </div>
                            </div>

                            {/* Filtro por categoría */}
                            <div className="col-lg-3">
                                <label htmlFor="filtro-categoria" className="form-label">
                                    Categoría
                                </label>
                                <select
                                    id="filtro-categoria"
                                    className="form-select"
                                    value={categoria}
                                    onChange={(event) => {
                                        setCategoria(event.target.value);
                                        setPagina(1);
                                    }}
                                >
                                    <option value="">Todas</option>
                                    <option value="PLASTICO">Plástico</option>
                                    <option value="CARTON">Cartón</option>
                                    <option value="PAPEL">Papel</option>
                                    <option value="METAL">Metal</option>
                                    <option value="VIDRIO">Vidrio</option>
                                </select>
                            </div>

                            {/* Filtro por estado */}
                            <div className="col-lg-2">
                                <label htmlFor="filtro-estado" className="form-label">
                                    Estado
                                </label>
                                <select
                                    id="filtro-estado"
                                    className="form-select"
                                    value={activo}
                                    onChange={(event) => {
                                        setActivo(event.target.value);
                                        setPagina(1);
                                    }}
                                >
                                    <option value="">Todos</option>
                                    <option value="true">Activos</option>
                                    <option value="false">Inactivos</option>
                                </select>
                            </div>
                            {/* Ordenamiento desde Django */}
                            <div className="col-lg-3">
                                <label htmlFor="filtro-orden" className="form-label">
                                    Ordenar por
                                </label>
                                <select
                                    id="filtro-orden"
                                    className="form-select"
                                    value={orden}
                                    onChange={(event) => {
                                        setOrden(event.target.value);
                                        setPagina(1);
                                    }}
                                >
                                    <option value="nombre">Nombre A-Z</option>
                                    <option value="-nombre">Nombre Z-A</option>
                                    <option value="precio_venta_kg">Precio menor a mayor</option>
                                    <option value="-precio_venta_kg">Precio mayor a menor</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tabla de materiales */}
            <div className="card border-0 shadow-sm inventario-tabla">
                <div className="card-body p-4">
                    <h2 className="h5 fw-bold mb-3">
                        Materiales registrados
                    </h2>
                    {cargando ? (
                        <p>Cargando materiales...</p>
                    ) : materiales.length === 0 ? (
                        <p className="text-secondary">
                            No se encontraron materiales.
                        </p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Categoría</th>
                                        <th>Precio/kg</th>
                                        <th>Stock (kg)</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materiales.map((material) => (
                                        <tr key={material.id}>
                                            <td className="fw-semibold">
                                                {material.nombre}
                                            </td>
                                            <td>
                                                {categorias[material.categoria]}
                                            </td>
                                            <td>
                                                ₡{material.precio_venta_kg}
                                            </td>
                                            <td>
                                                {material.stock_kg}
                                            </td>
                                            <td>
                                                <span className={
                                                    material.activo
                                                        ? 'badge text-bg-success'
                                                        : 'badge text-bg-secondary'
                                                }>
                                                    {material.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    {/* Consultar */}
                                                    <button className="btn btn-sm btn-outline-success" title="Ver material" onClick={() => verMaterial(material.id)}>
                                                        <i className="bi bi-eye" />
                                                    </button>

                                                    {/* Editar */}
                                                    {/* Editar material si tiene permiso */}
                                                    {tienePermiso('inventario.change_material') && (
                                                        <button className="btn btn-sm btn-outline-primary" title="Editar material" onClick={() => editarMaterial(material.id)}>
                                                            <i className="bi bi-pencil" />
                                                        </button>
                                                    )}
                                                    {/* Eliminar */}
                                                    {/* Eliminar material si tiene permiso */}
                                                    {tienePermiso('inventario.delete_material') && (
                                                        <button className="btn btn-sm btn-outline-danger" title="Eliminar material" onClick={() => eliminarMaterial(material.id)}>
                                                            <i className="bi bi-trash" />
                                                        </button>
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
                        <div className="inventario-paginacion">
                            <span>
                                Página {pagina} de {totalPaginas}
                                {' '}— {total} materiales
                            </span>

                            <div className="d-flex gap-2">
                                <button className="btn btn-outline-success btn-sm" disabled={!anterior} onClick={() => setPagina(pagina - 1)}>
                                    Anterior
                                </button>
                                <button className="btn btn-outline-success btn-sm" disabled={!siguiente} onClick={() => setPagina(pagina + 1)}>
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