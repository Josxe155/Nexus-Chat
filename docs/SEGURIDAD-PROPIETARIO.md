# Identidad propietaria del dashboard · v26.79.4

Nexus Assistant y el dashboard requieren la identidad propietaria configurada en Firebase. Una marca `dashboardAdmins/{uid}.enabled=true` ya no basta por sí sola: deben coincidir el UID y el correo del token de Authentication con `dashboardSecurity/owner`, el correo debe estar verificado y la sesión debe proceder de Google o correo/contraseña. Los valores reales del propietario se guardan en Firebase, no en el código ni en este documento.

La comprobación del cliente se ejecuta antes de las consultas de IA y de cada herramienta de lectura o escritura. Renueva el token cuando se solicita una operación y consulta la configuración de servidor. Las reglas de Firestore y Realtime Database repiten la restricción, por lo que quitar un botón o alterar el JavaScript no concede acceso administrativo a otra identidad. La configuración se refleja en ambos servicios con el mismo UID y correo. Los clientes, incluido el asistente con auditoría, no pueden modificarla.

El dashboard observa cambios en su autorización y en la política propietaria. Una cuenta distinta, un correo que no coincida, una identidad no verificada, una configuración ausente o deshabilitada y un método de acceso no admitido no reciben permisos administrativos. Google y la contraseña alternativa siguen disponibles para la misma cuenta propietaria. El correo escrito en un perfil de usuario no se considera prueba de identidad: se utilizan las afirmaciones del token autenticado.

La renovación de token no provoca un ciclo de comprobación ni desmonta una conversación ya autorizada mientras se verifica la misma identidad. Si cambia el usuario, se retira la autorización o falla la comprobación, el acceso se bloquea. Los usuarios ordinarios conservan los permisos que necesitan para sus propios chats; no reciben acceso al asistente del panel.

Esta corrección también reconoce encabezados Markdown de uno a seis numerales, como `### Título`, títulos subrayados con `===` o `---` y separadores. Los marcadores dentro de bloques de código permanecen literales. Se conservan las comillas, apóstrofos, negrita y enlaces existentes. Los encabezados tienen nivel accesible y tamaños relativos que se adaptan al dispositivo.

## Verificación

- Prueba unitaria de identidad propietaria: UID, correo verificado, proveedor y configuración habilitada.
- Cinco pruebas de formato, incluidos encabezados y separadores, y las quince pruebas existentes del cliente administrativo.
- Emuladores `demo-nexus`: se permite al propietario por Google y contraseña; se rechazan otros administradores habilitados, otro UID con igual correo, correo distinto, correo sin verificar, sesión anónima, política deshabilitada y modificación de la política incluso con auditoría. También se verifican los permisos anteriores de edición, acciones y lectura.
- Chromium a 390, 820 y 1440 píxeles con identidades y respuestas simuladas: otras cuentas no montan el chat ni invocan el modelo; el propietario puede consultar sin ciclos de renovación; se comprueban encabezados grandes, separadores, código literal e historial tras recarga.

Matriz de esta corrección: (1) identidad real comprobada en Firebase, (2) pruebas unitarias, (3) tipos/documentación/compilación, (4) reglas y operaciones emuladas, (5) interfaz en tres tamaños, (6) política propietaria guardada y verificada en ambos servicios, (7) GitHub y Hosting/reglas publicados y comprobados, (8) recorrido completo en equipos físicos. Tras verificar la publicación, 7/8 equivalen a **87,5 % por tamaño**; no es avance global del proyecto. Los dispositivos físicos siguen pendientes.

El trabajador administrativo de cuentas y publicaciones sigue en preparación aparte, pendiente de la aprobación específica de IAM. Esta corrección no crea esa identidad ni habilita sus roles. Su futura autorización también debe exigir esta política propietaria.
