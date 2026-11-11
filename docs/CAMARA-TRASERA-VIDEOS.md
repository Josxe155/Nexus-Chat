# Cámara frontal y trasera al grabar · v26.91.1

La cámara de fotos/video y el grabador de video instantáneo incorporan un botón con el icono de cambiar cámara. Su etiqueta accesible indica **Cambiar a cámara trasera** o **Cambiar a cámara frontal**, según la selección actual.

Puedes elegir la orientación antes de activar la cámara o empezar la grabación. También puedes cambiarla durante un video y, en una nota de video, mientras está pausada. La selección se conserva al repetir dentro del mismo grabador; no modifica los ajustes generales de dispositivos. Si existe una cámara guardada en Ajustes, se respeta al abrir salvo que elijas expresamente una orientación diferente.

## Fuente oficial y alcance

El [Centro de ayuda de WhatsApp: enviar notas de video](https://faq.whatsapp.com/993629751672762/?cms_platform=android) describe el cambio entre cámara frontal y trasera antes y durante la grabación, así como las notas de hasta sesenta segundos. Esta entrega aplica esa función a los grabadores existentes de Nexus, conservando la revisión y confirmación de envío que ya ofrecían. No sustituye todos los gestos ni certifica equivalencia visual completa con la aplicación nativa.

La cámara normal también conserva tomar foto, repetir y enviar captura. No se modifican la cámara de videollamadas, el flujo de foto de escritorio ni las notas de voz.

## Continuidad y permisos

- El cambio sustituye únicamente la cámara de entrada. Se conserva el micrófono y no se reinicia el contador ni el archivo del video.
- Cuando el navegador permite capturar un lienzo, el grabador recibe una pista de video estable de la vista previa y la misma pista de audio. Cambiar de cámara no añade o retira pistas de MediaRecorder ni concatena archivos independientes.
- En dispositivos que exigen liberar una cámara antes de abrir otra, se libera solo la cámara, manteniendo el audio. Si falla el cambio, se intenta recuperar la cámara anterior. Si no se puede recuperar, se indica detener y revisar la grabación antes de reintentar.
- Si falta esa capacidad del navegador, se conserva la grabación directa. Solo se cambia durante la grabación si el mismo track admite cambiar de orientación; en caso contrario, se invita a elegir cámara antes de empezar. No se descarta ni reinicia la grabación para simular el cambio.
- Una cámara única, un permiso denegado o una selección que devuelve la misma cámara producen un aviso comprensible de tres segundos. No se anuncia un cambio de orientación que no ocurrió.
- Cerrar durante una solicitud pendiente libera también los dispositivos que se concedan después. Al revisar, repetir o salir se detienen las pistas correspondientes y se liberan los recursos temporales.
- La revisión no envía automáticamente el archivo; el envío requiere la acción existente de confirmación. Se mantienen el máximo de sesenta segundos y los formatos de grabación admitidos por el navegador.

## Verificación

`npm run test:recording-camera` ejecuta diez pruebas unitarias: restricciones de orientación, conservación del micrófono, rechazo de la misma cámara, cámara inexistente, recuperación después de liberar la anterior, cierre durante apertura/cambio, preferencia obsoleta y mensajes de error. La corrección v26.91.1 cubre además el fallo de ambas cámaras: conserva el audio para revisar y no cambia la etiqueta de orientación si ya no hay cámara activa.

Las pruebas de navegador usan los componentes reales y MediaRecorder real. Dos cámaras sintéticas generan imágenes de colores distintos y un micrófono sintético proporciona audio. Se decodificaron videos grabados con ambos colores para comprobar que el mismo archivo contiene las dos cámaras; también se verificó que las identidades de las pistas de grabación y el micrófono permanecen estables.

| Tamaño simulado | Casos comunes aprobados | Cobertura |
| --- | --- | --- |
| Celular, 320 y 390 | 16/16 (100 %) | Cámara normal y video instantáneo, claro/oscuro, elección previa, cambio durante grabación, pausa de nota, revisión sin envío, envío confirmado y cierre de dispositivos. |
| Tablet, 820 | 8/8 (100 %) | Los mismos grabadores y comprobaciones en ambos temas. |
| Computadora, 1440 | 8/8 (100 %) | Regresión de los componentes compartidos en ambos temas. No añade una nueva entrada de video al menú de cámara de escritorio. |

Además se comprueban nueve casos específicos: decodificación frontal/trasera en ambos tipos de video, cámara trasera ausente, recuperación tras fallo, cierre durante cambio, foto trasera y repetición, navegador sin composición de video permiso denegado y fallo de ambas cámaras sin anunciar un cambio inexistente. En total son cuarenta y un casos de navegador, con transporte de envío simulado y sin escrituras en producción.

Estos porcentajes se refieren exclusivamente a los casos definidos. Continúa pendiente probar cámaras físicas en Android y iPhone/Safari y medir el rendimiento en equipos de gama baja. La codificación de video, el acceso a dos cámaras y la grabación en segundo plano dependen del navegador y del dispositivo.
