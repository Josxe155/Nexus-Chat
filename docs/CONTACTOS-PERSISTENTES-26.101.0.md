# Contactos de Google persistentes — v26.101.0

## Comportamiento

Nuevo contacto y Editar contacto recuerdan «Sincronizar con Google» y su correo. La preferencia se guarda en `users/{uid}/private/google-contacts` y en una caché local por cuenta. Contiene exclusivamente `schema`, `enabled` y `email`; las reglas existentes permiten leer y escribir ese documento privado únicamente al propietario autenticado. Un invitado no ve la opción. Desactivar el interruptor se conserva para los siguientes contactos.

El formulario utiliza People API directamente y obtiene el permiso de contactos con `reauthenticateWithPopup`, el proveedor Google configurado en Firebase y una indicación del correo actual. Esta operación conserva el UID de Nexus; no inicia sesión silenciosamente en otra cuenta. Después comprueba la identidad de Google y el acceso a People API. Una cuenta distinta o un permiso denegado no activa la sincronización.

Se abandona Apps Script como recorrido activo de estos formularios, porque Google documenta limitaciones de acceso con varias cuentas. No se recomienda incógnito ni cerrar las demás cuentas. Los archivos del script se conservan para el historial; ya no hacen falta cambios en ellos para este recorrido. El intento inicial mediante Google Identity Services detectó `origin_mismatch` en el cliente web existente; no se publica ese recorrido. Firebase utiliza su redirección de acceso ya configurada y la prueba pública llega a la pantalla oficial de Google.

El token de contactos se conserva únicamente en memoria durante un máximo conservador de cincuenta minutos y se descarta al cambiar la sesión. Otros contactos dentro de ese plazo lo reutilizan. Tras recargar, caducar el token o revocarse el acceso, «Guardar» puede abrir Google para obtener otro token; el interruptor y el correo siguen recordados. No se fuerza `prompt:consent`. Google puede solicitar de nuevo consentimiento o identidad según su política. El permiso concedido a Apps Script pertenece a otro cliente OAuth y puede requerirse una primera autorización en el nuevo recorrido.

No hay servidor propio, plan Blaze ni credenciales privadas añadidas al repositorio. Un token de Firebase no se utiliza como token de People API.

## Menús y esperas

Se conservan los campos y la distribución de la referencia de contacto. Las pantallas propias de Nexus muestran la cuenta, el estado de conexión o guardado, «Cancelar espera» y reintento. La conexión caduca a los dos minutos, las peticiones a Google tienen un límite de treinta segundos y la carga de preferencias de cinco. Los errores se muestran tres segundos; el borrador permanece disponible.

La cancelación ignora respuestas tardías. Si una creación pudo completarse sin recibirse confirmación, no se repite automáticamente: se consulta el vínculo para recuperarlo. Se conservan los datos de Google ajenos a Nexus y el número de Nexus continúa como campo personalizado.

Las pantallas nativas de acceso y consentimiento pertenecen a Google: sus controles, textos y distribución no son editables desde Nexus. El nombre y logo de la aplicación requieren la configuración de marca del proyecto en Google; esta entrega no afirma haberla cambiado.

## Verificación y límites

- 19 pruebas del cliente de contactos, incluidas reutilización, renovación, cuenta incorrecta, cancelación y protección contra duplicados.
- 6 pruebas de preferencias: aislamiento por UID/correo, recuperación después de recargar o borrar caché, ausencia de tokens, invitados y errores de red.
- Emulador de Firestore: acceso del propietario y rechazo de lectura/escritura de otro usuario o una sesión sin autenticar. Las reglas no se modifican.
- 37 comprobaciones de navegador con servicios simulados (celular 13/13, tablet 12/12 y computadora 12/12: 100 % de estos casos en cada tamaño): formularios nuevo/editar a 390, 820 y 1440 px; crear, reutilizar acceso, recargar, desactivar, recuperar preferencias, invitado y distribución. No equivale a pruebas físicas.
- Prueba de configuración real: la redirección existente abre la pantalla oficial de Google con el permiso de contactos, sin introducir credenciales ni escribir una agenda.

El propietario confirmó posteriormente un guardado real correcto en los contactos de Google desde Samsung Internet. La prueba física en Chrome con dos cuentas permanece pendiente. Google puede exigir que el permiso sensible de contactos esté publicado/verificado o que la cuenta esté incluida como usuario de prueba. Una pantalla de acceso correcta no acredita ese consentimiento completo.

TypeScript, enlaces de documentación, 228 pruebas unitarias del proyecto y compilación de Hosting completados. Estos porcentajes no describen el avance total de Nexus ni sustituyen las pruebas físicas.

## Fuentes oficiales

- [Firebase: Google Sign-In y permisos adicionales](https://firebase.google.com/docs/auth/web/google-signin).
- [Firebase: volver a autenticar un usuario](https://firebase.google.com/docs/auth/web/manage-users#re-authenticate_a_user).
- [Apps Script: limitaciones con varias cuentas](https://developers.google.com/apps-script/guides/support/troubleshooting#authorization_errors).
- [People API: crear contactos](https://developers.google.com/people/api/rest/v1/people/createContact).
- [People API: actualizar contactos](https://developers.google.com/people/api/rest/v1/people/updateContact).
