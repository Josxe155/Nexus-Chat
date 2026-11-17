# Referencias de chat y nuevo contacto — v26.96.0

## Inicio de conversación

En celular, el aviso de conversación vacía utiliza una tarjeta neutra, sin el texto morado anterior. La burbuja se sitúa a la izquierda del texto completo y centrada verticalmente. Se conserva el saludo solicitado y no se añaden afirmaciones de cifrado. La presentación anterior de computadora se mantiene.

## Aviso de mensajes temporales

Se reemplaza el aviso corto por el texto de la referencia, con el icono de reloj discontinuo, la duración activa y la excepción de conservación. Las duraciones mostradas son 24 horas, 7 días y 90 días. El enlace «Cambiar duración» abre directamente el selector de mensajes temporales existente, sin pasar por información de contacto. Al desactivar la función el aviso desaparece.

El selector conserva las comprobaciones de permisos de la conversación: un participante de grupo sin permiso de edición puede consultarlo, pero sus opciones están deshabilitadas. No se amplían permisos en Firebase ni se cambia el modelo de caducidad del historial en esta entrega.

## Nuevo contacto

La pantalla de celular ajusta cabecera, campos, espacios, bordes y botón inferior a las capturas. El campo de país muestra el código ISO y el prefijo —por ejemplo, «EC +593»— sin bandera, con una flecha a la derecha. Toda la superficie del botón abre el selector existente de países; se conserva su contenido y su búsqueda por nombre/prefijo. El campo contiguo utiliza el texto «Teléfono». Se conserva el acceso superior al lector QR.

La sincronización ofrece la cuenta de correo de la sesión cuando está disponible. Al activarla y conceder autorización, la sección inferior se titula «Sincronizar con» y muestra el correo confirmado. Al desactivarla esa sección se oculta, como en la cuarta captura. Las sesiones de invitado, incluidas las que usan correo técnico interno, no muestran esta opción ni ese correo. Se elimina del texto visible la explicación sobre el campo interno utilizado para el número de Nexus.

El contacto continúa guardándose en la cuenta Nexus. La sincronización externa usa la integración de People API existente y requiere consentimiento; se mantienen la comprobación de identidad de Google, el manejo de permisos y las protecciones contra duplicados. No se guardan números de Nexus como si fueran teléfonos reales de la operadora. La aplicación normaliza el número antes de consultar su registro y conserva el alias elegido por quien guarda el contacto. Si no está registrado, el formulario permanece abierto y no se crea un chat.

Los cambios de disposición del formulario se limitan a celular. Tablet y computadora mantienen el formulario que ya tenían; las condiciones de visibilidad de sincronización también se aplican en esos dispositivos. El fondo oscuro de la pantalla de celular conserva el mismo color de referencia aunque cambie la paleta general de Nexus.

## Comprobaciones

- TypeScript, compilación de Hosting y las 167 pruebas existentes.
- Matriz de navegador a 320, 390, 820 y 1440 px, en claro y oscuro: saludo/icono, aviso, navegación al selector, duraciones, consulta sin permiso de edición, país y búsqueda, sincronización activada/desactivada, guardado con alias y número unificado, rechazo de números no registrados, rechazo del permiso de Google, invitados y ausencia de desbordamiento horizontal.
- Dos comprobaciones adicionales de fondo en las paletas Nexus y azul. Grafito se comprueba en la matriz principal.
- Los componentes de interfaz son reales. Firebase y las escrituras en agendas externas se simulan: estas pruebas no modifican contactos ni mensajes de producción y no certifican una autorización real de People API en un teléfono.
- Las pruebas por tamaño son simulaciones de navegador, no pruebas físicas de Android/iPhone ni un porcentaje de finalización global de Nexus.

## Trabajo posterior

Esta entrega corresponde a las referencias recibidas. La actualización masiva posterior mantiene pendientes el progreso detallado de descargas, los nombres de usuario vacíos al crear cuentas, la revisión de generación de números de Nexus, la caducidad y borrado de mensajes temporales y el borrado de invitados tras treinta días de inactividad. La limpieza sigue ejecutándose desde el dashboard, tal como solicitó el propietario. Los retoques de logo e iconos se retiran de los pendientes activos.

Fuentes oficiales complementarias: [WhatsApp: mensajes temporales](https://faq.whatsapp.com/673193694148537), [WhatsApp: duraciones y configuración predeterminada](https://blog.whatsapp.com/more-control-and-privacy-with-default-disappearing-messages-and-multiple-durations), [WhatsApp: agregar y gestionar contactos](https://faq.whatsapp.com/5472030609512325/), [WhatsApp: contactos guardados en la cuenta](https://blog.whatsapp.com/making-it-easier-to-add-and-manage-contacts), [Google People API: contactos](https://developers.google.com/people/v1/contacts). Las capturas recibidas determinan la disposición concreta del formulario y del aviso.
