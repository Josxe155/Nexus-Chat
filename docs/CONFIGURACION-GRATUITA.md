> Documento histórico. La versión vigente se describe en [ACTUALIZACION-NEXUS.md](ACTUALIZACION-NEXUS.md).

> Revisión actual de escritorio y Nexus AI: consulta CAMBIOS-ESCRITORIO.md. Las claves de IA ya se incorporaron y ambos servicios respondieron en pruebas reales. Esta actualización sustituye las notas anteriores que indicaban claves pendientes o uso exclusivo de Ollama.

> Actualización móvil y backend: consulta CAMBIOS-MOVIL.md. Ahora npm run dev inicia también un backend y requiere npm --prefix server ci. Las funciones añadidas y los requisitos actuales están en ese documento.

# Configuración gratuita de Nexus Chat

La aplicación está preparada para nexus-chat-56d9d, RTDB https://nexus-chat-56d9d-default-rtdb.firebaseio.com/ y Firebase Authentication. La configuración pública del cliente no es una contraseña: la protección depende de Authentication y las reglas.

## Ejecutar

1. Instala Node.js y abre una terminal en esta carpeta.
2. Ejecuta npm ci y npm run dev.
3. Abre http://localhost:3000/. El servidor escucha en la red local en el puerto 3000.
4. npm run lint comprueba tipos; npm run build genera dist; npm run preview -- --host 0.0.0.0 --port 4173 permite ver dist.

## Activar Firebase

1. En la consola del proyecto, habilita Authentication con Google, Anónimo y Correo/contraseña. Configura el correo de soporte de Google y los dominios autorizados (incluido localhost para desarrollo). Configura también una política de contraseña del servidor acorde al mínimo del formulario.
2. Crea Firestore y Realtime Database si aún no existen. Revisa las reglas adjuntas antes de aplicarlas: son parte del control de acceso de estas funciones. No uses reglas públicas de prueba.
3. Con Firebase CLI autenticada en tu cuenta y el proyecto correcto, ejecuta firebase deploy --only firestore:rules,database --project nexus-chat-56d9d. Este paso cambia reglas remotas; no se ejecutó durante la revisión.
4. Prueba dos cuentas propias en perfiles separados, mensajes, permisos, llamadas y revocación de acceso. Los datos antiguos pueden no cumplir los nuevos esquemas: revísalos y migra con copia de seguridad, sin abrir las reglas para aceptarlos.
5. Si la consola solicita un índice para una consulta, crea únicamente el índice que corresponde a esa consulta. Mantén el proyecto dentro de cuotas y sin activar facturación si quieres evitar cargos. La app no contrata servicios de pago.
6. Para publicar, npm run build y firebase deploy --only hosting --project nexus-chat-56d9d. Publicación no realizada; no hay URL pública desplegada comprobada.

No habilites Cloud Storage para esta versión: los archivos se transfieren directamente. No existe garantía de almacenamiento gratuito ilimitado ni de entrega sin conexión.

## Llamadas y archivos

Permite cámara/micrófono. Para móviles y otros equipos utiliza HTTPS; HTTP por IP local no suele admitir estas funciones. Conecta dos usuarios, acepta la invitación y mantén las páginas abiertas. El receptor elige dónde guardar archivos grandes en Edge/Chrome de escritorio. En otros navegadores el límite de recepción es 100 MiB. Se almacena una caché local limitada; borrar datos del navegador borra esa caché.

Para redes restrictivas, configura un TURN que controles. Copia .env.example a .env.local y añade VITE_ICE_SERVERS con una lista JSON válida. Las variables VITE son públicas: no incluyas contraseñas permanentes de administración. Para producción hace falta un emisor confiable de credenciales TURN temporales. No hay un TURN de pago contratado ni garantía de conexión universal.

## IA local opcional

Instala Ollama por tu cuenta con un modelo local compatible, por ejemplo llama3.2. Permite explícitamente el origen de la página en OLLAMA_ORIGINS; evita permitir cualquier origen. En IA local configura http://127.0.0.1:11434 y el modelo descargado. Desde un móvil, localhost es el móvil: utiliza la IP privada del equipo con el motor y protege su acceso. Un sitio HTTPS puede bloquear acceso HTTP local; revisa los permisos y configuración segura de tu navegador.

Para imágenes instala Stable Diffusion WebUI con modelos y API local; autoriza únicamente el origen de Nexus y configura http://127.0.0.1:7860. La aplicación contiene el cliente, no instala ni arranca esos motores. No se probaron resultados de esos modelos. No se conecta con Meta AI. Modelos con sufijo :cloud y servidores públicos de IA se rechazan.

OCR descarga sus modelos de español/inglés al primer uso. Los GIF se buscan en Wikimedia Commons y muestran autor/licencia. Internet y la disponibilidad de esos servicios son necesarios.

Consulta ESTADO-FUNCIONES.md antes de presentar funciones avanzadas como terminadas. No hay E2EE, passkeys, biometría, visualización única ni bloqueo de capturas implementados.
