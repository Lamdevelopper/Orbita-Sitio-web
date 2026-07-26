# API newsletter

Las rutas de `subscribers` y `newsletters` mantienen dos fronteras: las altas publicas responden de forma generica para evitar enumeracion, mientras las operaciones editoriales requieren `isEditor` y validan `Origin` cuando el navegador lo envia. Los correos se cifran y se consultan por blind index; las respuestas administrativas solo exponen DTOs enmascarados.

Las newsletters usan revisiones: autosave incrementa `revision` y anula `testedRevision`; `test` prueba la revision guardada; `send` exige que ambas coincidan, requiere `Idempotency-Key` y no permite editar envios enviados. El footer se agrega unicamente en `lib/newsletter-render.ts`.
