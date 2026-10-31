# Nexus Chat

Aplicación web responsive para móvil, tablet y escritorio, desarrollada con React, TypeScript y Vite.

Web publicada: https://nexus-chat-nc.web.app/

## Preparar el proyecto

Requiere Node.js 22 o posterior y npm.

```sh
git clone https://github.com/Josxe155/Nexus-Chat.git
cd Nexus-Chat
npm ci
npm run dev
```

Abre http://localhost:3000. La instalación crea `src/public-services.json` a partir de la plantilla cuando no existe. Si ejecutas npm sin scripts, ejecuta `npm run setup` después. La plantilla no contiene claves de proveedores. Configura Groq, OpenRouter y Metered en ese archivo local si vas a utilizar inteligencia artificial, transcripción y TURN para llamadas. No lo subas al repositorio. Metered es un relé TURN para WebRTC; Firebase proporciona la señalización.

Las claves que incluyas al compilar se entregan al navegador y se pueden extraer de la web publicada. Excluirlas de Git no las oculta en una aplicación que las utiliza desde el cliente. El archivo de configuración pública de Firebase identifica el proyecto Nexus existente; la protección de los datos depende de Authentication y de las reglas. Para desplegar una copia independiente, reemplaza `firebase-applet-config.json`, `.firebaserc` y el sitio en `firebase.json` por los de tu propio proyecto.

## Comprobar y compilar

```sh
npm run lint
npm run build:hosting
```

El resultado se genera en `dist/`, junto con el manifiesto de versiones y tamaños para la actualización manual de la web. Los archivos compilados y las dependencias no se versionan.

## Firebase

- Authentication: inicio de sesión y recuperación de cuentas.
- Firestore: conversaciones, mensajes, perfiles, preferencias y permisos.
- Realtime Database: presencia, señalización y archivos fragmentados.
- Hosting: publicación HTTPS de la web.

```sh
npx firebase-tools login
npx firebase-tools deploy --only hosting,firestore:rules,firestore:indexes,database --project nexus-chat-56d9d
```

Publicar en el proyecto existente requiere una cuenta autorizada. No hace falta un servidor Node.js en producción. Node.js se utiliza para desarrollar y compilar. La web no ofrece instalación como aplicación ni vinculación de dispositivos. Cámara y micrófono requieren un contexto seguro y los permisos del navegador.

## Seguridad actual

Los mensajes y archivos nuevos no utilizan cifrado de extremo a extremo. Se retiró la creación de claves para evitar que una pérdida de claves del navegador impidiera conversar. HTTPS protege el transporte y las reglas restringen las conversaciones a sus miembros; Firebase puede acceder al contenido. Se conserva únicamente la lectura del historial cifrado anterior y la importación/exportación de sus copias. Sin sus claves originales no se puede reconstruir ese historial. No se borraron datos.

Consulta [CIFRADO-Y-LLAMADAS.md](CIFRADO-Y-LLAMADAS.md), [PENDIENTES-WHATSAPP.md](PENDIENTES-WHATSAPP.md) y [ACTUALIZACIONES-Y-ERRORES.md](ACTUALIZACIONES-Y-ERRORES.md) para conocer el estado y las limitaciones. Nexus es un proyecto independiente y no es un producto oficial de WhatsApp ni de Meta.

## Contenido del repositorio

- `src/`: interfaz y lógica de la web.
- `public/` y `assents/`: iconos, emojis, sonidos y recursos gráficos.
- `scripts/`: desarrollo, configuración y compilación.
- Reglas e índices de Firebase y documentación de la entrega.

No se incluyen bases de datos, datos de usuarios, credenciales administrativas, claves de proveedores ni conectores de servidores retirados. Las licencias de terceros incluidas con los recursos deben conservarse.
