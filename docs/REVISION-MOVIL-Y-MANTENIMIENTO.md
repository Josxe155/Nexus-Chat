# Revisión de interfaz y mantenimiento

El HTML inicial y la comprobación de sesión muestran «Abriendo Nexus Chat». «Preparando tus conversaciones» y su porcentaje se reservan para después de confirmar una sesión autenticada. Una visita sin sesión desemboca en el formulario de acceso, sin anunciar una carga de chats.

| Apartado | Comportamiento verificado |
| --- | --- |
| Chat móvil | Campo con fondo y bordes redondeados reales; botón de voz o envío separado. |
| Nexus AI | Un único campo redondeado, sin capas rectangular y circular superpuestas. |
| Cabecera móvil | Título Nexus Chat, menú de tres puntos a la derecha y sin lupa junto al título. |
| Estados | Se consultan en Novedades. Chats no contiene una barra de estados ni gestos para desplegarla. Los anillos de las fotos mantienen su centro. |
| Permisos | Panel móvil con cámara, micrófono, notificaciones y ubicación; marcas solo para permisos concedidos. Cámara y micrófono se detienen tras comprobar el permiso. Sin almacenamiento ni selección de fotos. |
| Galería | El usuario selecciona fotos y videos con el selector del sistema; no hay acceso automático al álbum completo. Recientes locales limitados a 18 elementos y 40 MB. |
| Menús | Transiciones breves y respeto de movimiento reducido. Se retira Listas de difusión; las listas de organización de chats se conservan. |
| Perfiles | Vista rápida con mensaje, voz, video e información desde la foto de la lista. Dentro de un chat, foto y nombre abren directamente la información de contacto o grupo. |
| Mensajes temporales | Indicador centrado sobre la foto únicamente en listas de chats; ausente en vista rápida y cabecera. Duraciones con opciones seleccionables y aviso móvil legible. |
| Nexus AI | Acceso con símbolo vectorial propio y animación breve de entrada/interacción en móvil y escritorio. Respeta movimiento reducido y el ajuste de animaciones de Nexus. |
| Reproducción | Ondas calculadas al acercarse al área visible y suscripciones estables para audios inactivos. |

## Actualizaciones

Las actualizaciones se aplican solo tras pulsar Actualizar. El aviso de versión pendiente aparece automáticamente tanto en móvil como en computadora. Al cerrarlo queda un botón persistente para retomarlo. El panel también se abre desde Ajustes → Chats → Actualizaciones de Nexus Chat.

El contador mide bytes de archivos preparados a partir de sus cuerpos descargados, no bytes comprimidos facturados por la red. Se conservan archivos completos y fragmentos en Cache Storage. Al cancelar se guarda el fragmento y el contador; al continuar se omiten los archivos completos. Si un archivo estaba a medias, se vuelve a solicitar y se descarta su prefijo ya guardado: puede consumir tráfico de nuevo, pero ese prefijo no se cuenta dos veces. El navegador puede eliminar la caché por falta de espacio o al borrar los datos del sitio.

No se recarga durante una llamada, grabación o edición pendiente. Se verifica que la versión siga siendo la misma antes de aplicarla. La caché de actualización contiene recursos públicos de la web, sin mensajes ni archivos privados.

## Limpieza mensual

El plan mensual puede activarse desde `/dashboard.html`, limitado a la cuenta de Google autorizada. Se ejecuta en el navegador mientras el panel esté abierto; no existe un proceso de servidor ni una ejecución desde GitHub. Incluye revisión previa, confirmación manual y aviso de tres días. Consulta [DASHBOARD.md](DASHBOARD.md).

Actualización del panel: acceso alternativo por contraseña en la misma cuenta administradora, sesión separada para no interferir con Nexus, estadísticas del contenido conservado y actividad identificada desde la actualización. Los avisos de limpieza se limitan a la ventana de tres días, sin controles permanentes en la interfaz principal.
