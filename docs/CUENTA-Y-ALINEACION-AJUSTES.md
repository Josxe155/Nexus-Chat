# Cuenta y alineación de Ajustes — v26.81.0

## Cambios entregados

Cuenta utiliza las capturas proporcionadas como referencia para agrupar seguridad e identidad. El menú superior contiene Solicitar info. de mi cuenta y Eliminar cuenta. Ambas opciones conservan los procesos existentes; la eliminación requiere reautenticación y confirmación escrita. Cerrar sesión aparece separado al final.

Se incorporaron el envío del enlace de recuperación de contraseña para cuentas con contraseña, la consulta del correo y su estado de verificación, el envío de un correo de verificación y la consulta y copia del número de Nexus. Las cuentas con acceso externo ofrecen el enlace a la seguridad de su acceso en lugar de simular una contraseña propia. Antes de enviar correos se comprueba que la sesión corresponde al perfil abierto. Los errores se muestran con texto comprensible, sin detalles internos del servicio.

No se simulan funciones sin soporte: múltiples cuentas simultáneas, llaves de acceso de cuenta, verificación en dos pasos y cambio de número telefónico quedan pendientes. El bloqueo de aplicación conserva su nombre y alcance; no se presenta como segundo factor de autenticación. No se incluyen preferencias exclusivas de Meta. El número de Nexus sigue siendo el identificador existente, no una línea celular.

Las filas compartidas separan el contenido principal del extremo derecho. Las flechas mantienen su posición y centrado aunque el texto ocupe varias líneas. Los botones de cabecera tienen dimensiones y centrado explícitos. El menú de Cuenta usa el componente flotante existente, con ajuste al espacio disponible, navegación por teclado, cierre y restauración del foco. La etiqueta del botón de cierre se adapta al menú abierto.

## Referencias oficiales consultadas

- [Consejos de seguridad de la cuenta de WhatsApp](https://faq.whatsapp.com/1095301557782068): funciones de seguridad como referencia, sin atribuirlas a Nexus cuando no están implementadas.
- [Solicitud de información de cuenta, documentación oficial de contacto](https://www.whatsapp.com/contact/forms/696255948470523): acceso a información desde la aplicación.

## Verificación

Compilación de producción, TypeScript, enlaces de documentación y las 23 pruebas existentes de Assistant, propietario y formato pasan. Chromium automatizado comprobó Cuenta en temas claro y oscuro a 320, 390, 820 y 1440 píxeles. Se usaron componentes reales, CSS de producción y datos y servicios simulados; no se enviaron correos ni se eliminaron cuentas reales.

Matriz de esta entrega (no del proyecto completo):

| Comprobación | Celular | Tablet | Computadora |
| --- | --- | --- | --- |
| Filas e iconos alineados, incluidos textos largos | Verificado | Verificado | Verificado |
| Menú dentro de la pantalla, claro y oscuro | Verificado | Verificado | Verificado |
| Navegación, cierre con Escape y restauración del foco | Verificado | Verificado | Verificado |
| Acciones de correo y rechazo de sesión ajena con servicios simulados | Verificado | Verificado | Verificado |
| Copia de número y bloqueo inicial de eliminación | Verificado | Verificado | Verificado |
| Regresión de cabecera: cuatro botones y desvanecimiento desde el primer píxel; otras vistas conservadas | Verificado | Verificado | Verificado |
| Publicación y manifiesto de versión | Pendiente | Pendiente | Pendiente |
| Recepción real de los correos de recuperación/verificación | Pendiente | Pendiente | Pendiente |
| Prueba manual en Android, iPhone, tablet y computadora físicos | Pendiente | Pendiente | Pendiente |

Avance verificado antes de publicar: celular 6/9 (67 %), tablet 6/9 (67 %), computadora 6/9 (67 %). Las funciones no implementadas indicadas arriba y la revisión de todos los subapartados de Ajustes permanecen en el inventario general; esta entrega no certifica equivalencia total con WhatsApp ni revisión de cada pantalla.
