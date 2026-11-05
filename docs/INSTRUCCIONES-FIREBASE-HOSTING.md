# Publicar Nexus Chat en Firebase Hosting

## 1. Preparar

Clona el repositorio de GitHub o descomprime la entrega en una carpeta nueva. Instala Node.js 22 o posterior. Abre una terminal en esa carpeta y ejecuta:

```sh
npm ci
npm run lint
npm run build:hosting
```

## 2. Conectar tu cuenta

```sh
npx firebase-tools login
npx firebase-tools use nexus-chat-56d9d
```

Usa la cuenta propietaria del proyecto. En Authentication deben seguir habilitados Google, correo/contraseña y anónimo. Agrega el dominio personalizado a los dominios autorizados de Authentication si utilizas uno.

## 3. Publicar

```sh
npx firebase-tools deploy --only hosting,firestore:rules,firestore:indexes,database --project nexus-chat-56d9d
```

El archivo firebase.json compila la aplicación antes de publicar Hosting. La carpeta publicada es dist. El sitio quedará en https://nexus-chat-nc.web.app y https://nexus-chat-nc.firebaseapp.com. Hosting proporciona HTTPS automáticamente, necesario para cámara, micrófono, portapapeles y cifrado del navegador. No hay un servidor propio que debas mantener.

Para publicar solo cambios visuales posteriores usa `npx firebase-tools deploy --only hosting --project nexus-chat-56d9d`. Espera a que los índices figuren listos antes de probar filtros de estados y privacidad de contactos.

## 4. Comprobar

Prueba inicio de sesión, verificación del correo, envío de texto, imagen y documento entre dos cuentas. Prueba una llamada entre dos dispositivos con permisos de cámara/micrófono. Revisa la privacidad con una tercera cuenta ajena a la conversación. Prueba Nexus AI y la recepción de avisos manteniendo la web abierta en otra pestaña.

## Configuración de proveedores

El repositorio no incluye claves de proveedores. npm ci crea src/public-services.json con los campos vacíos desde la plantilla src/public-services.example.json. Completa ese archivo local con tus claves de Groq, OpenRouter y Metered antes de publicar. Está excluido de Git. Al compilar la web con claves, estas quedan accesibles para sus visitantes. Groq es la primera opción; OpenRouter usa openrouter/free cuando la primera falla o alcanza su cuota. Las solicitudes consumen las cuotas de esos proveedores. El proyecto no contiene una garantía de uso ilimitado ni de coste cero si cambias sus planes.

No subas credenciales de cuentas de servicio, archivos .env privados ni la antigua carpeta server. No son necesarios para esta versión. El bloqueo de F12 no protege claves: cualquier visitante puede descargar lo que recibe su navegador.

## Límites que debes conocer

- Archivos de hasta 20 MB, enviados en fragmentos cifrados de 1 MB y sujetos al espacio y transferencia de Firebase. No se utiliza Firebase Storage.
- Los permisos y claves de cada archivo se guardan en Firestore. Esto no constituye cifrado de extremo a extremo frente a administradores de Firebase.
- Los reportes quedan guardados para revisión administrativa; no eliminan cuentas o grupos automáticamente.
- Los avisos se reciben con Nexus abierto. Esta entrega no incluye envío push fiable cuando la web está cerrada.
- El número de Nexus es interno, único y con formato regional; no es una línea telefónica y no permite SMS ni llamadas a la red celular. La región sugerida procede del navegador.
- No hay eliminación programada de invitados o limpieza periódica mientras la web está cerrada. Eliminar una cuenta puede dejar referencias en grupos y mensajes de otros participantes que deben revisarse administrativamente.

Nexus Chat se publicó en Firebase Hosting el 28 de octubre de 2026, con autorización del propietario. Dirección pública: https://nexus-chat-nc.web.app. El comando del paso 3 sirve para publicar futuras actualizaciones.

### Índice de estados móviles

El archivo firestore.indexes.json incluye los índices audienceIds/expiresAt y owner/expiresAt. En este proyecto ya están creados. Si se vuelven a desplegar en otro entorno, ejecutar `npx firebase deploy --only firestore:indexes` y esperar a que los índices aparezcan como READY antes de publicar la web. No sustituir las reglas permanentes por reglas abiertas para resolver un error de índice.
