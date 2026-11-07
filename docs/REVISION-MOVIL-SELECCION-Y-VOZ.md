# Revisión móvil: voz, selección y mensajes nuevos

[Volver al README](../README.md)

Se usan las capturas y el video lento entregados para esta revisión. Sus conversaciones, imágenes y datos personales no se incluyen en Nexus ni en GitHub.

| Apartado | Resultado de esta revisión |
| --- | --- |
| Grabación mantenida | Micrófono que crece al pulsar, control lateral derecho y candado más pequeño con apertura hacia la derecha y cierre al bloquear. |
| Toque corto | Conserva la grabación bloqueada, sin enviar un archivo vacío; también se comprueba un inicio lento del micrófono. |
| Descartar | La captura se detiene inmediatamente. En el chat vuelve la barra real de escritura y la animación continúa sobre ella: micrófono en vuelo y tapa del tacho. Se aplica tanto a grabación mantenida como bloqueada. |
| Seleccionar | Pulsación mantenida sobre la burbuja, franja verde completa, contador y barra superior. Se retira el menú móvil anterior de acciones dentro del mensaje. |
| Reacciones | Barra adaptada al ancho del chat, acceso a más emojis y guardado de la reacción. Al seleccionar varios mensajes no se aplica una reacción colectiva accidentalmente. |
| Mensaje propio | Responder, editar si aún está permitido, eliminar y reenviar. El submenú incluye información, copiar, fijar y traducir texto. |
| Mensaje recibido | Responder, destacar, eliminar de mi vista y reenviar. El submenú permite copiar, fijar si hay permiso, citar en Nexus AI, traducir texto y abrir el reporte. |
| Conservar | El remitente puede conservar su mensaje temporal. Se retira su vencimiento y se registra el original; dejar de conservar restaura exactamente ese plazo, aunque ya haya pasado. Es distinto de destacar un mensaje. |
| Mensajes nuevos | Botón compacto de doble flecha y contador en la esquina superior izquierda. Cuenta llegadas de otras personas mientras el lector está en el historial; no cuenta páginas antiguas ni mensajes propios. Mantiene el acumulado aunque se limite la ventana de mensajes cargados. Volver al final o cambiar de chat lo reinicia. |

## Seguridad y límites

- No se muestra «Verificar código de seguridad»: Nexus no utiliza cifrado de extremo a extremo en mensajes nuevos y no tiene ese código. La información real de seguridad sigue en la ficha de contacto.
- Conservar sólo está permitido al remitente de un mensaje temporal todavía vigente. Las reglas rechazan mensajes eliminados, vencidos, de una sola escucha y alteraciones de contenido, autor o fecha original. Las reglas existentes de participación, fijado y edición continúan aplicándose.
- Conservar evita el vencimiento del mensaje temporal; no excluye el contenido de la limpieza mensual general que decida ejecutar el administrador.
- Traducción y Nexus AI siguen dependiendo de los proveedores configurados. El reporte abre el sistema de reportar la conversación; no envía automáticamente el contenido del mensaje a un tercero.
- Se respetan las preferencias de movimiento reducido. Las pruebas de navegador no sustituyen una comprobación en teléfonos físicos ni certifican llamadas entre dos personas reales.

## Validación

Interfaz completa con datos ficticios en 320, 390 y 820 píxeles: selección propia y recibida, guardado de reacciones, selección múltiple, submenús, traducción, conservar y deshacer, fijado, 50 mensajes entrantes y descarte de grabación bloqueada con la barra de escritura presente durante la animación.

Grabación y reproducción con micrófono simulado en 320, 360, 390 y 820 píxeles: mantener, cancelar, bloquear, pausar, escuchar, reanudar, enviar, cambiar velocidad y recuperar un permiso denegado. Comprobaciones separadas del contador al recortar la ventana de historial. Emulador de Firestore para permisos de conservación y regresión de mensajes. El diseño de escritorio conserva sus propios controles y se comprueba por separado.

## Seguimiento

Se retiran los porcentajes globales publicados anteriormente: no existía una matriz completa ni una medición reproducible que los sustentara. El avance se comunica mediante funciones verificadas, límites conocidos y tareas pendientes. Quedan pendientes la prueba de notificaciones push con un emisor confiable, el visor multimedia general y la validación de voz y llamadas en dispositivos físicos.
