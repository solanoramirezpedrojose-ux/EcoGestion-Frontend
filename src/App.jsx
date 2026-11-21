import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from './pages/Dashboard.jsx';


//Componente para controlar el acceso a la pantalla de login
function LoginRoute() {
  //Consultamos si el usuario ya inicio sesion
  const { isAuthenticated } = useAuth();

  //Si esta autenticado lo enviamos al Dashboard
  //Si no esta autenticado mostramos el formulario de login
  return isAuthenticated ? <Navigate to="/dashboard" replace/> : <LoginPage/>
}

//Componente principal de EcoGestion
export default function App() {
  return(
    //Compartimos la sesion del usuario con toda la aplicacion 
    <AuthProvider>
      {/*Habilitamos la navegacion entre paginas*/}
      <BrowserRouter>
        <Routes>

          {/*Ruta publica para iniciar sesion*/}
          <Route path="/login" element={<LoginRoute/>}/>

          {/*Rutas que requieren iniciar sesion*/}
          <Route element={<ProtectedRoute/>}>
            {/*Pantalla principal del sistema*/}
            <Route path="/dashboard" element={<Dashboard/>}/>
          </Route>

          {/*Redirigimos la pagina inicial al dashboard*/}
          <Route path="/" element={<Navigate to="/dashboard" replace/>}/>

          {/*Redirigimos las rutas desconocidas*/}
          <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}