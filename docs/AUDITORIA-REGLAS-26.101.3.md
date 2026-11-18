# Auditoría de Firebase — v26.101.3

Revisión del 18 de noviembre de 2026. Alcance: reglas de Firestore y Realtime Database, sus consumidores y operaciones válidas y adversarias con datos sintéticos. No se leen conversaciones de producción ni se ejecutan limpiezas reales para probarlas.

## Correcciones

- Los documentos privados `settings`, `google-contacts`, `accountReports` y `preferences` validan sus campos y formatos tanto al crear como al actualizar. La preferencia de contactos exige el correo verificado del titular y no acepta campos de tokens. Las duraciones son desactivado, 24 horas, 7 días y 90 días; hasta tres chats fijados, distintos y con identificadores válidos. Se conservan campos raíz anteriores ajenos a estos modelos sin permitir alterarlos.
- Una vista previa nueva requiere un mensaje del remitente creado en la misma operación y coincidir con sus datos. Una edición o eliminación del resumen requiere modificar el mensaje correspondiente. Se rechazan vistas previas inventadas o cambios independientes del contenido real.
- Los contadores iniciales solo pueden ser cero y pertenecer a participantes. Un miembro puede reiniciar su propio contador; para modificar los de otros necesita crear un mensaje propio en la misma operación. Se rechazan objetos, listas, valores negativos, decimales, booleanos, nulos, texto no numérico, delimitadores y valores de más de diez cifras. También se admiten cadenas de dígitos: son metadatos de interfaz y no conceden permisos. La regla no certifica que cada incremento equivalga exactamente a una unidad por destinatario.
- La edición de un mensaje temporal, también desde Nexus Assistant, mantiene «Mensaje temporal» en el resumen compartido, sin copiar allí el texto. Editar un mensaje sin cambiar el contenido ya no intenta una escritura innecesaria que podía producir un error de permisos.
- El último mensaje ajeno de un grupo se puede eliminar por su administrador dentro del plazo existente; un administrador del canal puede editar la última publicación de otro administrador. El resumen sigue al mensaje sin exigir que su autor sea quien lo modera. Los permisos sobre el mensaje y sus plazos permanecen obligatorios.

La validación de contadores evita recorrer individualmente cien valores: hacerlo excedía el presupuesto de evaluación de las reglas. La batería incluye el envío real mediante SDK a un grupo sintético de cien miembros. No se reduce el límite de miembros ni se añade una escritura por destinatario.

## Permisos revisados

- Dashboard: identidad del propietario, correo verificado, proveedor admitido y autorización habilitada. Los clientes no pueden concederse el rol ni modificar la política del propietario.
- Datos privados: propiedad del documento; los documentos públicos de perfil no admiten campos arbitrarios de credenciales. Se conservan las excepciones administrativas expresas del modelo actual.
- Invitados y retención: vencimiento por inactividad, marcadores de eliminación y acceso a credenciales privadas; pruebas de mensajes temporales vencidos y conservación.
- Multimedia: permisos sobre manifiestos y claves en Firestore, visualización única, caducidad y destinatarios. Los bloques de Realtime Database son archivos cifrados; la lectura de bloques por usuarios autenticados no implica acceso libre a las claves del manifiesto.
- Realtime Database: acceso al dashboard, actividad de invitados, señalización, presencia y archivos según la batería existente. No se modifican estas reglas por no reproducirse una corrección necesaria en su alcance.

Los ajustes nuevos no sustituyen las validaciones ya existentes de perfiles, canales, encuestas, moderación, limpieza y acceso. No se añaden permisos administrativos generales.

## Comprobación y publicación

Resultados locales: **veinte suites de emuladores aprobadas**, con datos sintéticos y sin escrituras en producción. Incluyen **34 casos nuevos de ajustes privados**, **17 de integridad del chat**, **13 de política de edición/eliminación** y la regresión ampliada de Assistant con **13 casos**. Los comandos de edición también comprueban los temporales. Se aprobaron TypeScript, documentación, **251 pruebas unitarias**, la compilación de Hosting y la compilación de reglas mediante `firebase deploy --only firestore:rules --dry-run`. Las suites nuevas quedan incorporadas al control de GitHub.

Los resultados de emulador no son porcentajes de avance por dispositivo. La interfaz no cambia de diseño en esta entrega. La comprobación pública posterior debe revisar entrada, dashboard, guía y recuperación a 390, 820 y 1440 píxeles; las pruebas físicas de Android, iPhone y Samsung Internet siguen pendientes.

La comparación inicial confirmó que las reglas publicadas de ambos servicios coincidían con el repositorio anterior. La comparación posterior al despliegue debe confirmar la coincidencia con esta entrega. No se actualizan datos históricos ni se ejecuta un borrado masivo como parte del despliegue de reglas. Los clientes con código anterior pueden necesitar actualizar la página para las operaciones endurecidas.

## Condiciones pendientes antes de promoción

**Una clave privada en código JavaScript sigue estando en el frontend.** Aunque no aparezca en la interfaz ni se guarde en Git, puede extraerse de la compilación o de las peticiones del navegador. La revisión anterior confirmó claves compartidas de servicios de IA en los archivos publicados. Esta entrega de reglas no las oculta ni las retira, y no reproduce sus valores. Deben retirarse del cliente y rotarse las que se distribuyeron antes de presentar el sitio como apto para una apertura pública irrestricta. La configuración pública de Firebase es distinta: su seguridad depende de Authentication y de las reglas, no de ocultar su clave identificadora.

Se mantiene la restricción de no añadir servidores propios, Blaze ni servicios de pago. No se desactivan funciones de IA ni se introducen menús sin definir el cambio de producto. Los documentos privados con otros identificadores todavía mantienen la validación genérica de propiedad; endurecerlos requiere inventariar sus formatos. Las pruebas automatizadas no garantizan ausencia de todo error, abuso de cuotas ni validación física en todos los teléfonos y navegadores.

El [informe estructurado](AUDITORIA-REGLAS-26.101.3.json) puntúa únicamente el alcance de las reglas, no la preparación global para producción.

## Fuentes oficiales

- [Firebase: condiciones de reglas](https://firebase.google.com/docs/firestore/security/rules-conditions).
- [Firebase: validación de campos](https://firebase.google.com/docs/firestore/security/rules-fields).
- [Firebase: operaciones atómicas y getAfter](https://firebase.google.com/docs/firestore/manage-data/transactions#data_validation_for_atomic_operations).
- [Firebase: límites de reglas](https://firebase.google.com/docs/firestore/quotas#security_rules).
- [Firebase: pruebas de seguridad](https://firebase.google.com/docs/rules/unit-tests).
- [Firebase: claves API públicas y seguridad](https://firebase.google.com/docs/projects/api-keys).
- [Realtime Database: reglas de seguridad](https://firebase.google.com/docs/database/security).
