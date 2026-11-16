# Credenciales de invitados — v26.92.0

## Funcionamiento

El invitado sigue escribiendo únicamente su apodo. Para cada nueva entrada por esa opción, la aplicación crea una identidad anónima nueva y la enlaza a correo y contraseña con `linkWithCredential`. El UID permanece igual durante el enlace. El correo usa el dominio reservado y no entregable `guests.nexus-chat.invalid`; la contraseña se genera con 32 bytes de Web Crypto, sin Faker ni datos personales. No se envían correos de verificación a ese dominio.

El registro se guarda una sola vez en Firestore, en `guestAccountCredentials/{uid}`, con los campos `uid`, `email`, `password`, `version` y `createdAt`. La aplicación espera la confirmación de Authentication y de la escritura antes de admitir al invitado. Si falla esa preparación, intenta eliminar únicamente la identidad recién creada; nunca elimina la cuenta anterior. La escritura usa una transacción sin lecturas del registro privado, por lo que no queda pendiente como una escritura local cuando se está sin conexión.

La pantalla principal y el formulario de correo y contraseña conservan sus nombres y campos actuales. No hay un menú nuevo en el dashboard ni acceso por nombre de usuario. Los correos personales sin verificar siguen bloqueados. La excepción para invitados exige que el correo técnico corresponda al UID autenticado; no depende de una marca de perfil editable.

## Recuperación desde administración

1. En la consola de Firebase, localizar el UID en Authentication o en `users/{uid}`.
2. Con una identidad de Google Cloud que tenga los permisos IAM necesarios sobre Firestore, abrir `guestAccountCredentials/{uid}` y consultar `email` y `password`.
3. En Nexus Chat, elegir **Iniciar sesión con correo y contraseña** e introducir esos dos valores. Se abre la misma cuenta, sus conversaciones y su perfil.

No se publica una contraseña real de ejemplo. El registro no es legible desde ningún cliente web, ni siquiera desde el dashboard del propietario. El Assistant tampoco puede consultar o modificar esa colección. Ser administrador del dashboard no equivale a tener permisos IAM de la consola.

Cerrar sesión conserva la cuenta. Volver a elegir invitado crea otra identidad; usar las credenciales recupera la anterior, sin límite especial de cinco horas. Una sesión que sigue abierta mantiene el comportamiento habitual de persistencia de Firebase. Las cuentas anónimas existentes no se convierten automáticamente.

## Alcance de seguridad y conservación

La copia de `password` es recuperable, en texto legible para quien tenga acceso IAM a la base; no es un hash ni cifrado adicional de la aplicación. Por ello ese acceso, sus exportaciones y sus copias de seguridad deben restringirse. Authentication gestiona aparte su propia credencial. La contraseña no se añade al perfil, a los informes de cuenta, a Realtime Database ni a la interfaz.

Ocultar estos valores en la interfaz no los oculta al propietario del dispositivo que inspeccione el código o la memoria del navegador durante la creación. Cualquier persona que obtenga la contraseña podrá iniciar sesión como ese invitado: el formulario no exige además un rol administrativo. Ese inicio de sesión no concede acceso al dashboard. Cambiar o revocar una contraseña por fuera del flujo no actualiza automáticamente la copia conservada en Firestore.

El borrado completo de cuentas y datos a los treinta días **sigue pendiente**. La web sin servidor no puede garantizar la eliminación de Authentication y todos los datos con la página cerrada. El enlace también hace que estas cuentas dejen de ser anónimas para los mecanismos de limpieza de Firebase Authentication. La limpieza mensual existente no sustituye esa tarea. Una interrupción después de confirmar la escritura podría dejar un registro huérfano si se revierte Authentication; no se promete limpieza automática de esos residuos.

## Fuentes oficiales

- [Autenticación anónima y conversión de cuentas](https://firebase.google.com/docs/auth/web/anonymous-auth).
- [Enlazar proveedores y conservar la identidad](https://firebase.google.com/docs/auth/web/account-linking).
- [Acceso con correo y contraseña](https://firebase.google.com/docs/auth/web/password-auth).
- [Transacciones y comportamiento sin conexión](https://firebase.google.com/docs/firestore/manage-data/transactions).
- [Reglas de Firestore y acceso mediante IAM](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Comprobaciones

Las verificaciones se realizan con identidades sintéticas y emuladores locales, sin crear cuentas ni modificar datos de producción. Incluyen creación y enlace con el mismo UID, apodo, recuperación con contraseña, nuevo invitado distinto, denegación de lecturas y cambios del registro, conservación de la verificación de correos personales, mensajes, encuestas de doce opciones, presencia y archivos. La revisión visual usa Chromium con tamaños de celular, tablet y computadora; no equivale a pruebas en Android o iPhone físicos.

Resultado de la entrega: TypeScript y documentación correctos; 115 pruebas unitarias, 15 comprobaciones del nuevo flujo con SDK y emuladores, y 72 comprobaciones de regresión de reglas aprobadas. La revisión visual cubre cuatro recorridos por tema (claro y oscuro) en cada ancho: 390, 820 y 1440 píxeles; ocho de ocho por tamaño, 24 en total. Estos porcentajes se limitan a esta entrega.

Para repetir el flujo local, iniciar Authentication, Firestore y Realtime Database con `firebase.emulators.json` y ejecutar `npm run test:guest:emulators`. Las suites que limpian el proyecto de demostración deben ejecutarse de manera secuencial. Los scripts aceptan `FIRESTORE_EMULATOR_PORT` si el puerto predeterminado 8085 está ocupado.
