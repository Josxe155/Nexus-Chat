# Auditoría con documentación oficial · v26.89.0

Fecha: 11 de noviembre de 2026. Base: v26.88.1. Esta entrega conserva la identidad de Nexus Chat y utiliza artículos del Centro de ayuda de WhatsApp como fuentes de comportamiento. No incorpora opciones exclusivas de Meta.

## Qué se revisó y qué significa

- Inventario estático de los **329 archivos de `src`**, con **11.790 líneas físicas**, 1.781 atributos de eventos JSX y 37 atributos estáticos `role="menuitem"`. El [inventario por archivo](AUDITORIA-CODIGO-26.89.0.csv) incluye tamaño, líneas, diagnósticos sintácticos y marcas para inspección. Los menús generados dinámicamente no están contados por ese último indicador.
- Comprobación de tipos del proyecto completo; inspección dirigida de selección de mensajes, edición, eliminación, reenvío, encuestas, administración de canales, entrada, ayuda y limpieza del dashboard. Revisión de las reglas afectadas de Firestore y de los puntos que el análisis marcó como inactivos o vacíos.
- Pruebas con componentes reales en Chromium, clientes de datos simulados y micrófono sintético; pruebas de servicios reales contra emuladores locales de Firestore y Realtime Database. Ninguna prueba ejecuta limpiezas ni modifica conversaciones de producción.

El inventario y la compilación no prueban que cada línea sea correcta. Esta entrega tampoco constituye una revisión manual completa de cada pantalla, una auditoría de seguridad exhaustiva ni una copia visual al 100 %. Los artículos oficiales describen funciones y recorridos, pero no especifican todos los píxeles, colores ni animaciones de cada versión nativa. Esas diferencias permanecen abiertas cuando no existe una referencia oficial verificable.

## Diferencias corregidas con fuentes oficiales

| Apartado | Comportamiento aplicado | Fuente de WhatsApp |
| --- | --- | --- |
| Editar mensajes de chat | Solo el autor, texto o pregunta de encuesta, durante 15 minutos. El texto eliminado, vencido, pendiente o del historial cifrado no se reedita. | [Editar un mensaje](https://faq.whatsapp.com/6614640168569481/?cms_platform=android) |
| Eliminar para todos | Autor o administrador del grupo, dentro de dos días. La interfaz comprueba el mismo permiso que el servicio y las reglas. Se identifica al administrador que eliminó un mensaje ajeno. | [Eliminar mensajes](https://faq.whatsapp.com/1370476507114859/) |
| Edición en canales | Cualquier administrador puede editar publicaciones de texto dentro de 30 días, incluidas las de otros administradores. Se excluyen publicaciones reenviadas y los tipos que la fuente no permite editar. | [Controles de administradores](https://faq.whatsapp.com/360977646301595), [Editar actualizaciones](https://faq.whatsapp.com/1549633222110625/) |
| Eliminación en canales | Administradores, dentro de 30 días. Las actualizaciones eliminadas dejan de aparecer en la cronología. Se conserva el registro de eliminación; no se intenta retirar copias ya reenviadas o descargadas. | [Eliminar actualizaciones](https://faq.whatsapp.com/251090924134584/?cms_platform=android) |
| Administradores de canales | El propietario puede descartar a otro administrador y revocar una invitación pendiente. Un administrador puede renunciar; ambos recorridos conservan el seguimiento y el acceso a publicaciones. El propietario no se descarta a sí mismo por esta acción. Se muestran administradores e invitaciones pendientes con sus controles autorizados. | [Invitar administradores](https://faq.whatsapp.com/1142317320080231/), [Controles de administradores](https://faq.whatsapp.com/360977646301595) |
| Reacciones y acciones del mensaje | Desactivar reacciones deja disponibles las acciones independientes que corresponden al mensaje. En canales no se ofrece respuesta de chat ni información personal de entrega. El modo predeterminado de selección móvil ofrece los seis emojis permitidos, sin abrir otros emojis. | [Reacciones](https://faq.whatsapp.com/424198503229937/), [Controles de canales](https://faq.whatsapp.com/360977646301595) |
| Encuestas que ocultan nombres | Las nuevas encuestas con esa opción publican recuentos agregados. Cada participante solo puede leer su propio voto personal; tampoco el creador ordinario puede consultar votos ajenos. Se mantienen selección múltiple, cambio de voto, cierre y edición de pregunta. La opción existente de creación se conserva en computadora, sin inventar una pantalla móvil. | [Encuestas, variante Mac](https://faq.whatsapp.com/796470361614974/?cms_platform=mac) |
| Reenvío | Se impide elegir o publicar en canales eliminados o sin permisos. Una encuesta privada reenviada comienza con recuentos y votos vacíos. | [Controles de canales](https://faq.whatsapp.com/360977646301595), [Encuestas](https://faq.whatsapp.com/796470361614974/) |

La eliminación retira del documento activo el contenido de la encuesta, contacto, respuesta citada, ubicación y adjuntos. Actualiza la vista previa del último mensaje. La retirada del archivo físico sigue su autorización de almacenamiento; eliminar la referencia no garantiza borrar una copia que otra persona ya haya guardado.

Los límites operativos se comprueban de nuevo en transacciones con el mensaje y la conversación actuales. Las reglas impiden suplantar al autor de una eliminación y crear mensajes con metadatos administrativos falsos. El acceso administrativo explícitamente autorizado del propietario sigue siendo independiente de los permisos ordinarios de participantes.

### Alcance de la privacidad de encuestas

Se aplica a **encuestas nuevas con `anonymousVersion: 1`**. Las encuestas anteriores que solo tenían `hideVoterNames` conservan su estructura histórica; no se ha ejecutado una migración de datos reales ni se afirma que sus identificadores antiguos hayan desaparecido. La separación protege frente a otros participantes ordinarios, incluido el creador; no elimina el acceso de administración de datos autorizado al propietario del dashboard.

El voto personal lleva la fecha original del mensaje, comprobada en reglas. La limpieza confirmada o programada con bloqueo vigente retira votos antiguos únicamente si su mensaje ya no existe. Conserva los votos de mensajes protegidos y no permite a un participante ordinario borrar documentos de voto por su cuenta. La estimación de limpieza no ejecuta esas eliminaciones. La programación continúa dependiendo de una sesión de dashboard abierta; esta entrega no añade servidores ni cambia ese requisito.

### Correcciones auxiliares

- El menú flotante de administradores queda por encima de la pantalla de información del canal y sigue ajustándose a los bordes de la ventana. Los diálogos permiten cancelar antes de ejecutar la acción.
- El enlace de marca del acceso lleva a la portada, en lugar de una ancla vacía.
- Ayuda retira una mención incorrecta al límite de cien seguidores por canal. No se aumentan artificialmente los límites reales de grupos y llamadas de Nexus.
- Los resultados de limpieza del dashboard muestran nombres de función comprensibles, sin nombres internos de proveedores.
- Se comprobó transparencia real del favicon y de las seis variantes PNG de marca: alfa mínimo 0, máximo 255 y esquinas transparentes. No se anuncia un rediseño nuevo del logotipo.

## Comprobaciones

| Conjunto | Resultado | Alcance |
| --- | --- | --- |
| Unitarias | 92 aprobadas | IA del dashboard, propietario, referencias de Cuenta, limpieza, referencias de noviembre, contactos, Google Contacts, texto enriquecido y nuevas políticas de mensajes y recuentos de encuestas. |
| Reglas y servicios de canales | 23 aprobadas | Roles, seguidores, contadores, consultas privadas de invitaciones, aceptación, revocación, retirada, renuncia, transferencia, publicaciones y ataques de elevación de privilegios. |
| Reglas y servicios de mensajes | 11 aprobadas | Plazos, autoría, administradores, vista previa, eliminación de cargas de contenido, mensajes conservados y rechazo de falsificaciones. |
| Reglas y servicios de encuestas privadas | 11 aprobadas | Doce opciones, recuentos, lectura propia, denegación de lectura ajena/listados, cambio de selección, cierre y escrituras inválidas. |
| Regresión de contactos en emuladores | 11 aprobadas | Creación, idempotencia, bloqueo, audiencias privadas y llamadas permitidas/rechazadas. |
| Limpieza en emuladores | 16 aprobadas | Bloqueo y renovación, fallos recuperables, conservación de cuentas/perfiles/contenido protegido y votos huérfanos. |
| Navegador: contactos y ajustes | 45 aprobadas | Formularios, menús, QR, países, bloqueo, diálogos y regresión del chat; temas claro/oscuro. |
| Navegador: referencias de Novedades | 27 aprobadas | Estados, canales, llamadas, búsqueda, restricciones y archivados; anchos 320, 390, 820 y 1440 según caso. |
| Navegador: grabación de audio | 8 aprobadas | MediaRecorder real con micrófono sintético, cuatro anchos y dos temas; sin franja inferior en los casos definidos. |
| Navegador: administradores | 25 aprobadas | Cancelar, descartar, revocar y ausencia de desbordamiento en 390/820/1440 y ambos temas; además renuncia de administrador. |
| Navegador: acciones y votos privados | 36 aprobadas | Copiar sin reacciones, permisos de acciones, seis reacciones, menú de escritorio, plazo de eliminación y voto privado en tres anchos y dos temas. Todos los casos pasaron. |

Las pruebas de navegador usan componentes de producción y servicios externos simulados; las de emulador ejecutan los servicios y reglas reales con datos sintéticos. No sustituyen una prueba entre dos cuentas reales ni ensayos en Android, iPhone, tablet o equipos de gama baja físicos. No se ha enviado una consulta real a proveedores de IA en esta entrega.

## Marcas inspeccionadas y pendientes

| Zona | Situación comprobada |
| --- | --- |
| Eventos | El formulario actual prepara un archivo de calendario. No equivale al ciclo oficial de invitación, asistencia, modificación, cancelación y avisos. Enlace de llamada e invitados siguen inactivos. [Fuente oficial](https://faq.whatsapp.com/3313983622238973/) |
| Cuenta | Cambio de correo, menús de modificación/eliminación de nombre de usuario, clave de contacto, múltiples cuentas y pantalla de copia siguen pendientes donde no hay formulario autorizado/verificable o integración completa. No se habilitaron botones que simulen esas operaciones. |
| Seguridad | Las notificaciones de cambio de claves permanecen inactivas porque Nexus no genera cifrado de extremo a extremo para mensajes nuevos. No se afirma protección equivalente a WhatsApp. |
| Contacto y almacenamiento | Eliminación desde la selección de archivos, informe privado y cifrado conservan sus pendientes y restricciones actuales. El borrado de mensajes del chat sí sigue la nueva política. |
| Canales | Selectores de tono y vibración nativos, crecimiento neto de seguidores y revisión completa de estadísticas no están terminados. No se muestran valores inventados. |
| Comunidades y grupos | Ejemplos de comunidades sin contenido; permisos antes de crear grupo todavía no tienen flujo completo. Los permisos posteriores conservan su recorrido existente. Nexus mantiene sus límites reales; no se presume capacidad nativa de WhatsApp. |
| Estados | Reportar un estado sigue inactivo hasta tener confirmación, recorrido y gestión completos. No se sustituye por un reporte distinto. |
| Contactos del dispositivo | Los contactos Nexus se guardan en la cuenta. El interruptor informativo aparece activo y de solo lectura. La sincronización opcional con Google People conserva su integración existente; no representa una agenda telefónica nativa. |
| Acciones vacías detectadas | `onUserChange` de MobileSidebar es una alternativa para una propiedad opcional; App proporciona el callback real. `onManage` vacío en la vista de almacenamiento ya abierta no se ejecuta en esa rama. No se contabilizan como funciones nuevas terminadas. |
| Copia visual | Continúa la revisión de todos los subapartados de Ajustes, Info. de contacto/grupos, menús secundarios, accesibilidad, colores y animaciones. La documentación textual sola no demuestra equivalencia visual al 100 %. |
| Dispositivos y servicios | Pendientes Android/iPhone físicos, rendimiento en gama baja, notificaciones con pestaña cerrada y recorridos completos de llamadas, biometría, copias/restauración y consentimiento real de servicios cuando corresponda. |

Se consultaron además las fuentes oficiales de [Archivados](https://faq.whatsapp.com/1426887324388733/?cms_platform=android), [temas de chat](https://faq.whatsapp.com/6298875896807790/), [bloqueo de chats](https://faq.whatsapp.com/764072925284841/) y [visualización única](https://faq.whatsapp.com/1077018839582332/). La revisión de regresión conserva los límites documentados de esos recorridos; no añade promesas de bloqueo de capturas en el navegador.

## Cómo se mide el avance

El denominador común del bloque corregido es de **20 casos por tamaño de dispositivo**: seis comportamientos de acciones/encuestas y cuatro de administración de canales, en tema claro y oscuro. Resultado del bloque común: **celular 20/20 (100 %), tablet 20/20 (100 %) y computadora 20/20 (100 %), en navegador simulado**. El caso adicional de renuncia se informa aparte. Los demás conjuntos de regresión y emuladores tienen sus propios denominadores. Ninguno representa el porcentaje terminado de todo Nexus ni el porcentaje de semejanza con WhatsApp.

La auditoría integral de cada apartado continúa **incompleta**. No se calcula un porcentaje global sin un catálogo completo de pantallas, funciones y comprobaciones cerradas.
