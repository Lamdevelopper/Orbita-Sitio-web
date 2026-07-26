# Newsletter sender worker

`newsletter-sender.ts` procesa entregas en lotes de 50. Cada entrega se reclama con lease, se envia con idempotencia a EmailFlare y se marca `sent` o `failed`; los fallos conservan el contador y reintentan con backoff hasta cinco intentos. El correo se descifra solo dentro del envio y nunca se devuelve en respuestas.

Los limites operativos viven en `newsletter-config.ts`. Las credenciales y claves se reciben por bindings del Worker, no se guardan en D1 ni en el repositorio.

El token de baja se deriva con un secreto exclusivo y solo su hash se guarda en
D1. La direccion se descifra dentro del intento, se entrega una sola vez a
EmailFlare y no se incluye en logs ni errores normalizados.
