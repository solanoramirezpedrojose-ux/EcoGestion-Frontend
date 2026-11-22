# EcoGestión - Frontend
## 1. Descripción del proyecto
EcoGestión es una aplicación web para administrar las operaciones de un centro de acopio y reciclaje.

El sistema permite gestionar personas, materiales reciclables, recolecciones, ventas y pagos desde una interfaz desarrollada con React.

Este frontend corresponde al Proyecto 2 del curso Desarrollo de Software IV (IF0009) de la Universidad de Costa Rica, Sede del Pacífico.

La aplicación consume la API REST desarrollada anteriormente con Django REST Framework y MySQL en el Proyecto 1.

## 2. Tecnologías utilizadas
### Frontend
- React
- Vite
- JavaScript
- React Router
- Bootstrap 5
- Bootstrap Icons
- Axios
- HTML y CSS

### Backend
- Python 3.13
- Django 5.2
- Django REST Framework
- MySQL
- TokenAuthentication
- django-cors-headers

### Herramientas
- Visual Studio Code
- Git y GitHub
- GitHub Desktop
- MySQL Workbench
- Navegador web

## 3. Módulos del sistema
### Dashboard
Pantalla principal que presenta información general del sistema.

Incluye tres indicadores obtenidos de la API:
- Personas registradas.
- Materiales registrados.
- Ventas registradas.

### Personas
Permite administrar proveedores y compradores.

Funcionalidades:
- Registrar personas.
- Consultar personas.
- Editar información.
- Eliminar registros, según los permisos.
- Identificar personas activas e inactivas.
- Validar que la identificación sea única.

Los tipos de persona disponibles son PROVEEDOR, COMPRADOR y AMBOS.

### Inventario
Permite administrar los materiales reciclables.

Funcionalidades:
- Registrar materiales.
- Consultar, editar y eliminar materiales.
- Filtrar por categoría y estado.
- Buscar materiales por nombre.
- Ordenar por nombre y precio.
- Paginar los resultados.

El stock se actualiza mediante las recolecciones y ventas confirmadas, no directamente desde el formulario de materiales.

### Recolecciones
Permite registrar los materiales recibidos de los proveedores.

Funcionalidades:
- Registrar, consultar, editar y eliminar recolecciones.
- Seleccionar proveedores registrados.
- Agregar, editar y eliminar detalles de materiales.
- Registrar las cantidades en kilogramos.
- Filtrar por proveedor y estado.
- Consultar resultados paginados.
- Confirmar o cancelar recolecciones pendientes.

Estados:
- PENDIENTE
- RECIBIDA
- CANCELADA

Al confirmar una recolección, Django aumenta automáticamente el stock de los materiales correspondientes.

### Ventas
Permite administrar las ventas de materiales reciclables.

Funcionalidades:
- Registrar, consultar, editar y eliminar ventas.
- Seleccionar compradores.
- Agregar materiales, cantidades y precios unitarios.
- Consultar subtotales y el total calculado por Django.
- Filtrar ventas por comprador y estado.
- Confirmar o anular ventas pendientes.

Estados:
- PENDIENTE
- CONFIRMADA
- ANULADA

Al confirmar una venta, Django verifica las existencias y descuenta las cantidades vendidas del inventario.

### Pagos
Permite administrar los pagos relacionados con las ventas confirmadas.

Funcionalidades:
- Registrar, consultar, editar y eliminar pagos.
- Seleccionar ventas confirmadas.
- Registrar pagos parciales.
- Consultar el saldo pendiente.
- Evitar que los pagos superen el total de la venta.
- Filtrar por venta, comprador y método de pago.

Métodos disponibles:
- EFECTIVO
- TRANSFERENCIA
- SINPE

El monto de un pago existente puede actualizarse, siempre que la suma de los pagos no supere el total de la venta.

## 4. Requisitos previos
Para ejecutar el proyecto se necesita:

- Node.js y npm instalados.
- Python instalado.
- MySQL Server funcionando.
- Una base de datos MySQL configurada para EcoGestión.
- El backend de Django del Proyecto Integrador 1.
- Visual Studio Code o un editor equivalente.
- Acceso a una terminal.
Es necesario ejecutar el backend y el frontend al mismo tiempo para utilizar todas las funcionalidades.

## 5. Instalación del frontend
### 5.1. Obtener el proyecto
Clonar el repositorio desde GitHub o descargar el código fuente.

Abrir la carpeta EcoGestion-Frontend en Visual Studio Code.

### 5.2. Instalar dependencias
Desde la terminal, ejecutar:

```powershell
npm install
```

Este comando instala las dependencias especificadas en package.json y package-lock.json.

### 5.3. Configurar variables de entorno
El proyecto utiliza la variable VITE_API_URL para indicar la dirección del backend.

Crear un archivo llamado .env a partir de .env.example.

Contenido:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

La dirección debe corresponder al servidor Django que se esté ejecutando.

No subir el archivo .env real al repositorio.

### 5.4. Ejecutar el frontend
Ejecutar:

```powershell
npm run dev
```

Abrir en el navegador:

http://localhost:5173/

### 5.5. Generar versión de producción
Ejecutar:

```powershell
npm run build
```

Vite generará los archivos de compilación en la carpeta dist.

Esta carpeta no debe incluirse en el repositorio.

## 6. Ejecución del backend Django
El backend se encuentra en el proyecto EcoGestión desarrollado en el Proyecto Integrador 1.

### 6.1. Abrir el proyecto Django
Abrir otra terminal en la carpeta del backend, donde se encuentra manage.py.

### 6.2. Crear el entorno virtual
```powershell
py -m venv .venv
```

Activar el entorno virtual en Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 6.3. Instalar dependencias
```powershell
python -m pip install -r requirements.txt
```

El backend también necesita django-cors-headers, utilizado para permitir la comunicación con React.

Esta dependencia debe estar incluida en el requirements.txt actualizado del backend.

### 6.4. Configurar MySQL
Crear el archivo .env del backend a partir de su .env.example.

Configurar las variables:

```env
DB_NAME=ecogestion_db
DB_USER=usuario_mysql
DB_PASSWORD=contrasena_mysql
DB_HOST=localhost
DB_PORT=3306
```

Reemplazar los valores de ejemplo por la configuración local de MySQL.

### 6.5. Aplicar migraciones
```powershell
python manage.py migrate
```

Si se necesita crear un administrador:

```powershell
python manage.py createsuperuser
```

### 6.6. Ejecutar el servidor
```powershell
python manage.py runserver
```

El backend estará disponible en:

http://127.0.0.1:8000/

Panel de administración:

http://127.0.0.1:8000/admin/

## 7. Configuración CORS

Como React y Django se ejecutan en puertos diferentes, el backend utiliza django-cors-headers.

En settings.py se debe tener configurada la aplicación corsheaders y su middleware correspondiente.

Los orígenes permitidos para desarrollo son:

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
```
Esto permite que React realice solicitudes HTTP al backend desde el navegador.

## 8. Autenticación
EcoGestión utiliza la autenticación mediante tokens de Django REST Framework.

El inicio de sesión envía las credenciales a:

POST /api/token/

Si son correctas, Django devuelve un token de autenticación.

React guarda el token en sessionStorage y lo incorpora automáticamente a las solicitudes mediante Axios.

Encabezado utilizado:

```text
Authorization: Token TOKEN_DEL_USUARIO
```

El contexto AuthContext permite compartir la información de autenticación entre las pantallas.

### Cierre de sesión
Al presionar Salir:
- Se elimina el token de sessionStorage.
- Se limpian los datos de la sesión local.
- El usuario regresa a la pantalla de Login.
- Las rutas privadas dejan de estar disponibles.

El cierre de sesión elimina el acceso local, pero no revoca automáticamente el token en Django.

El backend utilizado no dispone de un endpoint de revocación de tokens. Esta es una limitación conocida del sistema.

## 9. Perfiles y permisos
El sistema utiliza los grupos y permisos de Django.

Los perfiles contemplados son:
- Administrador
- Operador
- Consulta

El frontend consulta la información del usuario autenticado mediante:

GET /api/usuario/

Este endpoint devuelve el nombre, los grupos y los permisos efectivos del usuario.
Los botones se muestran según los permisos recibidos.

### Matriz de perfiles
| Operación | Administrador | Operador | Consulta |
|---|---|---|---|
| Consultar registros | Sí | Sí | Sí |
| Registrar | Sí | Sí | No |
| Editar | Sí | Sí | No |
| Eliminar | Sí | No | No |
| Confirmar recolecciones | Sí | Sí | No |
| Cancelar recolecciones | Sí | Sí | No |
| Confirmar ventas | Sí | Sí | No |
| Anular ventas | Sí | Sí | No |
| Registrar pagos | Sí | Sí | No |
Los permisos efectivos dependen de la configuración del usuario y sus grupos en Django.
La autorización real se realiza en el backend. Ocultar botones en React no reemplaza las validaciones de seguridad del servidor.

## 10. Navegación y diseño
La aplicación utiliza React Router para cambiar entre los módulos sin recargar completamente la página.

Las rutas principales son:
| Ruta | Pantalla |
|---|---|
| /login | Inicio de sesión |
| /dashboard | Dashboard |
| /personas | Personas |
| /inventario | Inventario |
| /recolecciones | Recolecciones |
| /ventas | Ventas |
| /pagos | Pagos |
La aplicación utiliza un diseño adaptable con Bootstrap 5 y CSS personalizado.
La navegación principal se encuentra en una barra horizontal superior que contiene:
- Logo y nombre EcoGestión.
- Acceso a los seis apartados.
- Nombre del usuario autenticado.
- Botón para cerrar sesión.
En pantallas pequeñas, la navegación permite desplazamiento horizontal.

## 11. Endpoints utilizados
Todas las solicitudes utilizan la URL base configurada en VITE_API_URL.

### Autenticación
| Método | Endpoint | Función |
|---|---|---|
| POST | /api/token/ | Obtener token |
| GET | /api/usuario/ | Consultar usuario y permisos |

### Personas
| Método | Endpoint | Función |
|---|---|---|
| GET, POST | /api/personas/ | Listar y registrar |
| GET, PUT, DELETE | /api/personas/{id}/ | Consultar, editar y eliminar |

### Inventario
| Método | Endpoint | Función |
|---|---|---|
| GET, POST | /api/materiales/ | Listar y registrar |
| GET, PUT, DELETE | /api/materiales/{id}/ | Consultar, editar y eliminar |
Parámetros de consulta:
- categoria
- activo
- buscar
- orden
- page

### Recolecciones
| Método | Endpoint | Función |
|---|---|---|
| GET, POST | /api/recolecciones/ | Listar y registrar |
| GET, PUT, DELETE | /api/recolecciones/{id}/ | Consultar, editar y eliminar |
| POST | /api/recolecciones/{id}/confirmar/ | Confirmar |
| POST | /api/recolecciones/{id}/cancelar/ | Cancelar |
| GET, POST | /api/recolecciones/detalles/ | Consultar y agregar materiales |
| GET, PUT, DELETE | /api/recolecciones/detalles/{id}/ | Administrar un detalle |

Parámetros de consulta del listado:
- estado
- proveedor
- page

### Ventas
| Método | Endpoint | Función |
|---|---|---|
| GET, POST | /api/ventas/ | Listar y registrar |
| GET, PUT, DELETE | /api/ventas/{id}/ | Consultar, editar y eliminar |
| POST | /api/ventas/{id}/confirmar/ | Confirmar |
| POST | /api/ventas/{id}/anular/ | Anular |
| GET, POST | /api/ventas/detalles/ | Consultar y agregar materiales |
| GET, PUT, DELETE | /api/ventas/detalles/{id}/ | Administrar un detalle |

Parámetros de consulta del listado:
- estado
- comprador

### Pagos
| Método | Endpoint | Función |
|---|---|---|
| GET, POST | /api/pagos/ | Listar y registrar |
| GET, PUT, DELETE | /api/pagos/{id}/ | Consultar, editar y eliminar |

Parámetros de consulta:
- venta
- comprador
- metodo_pago

### Códigos de respuesta
- 200: solicitud exitosa.
- 201: registro creado.
- 204: eliminación exitosa.
- 400: datos inválidos o regla de negocio incumplida.
- 401: usuario sin autenticación.
- 403: usuario sin permisos.
- 404: registro o ruta inexistente.
- 409: conflicto con una regla de negocio o registros relacionados.
Los formularios muestran los errores recibidos desde Django mediante una función común de manejo de errores.

## 12. Organización del frontend
El proyecto se encuentra organizado en carpetas según su responsabilidad.
```text
EcoGestion-Frontend/
├── public/
├── src/
│   ├── api/
│   │   └── client.js
│   ├── assets/
│   ├── auth/
│   │   ├── AuthContext.jsx
│   │   └── ProtectedRoute.jsx
│   ├── components/
│   │   ├── AppLayout.jsx
│   │   ├── AppLayout.css
│   │   ├── FormPersona.jsx
│   │   ├── FormMaterial.jsx
│   │   ├── FormRecoleccion.jsx
│   │   ├── DetallesRecoleccion.jsx
│   │   ├── FormVenta.jsx
│   │   ├── DetallesVenta.jsx
│   │   └── FormPago.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Personas.jsx
│   │   ├── Inventario.jsx
│   │   ├── Recolecciones.jsx
│   │   ├── Ventas.jsx
│   │   └── Pagos.jsx
│   ├── services/
│   │   ├── dashboardService.js
│   │   ├── personasService.js
│   │   ├── inventarioService.js
│   │   ├── recoleccionesService.js
│   │   ├── ventasService.js
│   │   └── pagosService.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── Evidencias.docx
├── PRUEBAS.md
├── package.json
├── package-lock.json
└── README.md
```
Las pantallas específicas cuentan también con sus archivos CSS correspondientes.

## 13. Pruebas realizadas
Se realizaron pruebas manuales para comprobar la integración entre React y Django.
Se verificaron escenarios de:
- Inicio de sesión correcto e incorrecto.
- Cierre de sesión.
- Protección de rutas privadas.
- Registro y consulta de información.
- Validaciones de campos duplicados.
- Restricciones de permisos.
- Búsqueda, filtros y ordenamiento.
- Paginación.
- Confirmación de recolecciones.
- Aumento del stock.
- Confirmación de ventas.
- Disminución del stock.
- Registro y validación de pagos parciales.
Los resultados se encuentran documentados en PRUEBAS.md.
Las capturas correspondientes se encuentran en el documento de evidencias del proyecto.

## 14. Manejo de errores
Se implementó una función general getError() en el cliente HTTP.
Su propósito es interpretar los errores de Django y mostrar mensajes entendibles al usuario.
El sistema contempla:
- Errores de conexión.
- Campos obligatorios.
- Registros duplicados.
- Datos inválidos.
- Restricciones de negocio.
- Falta de autenticación.
- Permisos insuficientes.
- Registros inexistentes.
- Conflictos al modificar o eliminar información.
Las validaciones del frontend complementan las reglas de Django, pero no las sustituyen.

## 15. Trabajo colaborativo
El frontend fue desarrollado utilizando Git y GitHub Desktop.
Se utilizaron ramas de trabajo para organizar los cambios.
Distribución principal:

### Stacy
- Estructura inicial del frontend.
- Navegación y autenticación inicial.
- Dashboard.
- Módulo de Personas.
- Módulo de Inventario.

### Pedro
- Módulo de Recolecciones.
- Módulo de Ventas.
- Módulo de Pagos.
- Integración de permisos en React.
- Rediseño de la navegación.
- Pruebas y documentación final.
Se utilizaron commits, sincronización de ramas y revisiones para integrar las funcionalidades.

## 16. Limitaciones
- El frontend necesita que el servidor Django y MySQL estén funcionando.
- El sistema está configurado para desarrollo local.
- Los usuarios y permisos deben configurarse en Django.
- El cierre de sesión limpia el token del navegador, pero no lo revoca en el servidor.
- La información del sistema proviene de la API REST; no se utiliza almacenamiento local como base de datos del negocio.
- Para utilizar el sistema desde otra computadora se debe configurar la dirección de la API y los orígenes permitidos en CORS.