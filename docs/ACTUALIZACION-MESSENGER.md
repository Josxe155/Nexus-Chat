> Revisión posterior de móvil y tablet: consulta REVISION-MOVIL-TABLET.md.

# Nexus Chat · actualización de mensajería

Se tomó como guía la distribución de WhatsApp Web y Messenger que compartió el usuario. Se mantiene la identidad Nexus Chat y Nexus AI. No hay una medida técnica que permita certificar una similitud del 99,9 % ni equivalencia con toda la plataforma de WhatsApp.

## Cambios de esta revisión

- Escritorio: barra lateral de 64 px, lista de conversaciones, cabecera compacta, menús flotantes que se mantienen dentro de la pantalla y configuración con vista previa a la derecha. Archivados pertenece a la barra lateral.
- Móvil y tablet: distribución de una pantalla, navegación inferior, archivados en la lista, cabecera de chat con llamadas y menú; la búsqueda y el enlace de llamada están dentro de ese menú. La distribución responde al tamaño y al tipo de entrada.
- Una sola superficie por burbuja, remitentes de grupo, mensajes reenviados, selección múltiple, respuesta mediante gesto en pantallas táctiles, menú con clic derecho y pulsación prolongada, e información de entrega por participante.
- Favoritos, chats fijados, mensajes destacados personales y mensajes fijados compartidos son conceptos distintos. Los destacados y las ocultaciones se guardan en documentos privados del usuario.
- Eliminar o vaciar para mí guarda un límite de historial personal. No borra el documento compartido ni los mensajes de otras personas. Eliminar para todos conserva un aviso de eliminación.
- Borradores por conversación y cuenta. Cola local de mensajes en IndexedDB que resiste una recarga sin conexión. Reintento con el mismo identificador para evitar duplicados.
- Historial por páginas de 80 mensajes con actualizaciones en tiempo real; cargar páginas anteriores conserva la posición de lectura. Saltar a un destacado antiguo carga el historial necesario.
- Entrega y lectura registradas por destinatario. En conversaciones individuales se respetan las confirmaciones desactivadas. En grupos se conservan. El indicador escribiendo pertenece al chat y caduca automáticamente.
- Reenvío a un máximo de cinco conversaciones; los archivos privados reciben una copia y una URL autorizada para el destino. Eliminar el original no destruye la copia. Se conserva la transferencia por fragmentos y el límite de almacenamiento.
- Silenciar un chat afecta a avisos y sonidos locales y a Web Push, incluidas las reacciones; las llamadas se configuran por separado.
- Exportación de conversación a texto, información de contacto, archivos cargados, bloqueo y acciones de grupo desde un panel dentro de la interfaz.
- Estados agrupados por persona, pantalla de visualización con barras de progreso, reproducción automática, pausa, anterior/siguiente, controles de audio/video, reacciones y borrado de estados propios. No se duplican personas entre recientes y vistos.
- Fondo vectorial original que se repite al desplazarse; se conservan los fondos importados, los 15 estilos existentes, los tonos y la personalización del micrófono y las burbujas.

## Verificación

- TypeScript sin errores y compilación de producción.
- 23 comprobaciones de mensajería en navegador, con datos ficticios; pantallas de 360, 390, 768, 1024 y 1366 px. Incluyen paginación de 181 mensajes, borradores, cola sin conexión tras recargar, envío, destacados, borrado personal, estados, tipografía y menús.
- 34 comprobaciones de configuración en navegador.
- 94 comprobaciones anteriores de Firestore y Realtime Database, más 23 nuevas sobre recibos, escritura, privacidad personal, historial, notas propias y envío sin duplicados, utilizando emuladores.
- 34 pruebas del backend: proveedores gratuitos, llamadas, archivos por fragmentos, permisos, informes, eliminación de cuenta y notificaciones. Dos pruebas nuevas verifican el reenvío independiente y el silenciamiento.
- Reglas de Firestore publicadas en nexus-chat-56d9d y verificadas por contenido; reglas de Realtime Database e índice de estados conservados.

Las pruebas de interfaz no escribieron conversaciones en Firebase real ni contactaron a otras personas. La publicación de reglas sí actualizó la configuración del proyecto autorizado. Las capturas usan contactos ficticios.

## Diferencias pendientes

No se ha implementado un protocolo auditado de cifrado de extremo a extremo ni vinculación criptográfica de dispositivos como WhatsApp. Los permisos de Firebase y los archivos autenticados son controles de acceso; no deben presentarse como E2EE. La información de seguridad en la aplicación distingue esta limitación.

Se necesita un dominio con HTTPS y alojamiento permanente para cámara, micrófono y notificaciones desde otros dispositivos fuera de localhost. Web Push requiere permiso, soporte del navegador y un backend en ejecución. Las restricciones de los navegadores impiden garantizar el bloqueo de capturas de pantalla, biometría nativa o ejecución continua en segundo plano como una aplicación instalada.

No se certificaron llamadas en todos los dispositivos físicos ni cargas de 2 GB en producción. Se probaron las reglas, fragmentos, rangos y permisos en pruebas controladas. El límite existente de llamadas es seis participantes y el almacenamiento privado depende del disco del backend.

Las funciones de referencia se contrastaron con [Mensajería de WhatsApp](https://www.whatsapp.com/messaging?lang=es), [Filtros de chats](https://about.fb.com/news/2024/04/whatsapp-chat-filters/) y [Listas personalizadas](https://blog.whatsapp.com/focus-on-what-matters-with-custom-lists). Los dibujos y tonos de Nexus son propios.

## Inicio

Ver README.md. Las claves privadas viven únicamente en server/.env, que no se incluye en el ZIP. No se incluyen datos de usuarios, medios privados, dependencias instaladas ni archivos de prueba temporales. El ZIP conserva el código y la compilación de producción.
