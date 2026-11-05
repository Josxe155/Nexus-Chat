# Recuperación de Firestore y revisión previa al despliegue

27 de octubre de 2026.

## Recuperado y verificado

Se recuperaron las reglas de seguridad de Firestore del proyecto `nexus-chat-56d9d` en la base nueva `(default)`. La configuración publicada coincide con `firestore.rules`. También se recuperaron los índices de estados y contactos necesarios para las consultas existentes; ambos terminaron de prepararse.

Se conservaron las reglas actuales de Realtime Database. No se reconstruyeron perfiles, conversaciones, mensajes ni estados: la recuperación se limitó a la configuración, como pidió el usuario. Las cuentas existentes en Authentication no se eliminaron ni reemplazaron.

Comprobación de publicación: `verificacion-reglas-recuperadas.json`, junto al proyecto en la carpeta de entregables. El archivo confirma coincidencia de reglas e índices listos.

## Correcciones de esta revisión

- La carga de una sesión anterior no puede reemplazar la sesión más reciente cuando sus consultas terminan tarde.
- Se limpia la lista de chats y contactos al cambiar de cuenta para evitar mostrar información de la sesión anterior durante la carga.
- Los errores de sesión ofrecen tanto reintentar como cerrar sesión, evitando quedar atrapado en una pantalla de error.
- Los errores de Google, invitado y correo se muestran en español. No se copian al mensaje público detalles técnicos de errores desconocidos. Correo inexistente y contraseña incorrecta usan el mismo mensaje para evitar revelar la existencia de una cuenta.
- Se habilitó correo y contraseña en Firebase después de la autorización expresa del usuario. Se mantienen Google e invitados.
- La pantalla de error ya no promete que se conservarán los datos si el problema real fue una eliminación de la base de datos.
- La configuración de compilación ya no depende de una variable de directorio exclusiva de un cargador; también compila con el cargador alternativo de Vite.
- El backend permite los dos dominios concretos de Firebase Hosting del proyecto, conservando las restricciones de origen. No se abrió el acceso a cualquier origen.

## Comprobaciones

Se ejecutaron la revisión de tipos, la compilación de distribución, pruebas de mensajes de error de acceso, menús de grupo/contacto, gestión de miembros, invitaciones, llamadas y servicios del servidor. Los formularios se comprueban a varios anchos sin crear cuentas reales ni enviar mensajes reales. El acceso local, el servidor y el bloqueo de archivos privados también se comprueban.

Esta fue una revisión centrada en recuperación, acceso y preparación del despliegue. No equivale a certificar todas las funciones de una aplicación de mensajería en todos los navegadores.

## Pendientes antes de publicar en internet

1. Elegir dónde alojar el backend Node y disponer de su dirección HTTPS. Firebase Hosting por sí solo no ejecuta este servidor.
2. Configurar `VITE_API_BASE_URL` con esa dirección en `.env.production`. Es una dirección pública, nunca una clave. La tarea `npm run build:hosting` ya impide publicar con una dirección ausente o local.
3. Instalar las variables privadas, la credencial administrativa y el almacenamiento persistente de archivos en ese servidor. Nada de esto se incluye en el ZIP ni en la web. Los archivos y las suscripciones de notificaciones usan actualmente almacenamiento local del backend; no debe ser un disco efímero. Configurar también `PORT` y, cuando el alojamiento lo requiera, `HOST=0.0.0.0` detrás de HTTPS.
4. Revisar la política de contraseñas del proveedor antes de abrir el registro públicamente. El formulario exige 12 caracteres con letras y números; esa validación del formulario no sustituye una política equivalente aplicada por Firebase.
5. Hacer una prueba final entre dos dispositivos por HTTPS: acceso, mensajes, archivos, llamadas y notificaciones con la pestaña cerrada. Todavía no se ha publicado Hosting.

Los límites documentados en `REVISION-INTERFAZ-MODERACION.md` siguen vigentes, incluido que mensajes y archivos todavía no cuentan con cifrado de extremo a extremo.

## Mantenimiento

Las reglas y los índices recuperables están incluidos en el proyecto. Ante otra eliminación de Firestore se pueden volver a publicar con Firebase CLI, pero eso solo repone configuración: no recupera mensajes borrados. Para datos reales se necesita una estrategia de respaldo acordada antes de habilitar servicios con coste. No se activaron copias de pago ni se modificó la facturación.
