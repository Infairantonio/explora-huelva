# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Instala solo deps de producción
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

# Copia el código
COPY . .

# Vars por defecto (compose las sobreescribe)
ENV NODE_ENV=production
ENV PORT=5174
ENV UPLOAD_DIR=/app/uploads

# Asegura carpeta de subidas
RUN mkdir -p /app/uploads

EXPOSE 5174
CMD ["node", "src/app.js"]