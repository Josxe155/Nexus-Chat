# Novedades, canales y listas · v26.88.0

[Índice](INDICE.md) · [README](../README.md)

La [corrección v26.88.1](CORRECCION-REFERENCIAS-OFICIALES-26.88.1.md) detalla diferencias posteriores contrastadas con artículos e ilustraciones oficiales.

## Alcance

Revisión de las 55 capturas del ZIP de referencias del 10 de noviembre. Las pantallas nuevas corresponden a Messenger para Android y se aplican a la interfaz de celular. Tablet y computadora conservan sus componentes existentes; comparten los permisos y servicios de canales. No se incorporan publicidad, Meta AI ni datos personales de las capturas. Las referencias originales y las capturas de prueba permanecen fuera del repositorio.

## Correspondencia con las capturas

El identificador es la hora del nombre de archivo `Screenshot_20261110_…`. Esta tabla describe cobertura funcional; no equivale a certificar una igualdad visual del 100%.

| Capturas | Apartado | Implementación o diferencia pendiente |
| --- | --- | --- |
| 141621, 141628 | Novedades y menú | Estados y canales en la misma pestaña; crear canal, privacidad, destacados y ajustes. Se omite publicidad. |
| 141635, 141641, 141647 | Llamadas y borrar registro | Accesos, recientes y confirmación Cancelar/Aceptar. Solo borra el registro privado del usuario. Teclado permanece deshabilitado: falta su referencia interior. |
| 141655 | Eventos | Todos, llamadas programadas, sin respuesta, estado vacío y acceso a programación. El formulario existente se conserva sin inventar uno nuevo. |
| 141712, 141717 | Crear canal | Introducción inferior; imagen, nombre, descripción y creación. Borrador identificable para no duplicar canales al reintentar una subida. |
| 141725 | Conversación del canal | Acceso al enlace y tarjeta de invitación de seguidores: compartir en estado, editar imagen e invitar administradores. No se copian mensajes ni archivos personales de la captura. |
| 141730 | Información del canal | Identidad, descripción, fecha, estadísticas, notificaciones, privacidad, ajustes, alertas, enlaces y acciones por rol. Alcance calculado desde visitas registradas; la métrica neta de seguidores queda en «—» hasta disponer de historial de altas y bajas verificable. No se inventan cifras. La lista individual de seguidores guardados queda pendiente; el contador es real. |
| 141743, 141747 | Transferencia e invitaciones | Hasta 16 administradores además del propietario; invitaciones que deben aceptarse. Transferencia solo a un administrador aceptado, con confirmación. |
| 141754, 141759 | Editar canal | Menú Editar, foto, nombre, descripción y guardado de ambos documentos de información. |
| 141805 | Búsqueda dentro del canal | Reutiliza búsqueda del historial y carga de mensajes anteriores. El teclado pertenece al sistema. |
| 141811, 141816 | Enlace y QR del canal | Enviar a contactos, compartir en estado, copiar, compartir mediante el navegador y QR real del enlace. |
| 141821 | Menú del canal | Información, buscar, compartir, invitar administradores y ajustes según rol. Acceso directo del sistema queda pendiente y deshabilitado. |
| 141828 | Reacciones | Cualquier emoji, seis predeterminados o ninguna; verificación en cliente y reglas de Firebase. |
| 141849 | Compartir del sistema | Usa Web Share cuando está disponible y copia del enlace en los demás casos. La hoja nativa de Android no se dibuja como un menú web falso. |
| 141901 | Notificaciones del canal | Silencios separados para actividad de seguidores y administradores. Los selectores de tono y vibración carecen de referencia interior y quedan deshabilitados. |
| 141907 | Acerca de este canal | Panel inferior, identidad Nexus y explicación de los canales públicos. No se atribuye cifrado ni anonimato técnico que el proyecto no ofrece. |
| 141914 | Alertas | Lectura de alertas existentes y pantalla vacía; no crea avisos ficticios. |
| 141923, 141928 | Reportar y eliminar | Reporte con confirmación. Eliminación por propietario: retira directorio e impide nuevas publicaciones/seguidores; conserva historial accesible a seguidores anteriores. |
| 141939, 141946 | Enviar y compartir en estado | Selección de contactos y envío real del enlace; tarjeta de canal con comentario para estados. Se omite Meta AI. |
| 142000, 142004, 142010 | Texto y fuentes de estado | Texto centrado, siete estilos y borrador conservado al cambiar de modo. Las familias tipográficas dependen de las fuentes disponibles del dispositivo. |
| 142014, 142026, 142036 | Fondos de estado | 21 colores muestreados de las capturas; selección conserva el texto. |
| 142042, 142046 | Estado de audio | Fondo oliva, grabación con permisos reales, pausa, vista previa y publicación. Se oculta la opción de una sola escucha: los estados no usan esa semántica. |
| 142059, 142114 | Estados ocultos y visor | Se conservan ocultar/mostrar y respuestas existentes; visor con vuelta móvil, tipografía y tarjeta de canal. La revisión visual detallada de respuestas y lista de ocultos sigue pendiente. |
| 142133 | Nuevo contacto | Se conserva el formulario de la entrega anterior, QR y sincronización opcional con Google. |
| 142138, 142153, 142206, 142223 | Países | Banderas, nombres nativos, país seleccionado, lista destacada y búsqueda por nombre/código. No representa verificación de números reales por SMS. |
| 142348, 142353, 142403 | Búsqueda global | Filtros, no leídos e historial local de contactos recientes, con confirmación antes de borrarlo. Excluye mensajes ocultos, vencidos y chats restringidos. |
| 142409, 142413 | Código y carpeta restringida | Buscar el código revela la carpeta; no almacena las consultas. Protección local del navegador con contraseña, sin simular biometría nativa. |
| 142425, 142429, 142435 | Ajustes del bloqueo | Ocultar carpeta, crear/cambiar código y confirmar su desactivación. El código se guarda como hash con sal; desactivarlo conserva mensajes y bloqueos individuales. |
| 142451 | Chats | Lista existente, colores de referencia y acceso a búsqueda; no se copian nombres ni mensajes de la captura. |
| 142504, 142508, 142512, 142519 | Archivados | Lista sin filtros de bandeja, explicación y menú Ajustes de archivado; Mantener archivados persiste en preferencias. |

## Colores

Muestreo de zonas planas de los PNG: fondo `#0a1014`, superficies `#12181c`, campos e iconos `#20272b`, bordes/filtros `#23282c`, selección `#103529`, acento `#21c063`, texto `#f7f8fa`, secundario `#8d9599` y peligro `#ff4b60`. Se aplican al modo oscuro de las paletas grafito/Nexus. Se conservan las paletas personalizadas. Texto de estado `#8b6990` y audio `#b6b327`.

La documentación oficial explica el rediseño oscuro, pero no publica estos valores exactos por pantalla. Los valores anteriores proceden de las referencias proporcionadas, no de una supuesta guía oficial de colores.

## Datos y permisos

Canales nuevos usan `channelVersion: 2`. `participants` contiene administradores, mientras que `channelFollowers` almacena seguimientos individuales. El contador se modifica en una transacción junto con el seguimiento y las reglas comprueban ambos cambios. El modelo no impone el límite anterior de 100 participantes a los seguidores.

Las reacciones nuevas usan agregados en el mensaje y un documento privado por seguidor; otros seguidores no pueden consultar su identidad. Los recibos de lectura no escriben sus identificadores en publicaciones v2. Esto no oculta los identificadores administrativos internos a una persona que inspeccione documentos accesibles ni convierte un canal público en un chat cifrado. Las reacciones antiguas de canales v1 no se anonimizan retrospectivamente.

Los canales anteriores se migran cuando el propietario abre su información. Invitación, aceptación, transferencia y eliminación se verifican también en reglas. Los administradores pueden consultar seguidores para gestión y estadísticas; la interfaz no publica la agenda de seguidores.

La actividad de seguidores genera avisos locales mientras la web está activa. No se certifica aquí la recepción push con la pestaña cerrada. La eliminación conserva la actividad anterior y no ejecuta una limpieza de cuentas.

## Verificación

- TypeScript, compilación de Hosting y 80 pruebas unitarias del proyecto.
- 20 casos de canales y estados contra reglas reales en Firestore Emulator, con datos sintéticos.
- 11 casos de regresión de contactos y bloqueo en Firestore y Realtime Database emulados.
- Chromium: 22 recorridos funcionales de celular y cuatro comprobaciones de lista/desbordamiento a 320, 390, 820 y 1440 píxeles; siete comprobaciones adicionales de grabación, borradores, búsqueda, bloqueo y roles.
- Regresión de los menús de contactos: 45 comprobaciones de diseño en modos claro/oscuro, celular, tablet y computadora. Sincronización con Google: 16 configuraciones y recuperación ante un error de permisos, con API simulada; no se han creado contactos reales en Google. QR: cuatro recorridos móviles de lectura, rechazo de códigos propios/ajenos y búsqueda de países, además de guardado en tablet y computadora.

Las pruebas de componentes sustituyen servicios externos por datos sintéticos y se complementan con emuladores para verificar las reglas. No equivalen a pruebas en Android/iPhone físicos ni a certificar fidelidad píxel a píxel. Los porcentajes de una entrega corresponden exclusivamente a los casos terminados/verificados de esa entrega, no al porcentaje del producto completo.

## Fuentes oficiales consultadas

- [Rediseño de la interfaz y modo oscuro](https://www.meta.com/design-at-meta/blog/whatsapp-user-interface-update/).
- [Crear un canal](https://faq.whatsapp.com/794229125227200).
- [Administración de canales](https://faq.whatsapp.com/360977646301595).
- [Privacidad de canales](https://faq.whatsapp.com/1318001139066835).
- [Llamadas programadas](https://blog.whatsapp.com/calling-on-whatsapp-new-ways-to-plan-ahead-and-take-part).
- [Restricción de chats](https://faq.whatsapp.com/764072925284841/).
- [Archivar y desarchivar](https://faq.whatsapp.com/1426887324388733/).
- [Crear y compartir estados](https://faq.whatsapp.com/643144237275579/).
- [Estados: formatos y audiencia](https://www.whatsapp.com/status).
