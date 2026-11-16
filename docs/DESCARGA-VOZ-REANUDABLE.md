# Descarga de voz reanudable — v26.94.2

La primera lectura sigue necesitando el modelo Q8 de 92 361 116 bytes (unos 92 MB). Esta actualización evita repetir los bytes ya guardados después de cancelar, perder la conexión o agotar la espera de preparación; no reduce el peso del modelo ni garantiza una primera descarga rápida en celulares.

## Funcionamiento

Antes de iniciar la síntesis, el worker guarda bloques de aproximadamente 1 MiB en IndexedDB. Cada bloque y su contador se confirman en la misma transacción. El progreso anunciado corresponde a bytes guardados. Al detener la lectura, el worker termina; el bloque todavía sin confirmar puede perderse, pero los bloques confirmados permanecen. Un nuevo intento solicita el resto mediante HTTP Range.

La descarga usa una revisión inmutable del modelo oficial para no mezclar versiones. Se comprueban el estado HTTP, el rango y tamaño cuando esas cabeceras están disponibles, y el tamaño final. Si el servidor ignora Range, se reinicia sin concatenar un archivo entero al fragmento anterior. No se presenta esta validación de tamaño como una comprobación criptográfica.

Al completar la descarga se entrega el archivo a la misma Cache Storage que utiliza el motor de voz y se eliminan los bloques temporales. Un modelo completo que ya estuviera guardado se reutiliza. Web Locks evita que dos pestañas de este origen descarguen simultáneamente el mismo modelo. Si esas APIs no existen, se conserva la descarga normal del motor, sin prometer reanudación.

Estos almacenes solo contienen archivos públicos de voz: no contienen chats, cuentas ni contraseñas. La mejora no escribe en Firestore o Realtime Database y no necesita un servidor ni claves adicionales.

## Límites

- El límite absoluto de dos minutos hasta el primer audio se mantiene. Si vence durante una descarga lenta, otro intento puede continuar los bloques conservados.
- Se necesita espacio local para los bloques, la copia completa y los recursos de ejecución. Una cuota insuficiente puede impedir preparar la voz.
- Borrar los datos del sitio, utilizar almacenamiento temporal o la expulsión de datos por el navegador puede eliminar la descarga. Su conservación no es permanente ni se garantiza en navegación privada.
- Descargar el modelo completo no elimina el tiempo de inicialización, el consumo de memoria ni las restricciones de audio del navegador. Rendimiento en Chrome Android, iPhone y equipos de poca RAM: pendiente de pruebas físicas.

Se conserva Q8: el archivo Q4 de esta distribución pesa 305 215 966 bytes, más que Q8. Cambiar a Q4 no solucionaría esta espera.

## Verificación

Las pruebas automatizadas cubren continuación con Range, descarga truncada, reutilización completa sin red, servidor que ignora Range, cabeceras incompatibles y exceso de tamaño. La comprobación de navegador utiliza el worker y modelo reales, cancelación durante una descarga parcial, continuación desde el contador guardado, síntesis española y reutilización del archivo completo. Los tamaños de ventana no equivalen a dispositivos físicos.

Fuentes: [modelo oficial](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/tree/1939ad2a8e416c0acfeecc08a694d14ef25f2231/onnx), [HTTP Range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range), [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API), [motor y adaptación al español](VOZ-KOKOROJS.md).

Resultado de esta entrega: 150 pruebas unitarias aprobadas, TypeScript y compilación correctos. En Chromium se canceló con 2 097 152 bytes confirmados y la siguiente solicitud usó `Range: bytes=2097152-`; el modelo terminó de descargarse y produjo audio español no silencioso. Después de recargar la página se leyó desde caché en ventanas de 390, 820 y 1440 px sin nuevas solicitudes del modelo. En cada tamaño pasaron lectura desde caché, cancelación y ausencia de desbordamiento: 3/3 (100%) de esos casos; no es avance global ni una prueba física de Android/iPhone. También se comprobó la eliminación de bloques temporales al completar la caché.
