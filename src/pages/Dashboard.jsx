import { useEffect, useState } from "react";
import { useAuth } from '../auth/AuthContext.jsx';
import { getError } from "../api/client.js";
import { obtenerIndicadores } from "../services/dashboardService";
import './Dashboard.css';

//Componente principal del Dashboard
export default function Dashboard() {
    //Obtenemos el usuario que inicio sesion 
    const { username } = useAuth();

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
        <div className="ecog-dashboard">
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
        </div>
    );
}