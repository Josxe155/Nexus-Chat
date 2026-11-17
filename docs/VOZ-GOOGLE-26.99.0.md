# Lectura de voz — v26.99.0

## Implementación

Se retira KokoroJS de todos los controles de lectura: respuestas de Nexus AI, Nexus Assistant e informes del dashboard usan el mismo reproductor. Se mantienen sus botones existentes. No se añaden servidores propios, Functions, Blaze ni servicios de pago.

[gTTS](https://gtts.readthedocs.io/en/stable/) es una biblioteca Python que utiliza el servicio de voz de Google Translate. Esta web no ejecuta esa biblioteca: reproduce directamente MP3 del endpoint web `https://translate.google.com/translate_tts`, en español, con `HTMLAudioElement`. Se comprobó una respuesta HTTP 200 `audio/mpeg` y reproducción real en Chromium. El servicio rechaza las peticiones con Referer de terceros: las dos entradas HTML incluyen `referrer=no-referrer`, por lo que tampoco envían la dirección de Nexus al abrir recursos externos. El recurso no permite un `fetch` con CORS; el reproductor usa audio multimedia directo sin `crossOrigin`.

Se divide el texto en segmentos de hasta 100 caracteres, respetando frases, palabras y pares Unicode. El texto completo de 500 líneas se conserva; no se establece un límite de 500 caracteres. Un único elemento de audio reproduce los segmentos en orden. Detener, cambiar de lectura, cerrar la página o salir del asistente cancela la lectura activa. Un error devuelve el botón a su estado inicial; volver a intentar requiere una pulsación. Cada espera de red tiene un límite de veinte segundos que los eventos de progreso no prolongan.

## Privacidad y límites

El texto que se escucha se envía a Google en la petición de audio. No se guarda una copia nueva del informe ni del chat en Firebase por usar la voz. El navegador puede conservar audio según sus políticas de caché. Se necesita Internet; no hay lectura sin conexión ni modelo que descargar. Este endpoint web no constituye una API pública con garantía de continuidad: puede limitar solicitudes, cambiar o dejar de responder. Los informes largos pueden tener pausas entre segmentos. No se garantiza reproducción en segundo plano ni desbloqueo de audio en todos los iPhone sin pruebas físicas.

La limpieza de migración elimina únicamente `kokoro-voices`, entradas del modelo Kokoro en `transformers-cache` y bases `nexus-kokoro-download-*` cuando el navegador permite enumerarlas. Conserva conversaciones, sesión, cola de mensajes y otros modelos. Se retiran las dependencias de Kokoro, Transformers y el fonemizador, el worker y los binarios generados de `public/tts`. Los documentos anteriores se conservan como historial.

## Verificación

- TypeScript, compilación de Hosting y enlaces de documentación correctos.
- 178 pruebas unitarias aprobadas: 167 de la suite general, ocho de actualización masiva y tres de país. Incluyen nueve casos del nuevo reproductor, texto completo de 500 líneas, cancelación, error, reintento explícito y límite de espera.
- 21 comprobaciones de navegador aprobadas: celular 7/7 (100 %), tablet 7/7 (100 %) y computadora 7/7 (100 %), en 390, 820 y 1440 px. Se comprobaron dos lecturas sucesivas de informe, respuesta larga con dos segmentos, cancelación, error que desaparece a los tres segundos, conservación de otros datos al limpiar la voz, ausencia de descargas de modelo y ausencia de desbordamiento horizontal. Cada tamaño recibió cuatro respuestas reales MP3 de Google antes de la prueba de cancelación.
- La compilación deja de incluir los ejecutables, modelos y worker de Kokoro. Conserva las correcciones de país de v26.98.0 y sus reglas ya verificadas.

Los porcentajes corresponden exclusivamente a estos siete recorridos por tamaño, no al estado global de Nexus. Las pruebas de navegador simulan tamaños de pantalla; no equivalen a pruebas físicas en Android o iPhone.
