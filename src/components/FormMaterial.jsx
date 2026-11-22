import { useState } from 'react';
import { getError } from '../api/client.js';

// Formulario para registrar o editar materiales
export default function FormMaterial({ material, onGuardar, onCancelar }) {

    // Guardamos los datos iniciales del material
    // Si estamos registrando, utilizamos valores vacíos
    // Si estamos editando, cargamos los valores existentes
    const [datos, setDatos] = useState({
        nombre: material?.nombre || '',
        categoria: material?.categoria || 'PLASTICO',
        precio_venta_kg: material?.precio_venta_kg || '',
        activo: material?.activo ?? true
    });

    // Estados para mostrar errores y controlar el guardado
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    // Actualizamos los campos cuando el usuario escribe
    function cambiar(event) {
        setDatos({ ...datos, [event.target.name]: event.target.value });
    }

    // Función para enviar el formulario
    async function guardar(event) {

        // Evitamos que se recargue la página
        event.preventDefault();

        // Limpiamos errores anteriores
        setError('');

        // Validamos que el nombre no esté vacío
        if (!datos.nombre.trim()) {
            setError('Debe ingresar el nombre del material');
            return;
        }

        // Validamos que el precio sea un número mayor que cero
        if (!datos.precio_venta_kg || !Number.isFinite(Number(datos.precio_venta_kg)) || Number(datos.precio_venta_kg) <= 0) {
            setError('El precio de venta debe ser mayor que cero');
            return;
        }

        setGuardando(true);

        try {
            // Enviamos los datos al componente de Inventario
            // Ese componente realizará la petición a Django
            await onGuardar(datos);
        } catch (err) {
            // Mostramos el error si Django rechaza los datos
            setError(err.response ? getError(err) : err.message);
        } finally {
            // Finalizamos el proceso de guardado
            setGuardando(false);
        }
    }
    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">

                {/* Título según la operación */}
                <h2 className="h5 fw-bold mb-3" style={{ color: '#143D32' }}>
                    <i className="bi bi-box-seam me-2" />
                    {material ? 'Editar material' : 'Registrar nuevo material'}
                </h2>

                {/* Mostramos los errores de validación */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {/* Formulario principal */}
                <form onSubmit={guardar}>
                    <div className="row g-3">
                        {/* Nombre del material */}
                        <div className="col-md-6">
                            <label htmlFor="material-nombre" className="form-label">
                                Nombre del material
                            </label>
                            <input
                                id="material-nombre"
                                name="nombre"
                                type="text"
                                className="form-control"
                                placeholder="Ejemplo: Botellas PET"
                                maxLength={100}
                                value={datos.nombre}
                                onChange={cambiar}
                                required
                            />
                        </div>
                        {/* Categoría del material */}
                        <div className="col-md-6">
                            <label htmlFor="material-categoria" className="form-label">
                                Categoría
                            </label>
                            <select
                                id="material-categoria"
                                name="categoria"
                                className="form-select"
                                value={datos.categoria}
                                onChange={cambiar}
                                required
                            >
                                <option value="PLASTICO">Plástico</option>
                                <option value="CARTON">Cartón</option>
                                <option value="PAPEL">Papel</option>
                                <option value="METAL">Metal</option>
                                <option value="VIDRIO">Vidrio</option>
                            </select>
                        </div>
                        {/* Precio de venta por kilogramo */}
                        <div className="col-md-6">
                            <label htmlFor="material-precio" className="form-label">
                                Precio de venta por kg
                            </label>
                            <div className="input-group">
                                <span className="input-group-text">₡</span>
                                <input
                                    id="material-precio"
                                    name="precio_venta_kg"
                                    type="number"
                                    className="form-control"
                                    placeholder="0.00"
                                    min="0.01"
                                    step="0.01"
                                    value={datos.precio_venta_kg}
                                    onChange={cambiar}
                                    required
                                />
                            </div>
                        </div>
                        {/* Existencias: solo se muestran al editar */}
                        {material && (
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="material-stock">
                                    Stock disponible (kg)
                                </label>
                                <input
                                    id="material-stock"
                                    type="text"
                                    className="form-control"
                                    value={material.stock_kg ?? '0'}
                                    disabled
                                    readOnly
                                />
                                <small className="text-secondary">
                                    El stock se actualiza mediante las operaciones del sistema.
                                </small>
                            </div>
                        )}
                        {/* Estado del material */}
                        <div className="col-12">
                            <div className="form-check">
                                <input
                                    id="material-activo"
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={datos.activo}
                                    onChange={(event) => setDatos({
                                        ...datos,
                                        activo: event.target.checked
                                    })}
                                />
                                <label htmlFor="material-activo" className="form-check-label">
                                    Material activo
                                </label>
                            </div>
                        </div>
                        {/* Botones para guardar o cancelar */}
                        <div className="col-12 d-flex gap-2 mt-4">
                            <button type="submit" className="btn btn-success" disabled={guardando}>
                                <i className="bi bi-check-lg me-2" />
                                {guardando ? 'Guardando...' : 'Guardar material'}
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