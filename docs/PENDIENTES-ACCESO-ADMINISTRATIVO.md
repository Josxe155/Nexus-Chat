# Acceso administrativo a invitados y tareas aplazadas

Estado: propuesta pendiente, 11 de noviembre de 2026. No hay una nueva función de acceso publicada ni contraseñas de invitados generadas por esta tarea.

## Prioridad actual

Se solicitó generar un código privado al crear una cuenta de invitado y usar el nombre de usuario más ese código desde el dashboard para abrir dicha cuenta durante cinco horas, sin mostrar esos datos en la interfaz del invitado.

Las cuentas actuales usan Firebase Authentication anónima (`signInAnonymously`). Un campo de Firestore no es una credencial de Authentication y no permite obtener una sesión de otro UID. El código del navegador tampoco puede custodiar una credencial administrativa para emitir sesiones como otros usuarios.

El propietario confirmó mantener la web sin servidor y dejar pendiente la alternativa de una función administrada de Firebase que requiere Blaze. No se enlazan credenciales ocultas de correo/contraseña a los invitados ni se sustituye su identidad o sesión. No se han relajado las reglas de acceso.

La alternativa planteada, aún pendiente de aceptación, es una **vista administrativa de soporte**: usar la identidad verificada del propietario para inspeccionar una cuenta identificada por un código de referencia. Ese código no sería una contraseña de Firebase. La vista debería distinguirse claramente de un inicio de sesión real, registrar las acciones administrativas, limitar su duración y conservar la sesión y los datos del invitado.

Antes de implementarla se debe cerrar su alcance: datos visibles, operaciones permitidas y tratamiento de la caducidad. No se presentará un temporizador local como revocación de un token de Authentication ni se prometerá borrado físico automático de registros con la web cerrada.

Fuentes técnicas oficiales: [autenticación anónima](https://firebase.google.com/docs/auth/web/anonymous-auth) y [creación de tokens personalizados](https://firebase.google.com/docs/auth/admin/create-custom-tokens).

## Otros pendientes solicitados

1. Pantalla de cuenta bloqueada con el logo de Nexus y un mensaje claro. Un reporte por sí solo no debe confundirse con una sanción aplicada; falta definir el estado de moderación que activa la pantalla.
2. Ampliar las modificaciones operativas de Nexus Assistant, con cambios concretos, auditoría y protección de identidad, permisos, credenciales y datos importantes. No se amplían permisos en esta tarea.
3. Lectura multimedia del Assistant: localizar archivos desde su estructura en la base de datos, consultar metadatos y distinguirlos del análisis real de imágenes, videos o documentos. Queda aplazada por la prioridad actual de acceso administrativo; no se afirma que ya se envíen esos archivos al modelo.

## Avance verificable

La implementación del nuevo acceso no ha empezado: celular 0 %, tablet 0 % y computadora 0 %. La revisión técnica y este registro de pendientes no cuentan como una función implementada o probada. La última versión funcional publicada continúa siendo v26.91.1.
