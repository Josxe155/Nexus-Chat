# Seguimiento de referencias móviles — 31/10/2026

Se revisaron las 40 capturas privadas del ZIP sin copiarlas al repositorio ni reproducir sus contactos, chats, fotos o estados. Las referencias incluyen interfaces nativas de Android que una web no puede sustituir, como el selector de aplicaciones y los permisos del sistema.

## Cambios de esta entrega

- El campo de mensaje permanece habilitado; el botón de envío evita quitarle el foco. Se vacía al iniciar el envío y no se borra el siguiente borrador cuando termina la operación anterior. En móvil, Enter envía y Mayús+Enter permite saltos de línea. La visualización del teclado sigue dependiendo del navegador y del sistema operativo.
- El selector permanece abierto al insertar emojis. Se cierra desde su botón, con Escape o tocando fuera. En móvil no fuerza el teclado de búsqueda al abrirse y aparece debajo de la barra de escritura, con distribución propia de Messenger.
- Los glifos de emoji que coinciden con el símbolo de carácter ausente se excluyen de los resultados. Se priorizan las fuentes de emoji del dispositivo. El aspecto depende de la versión del sistema y de sus fuentes.
- Se eliminaron físicamente de public/gifs y public/stickers los paquetes predeterminados. No se eliminan mensajes o archivos ya enviados por usuarios.
- GIPHY y Tenor tienen adaptadores de búsqueda y tendencias, separación por proveedor, atribución, cancelación de búsquedas obsoletas y errores explícitos. Faltan las claves del propietario: giphyKey y tenorKey en src/public-services.json, fuera de Git. No se garantiza servicio real hasta validar esas claves y sus cuotas. Google indica que Tenor no admite nuevos clientes desde enero de 2026: https://developers.google.com/tenor/guides/quickstart . GIPHY: https://developers.giphy.com/docs/api/endpoint/search/ .
- Se separaron las pestañas inferiores de escritorio con líneas centrales y mayor espacio.
- Los contactos móviles tienen una pantalla propia con búsqueda y selección múltiple, basada exclusivamente en la cuenta propia y los contactos Nexus guardados. La galería real y los permisos siguen usando los selectores del navegador; no se simula una galería privada del teléfono.
- La cuadrícula de adjuntos y el formulario de encuesta de Messenger se ajustaron tomando las referencias como guía. No se trasladan los componentes de escritorio a móvil.
- El aviso de actualización comprueba al recuperar conexión, al volver a la pestaña y cada minuto. Cerrarlo conserva un botón inferior para reabrirlo. La descarga sigue siendo manual, con contador de bytes/MB y bloqueo durante actividad pendiente. Una pestaña con código anterior necesita recargarse una vez para recibir este cambio.
- La flecha de envío mantiene su forma e icono sin el estado visual gris generado por deshabilitar el botón. Los mensajes pendientes o fallidos mantienen sus indicadores y reintento, para no fingir que fueron entregados.

## Alcance pendiente

No se declara equivalencia completa con las 40 pantallas. Las llamadas y estados previos se mantienen; no se han recreado funciones nativas de Android, sincronización con cuentas externas, una tienda de stickers ni eventos nativos de WhatsApp. Las interfaces que necesiten funciones no disponibles deben adaptarse con controles reales en futuras entregas. El modelo de mensajes nuevos sigue sin cifrado de extremo a extremo.

## Verificación

TypeScript y compilación de producción correctos. Pruebas aisladas de navegador: 9 flujos de escritorio/móvil/tablet, 5 comprobaciones del controlador de envío y 4 comprobaciones de actualización manual. El teclado físico/virtual real de cada teléfono y el acceso efectivo a los proveedores requieren comprobación en esos dispositivos y con las claves correspondientes.
