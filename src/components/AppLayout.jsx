import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from '../auth/AuthContext.jsx';
import './AppLayout.css';

//Componente que contiene el menu principal de EcoGestion
export default function AppLayout() {
    //Obtenemos el usuario y la funcion para cerrar sesion
    const { username, logout } = useAuth();

    //Permite navegar entre las paginas 
    const navigate = useNavigate();

    //Funcion para cerrar la sesion
    function cerrarSesion() {
        logout();
        navigate('/login', { replace: true });
    }

    return (
        <div className="eco-layout">

            {/* Barra de navegación superior */}
            <header className="eco-topbar">
                <div className="eco-topbar-contenido">

                    {/* Logo y nombre del sistema */}
                    <NavLink to="/dashboard" className="eco-marca">
                        <i className="bi bi-recycle eco-logo" />
                        <span>EcoGestión</span>
                    </NavLink>

                    {/* Navegación principal de los módulos */}
                    <nav className="eco-navegacion" aria-label="Navegación principal">

                        <NavLink to="/dashboard" className={({ isActive }) => `eco-enlace ${isActive ? 'activo' : ''}`}>
                            <i className="bi bi-speedometer2" />
                            Dashboard
                        </NavLink>

                        <NavLink to="/personas" className={({ isActive }) => `eco-enlace ${isActive ? 'activo' : ''}`}>
                            <i className="bi bi-people" />
                            Personas
                        </NavLink>

                        <NavLink to="/inventario" className={({ isActive }) => `eco-enlace ${isActive ? 'activo' : ''}`}>
                            <i className="bi bi-box-seam" />
                            Inventario
                        </NavLink>

                        <NavLink to="/recolecciones" className={({ isActive }) => `eco-enlace ${isActive ? 'activo' : ''}`}>
                            <i className="bi bi-truck" />
                            Recolecciones
                        </NavLink>

                        <NavLink to="/ventas" className={({ isActive }) => `eco-enlace ${isActive ? 'activo' : ''}`}>
                            <i className="bi bi-cart-check" />
                            Ventas
                        </NavLink>

                        <NavLink to="/pagos" className={({ isActive }) => `eco-enlace ${isActive ? 'activo' : ''}`}>
                            <i className="bi bi-cash-coin" />
                            Pagos
                        </NavLink>

                    </nav>

                    {/* Información del usuario y botón para salir */}
                    <div className="eco-usuario">
                        <div className="eco-perfil">
                            <i className="bi bi-person-circle" />
                            <span title={username || 'Usuario'}>{username || 'Usuario'}</span>
                        </div>

                        <button type="button" className="eco-salir" onClick={cerrarSesion}>
                            <i className="bi bi-box-arrow-right" />
                            <span>Salir</span>
                        </button>
                    </div>

                </div>
            </header>

            {/* Contenido de cada módulo debajo de la barra */}
            <main className="eco-contenido">
                <Outlet />
            </main>

        </div>
    );
}