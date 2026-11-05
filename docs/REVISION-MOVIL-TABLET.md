# Nexus Chat · revisión de móvil y tablet

Las veinte capturas entregadas por el usuario se usaron como referencia de navegación, proporciones y organización de menús. No se importaron sus chats, contactos, imágenes, estados ni publicaciones. Las capturas de verificación de Nexus contienen únicamente datos ficticios de pruebas locales.

## Cambios realizados

- Nexus AI tiene un panel de mensajes independiente y un formulario fijo dentro de su distribución, sin posición absoluta. Campo y botón permanecen juntos cuando disminuye la altura visible por el teclado. Admite Enter, Shift+Enter, detener la respuesta, recuperar el borrador si falla, historial local por cuenta y borrar ese historial. Los errores no muestran nombres de proveedores ni claves.
- Los menús de chats, llamadas, novedades, comunidades y Nexus AI contienen acciones correspondientes a su apartado. Las lupas abren búsquedas reales. El menú de llamadas permite borrar el registro y abrir las programadas; el de novedades permite crear un canal y configurar la privacidad de estados.
- En móvil y tablet, los ajustes incluyen perfil, cuenta, privacidad, listas, chats, apariencia, notificaciones, almacenamiento, accesibilidad, ayuda e invitación. Video y voz sigue reservado al diseño de escritorio. Cada flecha regresa al nivel anterior de configuración.
- Listas permite crear, editar y eliminar filtros personalizados sin borrar conversaciones. Se conserva la misma colección privada utilizada por los filtros de Chats; se retiró el editor duplicado anterior.
- Apariencia concentra los estilos de pantalla y del chat. Burbuja y Fondo tienen su propio nivel de navegación, vista previa, fondos originales e importación de imágenes. En móvil, las miniaturas se desplazan horizontalmente en dos filas.
- Chats permite cambiar el tamaño de los mensajes, Enter para enviar, sustitución de texto con emojis y corrección ortográfica. En móvil, calidad y descarga automática están únicamente en Almacenamiento y datos.
- Accesibilidad aplica contraste reforzado y reducción de animaciones. El ajuste predeterminado respeta el sistema. Tamaño de texto, contraste y animación se guardan por navegador.
- Almacenamiento muestra copias locales reales, permite eliminar una o todas sin borrar los mensajes, y ofrece contadores de bytes de archivos enviados y recibidos por cuenta en este navegador. Los contadores no pretenden medir todo el tráfico de llamadas o mensajes. Las descargas privadas aptas para caché se registran en el almacén local. Los archivos mayores de 100 MB se gestionan manualmente para proteger la memoria.
- El perfil móvil tiene foto, nombre, usuario e información. Info ofrece sugerencias editables y respeta su audiencia. No se añadieron duraciones de Info que el servidor no pudiera hacer cumplir.
- Los estados incluyen tarjetas de actualizaciones recientes, vistos y ocultos. El nuevo editor permite texto, color, fuente, imagen, video, cámara y grabación de audio con revisión antes de publicar. El visor conserva progreso, pausa y navegación.
- Novedades incluye canales reales del proyecto. Permite crearlos, encontrarlos, seguirlos y abrirlos. Se mantiene el límite existente de 100 miembros; no se anuncia anonimato de seguidores ni capacidad ilimitada que esta implementación no garantiza.
- Las llamadas disponen de favoritos, historial, búsqueda y programación mediante enlaces. La programación sirve para encuentros dentro de las próximas 23 horas, según la caducidad del enlace; no realiza llamadas automáticamente. Se retiró de la interfaz la mención del proveedor de conexión.
- La biblioteca y la búsqueda global ahora respetan mensajes ocultos para mí y el límite de historial vaciado. No muestran archivos que el usuario retiró de su propio historial.

## Seguridad comprobada y límites

La autenticación de cuentas, las reglas publicadas de Firestore y Realtime Database, los documentos privados por cuenta y las descargas autenticadas protegen el acceso entre usuarios. Los archivos no se sirven desde una carpeta pública; sus permisos se verifican antes de descargarlos o reenviarlos. Las claves privadas de servicios permanecen en server/.env y se excluyen del cliente y del ZIP. Los avisos de nuevos accesos, bloqueo, audiencias, confirmaciones y temporales conservan las funciones de la revisión anterior.

Eso no demuestra cifrado de extremo a extremo. El cliente entrega el texto de los mensajes a Firestore y el servidor guarda archivos sin un protocolo de cifrado con claves exclusivas de los participantes. Quienes tengan acceso administrativo autorizado a esos servicios podrían leer el contenido. No se añadió una etiqueta que afirme que ni Nexus puede leerlo. Las llamadas usan el cifrado de transporte del navegador; no se ha auditado un sistema de identidad y claves equivalente al de WhatsApp.

Ocultar palabras técnicas de las pantallas no vuelve invisible el funcionamiento de una aplicación web. El navegador debe recibir su propia sesión y los parámetros temporales de conexión para realizar llamadas. La clave privada de la cuenta TURN se consulta exclusivamente en el backend; no se introduce en el paquete público. La configuración pública de Firebase identifica el proyecto y no sustituye sus reglas de acceso.

No se simularon controles de LED, acceso silencioso a la galería del teléfono, proxy nativo, controles parentales, biometría, llaves de acceso, varios perfiles simultáneos, transcripción de voz, música comercial o bloqueo de capturas. Requieren capacidades adicionales o diseño específico. Tampoco se expuso una preferencia de admisión a grupos como si ya se aplicara de forma segura a todos los grupos. Info se mantiene hasta que el usuario la cambia.

Las notificaciones existentes utilizan permiso del navegador y aviso del sistema; no se garantiza ejecución continua en todos los teléfonos. Los enlaces a sitios externos siguen sin generar vistas previas automáticas.

## Pruebas

Se comprobaron 40 casos de interfaz móvil y tablet en 360, 390, 768 y 1024 px, con entrada táctil, incluidas alturas reducidas de 480 px para el formulario de Nexus AI. Pasaron 34 comprobaciones de configuración y 38 pruebas del backend, incluidas cuatro nuevas sobre orígenes y solicitudes previas de conexión. Se mantiene la revisión de mensajería y sus pruebas anteriores; ver los informes de verificación entregados junto al proyecto.

Se ejecutaron comprobación de tipos y compilación de producción. Las pruebas de interfaz usan respuestas de prueba y no consumen la cuota de los proveedores de IA. No se publicaron contactos, mensajes, estados o canales de las capturas en Firebase real.

## Preparación para Firebase Hosting

Firebase Hosting publica la compilación estática y permite configurar cabeceras y rutas de la aplicación. No ejecuta por sí solo este servidor Node. La integración de servidor con Cloud Run requiere asociar facturación; por eso no se activó ni se cambió el proyecto a un plan facturado. Fuentes oficiales: [configuración de Hosting](https://firebase.google.com/docs/hosting/full-config) y [servicios dinámicos y facturación](https://firebase.google.com/docs/hosting/serverless-overview).

Se añadió una dirección configurable del backend, la compatibilidad de orígenes autorizados y las cabeceras de caché de la aplicación. Los mensajes y referencias a archivos conservan rutas relativas y el cliente las dirige al backend configurado. Las claves de los proveedores no viajan en la configuración pública.

La publicación completa queda pendiente de las referencias de escritorio y de disponer de un backend HTTPS permanente con disco persistente. No se desplegó Hosting en esta revisión. Antes de hacerlo:

1. Alojar el backend Node con su configuración privada y almacenamiento persistente. Mantener las claves únicamente en sus variables privadas.
2. Añadir los dominios exactos de la web a ALLOWED_ORIGINS en el backend, por ejemplo los dominios propios del proyecto terminados en web.app y firebaseapp.com. No usar un comodín.
3. Crear .env.production en el proyecto web con VITE_API_BASE_URL=https://direccion-publica-del-backend, sin ruta, consulta, contraseñas ni claves. El servidor debe aceptar /api y estar accesible por HTTPS.
4. Comprobar los dominios autorizados de inicio de sesión y la entrega de notificaciones en los dispositivos reales. Revisar cuotas gratuitas y disponibilidad del servidor.
5. Ejecutar npm run build:hosting y, tras la revisión final de escritorio, publicar con firebase deploy --only hosting. La comprobación previa impide publicar accidentalmente una web sin dirección de backend.

El comando normal npm run build sigue creando la versión local que usa /api del mismo origen. Un servidor gratuito que se suspenda, un equipo apagado o un disco temporal no permiten garantizar llamadas entrantes, archivos y notificaciones continuas aunque la web esté publicada.
