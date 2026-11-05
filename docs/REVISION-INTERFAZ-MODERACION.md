# Interfaz, canales y reportes

Actualización: 27 de octubre de 2026.

## Cambios implementados

- Paleta uniforme en paneles, menús, información del contacto/grupo, controles y barras de desplazamiento. Grafito, verde, azul y violeta; cada una admite modo claro y oscuro. La selección se conserva en el navegador. Los fondos y burbujas personalizados conservan su ajuste.
- La pantalla de acceso tiene un diseño neutro con claro/oscuro independiente de la paleta. No se ha cambiado la pantalla de inicio/carga.
- Avatar predeterminado circular, incluyendo el recorte inferior de la silueta. Se retiran los marcos y fondos verdes de la información del contacto/grupo; se conservan sus apartados y acciones.
- El contador de Archivados en móvil y tablet indica el total de mensajes sin leer: tres mensajes en una conversación suman tres; dos conversaciones con un mensaje cada una suman dos. Los chats archivados ya leídos no suman. En computadora se mantiene el acceso lateral y su contador de conversaciones pendientes, conforme a la referencia de escritorio.
- Los canales se excluyen de Chats y de su contador de mensajes pendientes. Se consultan desde Novedades en móvil/tablet y Canales en computadora. La navegación de una publicación mantiene esa sección.
- Creación de canal con nombre y descripción, edición por administradores, imagen del canal, seguir/dejar de seguir y activar/silenciar notificaciones. Se silencian de forma predeterminada al crear o seguir. Solo administradores publican; los seguidores pueden reaccionar y votar en encuestas. No aparecen botones de llamadas en canales.
- Reportes privados al servidor para contactos, grupos y canales. No se descargan ni se envían a correo, mensajería externa o proveedores de IA. No incluyen mensajes ni archivos.

## Retirada automática

Se aplica a partir de **15 cuentas verificadas diferentes**. La verificación usa las afirmaciones del servicio de autenticación, no un campo que pueda editar el navegador. Un mismo usuario cuenta una vez. Los reportes de invitados o cuentas no verificadas quedan registrados, pero no suman al umbral. Si una cuenta se verifica posteriormente, su reporte puede contar una sola vez.

La decisión y el contador se procesan en una transacción del servidor. Los clientes no pueden leer los reportes ni modificar el contador. Alcanzado el umbral:

- Grupo/canal: se retira de las listas, se vacía la información pública visible y se bloquea el acceso a mensajes, nuevas publicaciones y archivos. El canal se retira también del directorio. Se avisa internamente a sus miembros.
- Cuenta: se desactiva el inicio de sesión, se revocan las sesiones, se oculta el perfil y se impide recuperar el acceso desde el navegador. El propietario ve una explicación y la opción de cerrar sesión. Sus contactos y participantes de conversaciones reciben un aviso interno.
- Las reglas de llamadas y presencia rechazan cuentas y grupos retirados. Una llamada pierde su conexión cuando el navegador recibe la revocación de acceso.
- Si una operación de autenticación, presencia o aviso falla, queda pendiente en el servidor y se vuelve a intentar cada minuto. Los avisos tienen identificador estable y no se duplican al reintentar.

**Retirar no significa borrar físicamente todas las copias.** Se conserva un registro administrativo privado y los documentos necesarios para evitar reactivaciones y permitir revisión. No se puede borrar una copia que otra persona haya guardado en su dispositivo. El umbral es una política propia de Nexus, no una reproducción del sistema de moderación de WhatsApp, y no prueba por sí solo que haya una infracción.

## Credencial privada del servidor

Cuenta técnica dedicada con los tres permisos expresamente autorizados: acceso a Firestore, administración de Authentication y administración de Realtime Database. La clave persistente está en `server/.private/`; el servidor la carga mediante `GOOGLE_APPLICATION_CREDENTIALS`. No forma parte del código público, compilación ni ZIP. Tampoco se imprimen claves en los registros de comprobación.

Al trasladar el servidor se debe instalar su credencial de forma privada y configurar esa variable. La distribución contiene solo ejemplos de configuración. Firebase Hosting sirve la web; las operaciones privadas requieren mantener el backend accesible y configurar su URL/ruta. No se ha publicado Hosting como parte de esta actualización.

## Límites que se mantienen explícitos

- Canales: máximo actual de 100 miembros. No se garantiza anonimato de seguidores frente a otros participantes con conocimientos técnicos porque la estructura de datos actual conserva la lista de participantes. La interfaz no muestra una lista de seguidores. No se ofrecen suscripciones comerciales ni anuncios.
- No se delega la decisión de eliminación a una IA ni se remiten conversaciones a proveedores externos para moderarlas. Un análisis de contenido necesitaría otra política y un flujo específico.
- No se afirma que mensajes y archivos tengan cifrado de extremo a extremo. Las reglas de acceso y la conexión cifrada al servidor no equivalen a ese cifrado. La información de seguridad conserva esta distinción.
- Una web no puede garantizar bloqueo de capturas de pantalla, borrado de copias externas o todas las funciones biométricas de una aplicación nativa.
- Multidispositivo mediante vinculación por QR se mantiene fuera del alcance, como se solicitó.

## Referencias funcionales

La separación de canales y sus avisos silenciados por defecto sigue la documentación oficial: [Canales de WhatsApp](https://www.whatsapp.com/channels). Las capturas proporcionadas se usan como guía de estructura; no se incorporan nombres, fotos, chats ni estados de ejemplo a las cuentas reales.

## Verificación

Se prueban las reglas y la retirada con servicios emulados y datos de prueba. No se generan reportes masivos ni se desactiva ninguna cuenta real durante la verificación. Los resultados de las comprobaciones se entregan junto al ZIP en archivos `verificacion-*.json`.
