# 🚀 GLAMOURS Web Store - Despliegue en Producción

Este proyecto está listo para ser subido a la web. Sigue estos sencillos pasos para publicarlo en un servicio gratuito de alojamiento como **Render** o **Railway**.

## Archivos Críticos Preparados
- **`package.json`**: Se ha configurado el comando `"start": "node server.js"`.
- **`.gitignore`**: Evita subir contraseñas o archivos pesados a la nube.
- **`.env.example`**: Archivo de muestra para configurar tus claves secretas (Firebase, Stripe, Twilio) en el servidor final.
- **Frontend Listo**: Todos los archivos públicos están en la carpeta `public/`.

## Paso a Paso para Subir a la Web (Ejemplo con Render)

### 1. Sube tu código a GitHub
1. Crea una cuenta en [GitHub](https://github.com/).
2. Instala [Git](https://git-scm.com/) en tu computadora.
3. Abre una terminal en la carpeta del proyecto y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Primera versión lista para producción"
   ```
4. Sigue las instrucciones de GitHub para subir este repositorio.

### 2. Despliega en Render (Plataforma recomendada para Node.js)
1. Crea una cuenta gratuita en [Render](https://render.com/).
2. Haz clic en **"New +"** y selecciona **"Web Service"**.
3. Conecta tu cuenta de GitHub y selecciona el repositorio de `Glamours`.
4. Configuración del servicio:
   - **Name:** glamours-store (o el que prefieras).
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Variables de Entorno (Environment Variables):**
   Abre la sección "Advanced" e ingresa las variables que están en tu archivo `.env.example`.
6. Haz clic en **"Create Web Service"**.

¡Listo! En un par de minutos, Render te proporcionará un enlace oficial (ej: `https://glamours-store.onrender.com`) que podrás compartir con tus clientes.

---

### Notas de Producción
- **Base de datos (Firestore):** Recuerda reemplazar el arreglo `mockProducts` en `server.js` y descomentar el bloque de inicialización de Firebase cuando obtengas tus credenciales de Google Firebase.
- **Pagos (Stripe):** Cambia tu `STRIPE_SECRET_KEY` en el panel de Render por tu clave de producción.
- **WhatsApp (Twilio):** Para enviar mensajes reales, no olvides actualizar tu número de Twilio y añadir saldo.
