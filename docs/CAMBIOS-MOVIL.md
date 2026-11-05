> Documento histórico. La versión vigente se describe en [ACTUALIZACION-NEXUS.md](ACTUALIZACION-NEXUS.md).

> Revisión actual de escritorio y Nexus AI: consulta CAMBIOS-ESCRITORIO.md. Las claves de IA ya se incorporaron y ambos servicios respondieron en pruebas reales. Esta actualización sustituye las notas anteriores que indicaban claves pendientes o uso exclusivo de Ollama.

# Nexus Chat: revisión móvil con las referencias recibidas

## Cambios

- Vista móvil con Chats, Novedades, Comunidades y Llamadas en la barra inferior; búsqueda y filtros Todos, No leídos, Favoritos y Grupos.
- Todos los chats del usuario se conservan en la lista, aunque falte un perfil. Archivados aparece solo si existe un chat archivado. El filtro Favoritos utiliza los chats fijados (máximo tres).
- Menú principal desplegable y desplazable. Ajustes con secciones plegables y desplazamiento vertical independiente.
- Contactos muestra las personas registradas en Nexus. Acciones: Nuevo grupo, Nueva comunidad y Nuevo evento. Se retiraron Nuevo contacto y Nuevo estado de esta pantalla; los estados se gestionan desde Novedades.
- Nuevo evento guarda fecha y título de forma privada, permite compartir la invitación por chat y descargar un archivo de calendario .ics. No hay recordatorios con la página cerrada ni asistencia colaborativa.
- Difusiones permite guardar, reutilizar y eliminar listas de hasta 20 destinatarios, y enviar mensajes individuales.
- Mensajes fijados sustituye a Destacados: abre los mensajes anclados de los últimos 100 mensajes de cada chat, con enlace a su conversación. No se presenta como una búsqueda ilimitada.
- Marcar todos como leídos recorre el historial por páginas y conserva los mensajes nuevos que llegan durante la operación.
- Acceso desde otros dispositivos sustituye a Dispositivos vinculados: explica el acceso con la misma cuenta Google/correo y permite copiar la dirección. No simula vinculación por QR ni transferencia de sesión invitada.
- Ajustes ofrece perfil, recuperación de contraseña, cierre de sesión, privacidad, apariencia, difusión, eventos, avisos mientras la web está abierta, limpieza de caché y accesibilidad. Se omitieron opciones sin soporte, como controles parentales, idioma universal y copia de seguridad en nube.
- Se retiraron todas las llamadas a DiceBear y el generador aleatorio. Los perfiles sin foto y las imágenes antiguas de ese servicio se muestran con una silueta gris local.
- Se mantiene el diseño de escritorio anterior. Esta revisión se concentra en móvil; las correcciones compartidas de llamadas y avatares también aplican al escritorio.

## Backend privado

Se añadió server/ con una API autenticada mediante tokens de Firebase. El backend usa el proyecto nexus-chat-56d9d. Las claves se guardan únicamente en server/.env, que no se incluye en el navegador ni en el ZIP distribuible. El archivo server/.env.example indica qué completar al trasladar el proyecto. Nunca pongas claves en variables VITE_.

El TURN indicado quedó configurado en la copia local. Se comprobó que el servicio entrega cinco entradas ICE. El navegador recibe credenciales ICE para conectarse: estas necesariamente son visibles para el propio dispositivo que realiza la llamada; la clave maestra de la API permanece en el backend.

Groq se consulta primero; OpenRouter es el respaldo si Groq falla o limita el uso. OpenRouter solo admite modelos :free u openrouter/free. Se respeta Retry-After cuando existe y se evita reintentar inmediatamente al proveedor limitado. El servidor no inventa la cuota diaria ni el momento de su reinicio: depende de las respuestas del proveedor. Si ambos fallan, el cliente recibe «El servicio está temporalmente ocupado. Inténtalo más tarde.», sin proveedores, cuotas ni claves. Las claves de IA todavía no se recibieron: las respuestas reales de esos servicios están pendientes. Hay una pantalla Nexus con sugerencias y conversación que utiliza esta API.

## Invitados inactivos

La aplicación registra actividad mientras la sesión está abierta y visible. El backend conserva una fecha confiable de última actividad y ejecuta la limpieza cada hora. Al superar 30 días se elimina la cuenta invitada de Authentication, su perfil y documentos privados, y su presencia. Los mensajes compartidos no se borran de los chats de otras personas. Las cuentas con Google/correo no se eliminan por este mecanismo.

La eliminación necesita una cuenta de servicio de Firebase con permisos y GOOGLE_APPLICATION_CREDENTIALS configurado en el backend. Esta credencial administrativa no se proporcionó; por eso NO se ha activado ni probado una eliminación en el proyecto remoto. Los perfiles antiguos sin marcador de invitado se reconocen cuando vuelven a iniciar sesión; no se eliminan por suposición. Para sanear cuentas antiguas que nunca regresen hace falta una migración verificada. No se utilizó la limpieza estándar de Firebase porque sus 30 días cuentan desde la creación y no desde la última actividad.

## Ejecutar

Requiere Node.js 22 o posterior.

1. En la carpeta de la app: npm ci.
2. Instala el backend: npm --prefix server ci.
3. En otra copia o al extraer el ZIP, copia server/.env.example a server/.env y completa las claves privadas. En este espacio de trabajo el TURN ya está guardado.
4. Ejecuta npm run dev. Inicia el backend en 127.0.0.1:3001 y la web en el puerto 3000. La web utiliza /api mediante el proxy de Vite.
5. Para la limpieza de invitados, coloca el JSON de cuenta de servicio fuera de public/, dist/ y del repositorio; configura su ruta absoluta en GOOGLE_APPLICATION_CREDENTIALS. Reinicia el backend. Nunca publiques ese JSON ni lo envíes al navegador.
6. Publica las reglas actualizadas de firestore.rules y database.rules.json en el proyecto correcto y habilita los proveedores de Authentication. Son cambios locales; no se desplegaron reglas remotas durante esta revisión.
7. Para producción, aloja el backend detrás de HTTPS y dirige /api hacia él. ALLOWED_ORIGINS debe contener los orígenes reales autorizados. Firebase Hosting estático por sí solo no ejecuta este servidor. No se activó facturación ni se contrató hosting.

Desde otro móvil, HTTP por IP local puede mostrar la interfaz pero bloquear cámara y micrófono. Utiliza HTTPS para llamadas entre dispositivos. La aplicación muestra una explicación en ese caso.

## Pruebas

La revisión móvil pasó 67 comprobaciones en anchos 320, 360, 390, 430, 768 y 844, además de comprobar que se conserva la vista de escritorio. Sin desbordamientos ni errores JavaScript. Datos de muestra aislados: no se modificaron conversaciones remotas.

Las reglas actualizadas pasaron 68 pruebas en emuladores locales, incluyendo eventos y listas de difusión privados. El backend pasó ocho pruebas de prioridad, respaldo, errores neutros, modelos gratuitos, espera del proveedor, validación de entrada y cálculo de caducidad. Estos ensayos no consumieron cuotas reales de IA ni eliminaron cuentas reales.

Consulta los archivos JSON de verificación para el resultado final de llamadas y relay. Las limitaciones previas de E2EE, biometría y visualización única siguen vigentes; las imágenes de referencia no convierten esas garantías en funciones implementadas.

Resultado final: las llamadas pasaron con relay TURN de Metered real verificado en el navegador, además de voz, video, pantalla simulada, archivo de 8 MiB verificado byte a byte, persistencia local, tres participantes, continuidad de grupo, sala de voz sin timbre y enlace programado. Se usaron medios simulados y Firebase local; no se modificaron conversaciones del proyecto remoto. Compilación y TypeScript aprobados. Auditoría del backend: cero vulnerabilidades. La clave maestra TURN no aparece en los archivos del cliente ni en la compilación.


## Plantilla móvil de chats — 27 de octubre de 2026

Se ajustaron el buscador redondeado, la fila horizontal de filtros, tamaños de avatares, hora de 24 horas en móvil, botones flotantes y selección inferior en forma de cápsula. Se conservaron Nexus Chat, los datos reales, el conteo de mensajes archivados y la paleta configurada.

Nexus AI tiene cabecera móvil más compacta, sugerencias con iconos, fondo de dibujos, selector real de emojis dentro de la barra de escritura y envío circular separado. Su menú móvil permite consultar información, buscar mensajes, exportar el historial local y vaciarlo. Un texto sin coincidencias en el buscador puede abrirse como borrador en Nexus AI. No se añadieron adjuntos ni acceso a una aplicación externa que el asistente no pueda procesar. No se copiaron contactos, estados, fotos, marcas ni la llamada en curso de las capturas. Tampoco se añadió una afirmación de cifrado de extremo a extremo que la aplicación no garantice.

Verificación: 45 comprobaciones de móvil/tablet (360, 390, 768 y 1024 píxeles), alturas reducidas, emojis, búsqueda y exportación; 25 de escritorio; TypeScript y compilación correctos. Las pruebas usan datos locales simulados, sin crear conversaciones reales ni consultar proveedores de IA. Los controles de privacidad y autenticación no se modificaron en esta revisión.
