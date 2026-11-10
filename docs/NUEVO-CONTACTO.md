# Nuevo contacto — v26.85.0

## Referencia y alcance

La especificación verbal del propietario define Nombre, Apellido, Nombre de usuario, País, Teléfono, sincronización y la bifurcación registrado/no registrado. La aclaración del 10 de noviembre indica buscar **el número de Nexus que ya aparece en el perfil**. No equivale a verificar una línea telefónica por SMS.

Fuentes oficiales consultadas:

- [WhatsApp: añadir un contacto](https://faq.whatsapp.com/iphone/how-to-add-a-contact).
- [WhatsApp: gestión de contactos y nombres privados](https://blog.whatsapp.com/making-it-easier-to-add-and-manage-contacts).
- [WhatsApp: nombres de usuario](https://www.whatsapp.com/usernames-faq/).
- [UIT: estándar E.164](https://www.itu.int/rec/T-REC-E.164-202602-I/en).
- [MDN: Contact Picker API](https://developer.mozilla.org/en-US/docs/Web/API/Contact_Picker_API). El selector permite leer contactos elegidos; no proporciona escritura de la agenda.

No se declara equivalencia visual con una captura inexistente de este nuevo formulario. Se conserva la presentación de Nexus y se aplica la referencia verbal. El QR continúa en los ajustes de celular; no se añade como método visible en Nuevo contacto.

## Recorrido implementado

1. Nuevo contacto abre directamente el formulario. La sección «Personas en Nexus» se retira del directorio.
2. El nombre/apellido son el alias privado del propietario. Se requiere nombre y al menos número de Nexus o usuario. El usuario es opcional cuando se introduce número.
3. Antes de solicitar un token o consultar la base de datos, se valida el borrador y se normaliza el número a E.164 con libphonenumber-js. Se eliminan espacios, puntos, guiones y paréntesis; se conserva el cero significativo de Italia. Un prefijo ya internacional no se duplica. Letras, extensiones y longitudes imposibles se rechazan localmente.
4. La búsqueda recibe únicamente número canónico y usuario, nunca el alias. Consulta la reserva exacta del número; si se proporcionan número y usuario, deben pertenecer a la misma cuenta. No se utiliza el usuario como alternativa cuando el número no existe.
5. Una coincidencia debe tener perfil vigente y no retirado por moderación. Foto e información se leen de los detalles protegidos por las reglas de privacidad. El nombre registrado no sustituye el alias.
6. Una transacción guarda alias, vínculo por número si existe y pertenencia a contactos en documentos privados del propietario. Lee la privacidad actual para conservar contactos y preferencias concurrentes; actualiza su revisión pública. No cambia el perfil de la otra persona. Los estados activos del propietario actualizan su audiencia cuando corresponde.
7. A continuación se abre el chat directo existente o se crea uno determinista. Se lee antes de crear y se comprueba de nuevo ante una creación concurrente para evitar sobrescribir conversaciones. Un fallo al guardar impide abrir el chat; un fallo posterior al abrir permite volver a intentar conservando el contacto ya guardado.
8. Sin coincidencia: «Este número no está registrado en Nexus Chat». No se guarda nada ni se crea chat. Los campos permanecen; el aviso desaparece a los tres segundos y queda la invitación genérica. No se envían SMS a números internos.
9. Se bloquean envíos repetidos durante la operación y se comprueba que la sesión siga siendo la del propietario.

## Sincronización y pendientes

«Sincronizar con» muestra el correo real de la sesión, cuando está disponible: el destino es la cuenta Nexus del usuario. No implica sincronización con Google Contacts. «Sincronizar contacto con el teléfono» permanece desactivado: el número interno de Nexus no acredita una línea real y el navegador no ofrece escritura general en la agenda. No se inventa una integración nativa ni se publica el número como teléfono real.

Pendiente: referencia y diseño para líneas reales verificadas, integración autorizada con una agenda externa y pruebas de extremo a extremo con cuentas de prueba reales en Firebase. No se han creado ni modificado contactos de personas reales para comprobar esta entrega.

## Verificación

- 12 pruebas automatizadas de normalización, bifurcación, alias, errores, sesión, resolución, privacidad, transacción y reutilización/creación concurrente de chats. Firebase está simulado en estas pruebas.
- Chromium: formulario real y estilos de producción con servicios simulados; 320/390/820/1440 px, cada uno en claro y oscuro (8/8 configuraciones), sin desbordamiento horizontal.
- Seis recorridos de comportamiento: inexistente y aviso de tres segundos, número inválido sin consulta, usuario sin número, usuario contradictorio, doble envío y fallo al guardar.
- Regresión: TypeScript, documentación, 30 pruebas anteriores de Assistant/acceso de propietario/cuenta/texto enriquecido y compilación de Hosting.

Avance de **esta comprobación del formulario en navegador**, no del proyecto ni de hardware real: celular 4/4 configuraciones (100%), tablet 2/2 (100%), computadora 2/2 (100%). No equivale a validación física en Android, iPhone, tablet o PC, ni a una prueba real de escritura en Firebase.
