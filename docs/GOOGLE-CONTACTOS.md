# Contactos de Google — v26.87.0

La solicitud del propietario de completar la integración sustituye la retirada provisional de sincronización. El control ocupa el lugar del interruptor de la captura 223048, adaptado explícitamente a Google. No se añade un menú nuevo sin referencia.

## Función disponible

- En Nuevo contacto y Editar contacto, «Sincronizar con Google» abre la autorización de Google. Solo se activa después de obtener el permiso, verificar la cuenta y comprobar que People API permite leer la agenda. El correo de destino es el devuelto por Google.
- La cuenta debe corresponder al proveedor Google vinculado a la sesión de Firebase. Para una sesión por contraseña sin proveedor Google vinculado, debe coincidir con su correo verificado. Iniciar sesión en Nexus no equivale a autorizar la agenda de Google.
- Al guardar, primero se valida el número o usuario registrado en Nexus y se guarda el alias privado en Nexus. Si se activó Google, se crea o actualiza su contacto vinculado antes de abrir la conversación. El usuario puede guardar en Nexus sin activar Google.
- Los números de Nexus son identificadores internos. Se exportan en el campo personalizado «Nexus Chat · número», junto con el usuario en otro campo personalizado. No se rellenan `phoneNumbers` con números ficticios ni se envían SMS. No se exportan conversaciones, estados, fotos protegidas, contraseñas ni correos de terceras personas.
- La aplicación lee el vínculo de Google y la versión actual antes de actualizar. Conserva sus correos, teléfonos reales y demás campos ajenos. Solo actualiza nombre/alias y campos de Nexus. Los cambios concurrentes producen un error que permite volver a consultar, en lugar de sobreescribir sin comprobar la versión.
- Las consultas recorren todas las páginas antes de crear. Las escrituras se serializan y utilizan Web Locks entre pestañas. Un recibo local guarda únicamente la referencia del contacto; una respuesta perdida de creación bloquea otro intento de creación hasta poder confirmar el vínculo. No se eliminan contactos de Google.
- Si falla Google después de guardar en Nexus, el formulario informa de ambas situaciones, permanece abierto y conserva el borrador. Los avisos de error desaparecen a los tres segundos. Desactivar la opción permite terminar el guardado solo en Nexus.

Este alcance es sincronización **por contacto, desde Nexus hacia Google**. No importa automáticamente la agenda completa de Google, no identifica cuentas Nexus por teléfonos reales, no aplica automáticamente a Nexus los cambios hechos en Google y no ejecuta tareas con la página cerrada. Esas ampliaciones necesitan definición y referencias propias; no se presentan como disponibles.

## Configuración y autorización

People API se habilitó y su estado `ENABLED` se verificó en el proyecto `nexus-chat-56d9d` (1003799815307), el 10 de noviembre de 2026. Se reutiliza el identificador público de cliente web de `src/drive-client.json`; no se necesitan un secreto de cliente, un servidor propio ni Firebase Blaze.

El proyecto de Google Cloud debe mantener configurados:

1. People API habilitada.
2. Cliente OAuth web con los orígenes JavaScript autorizados que se utilicen, incluido `https://nexus-chat-nc.web.app`.
3. Pantalla de consentimiento y permiso `https://www.googleapis.com/auth/contacts`, además de `openid email` para verificar la cuenta. El permiso de contactos es sensible: la disponibilidad para usuarios externos depende de las condiciones de prueba/publicación y verificación de Google. Habilitar la API no completa esas condiciones por sí solo.
4. Consentimiento individual desde el interruptor de la página. Un permiso denegado, una cuenta distinta o un error de configuración no activa la sincronización.

Los tokens duran como máximo una hora y solo se conservan en memoria. Se descartan al cambiar la sesión; no se guardan en Firestore, Realtime Database, archivos, cookies, almacenamiento local ni GitHub. El recibo local contiene identificadores del vínculo, sin token ni datos de agenda. La renovación del permiso requiere una acción del usuario. Desactivar el interruptor detiene los siguientes guardados en Google; no revoca los permisos de otras funciones que utilicen el mismo cliente.

## Fuentes oficiales

Consultadas el 10 de noviembre de 2026:

- [Leer, crear y administrar contactos](https://developers.google.com/people/v1/contacts).
- [Crear un contacto y sus permisos](https://developers.google.com/people/api/rest/v1/people/createContact).
- [Actualizar un contacto: campos, fuentes y etag](https://developers.google.com/people/api/rest/v1/people/updateContact).
- [Listado y paginación](https://developers.google.com/people/api/rest/v1/people.connections/list).
- [Autorización en navegador con Google Identity Services](https://developers.google.com/identity/oauth2/web/guides/use-token-model).
- [Configurar OAuth para web](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid).
- [Permisos sensibles y verificación](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification).

## Verificación

- 15 pruebas de integración con servicios simulados: cuenta, permiso, configuración, alias, campos personalizados, conservación de datos, paginación, expiración, cambio de sesión, serialización, respuestas perdidas y recuperación sin otro POST.
- La prueba con una agenda real requiere el consentimiento interactivo de su propietario. No se han leído ni escrito contactos reales de Google para esta entrega.
- Las pruebas de navegador usan formularios reales y respuestas simuladas de Google/Firebase. No sustituyen una prueba de consentimiento real ni pruebas físicas de teléfono.

Comprobación de navegador de esta entrega: 16 configuraciones de Nuevo/Editar contacto en claro y oscuro. Celular 8/8 (100%), tablet 4/4 (100%) y computadora 4/4 (100%), con servicios simulados. Se verificó también el fallo de escritura sin pérdida del contacto Nexus y la desaparición del aviso a los tres segundos. Estos porcentajes no expresan avance del proyecto ni consentimiento real o pruebas físicas.
