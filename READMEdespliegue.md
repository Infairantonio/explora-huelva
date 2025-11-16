# Despliegue de Explora Huelva

Este documento describe **cómo se ha desplegado la aplicación Explora Huelva** en un servidor real utilizando Docker, Docker Compose y Caddy con HTTPS automático.

---

## 📌 Información general del despliegue

La aplicación completa está funcionando en producción en:

👉 **https://explorahuelva.es**

El sistema incluye:

- API Node.js (Express)
- Frontend React + Vite (compilado)
- MongoDB con volumen persistente
- Caddy como reverse proxy con certificados SSL automáticos
- Docker & Docker Compose

Todo el proyecto funciona usando contenedores aislados que se comunican entre sí mediante una red interna de Docker.

---

## 🧱 Arquitectura en producción

```
Servidor Ubuntu (VPS)
│
├── Caddy (HTTPS, Reverse Proxy)
│     ├── Redirige tráfico público al API y al Frontend
│     └── Renueva certificados de Let's Encrypt automáticamente
│
├── API Node.js (Contenedor Docker)
│     └── Disponible en https://explorahuelva.es/api
│
├── Frontend React compilado (Nginx dentro de Docker)
│     └── Disponible en https://explorahuelva.es
│
└── MongoDB (Contenedor Docker)
      ├── Usuario: admin
      ├── Contraseña: pass
      └── Base de datos: explora
```

---

## 🚀 Proceso de despliegue

### 1️⃣ Copiar el proyecto al servidor

El repositorio se subió al servidor mediante Git o SFTP:

```
git clone https://github.com/Infairantonio/explora-huelva.git
cd explora-huelva
```

---

### 2️⃣ Crear archivo de configuración de producción

El servidor usa:

```
docker-compose.prod.yml
```

Este archivo define:

- Caddy (puertos 80 y 443)
- API Node.js
- Frontend React compilado
- MongoDB

---

### 3️⃣ Levantar la aplicación en producción

Desde el servidor:

```
docker compose -f docker-compose.prod.yml up -d --build
```

Esto:

- Construye el frontend (Vite build)
- Construye la API
- Inicia MongoDB
- Configura Caddy con HTTPS real
- Publica el sitio en Internet

---

## 🔒 Seguridad aplicada

- MongoDB NO está expuesto a Internet, solo accesible internamente desde Docker.
- Caddy gestiona automáticamente HTTPS + renovaciones de certificados.
- Las imágenes subidas se guardan en un volumen persistente:
  - `explora-huelva_uploads_data`
- La base de datos se persiste en:
  - `explora-huelva_mongo_data`

---

## 🔍 Verificación del estado tras el despliegue

### API funcionando
```
https://explorahuelva.es/api/salud
```

### Frontend funcionando
```
https://explorahuelva.es
```

### Ver contenedores en el servidor
```
docker ps
```

### Ver logs de Caddy
```
docker logs explora-caddy-1
```

### Acceder a la base de datos
```
docker exec -it explora-mongo-1 mongosh -u admin -p pass --authenticationDatabase admin
```

---

## 📁 Volúmenes creados

| Volumen                          | Uso                         |
|----------------------------------|------------------------------|
| explora-huelva_mongo_data        | Datos de MongoDB            |
| explora-huelva_uploads_data      | Imágenes subidas             |

---

## 🧑‍💻 Autor

**Antonio Romero**  
Proyecto desplegado correctamente en servidor real con Docker.

---

## 📄 Licencia

Uso educativo y demostrativo.
