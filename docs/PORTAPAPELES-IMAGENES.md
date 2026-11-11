# Pegar imágenes en celular · v26.90.0

En un chat donde puedas escribir, abre **Adjuntar → Pegar imagen**. Copia previamente la imagen, no solo su enlace. El navegador puede solicitar permiso para leer el portapapeles.

Las imágenes se abren en la revisión de archivos existente: puedes añadir comentario, editar los formatos compatibles, quitar imágenes, cancelar o pulsar **Enviar archivos**. El borrador de texto se conserva. No se suben ni se envían imágenes hasta confirmar el envío. Se admiten hasta diez imágenes por operación y se elige una representación por imagen, evitando duplicar PNG/JPEG del mismo elemento.

La opción usa la presentación de celular ya utilizada por el compositor, incluida su variante horizontal. Tablet y computadora conservan su menú y el pegado nativo existente. Mantener pulsado el campo del mensaje y elegir **Pegar**, o pegar desde un teclado compatible, también conserva el recorrido de revisión cuando el navegador entrega un archivo de imagen.

## Compatibilidad y privacidad

- La lectura explícita requiere una conexión segura y `navigator.clipboard.read`. Se solicita únicamente al tocar la opción; no al cargar la página, entrar al chat o enfocar el campo.
- Se admiten PNG, JPEG, WebP, GIF, AVIF y BMP ofrecidos por el portapapeles. No se descargan imágenes de HTML ni enlaces copiados. La edición y el envío conservan las capacidades del flujo multimedia existente.
- Si falta la API, el permiso se deniega o no hay imágenes compatibles, se muestra una indicación dentro del chat durante tres segundos. No se exponen errores internos. El navegador y el teclado determinan si ofrecen el pegado nativo de imágenes; siempre se conserva la opción de adjuntar la foto.
- Un doble toque no inicia dos lecturas simultáneas. Si cambia la cuenta, el chat, el permiso para escribir o se desmonta el chat mientras se espera una respuesta, se descarta el resultado que ya no corresponde.
- Esta entrega no cambia reglas de acceso, cuotas, proveedores ni credenciales.

## Referencia oficial

Se consultó [Editar fotos y videos, Centro de ayuda de WhatsApp](https://faq.whatsapp.com/812276063311533/?cms_platform=iphone&locale=en_US) para conservar la revisión, edición y comentario antes del envío. El botón de portapapeles es la adaptación web solicitada para Nexus; esa documentación no describe una API web de pegado ni garantiza compatibilidad de navegadores móviles.

## Verificación

Ocho pruebas unitarias comprueban representaciones múltiples, formatos, límite de diez, errores, lectura parcial y extracción de archivos nativos sin duplicados. El comando es `npm run test:image-clipboard` y queda incluido en GitHub Actions.

La prueba de interfaz utiliza ChatWindow, los compositores y el lector reales; el transporte de envío se simula para evitar datos de producción. Se escribió y leyó un PNG real mediante Clipboard API en Chromium. La denegación de permiso y las respuestas demoradas se simularon para comprobar los errores y las condiciones de navegación.

| Dispositivo simulado | Casos aprobados | Alcance |
| --- | --- | --- |
| Celular | 22/22 (100 %) | Lectura real, conservación del borrador, cancelación sin subida, pegado nativo, envío confirmado y alertas en 320/390 y temas claro/oscuro; además doble toque y descarte tras bloqueo o cambio de chat. |
| Tablet | 2/2 (100 %) | Menú existente y revisión por pegado nativo a 820, en ambos temas. |
| Computadora | 2/2 (100 %) | Menú existente y entrega de archivos pegados al componente de revisión a 1440, en ambos temas. |

Son porcentajes de estos casos definidos, no del producto completo ni de compatibilidad universal. No se han realizado pruebas físicas en Android o iPhone/Safari.
