# Seguridad y llamadas

Estado vigente: 31/10/2026. El propietario eligió retirar el cifrado de extremo a extremo actual.

Los mensajes, encuestas, adjuntos y ubicaciones nuevos se envían sin cifrado de extremo a extremo y no dependen de claves del navegador. HTTPS protege el transporte; las reglas de Firestore limitan las conversaciones a sus miembros. Firebase y los administradores con acceso autorizado pueden acceder al contenido. El cifrado AES-GCM de los fragmentos multimedia continúa como formato de almacenamiento, con su clave en el manifiesto accesible a miembros: no constituye cifrado de extremo a extremo.

No se borraron conversaciones, identidades ni copias. Las marcas e2ee de chats antiguos son metadatos históricos y ya no condicionan el envío nuevo. Las reglas rechazan nuevos sobres cifrados e identidades; clientes antiguos deben actualizar. La interfaz de Seguridad informa del modelo actual. La cola reintenta los envíos locales que fallaron por claves, con el mismo ID para no duplicarlos.

Solo se conserva el lector del historial cifrado anterior, su recuperación local y la importación/exportación opcional de copias antiguas. Sin la clave o copia original no se puede reconstruir ese contenido. No se convierte ni se destruye el historial cifrado automáticamente. Los mensajes antiguos cifrados no se editan; se pueden eliminar con los permisos existentes.

Las llamadas de voz y video usan WebRTC, Firebase para señalización y Metered como relé cuando hace falta. Esta retirada del cifrado de mensajes no modifica el transporte cifrado de WebRTC ni añade servidores.

Revisión 31/10/2026: se reserva video bidireccional desde el inicio de las llamadas de voz; la recepción renueva los streams para activar el visor al llegar video. El cambio de cámara libera primero el hardware y restaura la cámara anterior si la trasera no está disponible. Las consultas de estados autorizan por audiencia; la caducidad se filtra en la consulta y en la interfaz, y se conserva en lecturas individuales, adjuntos y reacciones. Sin un proceso de limpieza, la caducidad visual no equivale a eliminación física del registro.

Avisos de llamadas, 31/10/2026: tarjeta entrante no modal con aceptar/rechazar; rechazo comunicado por Realtime Database y validado para el destinatario. Barra verde movible dentro de la página, controles rápidos, límites al área visible y restauración. Ocultar la pestaña minimiza la vista interna. Los avisos externos requieren permiso, respetan vistas previas y se cierran al terminar la invitación. No constituyen llamadas nativas ni garantizan ejecución con el navegador cerrado. El control de sonido silencia la recepción; no simula cambiar al auricular del teléfono.

Ampliación de llamadas, 31/10/2026: recuperación ICE con tres intentos por incidencia, mediciones aproximadas de latencia y pérdida de paquetes, respuesta de ocupado, coordinación de invitaciones entre pestañas, mano levantada, participantes y cambio de dispositivos durante la conexión. Silenciar a un participante solo cambia la escucha propia. Reincorporarse desde el historial exige una sala grupal o pública que siga abierta, vigente y autorizada. Los cambios de captura durante pantalla compartida requieren detenerla primero.

Ubicación en tiempo real: las coordenadas se sellan con el cifrado de Nexus para los participantes del chat, en registros separados con duración limitada y control del remitente. Las reglas no permiten que los destinatarios cambien las coordenadas ni prolonguen la duración. Se necesita permiso de ubicación y ejecución del navegador; no hay seguimiento nativo garantizado en segundo plano. Detener o caducar no borra físicamente el último registro cifrado.

Transcripción de voz: opción voluntaria por audio. Antes de enviarlo se informa de que Groq recibirá ese audio. Esta acción descifra el archivo para compartirlo con el proveedor autorizado por el usuario; no está protegida de extremo a extremo frente a ese proveedor. La transcripción permanece en memoria de la vista actual, sin guardarse automáticamente en Firebase. Las pruebas del recorrido utilizan una respuesta simulada y no consumen cuota real.
