# GIFs y stickers: GIPHY y KLIPY

Actualización del 31/10/2026: se configuraron las claves proporcionadas por el propietario y se sustituyó Tenor por KLIPY. El propietario autorizó expresamente su exposición pública en la web compilada; las claves siguen excluidas del repositorio. Las claves reales se conservan exclusivamente en src/public-services.json, excluido de Git. Las copias nuevas del repositorio deben completar giphyKey y klipyKey desde la plantilla sin claves.

## Funciones

- Búsqueda y tendencias con proveedor fijo por sección: GIPHY exclusivamente para GIFs y KLIPY exclusivamente para stickers, con atribución de origen. No hay selector para intercambiar proveedores.
- Búsquedas con cancelación y espera breve al escribir; no se mezclan los resultados entre proveedores.
- Vista previa optimizada y descarga de la animación para compartir. Los stickers GIF/WebP ya no se convierten automáticamente en una imagen PNG estática.
- Botón para obtener más resultados cuando la respuesta del proveedor indica que hay más páginas.
- Mensajes explícitos ante errores de conexión o cuota. No se restablecen los paquetes predeterminados eliminados.

## Comprobaciones

Las cuatro combinaciones de proveedor y tipo devolvieron HTTP 200 con las claves reales. Ocho pruebas de navegador comprobaron búsqueda, previsualización y descarga real: GIPHY y KLIPY, GIF y sticker, escritorio de 1366 px y móvil de 390 px. No se enviaron mensajes a cuentas reales durante estas pruebas. Se comprobó TypeScript antes de la compilación de publicación.

## Configuración y privacidad

Las solicitudes se realizan desde el navegador al proveedor seleccionado. El término de búsqueda y la conexión del visitante quedan sujetos a las políticas del proveedor. No se envía el historial del chat. Las cuotas y permisos de las claves dependen de sus cuentas; estas pruebas no garantizan disponibilidad permanente. Las claves usadas en una web compilada son accesibles a sus visitantes, aunque se excluyan del repositorio.

Documentación consultada: https://developers.giphy.com/docs/api/endpoint/search/ y https://docs.klipy.com/gifs-api y https://docs.klipy.com/stickers-api .


## Asignación verificada

Cuatro pruebas reales adicionales confirmaron GIFs de GIPHY y stickers de KLIPY en escritorio y móvil, incluyendo vistas previas y descarga del archivo seleccionado. Se publican las claves en la compilación web por autorización explícita del propietario del 31/10/2026; esta autorización no incluye incorporarlas a GitHub.
