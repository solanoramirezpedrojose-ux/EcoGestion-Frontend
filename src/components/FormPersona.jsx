import { useState } from "react";
import { getError } from "../api/client.js";

//Formulario para registrar o ediar una personas
export default function FormPersona({ persona, onGuardar, onCancelar }) {
    // Guardamos los datos iniciales del formulario
    // Si estamos registrando, utilizamos valores vacíos
    // Si estamos editando, cargamos los datos de la persona
    const [datos, setDatos] = useState({
        nombre: persona?.nombre || '',
        identificacion: persona?.identificacion || '',
        telefono: persona?.telefono || '',
        correo: persona?.correo || '',
        direccion: persona?.direccion || '',
        tipo_persona: persona?.tipo_persona || 'PROVEEDOR',
        activo: persona?.activo ?? true
    });

    //Estados para manejar errores y el proceso de onGuardar
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    //Actualizamos el campo que modifica el usuario
    function cambiar(event) {
        setDatos({...datos, [event.target.name]: event.target.value});
    }

    //Enviamos los datos del formulario
    async function guardar(event) {
        event.preventDefault();
        setError('');

        // Verificamos que los campos obligatorios tengan información
        // El signo ?. evita errores si algún campo no tiene valor
        if (!datos.nombre?.trim() ||
            !datos.identificacion?.trim() ||
            !datos.telefono?.trim() ||
            !datos.correo?.trim() ||
            !datos.direccion?.trim()) {
            setError('Complete todos los campos obligatorios');
            return;
        }
        setGuardando(true);
        try {
            //El componente Personas realizara la solicitud a Django
            await onGuardar(datos);
        }catch(err) {
            //Mostramos los errores que devuelve la API
            setError(getError(err));
        }finally {
            setGuardando(false);
        }
    }
    return(
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
                {/*Titulo segun la operacion*/}
                <h2 className="h5 fw-bold mb-3">
                    {persona ? 'Editar persona' : 'Registrar nueva persona'}
                </h2>
                {/*Mensaje de error*/}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                <form onSubmit={guardar}>
                    <div className="row g-3">
                        {/*Nombre*/}
                        <div className="col-md-6">
                            <label htmlFor="persona-nombre" className="form-label">
                                Nombre
                            </label>
                            <input
                                id="persona-nombre"
                                name="nombre"
                                className="form-control"
                                maxLength="100"
                                value={datos.nombre ?? ''}
                                onChange={cambiar}
                                required
                            />
                        </div>
                        {/* Identificación */}
                        <div className="col-md-6">
                            <label htmlFor="persona-identificacion" className="form-label">
                                Identificación
                            </label>
                            <input
                                id="persona-identificacion"
                                name="identificacion"
                                className="form-control"
                                maxLength="30"
                                value={datos.identificacion ?? ''}
                                onChange={cambiar}
                                required
                            />
                        </div>
                        {/* Teléfono */}
                        <div className="col-md-6">
                            <label htmlFor="persona-telefono" className="form-label">
                                Teléfono
                            </label>
                            <input
                                id="persona-telefono"
                                name="telefono"
                                type="tel"
                                className="form-control"
                                maxLength="20"
                                value={datos.telefono ?? ''}
                                onChange={cambiar}
                                required
                            />
                        </div>
                        {/* Correo */}
                        <div className="col-md-6">
                            <label htmlFor="persona-correo" className="form-label">
                                Correo electrónico
                            </label>
                            <input
                                id="persona-correo"
                                name="correo"
                                type="email"
                                className="form-control"
                                value={datos.correo ?? ''}
                                onChange={cambiar}
                                required
                            />
                        </div>
                        {/* Dirección */}
                        <div className="col-md-6">
                            <label htmlFor="persona-direccion" className="form-label">
                                Dirección
                            </label>
                            <input
                                id="persona-direccion"
                                name="direccion"
                                className="form-control"
                                maxLength="200"
                                value={datos.direccion ?? ''}
                                onChange={cambiar}
                                required
                            />
                        </div>
                        {/* Tipo de persona */}
                        <div className="col-md-6">
                            <label htmlFor="persona-tipo" className="form-label">
                                Tipo de persona
                            </label>
                            <select
                                id="persona-tipo"
                                name="tipo_persona"
                                className="form-select"
                                value={datos.tipo_persona}
                                onChange={cambiar}
                            >
                                <option value="PROVEEDOR">Proveedor</option>
                                <option value="COMPRADOR">Comprador</option>
                                <option value="AMBOS">Ambos</option>
                            </select>
                        </div>
                        {/* Estado de la persona */}
                        <div className="col-12">
                            <div className="form-check">
                                <input
                                    id="persona-activo"
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={datos.activo}
                                    onChange={(event) => setDatos({
                                        ...datos,
                                        activo: event.target.checked
                                    })}
                                />
                                <label htmlFor="persona-activo" className="form-check-label">
                                    Persona activa
                                </label>
                            </div>
                        </div>
                        {/*Botones del formulario*/}
                        <div className="col-12 d-flex gap-2">
                            <button type="submit" className="btn btn-succes" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar persona'}</button>
                            <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={guardando}>Cancelar</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}