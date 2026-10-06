# OSC Payment Academy v4.0.0-rc.1.21 — Red LINK: manuales confidenciales

Se instala sobre la v4.0.0-rc.1.20. Agrega los manuales ISO 8583 de la red LINK con acceso restringido. No requiere migración D1.

## Cambios
- **Manuales LINK (NUEVO):** `public/manuals/link/` con 25 documentos.
  - `original/`: los 21 .doc del Manual HTH ISO 8583 (C-X-1 a C-X-8) y 4 anexos en PDF (Nuevo Esquema de Transferencias A-7153, Nuevo Esquema de Transferencias 22/06/2026, Anexo Técnico I Cobro con Transferencias A-8406, Anexo Técnico II DEBIN).
  - `texto/`: versión .md de cada documento, para consulta por agentes.
  - `index.json`: catálogo con `confidencial: true`.
- **Confidencialidad:**
  - LINK **no** aparece en Documentación Técnica (`documentacion.html` no se modificó).
  - `src/index.js`: toda ruta `/manuals/link/...` exige sesión OSC_ADMIN. Cualquier otro usuario, o sin sesión, recibe 404. El control también cubre mayúsculas, rutas codificadas y barras dobles.
  - Respuestas con `Cache-Control: private, no-store` y `X-Robots-Tag: noindex, nofollow`. También se agregó en `public/_headers`.
- Visa, Mastercard y Amex no cambian.

## Verificado
Prueba del worker con sesión simulada:
- Admin abre `index.json` y los originales: 200.
- Estudiante y anónimo: 404, incluidas las variantes de URL.
- Manuales Visa y `documentacion.html` siguen respondiendo 200 al estudiante.

## Pendientes conocidos
- La conversión .doc → .md aplana algunas tablas. Para el formato exacto campo por campo, usar `original/`.
- Los manuales LINK no están enlazados en ninguna pantalla. El acceso es por URL directa, solo para admin.
