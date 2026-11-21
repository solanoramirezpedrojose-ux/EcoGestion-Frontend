import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

//Componente de la pantalla principal de EcoGestion
export default function Dashboard() {
    //Obtenemos los datos del usuario y la funcion para cerrar su session
    const { username, logout } = useAuth();

    //Permite navegar hacia otras pantallas
    const navigate = useNavigate();

    //Funcion para cerrar la sesion del usuario
    function cerrarSesion(){
        //Eliminamos los datos de autenticacion
        logout();

        //Regresamos a la pantalla de login
        navigate('login', { replace: true });
    }

    return(
        <main className="container py-5">
            {/*Encabezado principal*/}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="text-success fw-bold">
                    <i className="bi bi-recycle me-2"/>
                    EcoGestion
                </h1>

                {/*Boton para cerrar sesion*/}
                <button className="btn btn-outline-danger" onClick={cerrarSesion}>
                    <i className="bi bi-box-arrow-right me-2"/>
                    Cerrar sesion
                </button>
            </div>

            {/*Mensaje de bienvenida*/}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <h2 className="h4 fw-bold">
                        Bienvenido, {username}
                    </h2>
                    <p className="text-secondary mb-0">
                        Panel principal del sistema EcoGestión.
                        Próximamente mostraremos los indicadores
                        y módulos conectados con Django.
                    </p>
                </div>
            </div>
        </main>
    )
}