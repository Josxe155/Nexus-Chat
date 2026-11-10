# Revisión general de superficies — v26.84.1

## Errores reproducidos y corregidos

1. Durante la grabación, el área exterior del control conservaba un fondo transparente. Sus márgenes inferiores mostraban el fondo del chat. En computadora también era transparente el propio contenedor de grabación. Ahora el área de escritura cubre su relleno y el espacio seguro inferior mientras se graba.
2. Al abrir emojis, el relleno exterior de la zona de escritura podía mostrar otra franja del chat. Los selectores usaban fondos independientes y el de computadora se anclaba con una distancia fija de 75 píxeles. Ahora el fondo cubre el contenedor completo y el selector flotante de computadora se ancla al borde del área de escritura. El selector integrado de tablet mantiene su distribución.
3. El gris fijo de los controles y del selector de computadora ignoraba la paleta azul y otras paletas. Ahora el fondo, las selecciones y el foco utilizan los colores activos de Nexus. El selector de celular también toma la paleta activa y cubre una sola vez el área segura inferior.

El área de escritura normal conserva su tratamiento anterior al cerrar los paneles. No se añadieron menús ni funciones. La grabación, los permisos del micrófono, la codificación y el envío no se modificaron.

## Recorrido y resultados

Las pruebas de componentes utilizaron datos sintéticos y adaptadores para los servicios. El CSS corresponde a la compilación de producción. Las pruebas públicas no iniciaron sesión ni modificaron datos de usuarios.

| Área | Comprobación | Resultado |
| --- | --- | --- |
| Grabación y emojis | 8 recorridos: 320, 390, 820 y 1440 píxeles, claro/oscuro. Componentes reales, micrófono sintético de Chromium, pausa, reanudación, envío de un archivo con contenido, liberación de pistas, selección de emoji y cierre. | Pasan. |
| Fondos y paletas | 60 combinaciones de estructura representativa, tema, paleta y panel: predeterminada, grafito, azul, verde y violeta. | Fondos coincidentes con la paleta, relleno opaco y sin desbordamiento horizontal. |
| Selección de emojis | 10 combinaciones de tema y paleta en computadora. | El relleno seleccionado utiliza la paleta activa. |
| Área segura | Margen inferior simulado de 24 píxeles en el recorrido de componentes. | El fondo cubre el área; el selector de celular llega al borde inferior. |
| Ventanas bajas | Emojis a 390×360, 820×390 y 1440×420. | Paneles dentro de la pantalla. |
| Ajustes | 25 pantallas móviles en claro y oscuro: apariencia, icono, estilo, accesibilidad, animaciones, chats, transferencia, privacidad y sus revisiones, ubicación, notificaciones, contador, enfoque, almacenamiento, duración, uso de datos y ayuda. | 50 comprobaciones sin excepciones, contenido vacío ni desbordamiento horizontal. |
| Cuenta | Contraseña, correo, informes, número, menú, seguridad, usuario y cierre en cuatro anchuras y ambos temas. | Pasan los recorridos existentes con servicios simulados. |
| Inicio de Ajustes | Desplazamiento desde el primer píxel, flecha/búsqueda/QR/lápiz y navegación en cinco anchuras. | Pasan las regresiones existentes. |
| Info. de contacto | Cuatro recorridos móviles en ambos temas: conservados, caché, selección/ordenación, silencio, duración y acciones pendientes. | Pasan con servicios simulados. |
| Portada, acceso al dashboard, guía y error | Cuatro rutas en cuatro anchuras. | 16 comprobaciones sin excepción de JavaScript ni desbordamiento horizontal. |
| Código | TypeScript, documentación, 30 pruebas existentes y compilación de Hosting. | Pasan antes de publicar. |

Los resultados indican el alcance comprobado; no son un porcentaje de terminación del proyecto. Los recorridos se solapan y no se suman como si fueran funciones independientes.

## Pendiente de verificación real

- Android e iPhone físicos, especialmente teclado, gestos, micrófono y área segura del sistema.
- Prueba de usuario con sus conversaciones reales, archivos antiguos y conexiones lentas.
- Llamadas entre dispositivos, push con la pestaña cerrada y biometría física.
- Envío y recepción reales por Firebase del audio generado; en el recorrido automatizado el envío se captura localmente para no escribir datos de prueba en producción.
- Catálogos remotos de GIF y stickers con conexión real: sus adaptadores están simulados en las pruebas de componentes.

Esta revisión cubre las pantallas y estados de la tabla; no certifica que se hayan ejecutado todas las combinaciones posibles ni que no existan errores en las funciones pendientes del proyecto.
