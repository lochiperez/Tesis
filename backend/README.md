# Backend API - Sistema de Gestión de Rutas e Incidentes

## Descripción
Backend en Node.js + Express + Firebase para la aplicación de gestión de rutas con reporte de incidentes.

## Configuración

### Variables de Entorno (.env)
Deberas crear las API de openweather en https://home.openweathermap.org/api_keys y la API de google maps en https://console.cloud.google.com
```env
PORT=4000
GOOGLE_MAPS_API_KEY=tu_api_key_aqui
OPENWEATHER_API_KEY=tu_api_key_aqui
```
### Variable firebase (key-firebase.json)
## 🚀 Configuración de Firebase (Obligatoria)

Este proyecto requiere una configuración previa de **Firebase**.  
Antes de iniciar la aplicación, debés crear un proyecto en Firebase y completar los datos necesarios.

---

### 1️⃣ Crear un proyecto en Firebase

1. Entrá a https://console.firebase.google.com  
2. Creá un nuevo proyecto.  
3. Activá **Firestore** y **Authentication** (si corresponde).

---

### 2️⃣ Registrar la aplicación web

1. En tu proyecto de Firebase, abrí **Configuración del proyecto** (ícono de ⚙️).  
2. En la sección **General**, bajá hasta **"Tus apps"**.  
3. Hacé clic en **“Agregar app Web (</>)”**.  
4. Copiá la configuración que te da Firebase, que luce similar a:

```key-firebase
{
  "type": "",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "",
  "token_uri": "",
  "auth_provider_x509_cert_url": "",
  "client_x509_cert_url": "",
  "universe_domain": ""
}
```
Deberas crear un archivo con el nombre "key-firebase.json" dentro de la carpeta "backend", y pegar ahi las credenciales de firebase.

### Instalación
```bash
npm install
```

### Ejecutar
```bash
node index.js
```

## Endpoints Disponibles

### 🔐 Autenticación y Usuarios

#### POST /api/usuarios/register
Registrar un nuevo usuario

**Request Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "telefono": "1234567890",
  "direccion": "Calle 123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "userId": "abc123",
  "user": {
    "id": "abc123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "telefono": "1234567890",
    "direccion": "Calle 123"
  }
}
```

**Errores:**
- 400: Email ya registrado
- 400: Campos requeridos faltantes
- 500: Error del servidor

---

#### POST /api/usuarios/login
Iniciar sesión

**Request Body:**
```json
{
  "email": "juan@example.com",
  "password": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": "abc123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "telefono": "1234567890",
    "direccion": "Calle 123"
  }
}
```

**Errores:**
- 400: Campos requeridos faltantes
- 404: Usuario no encontrado
- 401: Contraseña incorrecta
- 500: Error del servidor

---

#### GET /api/usuarios/profile?userId=abc123
Obtener perfil de usuario

**Query Parameters:**
- `userId` (required): ID del usuario

**Response (200):**
```json
{
  "id": "abc123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "telefono": "1234567890",
  "direccion": "Calle 123"
}
```

**Errores:**
- 400: userId requerido
- 404: Usuario no encontrado
- 500: Error del servidor

---

#### PUT /api/usuarios/profile?userId=abc123
Actualizar perfil de usuario

**Query Parameters:**
- `userId` (required): ID del usuario

**Request Body:**
```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez García",
  "email": "juan.perez@example.com",
  "telefono": "0987654321",
  "direccion": "Avenida 456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "user": {
    "id": "abc123",
    "nombre": "Juan Carlos",
    "apellido": "Pérez García",
    "email": "juan.perez@example.com",
    "telefono": "0987654321",
    "direccion": "Avenida 456"
  }
}
```

**Errores:**
- 400: userId requerido
- 400: Email ya en uso
- 404: Usuario no encontrado
- 500: Error del servidor

---

### 🚨 Incidentes

#### POST /api/incidents
Crear un nuevo incidente

**Request Body:**
```json
{
  "type": "bache",
  "lat": -34.6037,
  "lng": -58.3816,
  "description": "Bache grande en el carril derecho",
  "userId": "abc123"
}
```

**Tipos válidos:** `bache`, `accidente`, `corte`, `nieve`

**Response (201):**
```json
{
  "success": true,
  "message": "Incidente reportado exitosamente",
  "incident": {
    "id": "inc123",
    "type": "bache",
    "lat": -34.6037,
    "lng": -58.3816,
    "description": "Bache grande en el carril derecho",
    "userId": "abc123",
    "timestamp": "2025-11-23T13:00:00.000Z",
    "upvotes": 0,
    "downvotes": 0,
    "votes": {}
  }
}
```

**Errores:**
- 400: Campos requeridos faltantes
- 400: Tipo de incidente inválido
- 500: Error del servidor

---

#### GET /api/incidents
Obtener todos los incidentes

**Response (200):**
```json
[
  {
    "id": "inc123",
    "type": "bache",
    "lat": -34.6037,
    "lng": -58.3816,
    "description": "Bache grande",
    "userId": "abc123",
    "timestamp": "2025-11-23T13:00:00.000Z",
    "upvotes": 5,
    "downvotes": 1,
    "votes": {
      "user1": "up",
      "user2": "up"
    }
  }
]
```

---

#### GET /api/incidents/area?lat=-34.6037&lng=-58.3816&radius=5000
Obtener incidentes por área

**Query Parameters:**
- `lat` (required): Latitud del centro
- `lng` (required): Longitud del centro
- `radius` (required): Radio en metros

**Response (200):**
```json
[
  {
    "id": "inc123",
    "type": "bache",
    "lat": -34.6037,
    "lng": -58.3816,
    "description": "Bache grande",
    "upvotes": 5,
    "downvotes": 1
  }
]
```

**Errores:**
- 400: Parámetros requeridos faltantes
- 500: Error del servidor

---

### 👍👎 Sistema de Votación

#### POST /api/incidents/:id/upvote
Votar positivo en un incidente

**URL Parameters:**
- `id`: ID del incidente

**Request Body:**
```json
{
  "userId": "abc123"
}
```

**Response (200):**
```json
{
  "success": true,
  "upvotes": 6,
  "downvotes": 1,
  "userVote": "up"
}
```

**Comportamiento:**
- Si el usuario ya votó positivo → Remueve el voto
- Si el usuario votó negativo → Cambia a positivo
- Si no ha votado → Agrega voto positivo

**Errores:**
- 400: userId requerido
- 404: Incidente no encontrado
- 500: Error del servidor

---

#### POST /api/incidents/:id/downvote
Votar negativo en un incidente

**URL Parameters:**
- `id`: ID del incidente

**Request Body:**
```json
{
  "userId": "abc123"
}
```

**Response (200):**
```json
{
  "success": true,
  "upvotes": 5,
  "downvotes": 2,
  "userVote": "down"
}
```

**Comportamiento:**
- Si el usuario ya votó negativo → Remueve el voto
- Si el usuario votó positivo → Cambia a negativo
- Si no ha votado → Agrega voto negativo

---

#### DELETE /api/incidents/:id/vote
Remover voto de un incidente

**URL Parameters:**
- `id`: ID del incidente

**Request Body:**
```json
{
  "userId": "abc123"
}
```

**Response (200):**
```json
{
  "success": true,
  "upvotes": 5,
  "downvotes": 1,
  "userVote": null
}
```

---

### 🗺️ Google Maps

#### GET /maps-script
Obtiene el script de Google Maps con la API key

**Response:** Redirect a Google Maps API

---

### 🌤️ Clima

#### GET /api-weather
Obtiene la API key de OpenWeather

**Response (200):**
```json
{
  "key": "your_api_key"
}
```

---

## Estructura de Base de Datos (Firebase)

### Colección: Usuarios
```json
{
  "nombre": "string",
  "apellido": "string",
  "email": "string",
  "password": "string",
  "telefono": "string",
  "direccion": "string",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

### Colección: Incidentes
```json
{
  "type": "bache | accidente | corte | nieve",
  "lat": "number",
  "lng": "number",
  "description": "string",
  "userId": "string",
  "timestamp": "ISO 8601 timestamp",
  "upvotes": "number",
  "downvotes": "number",
  "votes": {
    "userId1": "up | down",
    "userId2": "up | down"
  }
}
```

---

## Códigos de Estado HTTP

- **200**: OK - Solicitud exitosa
- **201**: Created - Recurso creado exitosamente
- **400**: Bad Request - Datos inválidos o faltantes
- **401**: Unauthorized - Credenciales incorrectas
- **404**: Not Found - Recurso no encontrado
- **500**: Internal Server Error - Error del servidor

---

## Notas de Seguridad

⚠️ **IMPORTANTE**: En producción se debe:
- Hashear las contraseñas con bcrypt
- Implementar JWT para autenticación
- Validar y sanitizar todas las entradas
- Implementar rate limiting
- Usar HTTPS
- Agregar middleware de autenticación

---

## Testing

### Ejemplos con cURL:

**Registro:**
```bash
curl -X POST http://localhost:4000/api/usuarios/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","apellido":"Pérez","email":"juan@test.com","password":"123456"}'
```

**Login:**
```bash
curl -X POST http://localhost:4000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@test.com","password":"123456"}'
```

**Crear Incidente:**
```bash
curl -X POST http://localhost:4000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"type":"bache","lat":-34.6037,"lng":-58.3816,"description":"Bache grande"}'
```

**Votar Incidente:**
```bash
curl -X POST http://localhost:4000/api/incidents/inc123/upvote \
  -H "Content-Type: application/json" \
  -d '{"userId":"abc123"}'
```

---

## Autor
Sistema de Gestión de Rutas e Incidentes - 2025
