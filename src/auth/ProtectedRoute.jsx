import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

//Componente para proteger las rutas privadas del sistema
export default function ProtectedRoute() {
    //Consultamos si el usuario ha iniciado sesion
    const { isAuthenticated } = useAuth();

    //Si tiene sesion mostrmos la pagina, si no lo enviamos al login
    return isAuthenticated ? <Outlet/> : <Navigate to="/login" replace/>;
}