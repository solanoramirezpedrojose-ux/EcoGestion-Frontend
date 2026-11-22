import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Personas from './pages/Personas.jsx';
import Inventario from './pages/Inventario.jsx';
import Recolecciones from './pages/Recolecciones.jsx';

// Componente temporal para los módulos todavía no implementados
function ModuloPendiente({ nombre }) {
    return (
        <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
                <h1 className="h3">{nombre}</h1>
                <p className="text-secondary mb-0">
                    La pantalla de este módulo está en desarrollo.
                </p>
            </div>
        </div>
    );
}

// Controlamos el acceso a la pantalla de login
function LoginRoute() {
    const { isAuthenticated } = useAuth();

    // Si ya inició sesión, enviamos al usuario al dashboard
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />;
}

// Componente principal de EcoGestión
export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Pantalla pública de login */}
                    <Route path="/login" element={<LoginRoute/>}/>

                    {/* Rutas privadas del sistema */}
                    <Route element={<ProtectedRoute/>}>

                        {/* Menú y barra superior compartidos */}
                        <Route element={<AppLayout/>}>

                            <Route path="/dashboard" element={<Dashboard/>}/>

                            {/* Estas pantallas se reemplazarán por los módulos reales */}
                            {/* Pantalla real del módulo Personas */}
                            <Route path="/personas" element={<Personas/>}/>
                            {/* Pantalla real del módulo Inventario */}
                            <Route path="/inventario" element={<Inventario/>}/>
                            {/* Pantalla real del módulo Recolecciones */}
                            <Route path="/recolecciones" element={<Recolecciones/>}/>
                            <Route path="/ventas" element={<ModuloPendiente nombre="Ventas" />} />
                            <Route path="/pagos" element={<ModuloPendiente nombre="Pagos" />} />

                        </Route>
                    </Route>

                    {/* Redirecciones generales */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}