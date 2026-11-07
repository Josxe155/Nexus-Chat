# Actualización móvil — 6 de noviembre de 2026

[Volver al README](../README.md)

| Apartado | Cambio |
| --- | --- |
| Información de contacto | Cabecera móvil con regreso, identidad legible, acceso a la foto, acciones de llamada, video y búsqueda, y filas que admiten nombres largos. El nombre guardado por la persona se mantiene separado del nombre público. |
| Número de Nexus | Lectura reactiva del número de la cuenta desde Firestore. Se distinguen carga, número no asignado y error. No se inventan números de otras personas ni se abre la lectura de sus registros privados. |
| Usuario elegido | Las cuentas con identificador provisional eligen manualmente un usuario antes de acceder a las conversaciones. Los invitados conservan su recorrido separado. |
| Cambios de usuario | Registro exclusivo y transacción de Firestore. La espera de 30 días usa la hora del servidor y un registro persistente que no se puede borrar desde el cliente. Nombre y descripción siguen editables. |
| Sincronización | La identidad pública es la referencia del usuario y su fecha de cambio; una copia privada antigua no vuelve a imponer el identificador anterior. |

El número de Nexus es un identificador interno, no una línea celular ni una verificación de titularidad de un teléfono real.

## Validación

- Emulador de Firestore: primer cambio, espera, cambio después de 30 días, edición de nombre, suplantación, alteración del reloj guardado y borrado/recreación del perfil.
- Interfaz con datos ficticios: ficha, foto ampliada, número recibido en tiempo real y edición del perfil en 360, 390 y 820 píxeles.
- Elección inicial del usuario y recuperación de errores en 360, 820 y 1366 píxeles.
- Las pruebas no crean ni modifican cuentas de producción.

## Seguimiento

Las estimaciones numéricas anteriores se retiran porque no tenían una medición reproducible. Esta revisión verificó contacto e identidad; no equivale a que los demás apartados estén terminados. Consulta la [revisión móvil actual](REVISION-MOVIL-SELECCION-Y-VOZ.md) para las pruebas y limitaciones vigentes.

Referencias: [privacidad e información de contacto de WhatsApp](https://faq.whatsapp.com/847237289639336/?cms_platform=android), [transacciones y validación conjunta de Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions).
