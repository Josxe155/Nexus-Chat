# Centro de acciones · dashboard.html

El panel se publica en `/dashboard.html`, dentro del mismo Firebase Hosting. No tiene enlaces en la navegación pública ni depende de GitHub Actions, Cloud Functions o un servidor externo.

## Acceso

Solo la cuenta de Google designada por el propietario puede entrar. Las autorizaciones se guardan en Firebase (`dashboardAdmins/<uid>`), nunca en un correo oculto en JavaScript ni en una contraseña incluida en el HTML. Los clientes no pueden crear o modificar esas autorizaciones. Las reglas verifican una sesión de Google con correo verificado y la autorización correspondiente en cada base de datos. No se versionan identidades personales ni credenciales.

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

El plan está desactivado hasta que el propietario lo active en el panel. La primera fecha propuesta es un mes desde la activación; se conserva el día del mes cuando es posible. El aviso se destaca tres días antes en las visitas de los usuarios a Nexus.

El borrado es irreversible y consume operaciones y transferencia de Firebase. Se procesa por lotes, con bloqueo temporal entre pestañas; si se interrumpe puede retomarse después de liberar el bloqueo. No se borran documentos de chats ni de grupos: se elimina su contenido antiguo y se limpia su resumen. Los archivos nuevos, los de alcances desconocidos y los referenciados por perfiles o portadas se preservan. Los administradores tienen permisos técnicos de eliminación de archivos en Realtime Database: la protección de referencias de fotos se aplica además en el programa. No modificar ese control sin revisar el impacto.

## Prepara Nexus Chat

La introducción de permisos se marca al mostrarse por primera vez en ese navegador. No reaparece por cerrar sin terminar, iniciar sesión o cambiar de versión. Se puede volver a abrir desde Ajustes → Chats → Permisos del dispositivo. Borrar los datos del sitio o usar otro navegador vuelve a considerarse una primera visita. Los permisos nativos siguen dependiendo del sistema.

## Pollinations

La generación de imágenes y las órdenes «genera una imagen de…» se integrarán en Nexus AI cuando el propietario facilite la configuración y lo ordene. Esta entrega no publica claves ni activa solicitudes de generación.
