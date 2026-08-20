# Superficies administrativas

- `analytics/page.tsx` conserva filtros y consultas agregadas; sus limites de
  filas usan `PAGINATION_LIMITS` y sus numeros/fechas usan el locale y timezone
  editoriales compartidos.
- El dashboard no expone identidad de lectores; cualquier nuevo indicador debe
  seguir consultando eventos agregados y mantener el acceso privado.
