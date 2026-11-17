# Estado actual de Nexus Chat — v26.97.1

## Implementado

- Acceso con Google, correo/contraseña e invitados. Los nuevos invitados tienen credenciales privadas recuperables desde Firestore mediante permisos administrativos.
- Chats, contactos por número Nexus y QR, grupos, estados, archivos, notas de voz y llamadas. Su existencia no equivale a haber verificado todos los recorridos en teléfonos reales.
- Dashboard con acceso restringido al propietario, estadísticas, informes, avisos, mantenimiento y limpieza manual confirmada.
- Nexus Assistant con historial local, búsqueda, lectura multimedia y cambios operativos auditados. CONFIRMAR no requiere códigos. Se conservan las protecciones de cuentas, permisos y credenciales.
- Pantalla de cuenta bloqueada, logo oficial, favicon e iconos transparentes.
- Lectura neuronal española con KokoroJS; necesita descargar y ejecutar el modelo en el navegador.
- Sincronización del código con GitHub y publicación de entregas verificadas en Firebase Hosting.

## Corrección v26.97.1

Se valida la hora del servidor al crear invitados para impedir que una fecha futura eluda la retención de treinta días.

## Actualización v26.97.0

Se implementan consultas y reglas de caducidad, limpieza de temporales y archivos vinculados, retención de invitados inactivos, progreso de voz con bytes reales y perfiles inicialmente sin usuario. Se valida la generación de números móviles para los países con plan disponible y se conservan números y usuarios existentes. [Alcance, comprobaciones y límites](ACTUALIZACION-MASIVA-26.97.0.md). El borrado físico requiere un cliente activo y la eliminación privilegiada de registros ajenos de Authentication sigue pendiente.

## Actualización v26.96.0

Se aplican las referencias del saludo y del aviso temporal del chat, así como de nuevo contacto en celular. La sincronización muestra la cuenta autorizada y se oculta para invitados; el país conserva el selector completo y utiliza código/prefijo sin bandera en el campo. [Detalles y pruebas](REFERENCIAS-CHAT-CONTACTO-26.96.0.md). Las tareas de datos de la actualización masiva siguen pendientes de la fase posterior a referencias.

## Corrección v26.95.1

Se corrigen submenús vacíos al ampliar Ajustes y los avisos persistentes/silenciosos de contactos. Las reglas acotan el esquema público, preservan identidad, restringen presencia antigua y validan multimedia. Se incorporan pruebas de abuso y acceso válido con emuladores. [Resultados y limitaciones de seguridad](AUDITORIA-26.95.1.md). La caducidad completa de lectura del historial y la cuota por cuenta no se presentan como resueltas.

## Actualización v26.95.0

El botón de salida deja de silenciar el audio recibido y selecciona salidas autorizadas cuando el navegador lo permite. Los controles de voz en celular siguen las referencias de esta entrega. Los avisos de una pestaña que continúa ejecutándose se envían al service worker, con limpieza y navegación internas; las notas de voz incorporan Media Session. No se incorpora un emisor Push remoto ni ejecución continua con la pestaña cerrada. [Implementación, pruebas y límites](LLAMADAS-Y-SEGUNDO-PLANO-26.95.0.md).

## Corrección v26.94.2

La descarga del modelo de voz conserva bloques locales confirmados y solicita los bytes restantes al reintentar. Reutiliza los modelos completos ya guardados y coordina las pestañas. La primera transferencia sigue siendo de unos 92 MB; la preparación y memoria del celular no desaparecen. [Funcionamiento y límites](DESCARGA-VOZ-REANUDABLE.md).

## Corrección v26.94.1

La preparación de voz podía prolongarse por progreso y reintentos. Se añade un límite absoluto de dos minutos hasta arrancar el primer audio, que también cubre la espera de reanudación de AudioContext. Se muestra progreso de descarga y se distingue de la preparación del audio. Preparar otro informe detiene la lectura anterior.

El usuario describió líneas que desaparecen al desplazar la página: no se ha reproducido el defecto concreto de su dispositivo. Se aísla el área de pintura del informe, se evita el filtro de brillo de sus botones y se reemplaza la vista previa cuando cambia el contenido para reducir capas gráficas residuales. La comprobación en ese dispositivo sigue pendiente; no se presenta esta mitigación como una reproducción confirmada del fallo.

## Pendientes

- Pruebas físicas de la actualización masiva, incluidas descargas lentas, consumo de memoria y autorizaciones externas.

- Finalizar la eliminación privilegiada de invitados en Firebase Authentication. El dashboard ya revoca el acceso y elimina los datos propios descritos en la entrega; conserva marcas mínimas de revocación y referencias compartidas.
- Estabilidad y rendimiento de voz en dispositivos físicos, especialmente equipos con poca memoria y audio de iPhone en segundo plano.
- Emisor automático de notificaciones remotas con la pestaña cerrada, bajo la restricción de no usar servidor. Comprobación física de notificaciones, audio y llamadas con pantalla bloqueada; selección de auricular interno según soporte del navegador, biometría y multimedia.
- Completar Ajustes, contacto, grupos y menús conforme a referencias pendientes. No se afirma una equivalencia total con WhatsApp.
- Completar copias/restauración y verificar las autorizaciones e integraciones externas que correspondan. Preparar un módulo no equivale a confirmar su funcionamiento real.
- Documentos adicionales y archivos mayores de 8 MB por consulta del Assistant.

Los porcentajes de cada entrega se refieren a sus casos comprobados por tamaño simulado; no son porcentajes de finalización global ni pruebas en Android o iPhone físicos.
