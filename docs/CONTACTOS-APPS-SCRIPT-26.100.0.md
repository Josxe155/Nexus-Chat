# Contactos con Apps Script — v26.100.0

## Estado

Implementación preparada. La web publicada permanece en v26.99.0 hasta que el propietario publique la revisión 3 de Apps Script. La revisión 2 fue autorizada y respondió `ok:true`, pero solo diagnostica acceso y no incluye el retorno a Nexus necesario para esta entrega. La URL pública no permite editar ni desplegar su proyecto; ese paso debe hacerlo el propietario.

El archivo completo es [Code.gs](../integrations/google-contacts-apps-script/Code.gs). Incluye la función `autorizarYComprobarCuenta`; no hace falta volver a añadirla al final. Conservar el manifiesto con contactos, correo, People v1 y ejecución como usuario que accede. Reemplazar código.gs, guardar y publicar Nueva versión. GET `/exec` debe responder `ok:true`, `revision:3` y `protocolo:nexus-contacts-preview-v1`.

## Recorrido

Se mantiene la disposición de las referencias de Nuevo contacto y Editar contacto. La opción no se muestra a invitados y exige un correo verificado.

1. Activar Sincronizar con Google abre la aplicación del propietario en una ventana separada. Cada visitante autoriza su propia cuenta, y el script comprueba que el usuario activo y el efectivo coincidan.
2. Pulsar Continuar en Nexus Chat devuelve una confirmación a la dirección principal de Nexus. El control solo se activa si el correo devuelto corresponde al de la sesión de Firebase. No basta con abrir una página o recibir HTTP 200.
3. Pulsar Guardar reserva una ventana en el gesto del usuario, antes de las consultas asíncronas. Nexus comprueba el usuario/número existente y guarda el alias privado como hasta ahora. El contacto no registrado no se envía a Google y no abre conversación.
4. Un formulario POST lleva el borrador a Apps Script. No se usa `fetch` entre orígenes ni se transfieren tokens OAuth, cookies o credenciales de Firebase al script. La vista previa externa muestra alias/cuenta y exige Guardar contacto.
5. El servicio crea o actualiza el vínculo, conserva campos ajenos y comprueba la versión. El número de Nexus es un campo personalizado, no un teléfono real. No se exportan chats, multimedia ni credenciales.
6. Después de guardar, Volver a Nexus Chat lleva el recibo a la página de retorno. Nexus abre la conversación o cierra la edición solo después de comprobarlo. Si Google falla, el contacto Nexus ya guardado se conserva y el borrador permanece abierto; su aviso desaparece a los tres segundos. Desactivar Google permite completar el guardado en Nexus.

Los enlaces de retorno requieren pulsación porque HtmlService restringe la navegación de su iframe. La autorización inicial y el guardado son acciones distintas. No se crea un nuevo menú de configuración.

## Retorno y cancelación

Cada operación tiene un identificador criptográfico aleatorio y cinco minutos de vigencia. El recibo debe coincidir en protocolo, operación, estado y correo. El origen de retorno está fijado a `https://nexus-chat-nc.web.app`; no se aceptan URLs arbitrarias. Esta dirección es también la única habilitada en el cliente para iniciar el recorrido.

La página de retorno recibe solo estado, operación, correo y resultado; nunca el alias o número. Borra el fragmento antes de cargar datos de la operación y usa `localStorage` del mismo origen para avisar a la pestaña inicial. Esto permite el retorno aunque Google aísle la ventana y se pierda `window.opener`. Los identificadores de operación y recibos temporales se retiran al consumirlos, cancelar o vencer. El correo forma parte del recibo temporal y se elimina al consumirlo; no se guardan tokens de Google. Si la pestaña termina abruptamente, los recibos vencidos se limpian en el siguiente uso de esta integración. El almacenamiento del sitio debe estar disponible y la pestaña original debe permanecer abierta.

Cancelar, desmontar el formulario o cambiar la sesión descarta la espera local. No revoca una escritura ya ejecutada en Google ni garantiza cerrar una ventana aislada por el navegador. El usuario no debe continuar con Guardar en una ventana cuya operación ya canceló. Los borradores del script caducan a los cinco minutos. Sus recibos privados de deduplicación conservan el vínculo o `pending` para impedir un segundo create después de una respuesta incierta. No hay reintentos automáticos de escritura.

Este resultado es una confirmación de interfaz y no autoriza operaciones de Firebase. Las reglas y los permisos de Firebase permanecen iguales. No se habilitan eliminaciones de contactos, importación masiva, sincronización inversa ni tareas en segundo plano.

## Verificación

- TypeScript y compilación de Hosting correctos.
- 20 pruebas del código de Apps Script con servicios simulados.
- 12 pruebas del transporte y página de retorno: cuenta diferente, invitados, correo no verificado, popup bloqueado/cerrado, cancelación, cambio de sesión, vencimiento, borrador inválido, recibo adulterado y almacenamiento bloqueado.
- 27 recorridos de Chromium sobre los formularios reales y el código real de Apps Script con People/Firebase simulados. Celular 9/9, tablet 9/9, computadora 9/9: 100 % de esos casos, no del proyecto completo.
- Por tamaño: crear y editar, repetir sin duplicado, ausencia de desbordamiento en ambos formularios, fallo de Google con conservación del contacto/borrador y aviso de tres segundos, invitados sin opción y bloqueo de popup sin falso éxito.
- El simulador aplica iframe con restricciones de HtmlService y `Cross-Origin-Opener-Policy: same-origin` para verificar el retorno sin opener. No se realizaron escrituras en agendas reales ni datos de producción.

Pendientes: publicación del script real, primer guardado consentido, segunda cuenta de Google y pruebas físicas Android/iPhone. El consentimiento previamente demostrado por el propietario no acredita todavía estas escrituras ni el recorrido entre ambas aplicaciones.

## Fuentes oficiales

- [WhatsApp: agregar y administrar contactos](https://faq.whatsapp.com/5472030609512325/).
- [WhatsApp: contactos en la cuenta](https://blog.whatsapp.com/making-it-easier-to-add-and-manage-contacts).
- [Google: aplicaciones web y usuario de ejecución](https://developers.google.com/apps-script/guides/web).
- [Google: comunicación desde HtmlService](https://developers.google.com/apps-script/guides/html/communication).
- [Google: restricciones de iframe y navegación](https://developers.google.com/apps-script/guides/html/restrictions).
- [People API: lectura, escritura, paginación y versiones](https://developers.google.com/people/v1/contacts).
