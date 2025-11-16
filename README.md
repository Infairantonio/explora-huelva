# Explora Huelva

Aplicación web desarrollada con **Node.js + Express**, **React (Vite)**,
**MongoDB** y **Docker**.\
Incluye API, frontend y base de datos, todo ejecutado mediante Docker
Compose usando **Caddy** como reverse proxy.

------------------------------------------------------------------------

## Tecnologías utilizadas

-   **Node.js + Express** --- API REST\
-   **React + Vite** --- Frontend\
-   **MongoDB** --- Base de datos NoSQL\
-   **Docker & Docker Compose**\
-   **Caddy** --- Reverse proxy en local\
-   **JWT** --- Autenticación\
-   **Mongoose** --- Modelado de datos

------------------------------------------------------------------------

## Estructura del proyecto

    explora-huelva/
    ├── backend/               # API Node + Express
    ├── frontend/              # Frontend React + Vite
    ├── Caddyfile              # Configuración de Caddy
    ├── docker-compose.yml     # Ejecución LOCAL
    └── docker-compose.prod.yml# Configuración de PRODUCCIÓN

------------------------------------------------------------------------

## Requisitos previos

-   **Docker Desktop** (Windows/Mac) o **Docker Engine** (Linux)\
-   **Git** (si se clona desde GitHub)

------------------------------------------------------------------------

## Configuración inicial

### 1. Clonar el repositorio

    git clone https://github.com/Infairantonio/explora-huelva.git
    cd explora-huelva

### 2. (Opcional) Archivos `.env`

Si existen `backend/.env.example` y `frontend/.env.example`, se pueden
copiar así:

    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env

> En la configuración actual, muchas variables ya están definidas
> directamente en `docker-compose.yml`.

------------------------------------------------------------------------

## Ejecución LOCAL con Docker

Desde la raíz del proyecto:

    docker compose up -d --build

### Servicios disponibles en LOCAL

  Servicio   URL
  ---------- ---------------------------
  Frontend   http://localhost
  API        http://localhost/api/...
  Caddy      Escucha en puertos 80/443

Para comprobar que la API responde:

    http://localhost/api/salud

Respuesta esperada:

    { "mensaje": "API funcionando correctamente" }

### Detener los contenedores

    docker compose down

------------------------------------------------------------------------

## Acceso a la base de datos (MongoDB)

La base de datos MongoDB corre en el contenedor:

-   **Contenedor:** `explora-mongo-1`\
-   **Usuario ROOT:** `admin`\
-   **Contraseña ROOT:** `pass`\
-   **Base de datos de la app:** `explora`

### 1. Entrar a MongoDB desde Docker (mongosh)

    docker exec -it explora-mongo-1 mongosh -u admin -p pass --authenticationDatabase admin

Una vez dentro del shell de MongoDB:

    use explora
    show collections
    db.usuarios.find()
    db.tarjetas.find()

### 2. Cadena de conexión usada por la API

    mongodb://admin:pass@mongo:27017/explora?authSource=admin

### 3. Volúmenes de datos utilizados

-   `explora-huelva_mongo_data` → Datos de MongoDB\
-   `explora-huelva_uploads_data` → Imágenes subidas por los usuarios

### 4. (Opcional) Acceso vía Mongo Express

Si se tiene un contenedor de **Mongo Express** levantado en local:

-   URL: `http://localhost:8081`\
-   Usuario: `admin`\
-   Contraseña: `pass`

------------------------------------------------------------------------

## Despliegue en PRODUCCIÓN

    docker compose -f docker-compose.prod.yml up -d --build

El archivo `docker-compose.prod.yml` incluye:

-   Caddy como reverse proxy con HTTPS\
-   API Node + Express\
-   MongoDB\
-   Frontend React ya compilado

------------------------------------------------------------------------

## Autor

**Antonio Romero**\
Proyecto académico -- Desarrollo de Aplicaciones Web (DAW)

------------------------------------------------------------------------

## Licencia

Proyecto creado para fines educativos y demostrativos.\
Puede reutilizarse para aprendizaje personal o pruebas técnicas.
