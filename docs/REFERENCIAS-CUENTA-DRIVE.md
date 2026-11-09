# Referencias de Cuenta y preparación de Drive — v26.82.0

## Entrega

Se sustituyeron las pantallas existentes de Info. de mi cuenta, Contraseña, Cambiar contraseña, Dirección de correo electrónico, Nombre de usuario, Contactarme con mi nombre de usuario, Notificaciones de seguridad y Cerrar sesión con la estructura de las referencias recibidas el 9 de noviembre. Las referencias privadas se inspeccionaron fuera del repositorio; no se publican sus capturas, correos ni teléfonos.

Se conservaron filas, ilustraciones, separadores, campos, posiciones de acciones y menús representados en las capturas. Los datos corresponden al usuario conectado. Las diferencias de texto necesarias para describir las capacidades reales se enumeran abajo. No se certifica una coincidencia visual del 99,9 %: requeriría una comparación de píxeles con el mismo tamaño, fuente y estado. La verificación de navegación y geometría no equivale a ese porcentaje.

## Funciones disponibles

- El informe de cuenta y el de canales se solicitan por separado y se descargan como JSON. Cuenta exporta el perfil y los ajustes permitidos, sin mensajes, contraseñas, tokens, claves ni códigos de contacto. Canales exporta la lista de canales seguidos o administrados y la función propia; la exportación de publicaciones queda pendiente.
- Los informes generados se guardan en IndexedDB, separados por UID y tipo. La preferencia de generación mensual se guarda en el documento privado `accountReports`. La generación se comprueba al abrir Nexus, recuperar la conexión, volver a la pestaña y cada hora mientras la página está abierta. La interfaz lo indica. La ejecución con la página cerrada queda pendiente; no se afirma que exista un trabajo programado en servidor.
- Contraseña admite cambiar una contraseña existente o añadirla al acceso propio con correo verificado. Comprueba ocho caracteres, una letra, un número y coincidencia; el servicio conserva sus verificaciones adicionales. Ante una sesión antigua, exige volver a iniciar sesión. No se incorporó un formulario de reautenticación sin referencia.
- Correo muestra la dirección real y su verificación. Conserva el envío de verificación para correos pendientes y actualiza el estado al volver a la pestaña. El lápiz queda pendiente de la referencia del formulario de cambio.
- El menú inferior del nombre de usuario reproduce las dos acciones recibidas. Cambio y eliminación quedan pendientes de sus formularios, confirmaciones y requisitos de conservación de identidad. El editor anterior del perfil sigue disponible y conserva la espera de 30 días. La opción de clave de contacto queda pendiente de implementación; no se simula una restricción que las reglas actuales no aplican.
- Cerrar sesión incluye los accesos de bloqueo, notificaciones y almacenamiento. Añadir cuenta y copia de seguridad permanecen sin activar. La salida conserva el proceso existente. No se promete guardar credenciales después de cerrar sesión.
- La pantalla de seguridad conserva la composición de la referencia y describe el modelo actual de acceso. No afirma cifrado de extremo a extremo para mensajes nuevos. Las notificaciones por cambios de códigos de seguridad quedan pendientes. La importación del historial cifrado anterior sigue disponible desde Seguridad de la información del contacto.

Los avisos de los componentes nuevos se retiran a los tres segundos. Los permisos administrativos y las reglas de Firebase no se ampliaron.

## Correspondencia con el ZIP

| Captura | Apartado | Estado |
| --- | --- | --- |
| 155309 | Llaves de acceso | Pendiente: requiere autenticación real con servidor; no se sustituye por el bloqueo local. |
| 155315, 155320, 155331 | Contraseña, cambio y creación | Implementado; llamadas de guardado y validación comprobadas con una sesión simulada. |
| 155337 | Correo | Vista implementada; formulario de cambio pendiente de referencia. |
| 155344, 155458 | Verificación en dos pasos | Pendiente de servicio de segundo factor y recorridos de registro/confirmación. |
| 155350 | Dispositivos de confianza | Pendiente del sistema real de confianza y revocación. |
| 155449 | Administrador de credenciales del sistema | Depende del navegador y su administrador de contraseñas; se utiliza `autocomplete`, sin simular su ventana. |
| 155505 | Notificaciones de seguridad | Composición adaptada al modelo real; notificaciones por cambio de código pendientes. |
| 155518, 155522, 155528 | Usuario, privacidad y menú | Pantallas y menú incorporados; formularios y clave de contacto pendientes. |
| 155539 | Cambio de teléfono | Pendiente: verificación telefónica y pasos siguientes sin referencia. El número de Nexus conserva su significado y sus datos. |
| 155545 | Cerrar sesión | Pantalla incorporada; múltiples cuentas y copias pendientes. |
| Imagen adjunta al mensaje | Info. de mi cuenta | Informes de cuenta/canales incorporados; publicidad exclusiva de Meta y tratamiento privado nativo no se presentan como servicios de Nexus. |

## Drive API: preparación técnica, todavía sin activar

Se consultó el proyecto existente: `drive.googleapis.com` figura **DISABLED**. Se recuperó únicamente el identificador público del cliente OAuth existente, guardado en `src/drive-client.json`; no se copió su secreto. Un identificador OAuth de una aplicación web es público y no sustituye la autorización del usuario.

`driveBackup.ts` prepara Google Identity Services y Drive API v3 con el permiso `drive.appdata`. Incluye autorización, subida reanudable, listado y descarga con comprobación de UID y formato. Los tokens se mantienen en memoria y se descartan al cambiar de sesión. El token solo se envía a `www.googleapis.com`; una dirección de subida ajena se rechaza. Un permiso vencido obliga a reconectar. Se limita cada copia a 40 MB y se evita anunciar éxito sin confirmación del archivo.

`chatBackup.ts` prepara una copia de texto y referencias a archivos desde el historial permitido del usuario. Omite conversaciones quitadas del historial, mensajes ocultos, caducados, eliminados y archivos de una sola visualización. No incluye binarios multimedia, contraseñas, claves, tokens ni el historial local de Assistant. La copia es JSON; no se afirma cifrado propio de la copia.

Estos módulos **no están conectados a una acción activa de la web**. No se ha subido información a Drive ni activado la API. La descarga del módulo devuelve los datos validados; todavía no restaura mensajes en Firebase.

Pendientes concretos de Drive:

1. Referencias de las pantallas de copia, selección de cuenta, estados, errores y restauración.
2. Habilitar Drive API y comprobar los orígenes autorizados y el consentimiento OAuth del cliente existente.
3. Conectar la interfaz referenciada a los módulos preparados, añadir copia multimedia y restauración segura sin sobrescribir conversaciones compartidas.
4. Autorizar una cuenta de prueba y verificar subida, listado, descarga y recuperación reales en los dispositivos objetivo.

## Referencias oficiales consultadas

- [Solicitar información de la cuenta de WhatsApp](https://faq.whatsapp.com/526463418847093/).
- [Informe de canales de WhatsApp](https://faq.whatsapp.com/6480469855345352/).
- [Carpeta de datos de aplicaciones de Drive](https://developers.google.com/workspace/drive/api/guides/appdata): carpeta privada de la aplicación, distinta de las copias nativas del dispositivo.
- [Permisos de Drive API](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).
- [Preparación de Drive en JavaScript](https://developers.google.com/workspace/drive/api/quickstart/js).
- [Gestión del usuario propio en Firebase](https://firebase.google.com/docs/auth/web/manage-users).

## Verificación de esta entrega

Chromium automatizado usa los componentes reales y el CSS de producción con datos y servicios simulados. Se probaron 320 y 390 píxeles para celular, 820 para tablet y 1440 para computadora, en modo claro y oscuro. No se utilizaron cuentas de producción para cambiar contraseñas ni crear informes reales.

Matriz de 11 comprobaciones, independiente de la lista general del proyecto:

| Comprobación | Celular | Tablet | Computadora |
| --- | --- | --- | --- |
| Geometría y navegación de pantallas referenciadas | Verificado | Verificado | Verificado |
| Solicitar y descargar informes con servicios simulados | Verificado | Verificado | Verificado |
| Preferencia mensual y cambio de mes | Verificado | Verificado | Verificado |
| Validación de contraseña y llamada de guardado simulada | Verificado | Verificado | Verificado |
| Correo real de la sesión simulada y estado verificado | Verificado | Verificado | Verificado |
| Menú de usuario, cierre y acciones pendientes desactivadas | Verificado | Verificado | Verificado |
| Cierre de sesión, destinos y protección de recorridos incompletos | Verificado | Verificado | Verificado |
| Regresión de la cabecera con sus cuatro botones | Verificado | Verificado | Verificado |
| Publicación y manifiesto de versión | Pendiente | Pendiente | Pendiente |
| Cambios de contraseña y correos reales en Firebase | Pendiente | Pendiente | Pendiente |
| Revisión física en Android, iPhone, tablet y computadora | Pendiente | Pendiente | Pendiente |

Avance verificado antes de las comprobaciones finales: **celular 8/11 (73 %), tablet 8/11 (73 %), computadora 8/11 (73 %)**. Este porcentaje no mide igualdad visual con WhatsApp ni considera terminadas las funciones pendientes del inventario.
