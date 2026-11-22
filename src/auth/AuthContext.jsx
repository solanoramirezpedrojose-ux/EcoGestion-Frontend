import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Creamos el contexto para compartir los datos del usuario
const AuthContext = createContext(null);

// Componente que administra la autenticación del sistema
export function AuthProvider({ children }) {
    // Recuperamos la sesión que está guardada en el navegador
    const [token, setToken] = useState(sessionStorage.getItem('ecogestion_token') || '');
    const [username, setUsername] = useState(sessionStorage.getItem('ecogestion_username') || '');

    // Guardamos la información y permisos del usuario
    const [perfil, setPerfil] = useState(null);
    const [cargandoPerfil, setCargandoPerfil] = useState(Boolean(token));

    // Consultamos los permisos cuando existe un token
    useEffect(() => {
        if (!token) {
            setPerfil(null);
            setCargandoPerfil(false);
            return;
        }

        let vigente = true;

        async function cargarPerfil() {
            setCargandoPerfil(true);
            try {
                // Solicitamos los grupos y permisos a Django
                const { data } = await api.get('/usuario/');

                if (vigente) {
                    setPerfil(data);
                    setUsername(data.username);
                    sessionStorage.setItem('ecogestion_username', data.username);
                }
            } catch (err) {
                if (vigente) {
                    setPerfil(null);

                    // Si el token no es válido, cerramos la sesión
                    if (err.response?.status === 401) {
                        sessionStorage.removeItem('ecogestion_token');
                        sessionStorage.removeItem('ecogestion_username');
                        setToken('');
                        setUsername('');
                    }
                }
            } finally {
                if (vigente) {
                    setCargandoPerfil(false);
                }
            }
        }

        cargarPerfil();

        return () => {
            vigente = false;
        };
    }, [token]);

    // Iniciamos sesión utilizando el endpoint de Django
    async function login(usernameInput, password) {
        const { data } = await api.post('/token/', {
            username: usernameInput,
            password: password
        });

        // Guardamos el token y el nombre de usuario
        sessionStorage.setItem('ecogestion_token', data.token);
        sessionStorage.setItem('ecogestion_username', usernameInput);

        setPerfil(null);
        setCargandoPerfil(true);
        setToken(data.token);
        setUsername(usernameInput);

        return data;
    }

    // Cerramos la sesión y eliminamos los datos guardados
    function logout() {
        sessionStorage.removeItem('ecogestion_token');
        sessionStorage.removeItem('ecogestion_username');

        setToken('');
        setUsername('');
        setPerfil(null);
        setCargandoPerfil(false);
    }

    // Comprobamos si el usuario tiene un permiso específico
    function tienePermiso(permiso) {
        return perfil?.permisos?.includes(permiso) || false;
    }

    // Compartimos los datos de autenticación con React
    return (
        <AuthContext.Provider value={{
            token,
            username,
            perfil,
            grupos: perfil?.grupos || [],
            cargandoPerfil,
            isAuthenticated: Boolean(token),
            login,
            logout,
            tienePermiso
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// Función para utilizar la autenticación en otros componentes
export function useAuth() {
    return useContext(AuthContext);
}