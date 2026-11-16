# Acceso a invitados y tareas aplazadas

Estado del código: v26.92.0, 16 de noviembre de 2026.

## Acceso implementado

Las nuevas cuentas de invitado se enlazan a un correo técnico y una contraseña aleatoria conservados en una colección privada de Firestore. El invitado solo escribe su apodo. Un administrador con permisos IAM sobre la base puede consultar las credenciales y entrar por el formulario existente de correo y contraseña. No se añade nada al dashboard ni se admite nombre de usuario en ese formulario.

El alcance, las limitaciones y el procedimiento están en [Credenciales de invitados](INVITADOS-CREDENCIALES.md). El límite de cinco horas quedó descartado. Las cuentas anónimas anteriores no se migran.

## Pendientes

1. Borrado completo de cuentas de invitado y todos sus datos tras treinta días. No se presenta la limpieza desde el navegador como ejecución garantizada con la web cerrada; se mantiene la restricción de no usar servidor ni Blaze.
2. Pantalla de cuenta bloqueada con el logo de Nexus y un mensaje claro. Un reporte no debe confundirse con una sanción aplicada.
3. Ampliar las modificaciones operativas de Nexus Assistant, con cambios concretos, auditoría y protección de identidad, permisos, credenciales y datos importantes. Esta entrega no amplía sus permisos.
4. Lectura multimedia del Assistant: localizar archivos, consultar metadatos y distinguirlos del análisis real de imágenes, videos o documentos. Esta entrega no incorpora ese análisis.

Los porcentajes de comprobaciones de una entrega describen únicamente sus casos terminados y verificados por tamaño de pantalla; no son un porcentaje de finalización de Nexus Chat ni de pruebas en dispositivos físicos.
