# Fondo de la cabecera de Ajustes · v26.80.0

La portada de Ajustes en celular muestra un fondo de dibujos detrás de la flecha de regreso, búsqueda, código QR y edición del perfil. La decoración termina en el centro del avatar y se desvanece suavemente hacia el fondo de la página, siguiendo la captura de referencia proporcionada por el propietario.

La barra superior y el área de contenido de esa portada son transparentes para que el patrón sea visible. Una capa decorativa independiente evita que las reglas generales de superficies de Ajustes borren la imagen. La capa no captura eventos de puntero. Los tamaños y posiciones existentes del avatar, botones y filas se conservan.

El límite se calcula a partir de la posición real del avatar. Se recalcula al cargar la imagen, cambiar dimensiones o altura de la burbuja de Info., desplazar el contenido y girar la pantalla. Un observador de tamaño y una actualización por fotograma mantienen el dibujo alineado sin escribir preferencias ni modificar datos de perfil. Al salir de la portada se limpian los observadores y variables decorativas.

El patrón se sirve localmente como `public/settings-profile-doodles.png`, conservando el recurso gráfico original y su transparencia. El tema oscuro utiliza trazos neutros tenues; el tema claro invierte el trazo para mantener contraste. Los subapartados de Ajustes y los diseños de tablet y computadora conservan sus superficies habituales. No se añaden suscripciones, cuentas de otras aplicaciones ni otras opciones exclusivas de Meta.

## Referencias

- Captura de Ajustes móvil proporcionada por el propietario: referencia principal de la distribución y del corte del fondo.
- [WhatsApp: cómo editar tu perfil](https://faq.whatsapp.com/859240711908360/?cms_platform=android&locale=es_LA): acceso a foto, nombre e Info. desde Ajustes.
- [WhatsApp: temas y fondos](https://blog.whatsapp.com/chat-themes-to-reflect-your-style): documentación complementaria de los fondos y la personalización. Describe fondos de chat; no sustituye la referencia visual de esta cabecera.
- [Mosaico gráfico del sitio oficial de WhatsApp](https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png): recurso original aplicado localmente a la cabecera. Su nombre de archivo local pertenece a Nexus y no cambia la identidad de la aplicación.

## Verificación

Se usaron los componentes reales SettingsCenter, PhoneSettingsHome, el cálculo de la decoración y el CSS compilado de producción. Los datos, medios y pantallas ajenas al cambio se sustituyeron por adaptadores de prueba; la navegación de los botones se comprobó, sin modificar perfiles reales ni ejercer la cámara del lector QR.

Chromium comprobó Android emulado de 393×873, iPhone emulado de 390×844, celular estrecho de 320×740, tema claro de 390×844, tablet de 820×1180 y computadora de 1440×900. En celular se compararon capturas con y sin la decoración: el patrón produce píxeles visibles y no se extiende por debajo del centro del avatar. Se verificaron barra transparente, navegación de búsqueda/QR/perfil/regreso, cambios de altura, desplazamiento, orientación, ausencia de desbordamiento y ausencia de errores de ejecución. El PNG tiene píxeles totalmente transparentes.

Matriz de esta entrega: (1) referencia oficial y recurso transparente, (2) tipos y compilación, (3) apariencia móvil oscura/clara y límite del fondo, (4) navegación de la cabecera, (5) regresión de tablet y computadora, (6) comprobaciones de GitHub, (7) Hosting y archivos publicados verificados, (8) recorrido en dispositivos físicos. Tras verificar la publicación se completan 7/8, **87,5 % por tamaño**. Es la verificación de esta entrega, no del proyecto completo; falta el recorrido físico.

La mejora de favicon, el resto de categorías de Ajustes y las pantallas de información de contacto siguen en sus pendientes respectivos.

En v26.80.1 la burbuja sin Info. personalizada alterna entre diez preguntas al abrir de nuevo la portada de Ajustes. No se repite una pregunta hasta recorrer la lista. La secuencia se mantiene en memoria por cuenta y no escribe en Firebase. Una Info. personalizada conserva su contenido y el botón sigue abriendo su editor.
