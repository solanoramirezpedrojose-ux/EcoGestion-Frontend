import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../auth/AuthContext.jsx';
import { getError } from "../api/client.js";
import { obtenerIndicadores } from "../services/dashboardService";
import './Dashboard.css';

//Componente principal del Dashboard
export default function Dashboard() {
    //Obtenemos el usuario y la funcion para cerrar sesion
    const { username, logout } = useAuth();
    const navigate = useNavigate();

    //Estados para guardar los indicadores, carga y errores
    const [indicadores, setIndicadores] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    //Consultamos los datos cuando se carga el dashboard
    useEffect(() => {
        let activo = true;

        async function cargarDatos() {
            try {
                //Obtenemos los indicadores desde Django
                const datos = await obtenerIndicadores();
                if(activo) {
                    setIndicadores(datos);
                }
            }catch(err) {
                //Mostramos un mensaje si ocurre un error
                if(activo) {
                    setError(err.response ? getError(err) : err.message);
                }
            }finally {
                //Terminamos el estao de carga
                if(activo) {
                    setCargando(false);
                }
            }
        }
        cargarDatos();
        
        //Evitamos actualizar el estado si se cierra la pantalla
        return() => {
            activo = false;
        };
    }, []);
    //Funcion para cerrar la sesion
    function cerrarSesion() {
        logout();
        navigate('/login', { replace: true });
    }

    //Datos que utilizaremos para las tarjetas
    const tarjetas = indicadores ? [
        {
            titulo: 'Personas registradas',
            valor: indicadores.totalPersonas,
            icono: 'bi-people'
        },
        {
            titulo: 'Materiales registrados',
            valor: indicadores.totalMateriales,
            icono: 'bi-box-seam'
        },
        {
            titulo: 'Ventas registradas',
            valor: indicadores.totalVentas,
            icono: 'bi-cart-check'
        }
    ] : [];

    return (
        <main className="container py-5 ecog-dashboard">
            {/*Encabezado del dashboard*/}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                <div>
                    <h1 className="fw-bold ecog-dashboard-title">
                        <i className="bi bi-recycle me-2"/>
                        EcoGestion
                    </h1>
                    <p className="text-secondary mb-0">
                        Panel general del sistema
                    </p>
                </div>
                {/*Boton para cerrar sesion*/}
                <button className="btn btn-outline-danger" onClick={cerrarSesion}>
                    <i className="bi bi-box-arrow-right me-2"/>
                    Cerrar sesion
                </button>
            </div>
            {/*Mensaje de bienvenida*/}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                    <h2 className="h4 fw-bold">
                        Bienvenido, {username}
                    </h2>
                    <p className="text-secondary mb-0">
                        Consulta la informacion general de EcoGestion
                    </p>
                </div>
            </div>
            {/*Mostramo un mensaje mientras cargan los datos*/}
            {cargando && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {/*Mostramos las tarjetas cuando existen datos*/}
            {!cargando && !error && (
                <div className="row g-4">
                    {tarjetas.map((tarjeta) => (
                        <div className="col-md-4" key={tarjeta.titulo}>
                            <div className="card ecog-stat-card h-100">
                                <div className="card-body p-4">
                                    <i className={`bi ${tarjeta.icono} ecog-stat-icon`}/>
                                    <h3 className="display-5 fw-bold mt-3">
                                        {tarjeta.valor}
                                    </h3>
                                    <p className="text-secondary mb-0">
                                        {tarjeta.titulo}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}