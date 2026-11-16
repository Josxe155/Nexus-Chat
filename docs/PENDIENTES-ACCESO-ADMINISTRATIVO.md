# Acceso a invitados y tareas aplazadas

Estado del código: v26.93.1, 16 de noviembre de 2026.

## Acceso implementado

Las nuevas cuentas de invitado se enlazan a un correo técnico y una contraseña aleatoria conservados en una colección privada de Firestore. El invitado solo escribe su apodo. Un administrador con permisos IAM sobre la base puede consultar las credenciales y entrar por el formulario existente de correo y contraseña. No se añade nada al dashboard ni se admite nombre de usuario en ese formulario.

El alcance, las limitaciones y el procedimiento están en [Credenciales de invitados](INVITADOS-CREDENCIALES.md). El límite de cinco horas quedó descartado. Las cuentas anónimas anteriores no se migran.

## Pendientes

1. Borrado completo de cuentas de invitado y todos sus datos tras treinta días. No se presenta la limpieza desde el navegador como ejecución garantizada con la web cerrada; se mantiene la restricción de no usar servidor ni Blaze.
2. Completar la revisión en dispositivos físicos, copias/restauración e interfaces con las referencias pendientes.
3. Ampliar los formatos de documentos y el tamaño de análisis del Assistant cuando pueda verificarse su funcionamiento en el navegador. Esta entrega admite hasta 8 MB acumulados por consulta.
4. Refinamiento artístico de bordes del logo y legibilidad de tamaños pequeños; la transparencia y la unificación de los recursos ya se verificaron.

## Completado en v26.93.0

Pantalla de cuenta bloqueada, búsquedas paginadas, cambios auditados de mensajes y lectura multimedia real del Assistant. Se mantiene la protección de cuentas, permisos y credenciales. [Alcance y comprobaciones](CAPACIDADES-ASSISTANT-26.93.0.md).

Los porcentajes de comprobaciones de una entrega describen únicamente sus casos terminados y verificados por tamaño de pantalla; no son un porcentaje de finalización de Nexus Chat ni de pruebas en dispositivos físicos.
