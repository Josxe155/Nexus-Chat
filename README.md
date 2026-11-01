<div align="center">

<img src="public/icons/nexus-192.png" alt="Logo de Nexus Chat" width="104" height="104" />

# Nexus Chat

**Tus conversaciones, en un solo lugar.**

Mensajería, llamadas y comunidad desde el navegador.<br />
Una interfaz adaptable a móvil, tablet y computadora.

[![Web](https://img.shields.io/badge/WEB-ABRIR%20NEXUS-20C472?style=for-the-badge&logo=firebase&logoColor=white)](https://nexus-chat-nc.web.app/)
[![React](https://img.shields.io/badge/REACT-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](package.json)
[![TypeScript](https://img.shields.io/badge/TYPESCRIPT-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](tsconfig.json)
[![Firebase](https://img.shields.io/badge/FIREBASE-HOSTING%20%2B%20DATOS-FFCA28?style=for-the-badge&logo=firebase&logoColor=20232A)](firebase.json)

[![Comprobaciones](https://github.com/Josxe155/Nexus-Chat/actions/workflows/check.yml/badge.svg)](https://github.com/Josxe155/Nexus-Chat/actions/workflows/check.yml)
![Plataforma](https://img.shields.io/badge/PLATAFORMA-WEB-7C5CFC?style=flat-square)
![Diseño](https://img.shields.io/badge/DISE%C3%91O-RESPONSIVE-20C472?style=flat-square)
![Arquitectura](https://img.shields.io/badge/ARQUITECTURA-FIREBASE-FFCA28?style=flat-square)

[Ver la web](https://nexus-chat-nc.web.app/) · [Instalación](#-inicio-rápido) · [Configuración](#-configuración) · [Documentación](#-documentación)

</div>

---

## ✨ El proyecto

Nexus Chat reúne conversaciones, archivos, estados, comunidades y llamadas en una aplicación web con identidad propia. Utiliza **React + TypeScript** para la interfaz y **Firebase** para autenticación, datos y publicación.

| 💬 Conversaciones | 📞 Voz y video | 🌐 En cualquier pantalla |
| :--- | :--- | :--- |
| Chats personales y grupos, respuestas, reacciones y mensajes destacados. | Llamadas con WebRTC y Metered como relé TURN cuando se necesita. | Interfaz adaptable a computadora, tablet y celular, directamente en el navegador. |

| 📎 Archivos y audio | 🟢 Estados y comunidad | 🤖 Nexus AI |
| :--- | :--- | :--- |
| Fotos, videos, documentos, notas de voz y visualización de archivos. | Estados, canales, comunidades y controles de privacidad. | Asistente con Groq y OpenRouter; transcripción de audio con consentimiento. |

> [!NOTE]
> Es un proyecto en desarrollo. Las funciones dependen de los permisos del navegador, la conexión y las cuotas de los proveedores. El alcance y las diferencias pendientes se describen en [PENDIENTES-WHATSAPP.md](PENDIENTES-WHATSAPP.md).

## 🎞️ Expresiones en Nexus Web

| GIFs · GIPHY | Stickers · KLIPY | Visor de stickers |
| :--- | :--- | :--- |
| Búsqueda por categorías y cuadrícula de resultados animados. | Cuadrícula de cinco columnas, búsqueda y acceso a crear stickers. | Vista amplia con remitente, fecha y acciones del mensaje. |
| Seleccionar abre una revisión con comentario y miniatura; se envía al pulsar la flecha. | Los favoritos guardados se encuentran en Destacados de este navegador. | Responder, destacar, fijar cuando hay permiso, eliminar, reenviar y añadir a favoritos. |

Esta distribución es exclusiva de computadora. Nexus Messenger conserva sus pantallas móviles. Se usan los datos reales del chat y del proveedor; no se inventan nombres de paquetes de stickers.

## 🧩 Tecnología

| Capa | Tecnología | Función |
| :--- | :--- | :--- |
| Interfaz | React 18 · TypeScript · Vite | Componentes, navegación y compilación. |
| Acceso | Firebase Authentication | Inicio de sesión y recuperación de cuentas. |
| Conversaciones | Cloud Firestore | Perfiles, chats, mensajes, preferencias y permisos. |
| Tiempo real | Firebase Realtime Database | Presencia, señalización y archivos fragmentados. |
| Publicación | Firebase Hosting | Entrega de la web mediante HTTPS. |
| Llamadas | WebRTC · Metered | Comunicación de voz y video; relé TURN. |
| Inteligencia artificial | Groq · OpenRouter | Asistente y procesamiento de las solicitudes autorizadas. |

**Node.js se utiliza para desarrollar y compilar.** Esta versión no necesita un servidor Node.js en producción.

## 🚀 Inicio rápido

**Requisitos:** Node.js 22 o posterior, npm y Git.

```sh
git clone https://github.com/Josxe155/Nexus-Chat.git
cd Nexus-Chat
npm ci
npm run dev
```

Abre **http://localhost:3000**.

La instalación crea `src/public-services.json` desde la plantilla si el archivo todavía no existe. Si instalaste con los scripts deshabilitados, ejecuta `npm run setup`.

## ⚙️ Configuración

| Archivo | Qué debes configurar | ¿Se sube a Git? |
| :--- | :--- | :---: |
| `src/public-services.json` | Claves de Groq, OpenRouter, Metered, GIPHY y KLIPY. | **No** |
| `src/public-services.example.json` | Plantilla sin claves para crear la configuración local. | Sí |
| `firebase-applet-config.json` | Identificadores públicos de tu proyecto Firebase. | Sí |
| `.firebaserc` · `firebase.json` | Proyecto de destino y sitio de Hosting. | Sí |
| `firestore.rules` · `database.rules.json` | Permisos de acceso a los datos. | Sí |

<details>
<summary><strong>Configurar IA, transcripción y llamadas</strong></summary>

Para GIFs y stickers configura también `giphyKey` y `klipyKey`. Los paquetes predeterminados se retiraron.

Completa los campos de `src/public-services.json` con tus propias claves y los datos del proveedor. Sin esa configuración, la copia puede compilar, pero las funciones que dependen de esos servicios no estarán plenamente disponibles.

- **Groq:** asistente y transcripción de audio.
- **OpenRouter:** alternativa para el asistente.
- **Metered:** credenciales TURN para mejorar la conectividad de las llamadas.

Excluir las claves de Git **no las oculta en la web compilada**: cualquier clave utilizada desde el navegador puede extraerse de los archivos o de las solicitudes de la aplicación.

</details>

<details>
<summary><strong>Usar un proyecto Firebase diferente</strong></summary>

El repositorio contiene los identificadores públicos del proyecto Nexus existente. Para publicar una copia independiente, reemplaza:

1. La configuración de `firebase-applet-config.json`.
2. El proyecto de `.firebaserc`.
3. El sitio de Hosting de `firebase.json`.

Configura los proveedores de Authentication, los dominios autorizados, las reglas y los índices en tu propio proyecto. Publicar en el proyecto existente requiere una cuenta autorizada.

</details>

## 🛠️ Comandos

| Comando | Acción |
| :--- | :--- |
| `npm ci` | Instala las dependencias del archivo de bloqueo y prepara la configuración local. |
| `npm run setup` | Crea la configuración local si todavía no existe. |
| `npm run dev` | Inicia la web de desarrollo en el puerto 3000. |
| `npm run lint` | Comprueba los tipos de TypeScript. |
| `npm run build:hosting` | Compila la web y genera el manifiesto de actualización. |
| `npm run preview` | Permite revisar una compilación local. |

## ☁️ Publicación en Firebase

```sh
npm run lint
npm run build:hosting
npx firebase-tools login
npx firebase-tools deploy --only hosting,firestore:rules,firestore:indexes,database --project nexus-chat-56d9d
```

El sitio publicado es **[nexus-chat-nc.web.app](https://nexus-chat-nc.web.app/)**. La carpeta generada es `dist/`; sus archivos y las dependencias no se versionan.

Consulta el procedimiento completo en [INSTRUCCIONES-FIREBASE-HOSTING.md](INSTRUCCIONES-FIREBASE-HOSTING.md).

## 🔐 Privacidad y alcance

| Aspecto | Estado actual |
| :--- | :--- |
| Transporte | HTTPS para la web y las conexiones con Firebase. |
| Acceso a conversaciones | Reglas de Firebase que restringen el acceso a sus participantes. |
| Mensajes y archivos nuevos | **Sin cifrado de extremo a extremo. Firebase puede acceder a su contenido.** |
| Historial cifrado anterior | Se conserva su lector y la importación/exportación de copias. Requiere sus claves originales. |
| Cámara y micrófono | Requieren permisos y un contexto seguro del navegador. |
| Instalación y vinculación | No se ofrece instalación como aplicación ni vinculación multidispositivo. |
| Repositorio | Sin claves de proveedores, cuentas de servicio ni datos de usuarios. |

La pérdida de las claves originales del historial cifrado anterior no permite reconstruir su contenido. Consulta [CIFRADO-Y-LLAMADAS.md](CIFRADO-Y-LLAMADAS.md) para conocer el modelo de seguridad vigente.

## 📂 Estructura

```text
Nexus-Chat/
├── .github/workflows/             Comprobaciones de TypeScript y compilación
├── assents/                       Recursos gráficos del proyecto
├── public/                        Iconos, emojis, sonidos y archivos estáticos
├── scripts/                       Desarrollo, configuración y compilación
├── src/                           Interfaz y lógica de la aplicación
│   └── public-services.example.json
├── firebase-applet-config.json    Configuración pública de Firebase
├── firebase.json                  Configuración de Hosting y servicios
├── firestore.rules               Reglas de Firestore
├── firestore.indexes.json         Índices de consultas
├── database.rules.json            Reglas de Realtime Database
└── package.json                   Dependencias y comandos
```

## 📚 Documentación

| Guía | Contenido |
| :--- | :--- |
| [Referencias de GIFs y stickers](GIFS-STICKERS-ESCRITORIO.md) | Revisión de envío, cuadrículas y visor de stickers en computadora. |
| [GIFs y stickers](GIPHY-Y-KLIPY.md) | GIFs con GIPHY y stickers con KLIPY; configuración y cuotas. |
| [Móvil y proveedores](SEGUIMIENTO-MOVIL-Y-PROVEEDORES.md) | Envíos consecutivos, teclado, emojis, actualización manual y claves de GIFs. |
| [Interfaz de escritorio](REFERENCIA-ESCRITORIO-ADJUNTOS.md) | Vistas de adjuntos, selectores, formularios y separación de dispositivos. |
| [Publicar la web](INSTRUCCIONES-FIREBASE-HOSTING.md) | Preparación y despliegue en Firebase. |
| [Estado de las funciones](ESTADO-FUNCIONES.md) | Funciones y condiciones de la entrega. |
| [Seguridad y llamadas](CIFRADO-Y-LLAMADAS.md) | Protección de datos, historial y comunicaciones. |
| [Actualizaciones y errores](ACTUALIZACIONES-Y-ERRORES.md) | Actualización manual y pantallas de error. |
| [Alcance y pendientes](PENDIENTES-WHATSAPP.md) | Diferencias, limitaciones y trabajo pendiente. |
| [Referencias de interfaz](REVISION-REFERENCIAS-WHATSAPP.md) | Referencias consultadas para la experiencia de uso. |

## 🔄 Mantenimiento

Los cambios de Nexus Chat se guardan también en este repositorio. GitHub Actions ejecuta las comprobaciones de TypeScript y compilación en cada subida y pull request. **Esto no publica automáticamente en Firebase.**

---

<div align="center">

**Nexus Chat** · Conversaciones con identidad propia.

Proyecto independiente, sin afiliación con WhatsApp ni Meta.<br />
Las licencias de terceros incluidas con los recursos deben conservarse.

</div>
