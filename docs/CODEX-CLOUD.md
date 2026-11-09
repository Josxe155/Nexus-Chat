# Nexus Chat en Codex Cloud

## Base y ejecución

La copia de trabajo procede del ZIP v26.76.1, commit `82c59433811484fc8fb4be68cb38c5e81464526e`, y está vinculada a `origin/main` de `Josxe155/Nexus-Chat`. La siguiente corrección es **v26.76.2**. Node.js 22 o posterior y el archivo de bloqueo permiten preparar otra sesión:

```sh
npm ci --include=dev
npm run lint
npm run check:docs
npm run test:dashboard-ai
npm run build:hosting
```

Codex Cloud ejecuta estos procesos en un entorno remoto, sin usar la computadora personal como servidor. El acceso desde el celular requiere iniciar sesión en la misma cuenta y abrir la tarea de Cloud. No se ha probado ese recorrido en un celular físico ni se ha configurado aquí una plantilla reutilizable del entorno. Una nueva sesión debe seleccionar el repositorio y preparar sus credenciales; vincular el Git local no configura por sí solo todos los entornos futuros.

## Configuración local

Configura `GEMINI_API_KEY` en los secretos del entorno y ejecuta `npm run setup`. El script importa esa clave a `src/public-services.json`, mantiene los otros servicios y completa los campos nuevos de la plantilla. No muestra las claves ni las guarda en Git. Ese archivo debe existir antes de compilar.

La consulta real se verificó con `gemini-3.1-flash-lite`, usando exclusivamente datos ficticios: ocho cuentas y tres activas durante los últimos siete días. Se obtuvo una respuesta en español que identificó ambas cifras y distinguió los datos de prueba. El modelo se puede cambiar mediante `geminiModel`. La consulta no verifica por sí sola el acceso a Firestore con una sesión administradora real.

La configuración de servicios se incorpora al JavaScript enviado al navegador. Excluirla del repositorio evita versionar la clave, pero no la oculta a los visitantes del Hosting. Las credenciales administrativas de Google no deben incorporarse a esa configuración.

## Firebase Hosting de prueba

Destino: proyecto `nexus-chat-56d9d`, sitio `nexus-chat-nc`. Firebase CLI se preparó en esta sesión como herramienta temporal. Para instalarla en otra sesión puede utilizarse `npx firebase-tools`. La publicación necesita una identidad de Google autorizada, mediante las credenciales del entorno o una sesión válida de Firebase CLI. Una clave de Gemini no proporciona esa autorización.

Después de las comprobaciones, el canal temporal se publica con:

```sh
npx firebase-tools hosting:channel:deploy codex-v26-76-2 --project nexus-chat-56d9d --expires 7d --no-authorized-domains
```

El canal no reemplaza el Hosting público. La opción final evita modificar automáticamente los dominios autorizados de Authentication; probar Google en el dominio temporal puede requerir autorizarlo. La vista previa utiliza los servicios de datos configurados en la aplicación: no es una base de datos de pruebas independiente. No se ejecutan limpiezas para comprobar Hosting.

La comprobación de credenciales de esta sesión falló con `Failed to authenticate, have you run firebase login?`. No hay identidad administrativa de Google configurada. El despliegue temporal queda pendiente hasta resolver ese acceso; no se afirma que exista una URL de prueba.

## Verificación de v26.76.2

| Comprobación | Evidencia y alcance |
| --- | --- |
| Compilación | `build:hosting` genera la aplicación, el dashboard y `release.json`. |
| Asistente del panel | Consulta real con datos ficticios; pruebas automatizadas de muestra, respuesta cortada, bloqueo, errores, configuración y cancelación. |
| Voz | Controles probados con reconocimiento y síntesis simulados; la lectura admite voces del sistema en español. |
| Acceso al dashboard | Pantalla Google y contraseña visibles sin desbordamiento; no se inició una sesión administradora real. |
| Identidad | Nuevo logo, iconos PNG y favicon ICO de 16, 32, 48 y 64 píxeles. |
| Dispositivos | Chromium a 393×873, 390×844, 820×1180 y 1440×900; no equivale a probar Android, Safari/iPhone o hardware real. |
| Actualizaciones | Versión visible y búsqueda con manifiesto simulado dentro de Acerca de la web, sin diálogos emergentes. |

Para esta entrega, la matriz por tamaño tiene ocho comprobaciones: logo, versión, búsqueda interna, acceso visible, dictado simulado, lectura simulada, sesión administradora real y audio en equipo físico. Las seis primeras están verificadas: **6/8, 75 %** en cada tamaño. Este porcentaje mide esta matriz, no el avance global de Nexus Chat. Las funciones anteriores que no se ejercitaron no se consideran verificadas por esta revisión.

## Notificaciones y limpieza: revisión pendiente

El cliente actual registra `sw.js` y permite avisos locales. No registra tokens con Firebase Cloud Messaging: faltan la configuración Web Push/VAPID y un emisor de confianza que envíe los mensajes. El manejador `push` existente no demuestra recepción con la pestaña cerrada. No se instalaron credenciales de envío en el navegador ni se desplegó un backend nuevo. Queda pendiente una prueba FCM real en segundo plano y con la pestaña cerrada.

La limpieza del dashboard sigue ejecutándose con Firebase desde el navegador. La revisión del código identifica confirmación escrita y adicional para la limpieza inmediata, comprobación de acceso administrativo, bloqueo entre pestañas y protección de medios referenciados por perfiles, chats y comunidades. Los documentos de cuentas, perfiles y estructuras de grupos no forman parte de los lotes de borrado. El aviso público comprueba que falten tres días o menos y que la fecha todavía sea futura. Estas observaciones son una revisión del código: falta verificar las operaciones y las reglas con datos de prueba aislados de Firestore y Realtime Database. No se borraron datos reales, activó facturación ni creó una tarea de servidor.

Quedan pendientes las pruebas físicas de voz, llamadas, biometría, pantalla completa y equipos modestos, así como los recorridos de multimedia, recuperación de llamadas, copias/restauración y comunidades. No se presenta esta corrección como finalización de esas funciones.

## Referencias oficiales consultadas

- [Gemini: generación de contenido](https://ai.google.dev/api/generate-content).
- [Firebase: canales de vista previa](https://firebase.google.com/docs/hosting/test-preview-deploy).
- [Firebase: recibir mensajes web](https://firebase.google.com/docs/cloud-messaging/web/receive-messages).
- [Firebase: preparar Cloud Messaging web](https://firebase.google.com/docs/cloud-messaging/web/get-started).
- [WhatsApp Web: problemas con las notificaciones](https://faq.whatsapp.com/655426345948308/?cms_platform=web).
