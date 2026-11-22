import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from '../auth/AuthContext.jsx';
import './AppLayout.css';

//Componente que contiene el menu principal de EcoGestion
export default function AppLayout() {
    //Obtenemos el usuario y la funcion para cerrar sesion
    const { username, logout} = useAuth();

    //Permite navegar entre las paginas 
    const navigate = useNavigate();

    //Funcion para cerrar la sesion
    function cerrarSesion() {
        logout();
        navigate('/login', { replace: true });
    }

    //Opciones de navegacion del sistema
    const opciones = [
        { nombre: 'Dashboard', ruta: '/dashboard', icono: 'bi-speedometer2' },
        { nombre: 'Personas', ruta: '/personas', icono: 'bi-people' },
        { nombre: 'Inventario', ruta: '/inventario', icono: 'bi-box-seam' },
        { nombre: 'Recolecciones', ruta: '/recolecciones', icono: 'bi-truck' },
        { nombre: 'Ventas', ruta: '/ventas', icono: 'bi-cart-check' },
        { nombre: 'Pagos', ruta: '/pagos', icono: 'bi-cash-coin' }
    ];

    return(
        <div className="ecog-app-layout">
            {/*Menu lateral para computadoras*/}
            <aside className="ecog-sidebar d-none d-lg-flex">
                {/*Nombre e icono del sistema*/}
                <div className="ecog-sidebar-brand">
                    <i className="bi bi-recycle me-2"/>
                    EcoGestion
                </div>

                <p className="ecog-sidebar-label">
                    ADMINISTRACION
                </p>

                {/*Opciones para navegar entre modulos*/}
                <nav className="nav flex-column gap-2" aria-label="Menu principal">
                    {opciones.map((opcion) => (
                        <NavLink key={opcion.ruta} to={opcion.ruta} className={({ isActive}) => `ecog-sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className={`bi ${opcion.icono} me-2`}/>
                            {opcion.nombre}
                        </NavLink>
                    ))}
                </nav>
                <div className="ecog-sidebar-footer">
                    Sistema de gestion de reciclaje
                </div>
            </aside>
            {/*Area derecha de la aplicacion*/}
            <div className="ecog-app-main">
                {/*Barra superior con usuario y cierre de sesion*/}
                <header className="ecog-topbar">
                    <span className="fw-bold ecog-topbar-title">
                        <i className="bi bi-recycle me-2"/>
                        EcoGestion
                    </span>
                    <div className="d-flex align-items-center gap-3">
                        <span className="ecog-username">
                            <i className="bi bi-person-circle me-2"/>
                            {username}
                        </span>
                        <button className="btn btn-outline-danger btn-sm" onClick={cerrarSesion}>
                            <i className="bi bi-box-arrow-right me-1"/>
                            Salir
                        </button>
                    </div>
                </header>
                {/*Menu para pantallas pequeñas*/}
                <nav className="ecog-mobile-menu d-lg-none" aria-label="Menu">
                    {opciones.map((opcion) => (
                        <NavLink key={opcion.ruta} to={opcion.ruta} className={({ isActive }) => `ecog-mobile-link ${isActive ? 'active' : ''}`}>
                            <i className={`bi ${opcion.icono} me-1`}/>
                            {opcion.nombre}
                        </NavLink>
                    ))}
                </nav>

                {/*Aqui se muestra la pagina seleccionada*/}
                <main className="ecog-page-content">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
}