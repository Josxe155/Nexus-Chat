> Documento histórico. La versión vigente se describe en [ACTUALIZACION-NEXUS.md](ACTUALIZACION-NEXUS.md).

> Informe histórico de una revisión anterior. El estado actual y las limitaciones están en ESTADO-FUNCIONES.md y CONFIGURACION-GRATUITA.md.

# Revisión de Nexus Chat

Se trabajó sobre una copia de nexus-chat.zip. El ZIP original se conservó intacto.

## Resultado y acceso

- Local: http://localhost:3000/
- Misma red local: http://192.168.0.104:3000/ (sujeto al firewall y a que la IP del equipo siga siendo la misma).
- Servidor: Vite, puerto 3000. No se publicó la aplicación en Internet.
- Para volver a iniciarlo: `npm ci` y `npm run dev` dentro de la carpeta del proyecto.

## Cambios aplicados

| Área | Problema encontrado y corrección |
| --- | --- |
| Bienvenida | Se retiraron el QR decorativo y el tutorial de uso del navegador. Ahora muestra una bienvenida y acceso directo. |
| Marca y lema | Se usa «Nexus Chat» y «Cada conversación nos acerca». Se ajustó el contraste del encabezado móvil y los botones de acceso. |
| Reglas de Firestore | Se retiró HTML que invalidaba el archivo y se corrigió el bloque de cierre. Se restringieron las modificaciones de mensajes ajenos a lectura y reacciones propias; se protegen los participantes de las conversaciones. |
| Storage | Se añadieron reglas por participantes y límite de 25 MB. firebase.json referencia ambos archivos de reglas. |
| Bots | Los perfiles de demostración se generan localmente; no escriben en perfiles ajenos. Se evita responder al mensaje del chat anterior y se limita la repetición dentro de la sesión. No se presentan datos meteorológicos inventados como datos reales. |
| Perfil | Iniciar sesión nuevamente conserva el nombre, la foto y la biografía existentes. |
| Inicio de sesión | Se maneja el fallo al cargar el perfil para evitar un indicador de carga indefinido. Se limpia el estado de conversaciones al cerrar sesión. |
| Envío | Mensaje y vista previa se guardan en un lote. Los contadores usan incrementos atómicos y las reacciones actualizan el campo de cada usuario. El texto se conserva si falla el envío y se bloquea el doble envío desde el botón. |
| Respuestas | Se guarda el contexto de la respuesta citada que el componente enviaba pero la aplicación ignoraba. |
| Historial | Se dividen los lotes grandes. «Eliminar chat» elimina también el documento de conversación; «Vaciar historial» conserva la conversación. Las confirmaciones explican que afectan a ambos participantes. |
| Audio y archivos | Se corrige la limpieza del grabador que podía detenerlo al empezar, se usa el tipo de audio real, se limpian temporizadores y se muestran errores de carga. Se permite volver a seleccionar el mismo archivo. |
| Fechas | Los encabezados usan una fecha local normalizada, evitando interpretar incorrectamente formatos regionales. |
| Tema | Se sincroniza la clase del modo oscuro, se valida la preferencia guardada y se añade el control de tema dentro de la sesión. |
| PWA y recursos | Se corrige el favicon, se enlaza el manifiesto, se usa un icono local y se renueva la estrategia de caché para evitar HTML antiguo y respuestas inválidas. El service worker solo se registra en producción. |
| Herramientas | Se excluye dist del análisis de TypeScript y se sustituye el comando de limpieza incompatible con Windows. Se actualiza el README y se retiran dependencias que no usaba el código. |
| Dependencias | Se aplicaron actualizaciones compatibles, se actualizó Vite y se añadió una sustitución de @grpc/grpc-js dentro de la versión principal 1 para corregir el aviso heredado de Firebase. La auditoría final informa cero vulnerabilidades conocidas. |
| Información de seguridad | Se retiraron afirmaciones de cifrado de extremo a extremo y funciones anunciadas que no estaban implementadas. |

## Verificación realizada

- `npm run lint`: correcto, sin errores de TypeScript.
- `npm run build`: correcto. La compilación advierte de un archivo JavaScript grande, aproximadamente 952 kB / 248 kB comprimido. Queda como mejora de rendimiento dividir la carga de código.
- `npm audit --json`: cero avisos en todas las severidades en la comprobación final. Esto no equivale a una auditoría exhaustiva de seguridad de la aplicación.
- Navegador Edge, escritorio y móvil: sin errores de JavaScript durante la prueba de la bienvenida, sin desbordamiento horizontal a 390 px, cambio de tema conservado al recargar, apertura y edición del formulario de invitado y regreso a la bienvenida.
- Marca, lema y retirada del QR: comprobados en el navegador.
- Favicon, manifiesto, icono y módulo de aplicación: respuesta HTTP 200.
- Capturas guardadas: nexus-desktop.png y nexus-mobile.png.

## Pendientes y límites de la revisión

1. Las reglas modificadas permanecen locales. Antes de usar esta versión con datos reales, deben probarse con los emuladores de Firebase y desplegarse al proyecto correcto. No se modificó el Firebase remoto.
2. No se validó el inicio de sesión real con Google o Anónimo, ni una conversación entre dos cuentas, ni la subida real de archivos. Requieren la configuración y permisos efectivos del proyecto Firebase. La prueba del formulario no creó cuentas.
3. La grabación necesita una prueba con micrófono y con distintos navegadores; solo se revisó y corrigió su implementación.
4. Los bots continúan siendo respuestas de demostración, sin servicio de IA. No hay cifrado de extremo a extremo, emparejamiento QR ni un sistema especial que limite el acceso a cuatro dispositivos.
5. El historial todavía se escucha completo: falta paginación. La edición o eliminación de mensajes puede dejar la vista previa del último mensaje sin actualizar. La sincronización de lectura al cambiar de pestaña necesita una prueba funcional.
6. La presencia al cerrar la pestaña no es fiable con escrituras asíncronas; conviene implementar presencia con desconexión gestionada por el servidor.
7. El borrado de historial es compartido y no implementa un borrado privado por usuario. La eliminación de grandes historiales se hace por lotes, sin transacción global; una interrupción puede dejar un borrado parcial.
8. Los archivos usan enlaces de descarga con token de Firebase, que pueden compartirse fuera del chat. El filtro de archivos no sustituye un análisis de contenido. Las reglas nuevas de Storage requieren validación en el entorno Firebase antes del despliegue.
9. El comportamiento sin conexión y las actualizaciones de la PWA requieren pruebas adicionales en producción. Las pruebas visuales se realizaron en el servidor de desarrollo.

El archivo nexus-chat-revisado.zip contiene el proyecto y la compilación; excluye node_modules y las cachés. README.md contiene las instrucciones de ejecución.
