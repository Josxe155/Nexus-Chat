# Permisos y varias cuentas — v26.100.2

## Permisos de la web

La introducción permite Continuar sin revisar desde el primer momento. Mientras revisa, Cerrar y continuar y la X permanecen disponibles. Cerrar no concede ningún permiso ni modifica cuentas; las funciones que necesitan cámara, micrófono o notificaciones siguen comprobando sus permisos reales.

La revisión tiene un límite absoluto de doce segundos. Si una solicitud no responde se muestra Sin respuesta todavía, en lugar de afirmar que fue denegada. Se ofrece Volver a intentar o continuar. Cada revisión tiene una generación independiente: respuestas tardías no actualizan una revisión nueva ni reabren el diálogo. Los streams que lleguen tras cerrar o vencer también se detienen. La apertura manual desde Ajustes funciona en computadora, manteniendo la introducción automática solo en dispositivos móviles.

El navegador conserva el control de sus propios avisos nativos. La página no puede cerrar un aviso del sistema ni revocar un permiso ya concedido mediante cancelar. La salida deja de esperar y conserva la comprobación real al usar cada función.

La selección del país al entrar tiene también un plazo externo de doce segundos para geolocalización, porque el timeout nativo puede no incluir la espera de consentimiento. Si no hay respuesta se pasa a la selección manual de país existente. No se asigna otro país ni se consulta por IP.

## Google y contactos

El propietario confirmó que el enlace existente asocia el correo y muestra Continuar en Nexus Chat en otro navegador. El primer guardado real de un contacto todavía no se ha realizado.

Google documenta que Apps Script no admite bien varias cuentas abiertas simultáneamente. El error de Google Drive observado antes de ejecutar el script no se puede convertir en una respuesta de People API desde Nexus. No se cambia de cuenta silenciosamente ni se introduce una ruta de cuenta inventada.

La conexión a contactos conserva Cancelar desde el inicio. A los doce segundos aparece una explicación del problema de varias cuentas y la recomendación de usar una ventana privada con la cuenta de Nexus. Volver a intentar está disponible para conectar: descarta el estado anterior y abre una ventana nueva desde la pulsación del usuario. Sus resultados tardíos no habilitan ni cierran la conexión nueva. El plazo total de conexión es dos minutos; el guardado conserva sus cinco minutos y nunca se reintenta automáticamente. Si Google falla después del guardado en Nexus, se conserva el contacto y el formulario como antes.

## Presentación de Apps Script

Se prepara revisión 4 de [Code.gs](../integrations/google-contacts-apps-script/Code.gs) con tarjeta adaptable, logo Nexus transparente, claro/oscuro y botones de retorno visibles solo en el momento correspondiente. Mantiene el protocolo y los campos de revisión 3: la web sigue siendo compatible con el script actual. Activar esta presentación requiere reemplazar código.gs y publicar Nueva versión en el proyecto del propietario. No se necesitan nuevos permisos ni cambios en el manifiesto.

## Tipografía solicitada

El propietario precisó que se refiere al rótulo WhatsApp de la cabecera, no al texto de mensajes. En los recursos públicos del sitio oficial se identificó WhatsApp Sans Var. El archivo de referencia incorpora condiciones de Dalton Maag y una URL de licencia; no se ha acreditado una licencia de redistribución para Nexus ni que sea el mismo archivo de la cabecera de la aplicación móvil. Esa coincidencia exacta queda pendiente de una referencia y un recurso autorizado. No se incluye la fuente de referencia en el repositorio ni se presenta otra familia como idéntica. Se conserva por ahora el título móvil de v26.100.1.

## Verificación

Se aprobaron 217 pruebas unitarias del proyecto, incluidas seis de permisos, doce de transporte y veintiuna de Apps Script. Se verificaron 42 recorridos de navegador: por tamaño, diez de contactos y cuatro de permisos. Celular 14/14, tablet 14/14 y computadora 14/14 (100 % de esos casos simulados, no de la aplicación completa). Se comprobaron el cierre antes de solicitar permisos, el plazo sin respuesta, reintento, cierre con respuestas tardías, streams liberados y finalización correcta; en contactos, además, el reintento mientras Google no responde sin que el intento cancelado cierre el nuevo. TypeScript, enlaces de documentación y compilación de Hosting correctos. Las pruebas utilizan permisos y servicios simulados, sin abrir cámaras reales, escribir agendas ni modificar Firebase. La comprobación del primer contacto real y el caso físico de Chrome con dos cuentas siguen pendientes.

## Fuentes oficiales

- [Apps Script: problemas con varias cuentas](https://developers.google.com/apps-script/guides/support/troubleshooting#issues_with_multiple_google_accounts).
- [MediaDevices.getUserMedia: una persona puede no responder](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
- [GeolocationPositionOptions.timeout](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions/timeout).
- [Recursos de marca de WhatsApp](https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/).
- [WhatsApp oficial](https://www.whatsapp.com/).
