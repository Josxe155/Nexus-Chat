# Mantenimiento de contenido · pendiente de activación

| Estado | Alcance |
| --- | --- |
| Automatización | **Desactivada.** No hay función ni tarea programada desplegada. |
| Plataforma prevista | Firebase; no se utiliza GitHub como ejecutor de la limpieza. |
| Facturación | No se ha habilitado Blaze ni modificado la cuenta de facturación. |
| Acceso | No se ha concedido una identidad de GitHub ni nuevos roles IAM. |

El programa prepara una limpieza mensual de mensajes, notas de voz, archivos de conversaciones y estados. El aviso de la web se habilitará junto con la automatización y se destacará tres días antes. La fecha del archivo `public/cleanup-policy.json` es una propuesta; debe fijarse a un mes de la activación real.

Se conservan documentos de usuarios, perfiles y descripciones, contactos, preferencias, grupos, comunidades, imágenes de perfil y portadas referenciadas. Los documentos de chats se conservan como estructura, eliminando su contenido anterior al corte. No se eliminan archivos recientes ni de alcance desconocido. La limpieza no cambia las reglas de acceso.

## Revisión local

```sh
cd maintenance
npm ci
node run-cleanup.cjs
```

El comando predeterminado **solo cuenta**, sin borrar. Requiere credenciales administrativas locales obtenidas de forma segura; no deben guardarse en este repositorio. El proyecto de destino se valida contra `nexus-chat-56d9d`.

La ejecución destructiva está protegida por tres condiciones: argumento `--execute`, política habilitada y variable `NEXUS_CLEANUP_ALLOWED=true`. Además, no ejecuta antes de la fecha prevista y registra un bloqueo temporal para evitar procesos simultáneos. No activar estas condiciones sin revisar el corte, las copias necesarias y la programación aprobada.

La ejecución usa Firebase Admin y por ello omite las reglas de cliente. La preservación de usuarios se implementa en el programa y debe mantenerse en cualquier cambio futuro; no equivale a una restricción IAM por documento.

## Automatización exclusivamente con Firebase

La opción propuesta es una función programada con Cloud Functions for Firebase y Cloud Scheduler. [Cloud Functions requiere el plan Blaze](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans); hay cuotas sin costo y cargos posibles por uso. No se puede garantizar costo cero. [Documentación de funciones programadas](https://firebase.google.com/docs/functions/schedule-functions).

No se han creado la función programada ni sus permisos. La decisión sobre facturación está pendiente del propietario. Mientras tanto no se borrará contenido automáticamente, aunque el código de preparación esté versionado.
