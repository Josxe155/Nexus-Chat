# Referencias de GIFs y stickers en computadora

31/10/2026. Se adaptan las cuatro capturas del propietario únicamente para Nexus Web. No se copian sus conversaciones ni las imágenes privadas de las referencias.

- GIF: búsqueda en GIPHY, cuadrícula con primera fila de dos resultados y siguientes de tres, pestañas inferiores separadas. Seleccionar descarga una copia para revisar, no envía automáticamente; se puede escribir un comentario, añadir archivos o cancelar antes del envío. Se conserva la animación.
- Stickers: resultados reales de KLIPY en cinco columnas y botón Crear dentro de la cuadrícula. Destacados muestra stickers guardados desde el visor; no se inventan favoritos ni se reinstalan los paquetes retirados.
- Pulsar un sticker de un chat abre el visor dedicado de escritorio con remitente, fecha, sticker centrado y botón Añadir/Quitar de Favoritos. Responder, destacar mensaje, fijar/desfijar con permiso, eliminar y reenviar utilizan los flujos existentes del chat. Los paquetes y autores solo se pueden mostrar cuando esos datos existan; no se copian los de la referencia.
- Los favoritos son locales a la cuenta y al navegador. Para stickers de chats se conserva la referencia al archivo privado; al volver a abrirlos se siguen aplicando los permisos de Firebase y no se sube una copia pública. Si se pierde acceso al archivo, no podrá volver a enviarse desde favoritos.
- Las pantallas móviles de GIFs, stickers y visor continúan separadas. No se cambia el modelo de seguridad de mensajes nuevos ni se añaden servidores. Las claves permanecen excluidas de GitHub.

Verificación: TypeScript, compilación de producción y siete comprobaciones de navegador con datos aislados: selector GIF, revisión manual sin envío automático, comentario y envío, visor, llamadas a sus acciones, favoritos y acceso a favoritos desde el selector. Las pruebas reales de los proveedores están documentadas en GIPHY-Y-KLIPY.md.
