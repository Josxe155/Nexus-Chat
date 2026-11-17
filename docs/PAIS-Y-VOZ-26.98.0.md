# País y reproducción de voz — v26.98.0

## País de la cuenta, también en computadora

La admisión solicita ubicación del navegador en celular, tablet y computadora para identificar el país. No añade un botón de envío de ubicación al chat de computadora. Se consulta el servicio gratuito de geocodificación desde el navegador, con las coordenadas obtenidas mediante permiso. A Firebase solo se envían país, procedencia de la selección y fecha; no se guardan coordenadas.

Si no se concede permiso, no existe geolocalización o falla la consulta, se utiliza el selector de países que ya tenía el proyecto. La persona debe elegir un país para continuar; idioma y zona horaria únicamente sugieren una posición en esa lista y ya no asignan un número silenciosamente. La ubicación identifica el país actual, no acredita nacionalidad o lugar de nacimiento.

El país se confirma una vez para la cuenta. Las siguientes entradas reutilizan esa selección para no cambiar el número durante un viaje. El formulario de nuevo contacto toma su país inicial del número de la cuenta y permite cambiarlo para agregar a alguien de otro país. Mientras carga no muestra Ecuador como si fuera un país confirmado.

Los prefijos se obtienen del plan internacional: Venezuela +58, Ecuador +593 y México +52. En cuentas antiguas aún sin país confirmado puede corregirse una asignación equivocada. Se reserva el número nuevo en una transacción y se conserva la reserva anterior como vínculo con el mismo UID: los contactos guardados con el número antiguo siguen encontrando a la persona. No se cambia el UID, el historial ni el perfil. Las reglas solo permiten esa corrección inicial al dueño de la cuenta, con reserva única y registro de país en la misma operación.

## Descarga y audio de KokoroJS

El problema descrito era que la preparación reaparecía después de la descarga sin llegar a producir voz. Había dos recorridos que favorecían esa experiencia: los eventos del SDK al leer un archivo ya guardado también se etiquetaban como descarga, y el plazo del primer audio empezaba antes de terminar la transferencia. Los fallos podían reiniciar un worker automáticamente. Además, desmontar el lector al preparar otro informe descartaba el modelo que acababa de quedar listo.

Ahora el SDK consume directamente el archivo descargado y verificado. Los bloques completos permanecen en IndexedDB y no se eliminan al terminar; se reutilizan tras recargar. Se aprovechan también archivos válidos de la caché anterior. El progreso de descarga solo corresponde a bytes transferidos/confirmados, no a una lectura local del SDK. Al terminar comienza la preparación del motor y del audio, sin volver a anunciar la misma descarga.

La transferencia tiene un límite absoluto de diez minutos y un límite sin progreso; inicialización y generación inicial tienen plazos separados de dos minutos. Un fallo devuelve el control y no vuelve a descargar o reinicializar en un ciclo automático. La persona puede iniciar un intento nuevo. Si una lectura termina, el motor queda disponible hasta cinco minutos para reutilizarlo en otro informe; después se libera memoria. Cerrar o salir de la sesión libera el motor. Los archivos locales permanecen, salvo que se borren los datos del sitio o el navegador los elimine.

KokoroJS ejecuta el modelo en el dispositivo. Descargar los archivos no instala un servicio en el sistema operativo ni evita la preparación de un proceso nuevo después de recargar. El tamaño del modelo, la memoria disponible y el rendimiento del dispositivo siguen influyendo. Si el almacenamiento local se bloquea o se vacía, no se promete conservar los archivos indefinidamente.

## Verificación

- 180 pruebas unitarias: suite existente y pruebas nuevas de detección, denegación de permiso, voz y códigos internacionales.
- 115 comprobaciones con emuladores: corrección EC a VE, nueva reserva, conservación del número anterior, ausencia de coordenadas, prohibición de nuevas reasignaciones y acceso privado; regresiones de invitados, mensajes, medios, encuestas y canales.
- Ubicación permitida y selección manual en 390, 820 y 1440 px, con consulta geográfica simulada y sin escribir datos de producción.
- Motor real y compilación equivalente a Hosting: el botón «Escuchar informe» produjo PCM no vacío y arrancó `AudioBufferSource` en la primera lectura, en otro informe y tras recargar. Se contó una única transferencia del modelo ONNX para los tres recorridos. La segunda lectura cambió el texto y desmontó el componente anterior.
- Se repiten las referencias anteriores de chat y nuevo contacto. Las comprobaciones por tamaño y los audios generados en Chromium no sustituyen una prueba física en Android/iPhone, de su altavoz ni de su memoria disponible.

Fuentes: [WhatsApp: números internacionales](https://faq.whatsapp.com/640432094208718/), [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API), [Geocodificación gratuita de navegador](https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free), [condiciones de uso del servicio](https://www.bigdatacloud.com/docs/article/fair-use-policy-for-free-client-side-reverse-geocoding-api), [KokoroJS oficial](https://github.com/hexgrad/kokoro/blob/main/kokoro.js/README.md).

La matriz por tamaño suma 87 recorridos, incluidas las referencias anteriores: celular 45/45, tablet 23/23 y computadora 19/19. Los porcentajes corresponden únicamente a estos casos, no al progreso total de la aplicación.
