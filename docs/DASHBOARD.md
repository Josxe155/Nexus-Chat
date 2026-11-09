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


## Modo IA · v26.77.0

Modo IA utiliza Gemini mediante `generateContent`, con herramientas de consulta automática. La interfaz es una conversación única: no requiere elegir una sección, una cuenta ni preparar una vista previa. Al enviar, la pregunta y los datos necesarios se comparten con el servicio de IA; el panel informa de ello antes de escribir.

El administrador autorizado tiene lectura general de Firestore y Realtime Database. La autorización requiere correo verificado, acceso por Google o contraseña y la marca administrativa en cada base. No se conceden nuevos permisos a los usuarios ordinarios ni se añaden herramientas de escritura o borrado al modelo. Cada consulta vuelve a comprobar la autorización.

El asistente puede leer documentos, recorrer colecciones y subcolecciones por páginas, contar registros y consultar rutas de Realtime Database. La paginación evita descargar toda la base de una vez y permite continuar con el cursor. Las contraseñas de Authentication no están disponibles; los datos cifrados antiguos requieren sus claves originales. La consulta tiene los límites técnicos de tiempo, contexto y cuota del servicio; el modelo debe indicar datos ausentes y resultados parciales.

Se mantienen los controles de dictado y lectura en español y el historial de la conversación mientras el componente permanece abierto. Las claves y las credenciales se conservan únicamente en la configuración local excluida de Git.

### Pruebas de acceso

Con Java 21, las dependencias de desarrollo y ambos emuladores locales disponibles:

```sh
npx firebase-tools emulators:exec --config firebase.emulators.json --project demo-nexus 'npm run test:dashboard-access'
```

La prueba carga las reglas reales en los emuladores, prepara datos ficticios y comprueba Google, contraseña, usuario ordinario, administrador desactivado, correo sin verificar, proveedor anónimo y sesión sin autenticar. El administrador puede consultar la ruta de prueba y nadie puede escribirla. No utiliza las bases de datos de producción. Si el iniciador de emuladores no funciona en un entorno, se pueden iniciar los dos emuladores por separado en los puertos configurados y ejecutar `npm run test:dashboard-access`.

En v26.77.0 se verificaron también seis pruebas automatizadas del cliente de IA, una consulta real a Gemini usando una herramienta con datos ficticios y el envío directo de una pregunta en Chromium a 390, 820 y 1440 píxeles. No hay selector de secciones ni paso de preparación. Falta una comprobación completa con una sesión administradora real del dashboard y dispositivos físicos.

La matriz de esta entrega tiene ocho comprobaciones: tipos, documentación, pruebas del cliente, consulta real a Gemini, reglas en emuladores, conversación adaptable, archivos publicados y uso completo con sesión administradora en equipo físico. Una vez verificados los archivos publicados, se completan siete de ocho: 87,5 % por tamaño de celular, tablet y computadora. El porcentaje corresponde a esta entrega, no al proyecto completo.
