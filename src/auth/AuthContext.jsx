import { createContext, useContext, useState } from "react";
import { api, getError } from '../api/client.js';

//Creamos el contexto para compartir la autenticacion
const AuthContext = createContext(null);

//Componente que administra la sesion del usuario
export function AuthProvider({ children }) {
    //Obtenemos el token y el usuario guardados en el navegador
    const [token, setToken] = useState(() => sessionStorage.getItem('ecogestion_token'));
    const [username, setUsername] = useState(() => sessionStorage.getItem('ecogestion_token'));

    //Funcion para iniciar sesion
    async function login(usernameInput, password) {
        try{
            //Enviamos el usuario y la contrasena a Django    
            const { data } = await api.post('/token/', {
                username: usernameInput,
                password
            });

            //Verificamos que Django haya devuelto un token
            if (!data?.token) {
                throw new Error('El servidor no devolvio el token');
            }

            //Guardamos los dato de la seion en el navegador
            sessionStorage.setItem('ecogestion_token', data.token);
            sessionStorage.setItem('ecogestion_username', usernameInput);

            //Actualizamos el estado de react
            setToken(data.token);
            setUsername(usernameInput);
        }catch(error) {
            //Mostramos el error si no se puede iniciar sesion
            throw new Error(error.response ? getError(error) : error.message);
        }
    }

    //Funcion para cerrar sesion
    function logout() {
        //Eliminamos los datos guardados en el navegador
        sessionStorage.removeItem('ecogestion_token');
        sessionStorage.removeItem('ecogestion_username');

        //Limpiamos los datos del usuario
        setToken(null);
        setUsername('');
    }

    //Compartimos la informacion de la sesion con los componentes
    return(
        <AuthContext.Provider value = {{
            login,
            logout,
            token,
            username,
            isAuthenticated: Boolean(token)
        }}>
            {children}
        </AuthContext.Provider>
    );
}

//Permitir utilizar la autenticacion desde otros componentes
export const useAuth = () => useContext(AuthContext);