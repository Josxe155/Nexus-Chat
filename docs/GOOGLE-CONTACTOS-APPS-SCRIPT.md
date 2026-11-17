# Preparación de contactos mediante Apps Script

Estado del 17 de noviembre de 2026: código preparado y probado localmente; pendiente de publicar en el proyecto del propietario y conectar el recorrido de navegador. La web publicada sigue en v26.99.0 con su integración directa de People API. No se presenta el nuevo enlace como una sincronización activa.

## Evidencia y alcance

El propietario mostró una respuesta `{ok:true}` de la prueba de lectura de contactos. Esto acredita esa lectura con la cuenta que autorizó la prueba. No acredita escritura, acceso de otra cuenta, sincronización desde Nexus ni funcionamiento en segundo plano.

La URL de implementación proporcionada es:

`https://script.google.com/macros/s/AKfycbxWlEBOLpct55599Ucn1VCy4e5OP_YXdvZrw2lIiHWdfjvhHpodIHnlP7rgWqYzRvuvcQ/exec`

La URL pública no permite editar el proyecto. No se dispone de acceso al editor ni de una herramienta autorizada de despliegue de ese proyecto. La actualización del script debe realizarla su propietario. No se añade esta URL a `fetch` en Nexus: un consentimiento concedido dentro de Apps Script no entrega automáticamente un token a la integración existente de navegador ni evita las restricciones entre orígenes.

## Archivo listo para instalar

1. Abrir [Code.gs](../integrations/google-contacts-apps-script/Code.gs), copiar su contenido completo y reemplazar el contenido de `código.gs` en el proyecto del propietario. El código incluye toda la vista previa; no requiere crear otro archivo HTML.
2. Mantener el servicio avanzado **People v1** añadido. People API debe estar habilitada en el proyecto Cloud asociado.
3. Si el proyecto tiene permisos OAuth explícitos, incorporar los dos ámbitos del [manifiesto](../integrations/google-contacts-apps-script/appsscript.json): contactos y correo de la cuenta. El manifiesto completo es para este proyecto dedicado; no reemplazar el de otro proyecto que tenga servicios adicionales. Con detección automática, Apps Script infiere los permisos del código.
4. Guardar. Abrir Implementar → Administrar implementaciones → lápiz → Nueva versión. **Ejecutar como: usuario que accede a la aplicación web**. Acceso: usuarios con cuenta de Google, según las opciones disponibles para esa cuenta.
5. Implementar y abrir la URL `/exec`. Autorizar los permisos de contactos y correo si Google lo solicita. Si hay problemas con varias cuentas abiertas, probar en incógnito iniciando una sola cuenta.
6. La respuesta correcta incluye `ok:true`, `protocolo:"nexus-contacts-preview-v1"` y el mensaje de conexión. No escribir contactos reales solo para obtener este estado: el GET no escribe nada.

## Funciones preparadas

- GET: comprueba usuario activo/efectivo y lectura de People API; devuelve únicamente estado y versión del protocolo. No expone la agenda ni el correo en JSON.
- POST de formulario: valida el campo `contact` como JSON con `owner`, `uid`, `email`, `first`, `last`, `username` y `phone`. Solo prepara una vista previa en la sesión Google del solicitante; no escribe al recibir el POST. No admite un destino arbitrario ni comandos administrativos.
- La vista previa muestra alias y cuenta de destino con texto escapado. Su botón Guardar llama a `google.script.run` con un ticket aleatorio, privado por usuario, que caduca a los cinco minutos. Este es un paso de la autorización externa; no es un nuevo menú de Nexus ni una reproducción de una referencia de WhatsApp.
- Guardado: comprueba de nuevo la cuenta, bloquea escrituras simultáneas del mismo usuario, recorre la agenda y crea o actualiza solo el contacto con el vínculo Nexus correspondiente. No permite eliminar contactos ni consultar Firebase.
- El número Nexus se guarda como campo personalizado. No se inventa un teléfono real ni se exportan conversaciones, fotos, contraseñas o tokens. No se sobrescriben teléfonos reales, correos ni otros campos de la agenda.
- Las actualizaciones incluyen la versión del contacto. Los recibos privados por usuario conservan solo el vínculo o `pending`. Si una creación tiene respuesta incierta, otro intento busca el contacto y evita duplicarlo si todavía no aparece. Los borradores caducan; los recibos de deduplicación persisten. No se crea una segunda copia automáticamente para resolver errores.

La comprobación de correo solo se refiere a la cuenta Google que ejecuta el script. Los identificadores de Nexus enviados por el cliente son etiquetas del vínculo; no otorgan permisos sobre Firebase ni acreditan una sesión Firebase. La comprobación de usuario registrado y correo de Nexus seguirá siendo responsabilidad de la aplicación antes de enviar un borrador.

## Validación y pendientes

Ejecutar desde la raíz: `node scripts/google-contacts-apps-script.test.cjs`.

Se aprobaron 15 pruebas con servicios simulados: GET sin escritura ni datos personales, identidad efectiva, vista previa segura, validación, tickets, creación, actualización con conservación de campos, paginación, lecturas incompletas, duplicados/etag, respuesta perdida, recuperación y bloqueo/cambio de cuenta, y manifiesto limitado.

Pendientes necesarios antes de activar el nuevo recorrido:

- Publicación de este archivo por el propietario y comprobación de su marcador de protocolo.
- Probar con dos cuentas que el destino es la cuenta del visitante, no la del propietario del script.
- Implementar y probar en Nexus el envío por formulario y el retorno de resultado. No basta con sustituir la URL de People API por `/exec`; deben resolverse autorización, ventanas bloqueadas, cancelación, errores y estado del formulario sin afirmar un guardado no confirmado.
- Escritura real de un contacto de prueba autorizada por su propietario, repetición sin duplicado y conservación de sus otros campos. No se han realizado escrituras reales de agenda en esta preparación.
- Recorrido de navegador y pruebas físicas. Avance de la integración del enlace por dispositivo: celular, tablet y computadora pendientes; no hay un porcentaje de funcionamiento real acreditado.

Esta preparación no cambia Firebase Hosting, las reglas ni los datos de usuarios. No requiere contratar un servidor ni activar Blaze. Apps Script ejecuta código en la infraestructura de Google y tiene sus propias cuotas y requisitos de consentimiento/verificación.

## Fuentes oficiales

- [Servicio avanzado de People](https://developers.google.com/apps-script/advanced/people).
- [Administración de contactos y control de versiones](https://developers.google.com/people/v1/contacts).
- [Aplicaciones web, ejecución y permisos](https://developers.google.com/apps-script/guides/web).
- [Comunicación con funciones de Apps Script](https://developers.google.com/apps-script/guides/html/communication).
- [Restricciones del entorno HTML](https://developers.google.com/apps-script/guides/html/restrictions).
- [Problemas con varias cuentas abiertas](https://developers.google.com/apps-script/guides/support/troubleshooting#issues_with_multiple_google_accounts).
