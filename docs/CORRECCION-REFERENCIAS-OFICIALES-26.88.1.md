# Corrección contrastada con WhatsApp · v26.88.1

[Índice](INDICE.md) · [Correspondencia de las 55 capturas](REFERENCIAS-NOVEDADES-2026-11-10.md)

Esta corrección responde a diferencias de la entrega anterior. La comprobación de botones y permisos de v26.88.0 no acreditaba que sus pantallas coincidieran visualmente con las referencias. Los porcentajes de pruebas de aquella entrega no representan fidelidad visual ni avance global del producto.

## Fuentes utilizadas y diferencias corregidas

| Apartado | Fuente oficial y referencia | Diferencia corregida |
| --- | --- | --- |
| Novedades y cabeceras | [Menú de opciones de Android](https://faq.whatsapp.com/1189188245314343/?cms_platform=android); capturas 141621 y 141628 | Búsqueda antes del menú, título y tarjetas con medidas acordes a la captura. Los botones de crear estado se renderizan fuera del panel animado para permanecer en la parte inferior de la ventana. |
| Crear canal | [Crear un canal](https://faq.whatsapp.com/794229125227200/); captura 141717 | Marcador neutro de canal, campo de nombre sin una etiqueta duplicada, posición de imagen y descripción y ancho del botón. |
| Información y ajustes de canal | [Administrar información y ajustes](https://faq.whatsapp.com/214063281402212/); capturas 141730, 141759 y 141828 | Cabecera con nombre e imagen al desplazar el contenido; iconos de invitación, edición y reporte. Se conservan las tres políticas de reacciones. |
| Administradores y propiedad | [Permisos administrativos](https://faq.whatsapp.com/360977646301595), [invitaciones](https://faq.whatsapp.com/1142317320080231/) y [transferencia](https://faq.whatsapp.com/285196217903505/); capturas 141743 y 141747 | Contador bajo el título y búsqueda que se abre con la lupa. El cambio de apartado limpia la búsqueda anterior. Las invitaciones siguen requiriendo aceptación. |
| Reportar y eliminar canal | [Privacidad y seguridad de canales](https://faq.whatsapp.com/1318001139066835/); capturas 141923 y 141928 | Icono y composición del reporte y marca de eliminación junto a la imagen. Cancelar no envía reportes. |
| Grabación de estado | [Crear y compartir estados](https://faq.whatsapp.com/643144237275579/?cms_platform=android); capturas 142042 y 142046 | Onda y duración dentro de la burbuja. Al mantener el micrófono se muestra la indicación de cancelar; soltar prepara el audio para publicar. No aparece la tarjeta de controles de notas de voz ni una opción de una sola escucha. |
| Visor y respuestas | [Ver y responder estados](https://faq.whatsapp.com/2544894022567526/); captura 142114 | Se elimina la regla que imponía fondo negro. Colores y fuentes se aplican al contenido, sin cambiar la fuente de la cabecera. La respuesta inicial conserva campo, dos emojis y corazón; el teclado y sus controles se usan al escribir. |
| Menú y estados ocultos | [Ocultar y mostrar estados, Android, con ilustración oficial](https://faq.whatsapp.com/1508707852886383/?cms_platform=android&locale=es_LA); captura 142059 | Menú del visor y confirmación de ocultar/mostrar basados en la ilustración. Pulsación prolongada para cambiar visibilidad; la lista móvil de ocultos ya no añade botones de ojo en cada fila y muestra el tiempo de las actualizaciones recientes. Se respetan los alias guardados por el usuario. |
| Archivados | [Archivar y desarchivar, Android](https://faq.whatsapp.com/1426887324388733/?cms_platform=android); capturas 142504–142519 | Con Mantener archivados, el contador representa chats sin leer, incluidos los marcados manualmente. Al desactivarlo muestra el total y el acceso se coloca después de las conversaciones. La cabecera de Archivados conserva el menú de su referencia. |
| Alcance de canales | [Métricas oficiales](https://faq.whatsapp.com/1446688872845683/); captura 141730 | El registro de alcance requiere una publicación disponible e incluye a administradores. La métrica neta permanece sin cifra: necesita un historial de altas y bajas. |

La documentación común y de WhatsApp Web sirve para confirmar comportamientos compartidos; las posiciones se contrastan con las capturas de Android. Algunas variantes Android de los artículos de canales no devolvieron un cuerpo legible en la consulta; se usaron la versión oficial accesible y las capturas, sin atribuirles detalles no comprobados.

La ilustración oficial de ocultar estados muestra las acciones Mensaje, Llamada de voz, Videollamada, Ver contacto, Ocultar y Reportar. Nexus conecta las cuatro primeras a sus recorridos existentes y permite ocultar/mostrar con confirmación. Reportar un estado permanece deshabilitado hasta completar su tratamiento en moderación y disponer de la referencia de ese recorrido. No se registra como un reporte de mensaje o de contacto diferente.

## Compatibilidad

Los cambios de composición Android se limitan a la interfaz de celular. Las correcciones de fondos de estados, conservación del chat al responder y contador usan la lógica compartida donde corresponde. El grabador de notas de voz conserva su presentación anterior en chats y su variante de computadora; la nueva presentación es exclusiva de estados móviles.

El código sigue usando TypeScript/JavaScript en el navegador y los servicios Firebase existentes. Esta corrección no añade servidores, proveedores, permisos de Authentication ni reglas nuevas de Firebase.

## Verificación y límites

- 83 pruebas unitarias, incluidas tres para el contador de archivados y las fechas del visor y de la lista.
- 19 recorridos funcionales de la corrección en Chromium: cabeceras, formularios de canal, desplazamiento, invitaciones, reporte de canal, visor, visibilidad, llamadas, respuesta, grabación, cancelación y archivados.
- Comparación de estados y visor a 320, 390, 820 y 1440 píxeles en claro y oscuro.
- Ocho comprobaciones del grabador de notas de voz de chat y 45 de menús de contactos, más compilación y comprobación de documentación.

Los servicios externos de las pruebas de navegador usan datos sintéticos. Las capturas de comprobación y la ilustración oficial descargada se conservan fuera del repositorio. No se han enviado reportes, llamadas o mensajes a personas reales durante la revisión. No se han realizado pruebas en dispositivos físicos.

## Pendientes concretos

- Reportar estados: recorrido de moderación y referencia de su confirmación.
- Selectores internos de tonos y vibración, teclado de llamadas y acceso directo del sistema: faltan referencias de los recorridos interiores.
- Lista individual de seguidores guardados e historial para calcular seguidores netos.
- Personalización avanzada de las tarjetas compartidas en estados y pantallas interiores no aportadas.

Estas diferencias siguen pendientes; esta versión no certifica una copia visual del 100% de todo Nexus Chat.
