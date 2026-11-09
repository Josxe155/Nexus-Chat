# Centro de acciones · dashboard.html

El panel se publica en `/dashboard.html`, dentro del mismo Firebase Hosting. No tiene enlaces en la navegación pública ni depende de GitHub Actions, Cloud Functions o un servidor externo.

## Acceso

Solo la identidad de Nexus designada por el propietario puede entrar, con Google o con la contraseña alternativa añadida a esa misma cuenta. No se creó otra cuenta administradora. Las autorizaciones se guardan en Firebase (`dashboardAdmins/<uid>`), nunca en un correo oculto en JavaScript ni en una contraseña incluida en el HTML. Los clientes no pueden crear o modificar esas autorizaciones. Las reglas verifican una sesión con correo verificado, proveedor Google o contraseña, y la autorización correspondiente en cada base de datos. La contraseña se verifica en Firebase Authentication; nunca se incluye en el HTML, JavaScript ni repositorio. No se versionan identidades personales ni credenciales.

La sesión Google de Nexus ya iniciada se restaura automáticamente. El navegador no puede leer cualquier cuenta abierta en Google. El acceso con correo y contraseña usa una sesión administrativa separada por pestaña, para no cerrar la sesión normal de Nexus de otra cuenta.

## Estadísticas

Recuentos de cuentas, mensajes conservados, mensajes con al menos una recepción confirmada, archivos, espacio y salas de llamada conservadas. Incluye actividad diaria de mensajes y distribución por tipo. Los usuarios que han entrado se cuentan por UID en `dashboardVisits`, desde esta actualización; no se inventa historial de visitas ni se registran visitantes sin iniciar sesión. Solo el usuario y el administrador pueden consultar su registro. No se guardan IP ni detalles del dispositivo.

## Acciones

| Acción | Resultado |
| --- | --- |
| Activar plan mensual | Guarda la próxima fecha y el aviso de tres días en Firebase. No borra al activarse. |
| Revisar contenido | Recuento previo de mensajes, estados y archivos elegibles, sin borrarlos. |
| Ejecutar limpieza pendiente | Requiere fecha cumplida y confirmación escrita. Conserva cuentas, perfiles, contactos, grupos, comunidades, preferencias y medios de perfil/portada referenciados. |
| Ejecutar con el panel abierto | Opción explícita por pestaña; comprueba la fecha cada minuto. |
| Pausar plan | Desactiva el plan en Firebase. |
| Consultar versión | Lee la versión publicada en Hosting. |
| Liberar caché local | Elimina solo descargas de actualizaciones de ese navegador. |
| Descargar resumen | Exporta configuración y recuentos, sin mensajes ni datos de usuarios. |

## Límites de una web estática

**El navegador debe permanecer abierto, con sesión de administrador.** El HTML no se ejecuta si el equipo está apagado, la pestaña está cerrada o el navegador la suspende. Si pasa la fecha, la tarea queda pendiente hasta que el administrador vuelva y la ejecute o habilite la ejecución con el panel abierto. Esto no equivale a un cron de servidor ni garantiza puntualidad.

El plan está desactivado hasta que el propietario lo active en el panel. La primera fecha propuesta es un mes desde la activación; se conserva el día del mes cuando es posible. El aviso aparece únicamente durante los tres días anteriores, una vez por ciclo en ese navegador. No hay etiqueta permanente, opción de limpieza en Ajustes ni botón Abrir mis archivos.

El borrado es irreversible y consume operaciones y transferencia de Firebase. Se procesa por lotes, con bloqueo temporal entre pestañas; si se interrumpe puede retomarse después de liberar el bloqueo. No se borran documentos de chats ni de grupos: se elimina su contenido antiguo y se limpia su resumen. Los archivos nuevos, los de alcances desconocidos y los referenciados por perfiles o portadas se preservan. Los administradores tienen permisos técnicos de eliminación de archivos en Realtime Database: la protección de referencias de fotos se aplica además en el programa. No modificar ese control sin revisar el impacto.

## Prepara Nexus Chat

La introducción de permisos se marca al mostrarse por primera vez en ese navegador. No reaparece por cerrar sin terminar, iniciar sesión o cambiar de versión. Se puede volver a abrir desde Ajustes → Chats → Permisos del dispositivo. Borrar los datos del sitio o usar otro navegador vuelve a considerarse una primera visita. Los permisos nativos siguen dependiendo del sistema.

## Pollinations

Nexus AI reconoce órdenes como «genera una imagen de…», crea la imagen, permite ampliarla y descargarla, y conserva hasta ocho imágenes o 40 MB localmente por cuenta. Usa Pollinations con la clave pública de la entrega, cuya exposición en el navegador fue autorizada expresamente por el propietario. La clave no se incluye en GitHub; cualquier visitante puede extraerla de la web compilada y consumir su saldo. No se cambió la facturación de Firebase.

## Controles adicionales

- Las acciones bloquean un segundo clic mientras se ejecutan; el cierre de sesión también queda bloqueado durante una operación.
- La limpieza valida su fecha antes de empezar y comprueba entre lotes que el plan siga activo, con la misma fecha y el mismo identificador de ejecución. Una pausa, reprogramación o toma de control por otra pestaña detiene el ciclo antiguo. No revierte los lotes ya completados.
- El modo automático intenta cada fecha una sola vez. Si quedan ciclos vencidos después de una ejecución, se detiene para que el administrador revise el plan.
- Las estadísticas indican cuándo terminaron de leerse; se pueden exportar como CSV o detener durante el escaneo, conservando el último resultado completo. La cancelación evita continuar leyendo otras páginas; las solicitudes ya enviadas pueden terminar.
- Los recuentos y archivos CSV contienen cantidades, no textos de chats ni identidades de usuarios. No se modificó la autorización del panel.


## Nexus Assistant · v26.79.0

Modo IA utiliza Gemini mediante `generateContent`, con herramientas de consulta automática. La interfaz es una conversación única: no requiere elegir una sección, una cuenta ni preparar una vista previa. Al enviar, la pregunta y los datos necesarios se comparten con el servicio de IA; el panel informa de ello antes de escribir.

El administrador autorizado tiene lectura general de Firestore y Realtime Database. La autorización requiere correo verificado, acceso por Google o contraseña y la marca administrativa en cada base. No se conceden nuevos permisos a los usuarios ordinarios. Cada consulta y cada comando vuelven a comprobar la autorización. El modelo puede solicitar herramientas, pero el programa comprueba la sesión y la orden actual antes de ejecutar escrituras. Las solicitudes de preparación permanecen pendientes de confirmación.

El asistente puede leer documentos, recorrer colecciones y subcolecciones por páginas, contar registros y consultar rutas de Realtime Database. La paginación evita descargar toda la base de una vez y permite continuar con el cursor. Las contraseñas de Authentication no están disponibles; los datos cifrados antiguos requieren sus claves originales. La consulta tiene los límites técnicos de tiempo, contexto y cuota del servicio; el modelo debe indicar datos ausentes y resultados parciales.

El dictado procesa una sola vez cada resultado final del reconocimiento, aunque el navegador repita eventos. La lectura usa meSpeak/eSpeak con la voz española incluida y Web Audio; no requiere voces españolas del sistema. El historial se mantiene mientras el componente permanece abierto. Las claves y las credenciales se conservan únicamente en la configuración local excluida de Git.

### Pruebas de acceso

Con Java 21, las dependencias de desarrollo y ambos emuladores locales disponibles:

```sh
npx firebase-tools emulators:exec --config firebase.emulators.json --project demo-nexus 'npm run test:dashboard-access'
```

La prueba carga las reglas reales en los emuladores, prepara datos ficticios y comprueba Google, contraseña, usuario ordinario, administrador desactivado, correo sin verificar, proveedor anónimo y sesión sin autenticar. El administrador puede consultar la ruta de prueba y nadie puede escribirla. No utiliza las bases de datos de producción. Si el iniciador de emuladores no funciona en un entorno, se pueden iniciar los dos emuladores por separado en los puertos configurados y ejecutar `npm run test:dashboard-access`.

En v26.77.0 se verificaron también seis pruebas automatizadas del cliente de IA, una consulta real a Gemini usando una herramienta con datos ficticios y el envío directo de una pregunta en Chromium a 390, 820 y 1440 píxeles. No hay selector de secciones ni paso de preparación. Falta una comprobación completa con una sesión administradora real del dashboard y dispositivos físicos.

La matriz de esta entrega tiene ocho comprobaciones: tipos, documentación, pruebas del cliente, consulta real a Gemini, reglas en emuladores, conversación adaptable, archivos publicados y uso completo con sesión administradora en equipo físico. Una vez verificados los archivos publicados, se completan siete de ocho: 87,5 % por tamaño de celular, tablet y computadora. El porcentaje corresponde a esta entrega, no al proyecto completo.


### Comandos de edición · v26.78.0

Modo IA presenta mensajes en burbujas, desplazamiento del historial y una barra de escritura, dictado y lectura; no incluye menús de opciones ni selectores de secciones. Los comandos se escriben en la misma conversación. Ejemplo:

```text
edita el mensaje de Alexander Alvarado en el que dice "Mañana no hay clases" y cámbialo por "Mañana si hay clase"
```

El comando busca una cuenta por nombre completo, usuario o identificador y exige coincidencia exacta del texto. Solo modifica un mensaje cuando la cuenta y el mensaje son inequívocos. Si aparecen varios chats, se puede añadir `en el chat "ID"` al final. Si quedan varias coincidencias en ese chat, no modifica ninguna. No se editan mensajes cifrados antiguos, eliminados, caducados ni otros tipos de contenido. No se ejecutan instrucciones de escritura procedentes de registros consultados o de respuestas del modelo.

La escritura se realiza mediante una transacción con autorización administrativa. Comprueba otra vez el autor y el texto, conserva identificadores y fechas originales, marca el mensaje como editado y actualiza la vista previa si corresponde al último mensaje. Crea un registro inmutable en `dashboardEdits` con autor de la acción, mensaje, texto anterior, texto nuevo y fecha. Las reglas exigen este registro para la edición administrativa. Los usuarios conservan sus permisos habituales de edición de mensajes propios. La cancelación se deshabilita durante el guardado: una operación enviada no puede deshacerse cancelando la consulta.

Las pruebas `npm run test:dashboard-access` y `npm run test:dashboard-command` se ejecutan de forma secuencial con los emuladores configurados. Preparan únicamente datos ficticios en `demo-nexus`. Comprueban edición administrativa, conservación de autor y fecha, actualización del resumen, auditoría, ambigüedad, reintento, cancelación y permisos ordinarios.

La duplicación de dictado fuera del Modo IA queda pendiente de reproducción porque no se identificó el apartado. No se considera resuelta mediante esta entrega.

La matriz de v26.78.0 comprende tipos, documentación, pruebas unitarias, comandos y permisos en emuladores, audio español generado en navegador sin voces instaladas, chat y dictado en tres anchos, archivos publicados y prueba completa con cuenta administradora en equipo físico. Siete de ocho comprobaciones, una vez publicados y verificados los archivos, equivalen a 87,5 % por tamaño. No es un porcentaje del proyecto completo.

Referencias consultadas para esta revisión: [edición de mensajes de WhatsApp](https://blog.whatsapp.com/now-you-can-edit-your-whatsapp-messages?lang=en) y [resultados del reconocimiento de voz](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionEvent/results). La edición administrativa de Nexus es una función propia del panel y no reproduce los permisos de edición de WhatsApp.


### Nexus Assistant: historial y acciones · v26.79.0

Nexus Assistant está disponible únicamente en el dashboard para la cuenta administradora autorizada. La ruta `#modo-ia` se conserva para los enlaces existentes. Las funciones generales de Nexus AI fuera del dashboard no reciben estas herramientas ni estos permisos.

Los errores junto al cuadro de escritura se muestran como alertas durante tres segundos. No quedan transcripciones provisionales ni avisos de preparación de audio fijados debajo del cuadro. El estado de una consulta en curso aparece en la conversación. El dictado reconstruye el texto de la sesión sobre el borrador inicial, en lugar de añadir una cadena acumulada cada vez. Detecta frases completas repetidas entre resultados y conserva repeticiones intencionadas de palabras sueltas. Iniciar el micrófono detiene la lectura, e iniciar la lectura detiene el dictado, para evitar capturar la voz del propio asistente.

Las conversaciones y propuestas se guardan en `localStorage`, separadas por UID. Una cookie sin contenido de conversación y un marcador de CacheStorage permiten detectar que se eliminaron las cookies o esa caché al volver a abrir, recargar o enfocar la página. En ese caso el historial anterior se descarta. El botón Liberar caché local del dashboard también lo elimina expresamente. Borrar exclusivamente archivos de la caché HTTP puede no borrar estos almacenes; depende del navegador. No se escriben preguntas, respuestas ni conversaciones del asistente en Firestore o Realtime Database. Los datos necesarios se envían al servicio de IA para responder, como antes.

El asistente dispone de búsqueda en todo su historial local, lectura de Firestore y Realtime Database, recuentos, navegación entre pantallas, creación de documentos o nodos, actualización, eliminación, planificación de limpieza y limpieza manual. Las órdenes directas, como crear, editar, publicar, activar o eliminar, pueden ejecutar las herramientas correspondientes. Si se pide preparar un cambio o se trata de una consulta, se devuelve una propuesta que se ejecuta con `CONFIRMAR` y su identificador. La limpieza exige `LIMPIAR AHORA` y el identificador, manteniendo su protección de cuentas y perfiles. La edición exacta de mensajes sigue disponible por el comando explícito anterior. Las propuestas caducan tras 24 horas y las ya ejecutadas quedan marcadas en el historial local.

La escritura de Firestore utiliza transacciones que comparan el registro actual con el observado al preparar la propuesta y guardan una auditoría junto al cambio. Las eliminaciones afectan al documento concreto, no borran automáticamente sus subcolecciones. Realtime Database comprueba los datos antes de enviar una actualización multipath atómica con auditoría; una escritura simultánea posterior a esa comprobación puede exigir revisar los datos de nuevo. Las reglas no conceden acceso administrativo a usuarios ordinarios ni permiten modificar las marcas de autorización desde estas herramientas. Los registros de auditoría son datos de las acciones realizadas y permanecen en Firebase; no son el historial de la conversación.

Este acceso operativo no equivale a modificar el código desplegado, las reglas de seguridad, la facturación, las credenciales de Google ni las contraseñas y cuentas de Firebase Authentication. Esas tareas requieren un servicio administrativo de servidor; no se expone una cuenta de servicio en el navegador ni se activa facturación para resolverlo. No se garantiza acceso ilimitado al modelo: siguen existiendo cuotas, límites de contexto y permisos. La ejecución periódica de la limpieza sigue necesitando el dashboard abierto.

Pruebas: once pruebas del cliente y de comandos, cuatro de formato, permisos y acciones contra los emuladores de Firebase, consulta real a Gemini con ejecución simulada y Chromium a 390, 820 y 1440 píxeles. Se verificaron dictado acumulado, historial tras recarga, separación de cuentas, alertas de tres segundos, confirmación única y borrado por cookies o CacheStorage. Las pruebas emuladas se ejecutan de forma secuencial con `npm run test:dashboard-access`, `npm run test:dashboard-command` y `npm run test:dashboard-actions`.

La matriz de esta entrega comprende tipos y documentación, pruebas unitarias, permisos y acciones emuladas, consulta real a Gemini, historial local y caducidad de avisos, interfaz y dictado en tres tamaños, archivos publicados y pruebas completas con dispositivos físicos. Una vez publicados y verificados los archivos se completan siete de ocho comprobaciones, 87,5 % por tamaño. No equivale al avance global del proyecto ni a una garantía de dictado en todos los teléfonos; los dispositivos físicos siguen pendientes.

La corrección **v26.79.1** aplica también tres segundos de caducidad a los avisos generales del panel y evita que se arrastren debajo de Nexus Assistant al cambiar de apartado.

### Escritura y lectura largas · v26.79.2

Nexus Assistant acepta hasta **500 líneas** por consulta y respuesta. Se cuentan los saltos de línea explícitos, no los renglones que se forman al ajustar el texto al ancho de la pantalla. Mayús + Intro inserta un salto de línea. Al pegar más de 500 líneas se conserva el borrador completo y se bloquea el envío hasta ajustarlo; no se recorta silenciosamente. Existe además una protección técnica de 250.000 caracteres por mensaje para no agotar la memoria con una sola línea desmesurada.

La petición reserva hasta 32.768 tokens de salida y solicita respuestas completas dentro de esas 500 líneas. Si la API informa `MAX_TOKENS`, el cliente solicita hasta tres continuaciones, conserva el contenido recibido y elimina solapamientos exactos extensos. Las continuaciones deshabilitan las herramientas para evitar repetir escrituras administrativas. Si una continuación falla, se conserva el texto disponible con un aviso explícito; no se presenta como respuesta completa. El tiempo máximo de consulta pasa a diez minutos y se mantiene el botón de cancelación. La protección de tamaño se aplica también al texto final con los resultados de acciones y propuestas.

La lectura española de respuestas e informes utiliza un mismo reproductor local. Divide el texto por frases y fragmentos de hasta 320 caracteres, carga la voz una vez por trabajador, prepara un fragmento por adelantado y programa el audio con el reloj del reproductor. Mantiene como máximo dos fragmentos decodificados en memoria. Un fallo de generación o decodificación permite un reintento del fragmento pendiente; detener la lectura no produce una alerta de error. El texto que ya se está leyendo se mantiene aunque llegue una nueva respuesta. Al volver a la pestaña se intenta reanudar el contexto de audio. El sistema operativo todavía puede suspender la reproducción en segundo plano; esta entrega no promete reproducción con la pantalla bloqueada.

Verificación: quince pruebas unitarias del asistente y cuatro de formato; consulta real con más de 1.500 caracteres y marcador final; síntesis real española sin voces instaladas en Chromium; reproducción completa de 500 líneas en 100 fragmentos, con reloj y velocidad acelerados para verificar toda la cola; escritura de 500 líneas, conservación de borrador de 501 líneas, cambio de respuesta durante la lectura, alertas, dictado e historial a 390, 820 y 1440 píxeles. La aceleración comprueba la cola completa, pero no sustituye una escucha prolongada en teléfonos físicos.

Matriz de esta corrección: (1) tipos y documentación, (2) pruebas unitarias y formato, (3) historial y alertas, (4) dictado y audio corto en tres tamaños, (5) escritura y audio de 500 líneas en tres tamaños, (6) consulta real completa, (7) publicación y archivos verificados, (8) pruebas físicas en Android, iPhone, tablet y computadora. Tras verificar la publicación: **7/8, 87,5 %** por tamaño; el último punto sigue pendiente. Es avance de esta corrección, no del proyecto completo.

Referencia técnica: [límites oficiales de Gemini 3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite), que permite hasta 65.536 tokens de salida. El límite de 500 líneas es propio de Nexus Assistant.

### Entrada de voz retirada · v26.79.3

Se retiran el botón de dictado y el reconocimiento de voz de Nexus Assistant. También se elimina de Nexus AI la grabación y transcripción para enviar consultas. Ambos asistentes conservan la escritura por teclado; Nexus Assistant conserva la lectura de respuestas en español y los informes mantienen su lectura. Las notas de voz y la transcripción de audios de las conversaciones ordinarias siguen disponibles. Esta retirada sustituye las referencias anteriores al dictado de los asistentes; no implica que se haya resuelto la duplicación observada.

Verificación de esta retirada: tipos y documentación, 19 pruebas unitarias existentes, ausencia de controles y peticiones de micrófono en ambos asistentes, envío por teclado en ambos, lectura española real en el dashboard, compilación y comprobaciones de GitHub, y archivos publicados. La interfaz se revisó en Chromium a 390, 820 y 1440 píxeles con consultas y cuentas simuladas, sin modificar datos de usuarios. Tras verificar la publicación se completan 7 de 8 comprobaciones por tamaño (87,5 %); la octava, prueba en dispositivos físicos, permanece pendiente. Es la verificación de esta corrección, no del proyecto entero.

### Identidad propietaria y encabezados · v26.79.4

El dashboard y Nexus Assistant exigen UID y correo verificado coincidentes con la política propietaria guardada en Firebase. Otra cuenta no puede obtener acceso administrativo solo por tener una marca de administrador. La política no puede editarse desde los clientes. Se mantienen Google y contraseña para la identidad propietaria. También se muestran correctamente los encabezados `###`, títulos subrayados y separadores. Consulta [el alcance y la verificación](SEGURIDAD-PROPIETARIO.md).
