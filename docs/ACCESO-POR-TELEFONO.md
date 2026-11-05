> Actualización 27/10/2026: el acceso y la verificación por SMS se retiraron. El teléfono actual es un dato privado sin verificar. Consulta REGISTRO-Y-PROTECCION.md. El contenido siguiente conserva la revisión histórica anterior.

# Acceso por teléfono

Se añadió «Usar número de teléfono» al acceso de Nexus Chat. Solicita nombre, número con prefijo internacional y consentimiento para recibir el código y para el tratamiento del número por Google. Usa Firebase Authentication con reCAPTCHA y confirmación de seis dígitos. El número y el código no se guardan en documentos públicos, registros propios ni almacenamiento del navegador. Solo se conserva una marca de tiempo para esperar 60 segundos entre solicitudes desde el formulario.

El usuario puede reenviar el código, cambiar el número y volver a las opciones de acceso. Se limpian la comprobación de seguridad y la confirmación pendiente al salir del formulario. Los errores de número, código incorrecto, caducidad, cuota, seguridad y disponibilidad aparecen en español. La espera del formulario es una ayuda de interfaz; los controles reales contra abuso y las cuotas corresponden a Firebase.

Tras verificar el código se utiliza el mismo flujo de perfil que en Google y correo. No se publica el número como nombre, nombre de usuario ni foto. El acceso por teléfono es independiente: no fusiona automáticamente una cuenta existente de Google, correo o invitado. Desde Editar perfil se puede verificar y vincular un número a la cuenta actual, conservando su identificador; no se fusionan cuentas basándose en datos escritos por el usuario.

## Verificación y límites

Se comprueban con un proveedor simulado los formularios a 360 y 1366 píxeles: consentimiento, número inválido sin envío, código incorrecto, espera de reenvío, confirmación y ausencia de desbordamiento. No se envían SMS reales ni se crean cuentas de prueba en el proyecto. También se ejecutan la revisión de tipos, compilación y regresiones de la navegación móvil.

Queda pendiente una prueba real en el dominio HTTPS autorizado con un número de prueba configurado por el propietario, antes de probar SMS a un teléfono real. Los números ficticios y códigos de prueba deben configurarse en Firebase, no en el código público. No se desactiva reCAPTCHA en producción.

Habilitar el proveedor no garantiza el envío: también influyen las regiones SMS permitidas, el dominio autorizado, los controles contra abuso, las cuotas y el plan del proyecto. Los SMS reales de Firebase pueden requerir facturación y tener coste. No se cambió el plan ni se habilitó facturación. Google, correo e invitados siguen disponibles como alternativas.

Referencias oficiales: [Acceso por teléfono en la web](https://firebase.google.com/docs/auth/web/phone-auth), [Límites de Authentication](https://firebase.google.com/docs/auth/limits).

Los pendientes de backend HTTPS, almacenamiento persistente y publicación en Hosting siguen documentados en `RECUPERACION-FIRESTORE-Y-PREPARACION.md`.

Se comprobó y habilitó el método Teléfono de Authentication en el proyecto. La documentación vigente de Firebase indica que los SMS con códigos requieren el plan Blaze; no debe presentarse este método como envío gratuito de SMS. La verificación telefónica tampoco cambia automáticamente el requisito de correo verificado del sistema actual de reportes.
