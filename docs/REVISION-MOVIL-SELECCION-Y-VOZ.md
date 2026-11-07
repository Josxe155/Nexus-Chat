# Revisión móvil: voz, selección y mensajes nuevos

[Volver al README](../README.md)

Se usan las capturas y el video lento entregados para esta revisión. Sus conversaciones, imágenes y datos personales no se incluyen en Nexus ni en GitHub.

| Apartado | Resultado de esta revisión |
| --- | --- |
| Grabación mantenida | El micrófono ampliado sigue un eje por vez. Se puede cambiar entre izquierda y arriba durante la misma pulsación. El candado se abre y se cierra lentamente en reposo y sigue el recorrido al deslizar hacia arriba. |
| Toque corto | Conserva la grabación bloqueada, sin enviar un archivo vacío; también se comprueba un inicio lento del micrófono. |
| Descartar | Durante la pulsación, deslizar a la izquierda anima el micrófono rojo y levanta la tapa del tacho hacia arriba y a la izquierda. El botón rojo de la grabación bloqueada elimina la nota al instante. |
| Seleccionar | Pulsación mantenida sobre la burbuja, franja verde completa, contador y barra superior. Se retira el menú móvil anterior de acciones dentro del mensaje. |
| Reacciones | Barra adaptada al ancho del chat, acceso a más emojis y guardado de la reacción. Al seleccionar varios mensajes no se aplica una reacción colectiva accidentalmente. |
| Mensaje propio | Responder, editar dentro del plazo, eliminar, reenviar, conservar cuando corresponde, Info., copiar y fijar. |
| Mensaje recibido | Responder, conservar cuando corresponde, eliminar para mí, reenviar, transcribir audios disponibles, compartir, fijar y reportar. |
| Conservar | Los participantes pueden conservar un mensaje temporal vigente dentro de su historial. El remitente y quien lo conservó pueden restaurar el vencimiento original. |
| Mensajes nuevos | Botón compacto de doble flecha y contador en la esquina superior izquierda. Cuenta llegadas de otras personas mientras el lector está en el historial; no cuenta páginas antiguas ni mensajes propios. Mantiene el acumulado aunque se limite la ventana de mensajes cargados. Volver al final o cambiar de chat lo reinicia. |

## Seguridad y límites

- No se muestra «Verificar código de seguridad»: Nexus no utiliza cifrado de extremo a extremo en mensajes nuevos y no tiene ese código. La información real de seguridad sigue en la ficha de contacto.
- Las reglas de conservación protegen el límite del historial y el vencimiento original. Rechazan mensajes eliminados, vencidos o de una sola escucha.
- La conservación del mensaje temporal mantiene el calendario de limpieza mensual.
- Las notas de voz móviles solicitan captura sin procesamiento de llamadas. El sistema operativo y el navegador determinan el panel de volumen que aparece al usar el micrófono.
- La transcripción manual pide confirmación antes de procesar el audio. Al reportar, Firestore comprueba el mensaje original y guarda una copia de su texto y los datos del adjunto para revisión privada. El bloqueo se aplica a mensajes directos y llamadas.
- Se respetan las preferencias de movimiento reducido. Las pruebas de navegador no sustituyen una comprobación en teléfonos físicos ni certifican llamadas entre dos personas reales.

## Validación

Interfaz móvil con datos ficticios a 320, 390 y 820 píxeles. Las comprobaciones cubren los menús de selección, reacciones, conservar, fijar, el contador y el descarte bloqueado.

Grabación y reproducción con micrófono simulado en 320, 360, 390 y 820 píxeles: mantener, cancelar, bloquear, pausar, escuchar, reanudar, enviar, cambiar velocidad y recuperar un permiso denegado. Comprobaciones separadas del contador al recortar la ventana de historial. Emulador de Firestore para permisos de conservación y regresión de mensajes. El diseño de escritorio conserva sus propios controles y se comprueba por separado.

## Seguimiento

Se retiran los porcentajes globales publicados anteriormente: no existía una matriz completa ni una medición reproducible que los sustentara. El avance se comunica mediante funciones verificadas, límites conocidos y tareas pendientes. Quedan pendientes la prueba de notificaciones push con un emisor confiable, el visor multimedia general y la validación de voz y llamadas en dispositivos físicos.
