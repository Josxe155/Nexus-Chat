# Dashboard y limpieza inmediata — v26.85.2

## Incidencia reproducida

El motor rechazaba cualquier fecha de bloqueo futura, aunque el plan estuviera en estado de error o finalizado. La interfaz solo consideraba «en uso» un plan en ejecución. Esa diferencia permitía habilitar el botón y recibir después «Hay una limpieza en curso en otra pestaña».

Se reprodujo con un plan sintético en estado `error` y bloqueo futuro. La lectura de metadatos del plan de producción encontró estado de error y bloqueo a cero; esa lectura no demuestra cuál era el estado exacto cuando el propietario vio el aviso. No se ejecutó una limpieza de producción para diagnosticarlo.

## Correcciones

- Un criterio compartido determina el bloqueo en mantenimiento, motor y planificación del Assistant. Un estado de error/finalizado no conserva la exclusión. Los bloqueos caducados o con fechas imposibles se pueden recuperar mediante la confirmación habitual; una ejecución vigente sigue impidiendo otra concurrente.
- Las nuevas ejecuciones renuevan su bloqueo cada 15 segundos, también durante lecturas iniciales y esperas. El plazo es de 90 segundos desde la última renovación. Al terminar o fallar se retiran identificador de ejecución y fecha de corte manual, y el bloqueo queda a cero. La interfaz muestra cuánto falta para caducar si no hay actividad.
- El motor compara con la hora de Firebase. El dashboard escucha la hora de la instancia de Realtime Database de su sesión, incluida la cuenta alternativa. El calendario mensual utiliza meses de Ecuador y ajusta los últimos días de febrero.
- Los controles de limpieza requieren conexión. Los errores de permisos, conexión y configuración se traducen a mensajes comprensibles.
- Se siguen exigiendo «LIMPIAR AHORA» y confirmación del navegador para la ejecución inmediata. Se conserva la fecha del plan mensual y su estado activo/pausado. La limpieza programada sigue necesitando el dashboard abierto; no se añade servidor propio ni plan de pago.
- Se preservan cuentas, perfiles, contactos, grupos y comunidades. Los mensajes conservados y sus archivos quedan fuera del borrado. La paginación avanza aunque un lote entero contenga conservados, evitando un bucle. Se retiran referencias de fijados a mensajes eliminados y se mantienen las de mensajes retenidos.
- Las reglas de Firestore exigen una ejecución con bloqueo vigente también para el borrado programado y excluyen los mensajes conservados. No se amplían permisos administrativos ni se modifican reglas de Realtime Database.
- Si falla una retirada de multimedia en Realtime Database, su ficha no se elimina de Firestore. Las dos bases no comparten una transacción; puede haber avance parcial y se permite retomar. La conservación de perfiles se comprueba antes de procesar multimedia.
- Mantenimiento y Avisos oficiales retiran sus mensajes de resultado/error a los tres segundos. Liberar historial local funciona también sin Cache Storage. La planificación del Assistant elimina campos residuales de ejecuciones anteriores al actualizar un plan.

## Validación

- 6 pruebas de estado del bloqueo, calendario, marcas de tiempo y errores, añadidas a GitHub Actions; 42 pruebas existentes de Assistant, propietario, cuentas, contactos y texto enriquecido.
- 15 recorridos contra Firestore y Realtime Database emulados con las reglas del proyecto: limpieza inmediata, bloqueo residual, exclusión, recuperación, permisos, calendario vencido/no vencido, conservación, ambas bases, más de 200 conservados, fallos intermedios, reintentos, rechazo por reglas, reloj adelantado y renovación durante una espera real de 17 segundos. Solo datos sintéticos.
- Regresión adicional de las acciones administrativas del Assistant en los emuladores: preparación, creación/actualización/eliminación, auditoría, cambios concurrentes, calendario y Realtime Database.
- Chromium con componentes reales del dashboard y servicios simulados: 320, 390, 820 y 1440 px; confirmación/cancelación, caducidad, desconexión, errores, borrado local sin caché y avisos temporales. No se publica ningún aviso real durante la prueba.
- TypeScript, documentación y compilación de Hosting.

Avance de la comprobación visual de este cambio en navegador: celular 2/2 tamaños (100%), tablet 1/1 (100%), computadora 1/1 (100%). Estos porcentajes no representan el proyecto completo, pruebas físicas en dispositivos ni un borrado real de producción.

Para repetir las pruebas de integración, inicia emuladores locales con el proyecto `demo-nexus`: Firestore en `127.0.0.1:8085` y Realtime Database en `127.0.0.1:9015`; ejecuta `npm run test:cleanup:emulators`. El script carga las reglas y reinicia únicamente ese entorno de prueba. La CLI de emuladores puede necesitar un entorno que respete las conexiones locales cuando hay un proxy global.
