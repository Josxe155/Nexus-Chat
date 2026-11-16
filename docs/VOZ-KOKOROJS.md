# Texto a voz con KokoroJS — v26.94.0

La lectura de respuestas y de informes sustituye meSpeak por **KokoroJS 1.2.1**, modelo `onnx-community/Kokoro-82M-v1.0-ONNX`, cuantización `q8` y voz española `ef_dora`. Se ejecuta en un Web Worker mediante WebAssembly, sin servidor de síntesis, clave de voz ni envío del texto a una API de audio.

## Adaptación al español

La API de texto y el catálogo de voces de KokoroJS 1.2.1 solo exponen inglés. Además, su dependencia `phonemizer` incluye únicamente el diccionario inglés, por lo que pasar directamente español o cambiar el nombre de voz no basta.

La integración usa `espeak-phonemizer` 0.2.0 con su diccionario completo y `es-419` para obtener fonemas españoles, y la API pública `generate_from_ids` de KokoroJS para aplicar la voz española publicada por el modelo. El fonemizador no genera la voz final: el audio lo produce el modelo neuronal de Kokoro. Se normaliza la g al símbolo IPA del vocabulario y se dividen entradas fonéticas largas sin truncarlas.

## Carga, reproducción y cancelación

El modelo se descarga al solicitar la primera lectura; no forma parte de la carga inicial del chat. El navegador puede conservar sus archivos en Cache Storage. La primera preparación necesita una descarga grande y memoria suficiente; puede tardar bastante y no se promete funcionamiento sin conexión hasta disponer de todos los recursos necesarios. No se descargan datos de usuarios para preparar la voz.

Los recursos WebAssembly y el diccionario se sirven desde Hosting, preparados a partir de las dependencias fijadas. El binario principal de inferencia se comparte con el generado por Vite para evitar una copia duplicada de aproximadamente 21 MB. Los pesos del modelo y de la voz se descargan de su distribución pública. El texto se procesa localmente.

La interfaz muestra preparación y permite cancelarla. Se mantienen los fragmentos de texto, la preparación de una pieza por adelantado y la reproducción mediante Web Audio. Detener libera la generación activa y descarta sus resultados tardíos. Iniciar otra lectura detiene la anterior dentro de la misma página. Tras terminar normalmente se conserva un único worker hasta sesenta segundos para reutilizar el modelo; salir del control también libera el modelo inactivo.

Los tiempos de espera de síntesis aumentan a tres minutos por tramo sin progreso para no aplicar el antiguo límite de treinta segundos a la descarga inicial. Los avisos de progreso reales pueden ampliar ese tiempo; no se envían latidos artificiales que mantengan una generación bloqueada indefinidamente. Se conserva un único reintento ante error y el aviso transitorio de la interfaz.

No se vuelve a usar meSpeak si falla el modelo. El soporte en teléfonos reales, el rendimiento con poca RAM y el comportamiento de audio de iOS en segundo plano siguen pendientes de pruebas físicas. Cambiar el tamaño de Chromium no equivale a medir un teléfono.

## Instalación y licencias

`npm ci` prepara los recursos con `scripts/prepare-tts.cjs`; `build:hosting` vuelve a prepararlos. `public/tts/` es generado y está fuera del repositorio. El ZIP de código requiere instalar las dependencias antes de compilar. `.npmrc` evita la descarga CUDA del paquete de inferencia para Node, que no utiliza la web; también puede establecerse `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` al instalar.

KokoroJS y el modelo se distribuyen bajo Apache-2.0. El fonemizador multilingüe se distribuye bajo GPL-3.0-only; se copian su licencia y los avisos de terceros con los recursos públicos. Sus fuentes y construcción están disponibles en los enlaces del paquete. Se conservan las licencias de cada dependencia.

Fuentes: [KokoroJS oficial](https://github.com/hexgrad/kokoro/tree/main/kokoro.js), [modelo ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX), [voces oficiales](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md), [fonemizador multilingüe](https://www.npmjs.com/package/espeak-phonemizer).

## Comprobaciones

Se comprobaron la instalación limpia, TypeScript, compilación y pruebas de división de fonemas, progreso, reintento, exclusión de lecturas simultáneas, reutilización y liberación del worker. Se generó y reprodujo audio real en español con el worker compilado. En la primera prueba de este entorno, descargar y preparar la voz tomó aproximadamente setenta segundos; no es una medición de dispositivos físicos.

La matriz de Chromium prueba preparación cancelable, síntesis real y reutilización, y detener una reproducción sin errores o desbordamiento. Se ejecuta a 390, 820 y 1440 píxeles, en claro y oscuro. Sus porcentajes describen esos recorridos, no la finalización de Nexus Chat.

Resultado de la entrega: instalación limpia correcta, 143 pruebas unitarias aprobadas y dieciocho recorridos reales de reproducción en Chromium. Celular, tablet y computadora completaron seis de seis casos por tamaño simulado. Se comprobó audio no silencioso, preparación y reproducción cancelables, ausencia de errores y reutilización del mismo worker entre dos lecturas completas. No se modificaron datos de producción para probar la voz.
