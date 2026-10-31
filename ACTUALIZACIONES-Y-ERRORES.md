> Estado vigente, 31/10/2026: se retiró el cifrado de extremo a extremo para mensajes y archivos nuevos por decisión del propietario. No se generan claves ni se requieren para conversar. Las referencias posteriores al cifrado automático describen versiones anteriores. Se conserva únicamente la lectura y la importación de copias del historial anterior, sin borrar datos. Consulta CIFRADO-Y-LLAMADAS.md.

# Actualizaciones y página de error

Las actualizaciones se aplican únicamente al pulsar Actualizar. Se comprueba la existencia de una versión nueva periódicamente, pero no se recarga automáticamente por detectar una nueva versión. El aviso muestra los bytes leídos de los archivos y su total real en MB. Los archivos que el navegador ya tenga en caché pueden prepararse inmediatamente. Si falla la conexión o cambia la versión durante la descarga, se ofrece volver a intentar. Una llamada, grabación o edición pendiente bloquea la actualización para evitar perder actividad.

La página de error es `public/error.html`. Es autónoma y se puede abrir con Live Server. Permite previsualizar variantes con `?mode=error`, `?mode=disabled` y `?mode=offline`; sin parámetro muestra mantenimiento.

Para activar mantenimiento en la web, cambia `public/availability.json` a `{"mode":"maintenance"}` y publica Hosting. Para deshabilitar su interfaz, usa `{"mode":"disabled"}`; para restablecerla, `{"mode":"online"}`. Se comprueba cada minuto. Esto controla la interfaz, no revoca sesiones ni sustituye las reglas de seguridad. Mantenimiento interrumpe la actividad abierta de la interfaz.

Los fallos de pantalla capturados por React muestran la página de error integrada. Si todo el servicio de alojamiento o la conexión dejan de responder, el navegador puede mostrar su propio error porque tampoco podría descargar error.html.

Llamadas: los menús de participantes, mano levantada, dispositivos y copia de enlace se limitan a grupos. Se elimina Enviar mensaje. Compartir pantalla exige activar primero la cámara propia; detener la compartición sigue disponible. El audio remoto se reproduce mediante un elemento de audio dedicado, separado del video, con un control explícito de activación si el navegador bloquea la reproducción automática. Los permisos y el volumen del sistema siguen siendo necesarios.

Validación: TypeScript, 18 comprobaciones de llamadas con WebRTC local y 6 del recorrido de actualización/error. No sustituye una comprobación física de altavoces y micrófonos en cada teléfono.

QR de enlaces: se generan localmente para Ajustes → Invitar amigos, invitaciones a grupos y enlaces de llamada. Se pueden guardar como PNG. Los enlaces conservan su autorización y caducidad; no sirven para vincular dispositivos ni contienen claves de cifrado. Se usa node-qrcode en el navegador, sin un servidor Node.js nuevo. La validación leyó tres QR con un lector independiente.

El panel de actualización muestra ahora la descarga de forma central y conserva brevemente la confirmación con el total real antes de recargar. Solo aparece al aceptar una versión pendiente. Una pestaña que aún ejecute el código antiguo puede requerir una recarga completa para recibir este comportamiento; no se deben borrar los datos del sitio para hacerlo. Esta entrega no modifica el sistema de cifrado ni las bases de datos.
