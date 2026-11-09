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


## Modo IA · v26.76.2

El panel consulta Gemini mediante `generateContent`, con el modelo configurable en `geminiModel`. La configuración probada utiliza `gemini-3.1-flash-lite`. La clave se guarda únicamente en `src/public-services.json`, excluido de Git. `npm run setup` importa `GEMINI_API_KEY` desde el entorno y conserva la configuración existente de los otros servicios. Se retira el campo anterior `huggingFaceKey`. Las claves de esta arquitectura son accesibles al navegador al compilar; no se incluyen credenciales administrativas de Google.

La sesión administradora y la vista previa siguen siendo obligatorias. Solo se envían la pregunta y la muestra revisada; el modelo no recibe herramientas de escritura ni acceso directo a Firebase. Los mensajes eliminados, caducados, de vista única o cifrados antiguos se excluyen del contexto de chats. El asistente general de Nexus mantiene su alternativa con OpenRouter.

Los controles de dictado y lectura mantienen textos neutros. La lectura admite voces en español del sistema. Su disponibilidad real y la del dictado dependen del navegador y de los permisos. Las pruebas automatizadas de voz usan simulaciones; no certifican el micrófono ni la reproducción en un teléfono físico.
