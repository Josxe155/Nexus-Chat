# Info. de contacto en celular — v26.84.0

## Alcance y estado

La nueva vista se aplica a contactos individuales en la expresión de celular. Tablet, computadora, grupos y canales conservan el componente anterior. Se inspeccionaron las nueve capturas proporcionadas fuera del repositorio y la descripción del propietario. Las imágenes privadas y sus datos personales no se publican.

Se incorporaron las entradas descritas, con separación de archivos, almacenamiento, notificaciones, conservados, seguridad, duración, protecciones, traducción, grupos compartidos y acciones personales. Las opciones sin recorrido terminado permanecen desactivadas. No se certifica una copia visual al 100 % ni equivalencia funcional completa.

| Opción | Estado |
| --- | --- |
| Foto, contacto, llamadas, video y búsqueda | Reutilizan los recorridos existentes. |
| Archivos, enlaces y docs | Abre el visor existente del historial cargado; no se mezcla con almacenamiento local. |
| Administrar almacenamiento | Cuadrícula del historial cargado que tiene copia local: selección individual/todos, suma y orden por tamaño, reciente o antiguo. Reconoce claves de caché y de transferencia. Eliminación pendiente de referencia de confirmación; no borra mensajes ni archivos ajenos. |
| Notificaciones | Vista de Mensaje, Llamada y Estado; silencio del chat conectado a su preferencia existente. Tonos, vibración, ajustes avanzados y silencio de estados por contacto pendientes. |
| Visibilidad multimedia | Pendiente de recorrido e integración con descargas; el navegador no administra la galería nativa del teléfono como WhatsApp. |
| Mensajes conservados | Lista separada de destacados, consulta propia de mensajes con `keptBy` y búsqueda. Excluye eliminados, ocultos, caducados y visualización única. Mantiene la conservación existente desde el menú de mensaje. |
| Cifrado | Mantiene el panel real y la importación del historial anterior. La verificación, QR y comparación de 60 dígitos de la captura quedan pendientes: Nexus no usa cifrado de extremo a extremo para mensajes nuevos. No se simula una verificación. |
| Mensajes temporales | Pantalla con 24 horas, 7 días, 90 días y desactivada. Guarda el ajuste del chat con las reglas existentes. La ilustración es un icono de reloj; no se afirma coincidencia exacta con la ilustración nativa. |
| Restringir y ocultar | Pendiente de protección integral, ocultación y referencias de configuración. No se presenta el bloqueo de vista existente como si ocultara todo el chat. |
| Chat limitado | Vista introductoria; control desactivado. Las restricciones reales de exportación, descargas y acceso siguen pendientes. No incluye funciones exclusivas de Meta ni garantías falsas de cifrado. |
| Traducir mensajes | Pendiente de los recorridos de idioma y automatización. |
| Grupos en común | Datos de los chats cargados a los que pertenecen ambos usuarios, foto y nombres disponibles. Permite abrir el grupo. No inventa nombres ni números. |
| Crear grupo / añadir a grupos | Entradas pendientes de las referencias de selección y confirmación. |
| Favoritos, listas, vaciar, bloquear y reportar | Conectados a los recorridos y confirmaciones existentes. |

Las pantallas se basan en la estructura de las referencias; las ilustraciones de reloj y chat limitado utilizan iconos disponibles, sin afirmar una reproducción idéntica. Los estados y las protecciones reflejan capacidades reales. Los mensajes de error del nuevo componente duran tres segundos.

## Fuentes oficiales consultadas

- [Almacenamiento desde cada chat](https://blog.whatsapp.com/new-feature-roundup-free-up-space-multiple-accounts-cross-platform-transfer-and-more).
- [Mensajes conservados](https://blog.whatsapp.com/keep-in-chat-your-new-sender-superpower).
- [Mensajes temporales y duraciones](https://faq.whatsapp.com/673193694148537/).
- [Restringir chats](https://faq.whatsapp.com/764072925284841/).
- [Privacidad avanzada del chat](https://faq.whatsapp.com/715385484388016/).
- [Traducción de mensajes](https://blog.whatsapp.com/introducing-message-translations?lang=es).

## Comprobaciones

Chromium automatizado con componentes reales, CSS de producción y datos/servicios simulados: 320 y 390 píxeles, claro y oscuro. Pasan los cuatro escenarios de navegación, conservados separados, selección/ordenación, silencio, duración, acciones pendientes desactivadas y ausencia de desbordamiento horizontal. También pasan TypeScript y la compilación. Las pruebas de regresión existentes se ejecutan antes de publicar.

No se ha verificado una modificación real de cuentas o conversaciones de producción. Revisión física Android/iPhone pendiente. Tablet y computadora conservan la rama anterior por código; la revisión visual de esas vistas con sesión real sigue pendiente. Estas comprobaciones no equivalen a porcentaje de terminación de funciones o similitud con WhatsApp.
