# Nexus Chat · revisión de escritorio

Las quince capturas del usuario se usaron como guía de diseño y navegación. No se copiaron sus conversaciones, personas, archivos, estados, canales ni imágenes. Las capturas de verificación utilizan datos ficticios en un entorno local de pruebas.

## Distribución

El escritorio conserva su barra lateral. Llamadas, Estados, Canales y Comunidades tienen una lista izquierda y un panel derecho con acciones reales. Al cambiar de sección cambian ambos paneles. Las columnas se ajustan entre 1024 y 1366 píxeles sin recortar el contenido.

Canales dispone de un acceso propio. Las difusiones siguen disponibles en el menú de chats. Archivados conserva su lista lateral, explica que los chats permanecen archivados y permite desarchivarlos desde su menú; no repite los filtros de la lista principal. El botón de archivados de escritorio sigue separado del acceso de móvil.

Nexus AI conserva una lista de conversaciones a su izquierda y el formulario de escritura a la derecha. Su acceso es una función de Nexus; no se creó una cuenta ficticia de contacto en la base de datos. La bienvenida del chat ofrece documento, contacto, invitación y Nexus AI. Enviar un documento abre las notas propias y las opciones de adjuntar.

## Portapapeles

- Ctrl+V o el pegado de imágenes abre la revisión de archivos del chat, con miniatura y nombre. No envía la imagen automáticamente. Se admite el mismo límite de diez archivos por selección.
- En el visor de una imagen, Ctrl+C copia una representación PNG. El menú del mensaje y los visores ofrecen también Copiar imagen. Se admiten Ctrl y la tecla equivalente de macOS.
- La copia y el pegado normales de texto permanecen bajo el control del navegador. No se interceptan si se está editando texto o hay texto seleccionado.
- El chat no lee el portapapeles en segundo plano. Utiliza el contenido que el navegador entrega al pegar o la imagen que el usuario solicita copiar.
- La copia de imágenes depende de una conexión segura, la compatibilidad del navegador y sus permisos. En localhost está disponible; en una dirección de red local por HTTP puede no estarlo. Para imágenes externas se necesita además que el origen permita su lectura. Descargar sigue disponible como alternativa.

Referencias técnicas: [Clipboard API de MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) y [portapapeles de WebKit](https://webkit.org/blog/10855/async-clipboard-api/). Las pruebas no inspeccionaron el contenido anterior del portapapeles del usuario: utilizaron imágenes generadas localmente para comprobar los eventos de pegado, el atajo y la preparación de PNG.

## Menús compartidos

El menú de chats incorpora selección múltiple, archivado y borrado personal de la selección. Todos, No leídos y Favoritos quedan visibles en escritorio; Grupos y listas personalizadas se encuentran en el desplegable. El menú de una conversación permite fijar, archivar, añadir a favoritos o a listas, silenciar, marcar su lectura, bloquear un contacto, vaciar y eliminar para mí.

El menú del chat añade búsqueda, favoritos, listas, temporales y cerrar chat. El mismo diálogo de silenciamiento permite ocho horas, una semana, siempre o reactivar. Las listas utilizan el mismo documento privado de la configuración. La duración temporal se aplica a los mensajes nuevos; en grupos y canales solo se ofrece a administradores. Se conservan respuesta, edición de quince minutos, información de entrega, reenvío y borrado para todos.

Pregúntale a Nexus AI prepara un borrador con el mensaje elegido y abre el asistente. El usuario revisa ese borrador y decide enviarlo. No se lo envía automáticamente a un proveedor.

El clip incluye Documento, Fotos y videos, Cámara, Audio, Contacto, Encuesta, Evento y Nuevo sticker. Evento comparte un archivo de calendario de una hora con nombre, descripción y fecha; no se presenta como un sistema de asistencia o votación que no está implementado.

Emojis dispone de categorías visuales, búsqueda, recientes y navegación de teclado que se ajusta al número de columnas. GIF y stickers permiten buscar en los paquetes originales incluidos en Nexus y crear stickers propios. No se importaron los stickers, memes o el catálogo comercial mostrado en las capturas.

## Llamadas, estados y archivos

Las llamadas permiten buscar personas, ver favoritos y registro, crear un enlace inmediato o programar un enlace con fecha. No se confunden ambos tipos de enlace. Se mantiene el límite real de seis participantes y la caducidad existente; no se anuncia la capacidad de 32 personas de la referencia.

Estados permite crear texto o abrir cámara desde el panel derecho, y ver recientes, vistos y ocultos a la izquierda. Canales y Comunidades mantienen los formularios y permisos existentes; sus botones del panel derecho abren esas funciones, sin datos decorativos añadidos.

La biblioteca tiene multimedia, documentos y enlaces, búsqueda, orden por fecha o tamaño, selección, borrado para mí, descargas, visor y copia de imágenes. Respeta los mensajes ocultos, temporales y el historial vaciado, y conserva el acceso autenticado a los archivos.

No se añadió una restricción de chat, bloqueo general con biometría, moderación de reportes ni una promesa de conservar mensajes temporales sin implementar sus garantías. La seguridad y las diferencias de cifrado siguen documentadas en REVISION-MOVIL-TABLET.md. Las leyendas de cifrado de las capturas no se trataron como pruebas de seguridad de Nexus.

## Verificación

- 25 comprobaciones nuevas de escritorio a 1024, 1280 y 1366 píxeles: columnas, sección correcta, Nexus AI, menús, portapapeles, listas, temporales, enlaces y biblioteca.
- 40 comprobaciones de móvil y tablet después de los cambios compartidos.
- 34 comprobaciones de configuración y la revisión existente de mensajería.
- Comprobación de tipos y compilación de producción.
- Inicio de la web y servidor local correctos; archivos privados bloqueados y paquete público sin claves privadas.

Las pruebas de interfaz no escribieron usuarios, canales, estados ni mensajes en Firebase real y no consumieron cuotas de IA. El servidor y sus reglas de datos no necesitaron nuevos servicios pagados para esta revisión.

No se publicó Firebase Hosting. Su preparación sigue vigente: es necesario configurar una dirección HTTPS permanente del backend privado antes de la publicación completa. Ver REVISION-MOVIL-TABLET.md para los pasos y límites del alojamiento.
