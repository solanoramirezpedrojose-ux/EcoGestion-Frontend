import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../auth/AuthContext.jsx';
import './LoginPage.css';

//Componente que muestra la pantalla de inicio de sesion
export default function LoginPage() {
    //Obtenemos la funcion de login desde AuthContext
    const { login } = useAuth();
    const navigate = useNavigate();

    //Estados para almacenar los datos del formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    //Estados para controlar los errores y la carga
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    //Funcion que se ejecuta la enviar el formulario
    async function submit(event) {
        //Evitamos que se recargue la pagina
        event.preventDefault();

        //Limpiamos errores y activamos el estado de carga
        setError('');
        setLoading(true);

        try {
            //Enviamos las credenciales al contexto de autenticacion
            await login(username, password);

            //Si el login funciona ingresamos al sistema
            navigate('/', { replace: true });
        }catch(err){
            //Mostramos el mensaje si ocurre un error
            setError(err.message);
        }finally{
            //Finalizamos el estado de carga
            setLoading(false);
        }
    }

    return(
        <main className="ecog-login">
            <div className="ecog-login-container">
                {/*Panel izquierdo con la identidad de EcoGestion*/}
                <section className="ecog-login-aside">
                    <div className="ecog-login-brand">
                        <i className="bi bi-recycle"/>
                    </div>
                    <h1>EcoGestion</h1>
                    <p>Una manera inteligente de gestionar
                        nuestros recursos
                    </p>
                    <div className="ecog-login-footer">
                        <i className="bi bi-leaf me-2"/>
                        Gestion sostenible
                    </div>
                </section>

                {/*Panel derecho con el formulario de acceso*/}
                <section className="ecog-login-form">
                    <div className="ecog-form-content">
                        <h2 className="fw-bold mb-2">
                            Bienvenido
                        </h2>
                        <p className="text-secondary mb-4">
                            Inicia sesion para continuar
                        </p>
                        {/*Alerta cuando ocurra un error*/}
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                <i className="bi bi-exclamation-circle me-2"/>
                                {error}
                            </div>
                        )}

                        {/*Formulario de usuario y contrasena*/}
                        <form onSubmit={submit}>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">
                                    Usuario
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-person"/>
                                    </span>
                                    <input
                                        id="username"
                                        type="text"
                                        className="form-control"
                                        placeholder="Ingresa tu usuario"
                                        autoComplete="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="password" className="form-label">
                                    Contraseña
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-lock"/>
                                    </span>
                                    <input
                                        id="password"
                                        type="password"
                                        className="form-control"
                                        placeholder="Ingresa tu contraseña"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {/*Boton para iniciar sesion*/}
                            <button type="submit" className="btn ecog-login-button w-100" disabled={loading}>
                                {loading ? 'Verificando...' : 'Ingresar'}
                                {!loading && (<i className="bi bi-arrow-right ms-2"/>)}
                            </button>
                        </form>
                        <p className="ecog-login-note">
                            Sistema de gestion de recursos reciclables
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}