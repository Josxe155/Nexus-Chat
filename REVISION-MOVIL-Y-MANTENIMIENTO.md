# Revisión de interfaz y mantenimiento

| Apartado | Comportamiento verificado |
| --- | --- |
| Chat móvil | Campo con fondo y bordes redondeados reales; botón de voz o envío separado. |
| Nexus AI | Un único campo redondeado, sin capas rectangular y circular superpuestas. |
| Cabecera móvil | Menú accesible desde el título; se retiran búsqueda y tres puntos junto al nombre principal. |
| Estados | Plegados al entrar, con avatares compactos de estados disponibles. Un gesto desde el inicio de la lista o un toque los despliega. |
| Permisos | Revisión inicial en móvil y reapertura desde Ajustes → Chats. Cámara y micrófono se detienen tras comprobar el permiso. |
| Galería | El usuario selecciona fotos y videos con el selector del sistema; no hay acceso automático al álbum completo. Recientes locales limitados a 18 elementos y 40 MB. |
| Menús | Transiciones breves y respeto de movimiento reducido. Botones de reordenación de encuestas separados. |
| Reproducción | Ondas calculadas al acercarse al área visible y suscripciones estables para audios inactivos. |

## Actualizaciones

Las actualizaciones se aplican solo tras pulsar Actualizar. En móvil, el panel se abre desde Ajustes → Chats → Actualizaciones de Nexus Chat. En computadora permanece disponible el aviso de versión pendiente.

El contador mide bytes de archivos preparados a partir de sus cuerpos descargados, no bytes comprimidos facturados por la red. Se conservan archivos completos y fragmentos en Cache Storage. Al cancelar se guarda el fragmento y el contador; al continuar se omiten los archivos completos. Si un archivo estaba a medias, se vuelve a solicitar y se descarta su prefijo ya guardado: puede consumir tráfico de nuevo, pero ese prefijo no se cuenta dos veces. El navegador puede eliminar la caché por falta de espacio o al borrar los datos del sitio.

No se recarga durante una llamada, grabación o edición pendiente. Se verifica que la versión siga siendo la misma antes de aplicarla. La caché de actualización contiene recursos públicos de la web, sin mensajes ni archivos privados.

## Limpieza mensual

Preparación sin activar. Se revisó el motor con datos de prueba y una simulación de solo lectura en Firebase; no se ejecutaron borrados. No se utiliza GitHub para ejecutarlo. La programación exclusivamente en Firebase requiere decidir sobre Blaze; no se ha habilitado facturación. Véase [maintenance/README.md](maintenance/README.md).

La regla de `publicConfig/cleanup` permite leer el aviso a cuentas autorizadas, pero impide que un cliente lo escriba, active o elimine. Las demás restricciones de Firestore y Realtime Database permanecen vigentes, sin una fecha global de caducidad.
