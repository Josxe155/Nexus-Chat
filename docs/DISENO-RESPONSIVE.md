> Documento histórico. La versión vigente se describe en [ACTUALIZACION-NEXUS.md](ACTUALIZACION-NEXUS.md).

> Informe histórico de una revisión anterior. El estado actual y las limitaciones están en ESTADO-FUNCIONES.md y CONFIGURACION-GRATUITA.md.

# Diseño moderno y adaptable de Nexus Chat

## Cambios

- Nueva portada con identidad en verde lima, tipografía amplia, vista ilustrativa de una conversación y un panel de acceso. Se conservan Google e invitado, el lema y el modo claro/oscuro.
- El diseño cambia de dos columnas a una columna en móvil y ajusta tipografía, márgenes, formularios y botones.
- Se utiliza una sola estructura de aplicación para móvil, tableta y escritorio. Por debajo de 900 px se alterna entre conversaciones y chat; en pantallas más anchas aparecen juntos.
- La altura del espacio de conversación sigue el viewport visual para mantener el área de escritura accesible cuando cambia la altura disponible, incluido el teclado virtual. El espacio inferior respeta el área segura del dispositivo.
- Contactos, perfil, archivados, búsqueda, archivos adjuntos, emojis y respuestas citadas tienen medidas adaptables, controles táctiles y desplazamiento dentro de sus paneles.
- Las acciones de mensajes usan un menú con botones de respuesta, edición, eliminación y reacciones. En móvil se presenta como un panel inferior. No hace falta pasar el cursor ni escribir comandos en una ventana de diálogo.
- Se sustituyeron los seis campos de configuración por los del proyecto `nexus-chat-56d9d`. También se actualizó el proyecto predeterminado de Firebase CLI y se retiró el destino de hosting antiguo.

## Comprobaciones

- TypeScript: sin errores.
- Compilación de producción: correcta. Se mantiene el aviso de tamaño del paquete JavaScript de Firebase; la división de código sigue siendo una mejora pendiente.
- 113 comprobaciones en Edge, sin errores de JavaScript ni desbordamientos horizontales detectados.
- Viewports: 320×568, 360×780, 390×844, 768×1024, 844×390, 899×700, 900×700, 1024×768, 1440×1000 y 1920×1080.
- Se revisaron bienvenida, formulario de invitado, conversaciones, perfil, archivados, contactos, chat, emojis, adjuntos, respuestas y búsqueda.
- Se redujo también la altura del chat a 390×420 para comprobar que el área de escritura siguiera dentro de la pantalla. Es una comprobación geométrica; no sustituye probar teclados reales de iOS y Android.
- El cambio de tema se conserva tras recargar.
- Los seis valores de Firebase y el proyecto predeterminado se comprobaron automáticamente contra los datos proporcionados.

Las pantallas internas se probaron con usuarios y conversaciones de muestra, sin crear cuentas ni escribir en Firebase. La autenticación, las reglas remotas, el almacenamiento y los datos reales del proyecto nuevo requieren una comprobación funcional aparte. No se desplegó la aplicación ni se migraron datos del proyecto anterior.

## Entrega

El proyecto actualizado y su compilación están en `nexus-chat-revisado.zip`. El servidor de desarrollo está disponible en http://localhost:3000/.

Capturas: `nexus-inicio-1440.png`, `nexus-inicio-390.png`, `nexus-inicio-claro.png`, `nexus-chat-1440.png`, `nexus-chat-390.png` y `nexus-perfil-movil.png`. Las capturas de los paneles internos contienen datos de muestra. Los resultados detallados están en `verificacion-responsive.json`.
