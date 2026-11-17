# Revisión general y reglas — v26.95.1

## Correcciones

- Ajustes podía quedar vacío al ampliar una ventana que tenía abierto un submenú exclusivo de celular. Ahora vuelve a la categoría ya existente de tablet/computadora; se conserva el retroceso y no se añaden menús.
- Los errores al quitar un contacto utilizaban una alerta nativa persistente y los errores del portapapeles se silenciaban. Ambos se informan dentro de la página durante tres segundos. Ajustes también retira sus avisos de error y confirmación a los tres segundos.
- El perfil público de Firestore admitía campos adicionales y listas privadas dentro del resumen de privacidad. Ahora crea y actualiza solo el esquema público, con tipos y límites. Los ajustes privados y las credenciales siguen en sus rutas privadas.
- Se protegen la fecha de creación, la categoría de cuenta y el marcador de moderación frente a cambios desde el perfil. El alta de usuario debe vincular el nombre reservado a su UID en la misma operación; se comprueban también altas válidas.
- Los metadatos multimedia validan nombres, referencias, tipos, tamaño entero, número entero de fragmentos y fechas tanto al crear como al completar el archivo.
- Realtime Database permitía leer globalmente la presencia antigua, al margen de la privacidad de las rutas nuevas. Esa ruta queda accesible solo para su titular y la administración autorizada. El cliente actual usa `presenceSessions` y `presenceLastSeen`, que mantienen sus filtros de privacidad.
- Los fragmentos cifrados solo admiten índices 0–19, coherentes con los 20 MB por archivo de esta versión. Se requiere propietario y se conservan las comprobaciones de autoría y tamaño del fragmento.

## Alcance de la revisión

Se revisaron perfiles/privacidad, contactos, consultas y operaciones de chats y mensajes, grupos/canales, encuestas, multimedia, presencia, llamadas, limpieza y acceso/acciones del dashboard. Se contrastaron las reglas con los flujos de lectura y escritura del cliente. No se rediseñaron pantallas ni se añadieron servicios.

Se compararon las reglas publicadas con los archivos originales antes de modificarlos y coincidían. Se comprobó la compatibilidad de los campos existentes mediante un resumen de esquema sin mostrar identidades o valores personales. Las pruebas de escritura usan exclusivamente el proyecto demo de los emuladores. La publicación de reglas no requiere editar perfiles ni mensajes reales.

No hay integración de `firebase/storage` en el cliente ni publicación de reglas de Cloud Storage en el proyecto inspeccionado. Los archivos de esta implementación usan fragmentos cifrados en Realtime Database y metadatos con permisos en Firestore. La consulta del inventario de buckets devolvió HTTP 403; no se certifica el contenido o IAM de buckets ajenos a la implementación inspeccionada. No se habilita Cloud Storage, ninguna API adicional, servidor, plan Blaze ni servicio de pago.

La configuración administrativa sigue exigiendo UID y correo verificado del propietario, proveedor admitido y habilitación administrativa. Los clientes no pueden modificar esa autoridad ni leer las credenciales privadas de invitados, incluido el dashboard. Los límites del Assistant y su auditoría se conservan.

## Verificaciones

- TypeScript, documentación, compilación de Hosting y 167 pruebas unitarias existentes.
- Dieciocho casos nuevos de permisos y validación en emuladores. Antes del endurecimiento, ocho grupos de comprobaciones reproducían fallos de esquema, inmutabilidad, presencia o índices; después se rechazan esas operaciones y se permiten las válidas.
- Trece suites emuladas: identidad propietaria, ámbito administrativo, acciones, edición, lecturas, limpieza, contactos, canales, política de mensajes, encuestas anónimas, alta/recuperación de invitados y capacidades del Assistant, además de la auditoría nueva. Se prueban permisos de Google y contraseña, identidades ajenas, ausencia de sesión y accesos sin verificar.
- Dieciséis visitas a portada, acceso del dashboard, guía y página de error a 320, 390, 820 y 1440 px.
- Treinta y seis recorridos de mensajes: copiar, reacciones y menús, permisos de respuesta/información, eliminación y encuestas privadas, a 390/820/1440 px en claro y oscuro.
- Ciento cincuenta comprobaciones de Ajustes: 25 apartados, tres tamaños y dos temas. Se usa el componente real con datos y componentes ajenos al recorrido simulados; no equivale a probar cada función interna de esos componentes.
- Cinco recorridos adicionales de errores transitorios de contactos y de navegación/retroceso al ampliar Ajustes.
- Validación `--dry-run` de las reglas de ambos servicios antes de publicarlas. Tras publicar se compara su contenido activo con el repositorio y se comprueban los archivos de Hosting.

La prueba de alta de invitados se repitió después de corregir el entorno local: un fallo del supervisor de emuladores había detenido Authentication, mientras los emuladores Java seguían activos. No era un fallo del acceso publicado. Los casos finales usan los tres servicios demo disponibles.

La auditoría de seguridad nueva queda añadida al flujo de GitHub mediante emuladores y Java 21, sin credenciales ni datos de producción.

## Límites y pendientes

La revisión no garantiza ausencia de cualquier vulnerabilidad ni prueba física de Android/iPhone. Audio, Bluetooth, bloqueo de pantalla, llamadas reales entre equipos, notificaciones remotas y rendimiento en equipos de poca memoria siguen pendientes de comprobación física.

Los permisos privados de configuración admiten estructuras variables y requieren seguir acotando cada formato conforme evolucione la aplicación. Las reglas limitan el tamaño de documentos y archivos concretos, pero no implementan una cuota transaccional por cuenta entre Firestore y Realtime Database; no se garantiza protección completa frente a consumo abusivo de la cuota gratuita.

La caducidad de mensajes temporales y el borrado mensual siguen dependiendo de la lógica del cliente y de la limpieza autorizada. Las reglas actuales pueden permitir que un miembro autorizado consulte un mensaje vencido que todavía exista. Ocultarlo en la interfaz no equivale a borrarlo del servidor ni a impedir todas sus lecturas. Reforzar esa caducidad requiere adaptar consultas y migrar el modelo de historial; no se hizo una migración masiva de mensajes dentro de esta revisión ni se habilitó un proceso de pago. El borrado íntegro de invitados a los treinta días también sigue pendiente bajo las restricciones vigentes.

Los porcentajes informados se limitan a los casos ejecutados de esta revisión; no describen el porcentaje global de Nexus ni una equivalencia completa con WhatsApp.

Evaluación estructurada: [resultado de la auditoría](AUDITORIA-26.95.1.json). Guías utilizadas: [auditor de reglas de Firebase](https://firebase.google.com/docs/rules), [condiciones de Firestore](https://firebase.google.com/docs/firestore/security/rules-conditions), [validación de Realtime Database](https://firebase.google.com/docs/database/security), [emuladores](https://firebase.google.com/docs/rules/unit-tests).
