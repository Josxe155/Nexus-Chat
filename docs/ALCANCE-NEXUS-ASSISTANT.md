# Nexus Assistant: gestión operativa de datos · v26.79.5

El propietario acotó el alcance a las operaciones de datos de Nexus en Firestore y Realtime Database. Queda descartada la preparación anterior para administrar cuentas de Authentication, modificar código o desplegar la web desde la IA. No requiere crear un trabajador de GitHub Actions, una cuenta de servicio, un pool OIDC ni nuevos permisos de IAM. Esa preparación no llegó a habilitarse ni a publicarse.

## Funciones disponibles

- Leer, buscar y analizar datos de la aplicación, con listas paginadas y recuentos actuales.
- Editar mensajes de texto identificados de forma inequívoca, conservando autor, identificadores y fecha originales; marcar la edición y actualizar la vista previa del chat cuando corresponda.
- Crear, modificar o eliminar documentos y nodos operativos permitidos, incluidos avisos, reportes y contenido. Cada operación actúa sobre un destino concreto; eliminar un documento no elimina automáticamente sus subcolecciones.
- Consultar y modificar los ajustes operativos admitidos, como mantenimiento o planificación de limpieza. La limpieza manual conserva su confirmación explícita y la protección de cuentas y perfiles.
- Preparar propuestas sin ejecutar cambios cuando se solicite una vista previa o simulación; ejecutarlas con CONFIRMAR y su identificador.

Las órdenes de cambio admiten frases como «quiero que edites» o «¿puedes actualizar?». El modelo indica execution=execute o execution=prepare; el cliente conserva las protecciones de las solicitudes de solo lectura, no ejecución o preparación. Las instrucciones encontradas dentro de registros se tratan como datos, no como autorización. No se presenta una acción como realizada sin un resultado de la herramienta.

## Datos y operaciones protegidos

El asistente no crea, suspende, modifica ni elimina cuentas de Authentication o perfiles. Tampoco gestiona nombres de acceso, números identificadores, permisos, propiedad, miembros/administradores, bloqueos de seguridad, credenciales, reglas de Firebase, código o despliegues.

Se bloquean los destinos de identidad y seguridad, auditorías, archivos y sus fragmentos, y señales o conexiones activas. Los campos de permisos y credenciales también se rechazan al preparar y ejecutar cambios. Las consultas ocultan los campos identificados como claves, tokens, contraseñas, contenido cifrado y valores binarios antes de devolver información al modelo. Los fragmentos de archivos no son una fuente de análisis de texto; se consulta su catálogo cuando se necesita información de los archivos. Las consultas deben indicar un área concreta, evitando descargar toda la base de datos de una vez.

Las reglas mantienen la verificación del UID y correo verificado del propietario. También se retira el permiso genérico auditado sobre los destinos protegidos. Los permisos ordinarios necesarios para que cada usuario gestione su propio perfil, mensajes, archivos o llamadas se mantienen mediante sus reglas específicas; este cambio no deshabilita las funciones normales de Nexus.

Cada escritura admitida conserva auditoría y comprobación de cambios concurrentes. Firestore usa transacciones; Realtime Database conserva las comprobaciones previas y la actualización multipath del contenido y la auditoría. El historial de conversación sigue siendo local y se mantiene el límite de 500 líneas. No se reincorpora el dictado.

## Verificación de la entrega

La matriz comprende: (1) tipos y documentación, (2) pruebas unitarias de alcance y formato, (3) permisos y destinos protegidos en emuladores, (4) edición y operaciones permitidas en emuladores, (5) interfaz y órdenes de texto en tres tamaños, (6) compilación y comprobaciones de GitHub, (7) Hosting y reglas publicados y verificados, (8) uso completo en dispositivos físicos. Con la publicación verificada se completan 7/8, **87,5 % por tamaño**. La prueba física sigue pendiente; no es un porcentaje de finalización del proyecto.

La revisión de favicon, ajustes, categorías e información de contacto continúa en la lista de pendientes y no se considera realizada mediante esta corrección.

Validación realizada: 17 pruebas del cliente administrativo, una de identidad y cinco de formato; permisos, alcance, edición y acciones contra emuladores con datos ficticios; interfaz a 390, 820 y 1440 píxeles con adaptadores de almacenamiento simulados. Se comprobaron órdenes naturales, conservación de autor y fecha, vista previa del chat, propuestas sin escritura, bloqueo de perfiles/permisos e historial local.
