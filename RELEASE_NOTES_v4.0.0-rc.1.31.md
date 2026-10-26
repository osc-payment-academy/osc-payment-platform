# OSC Payment Academy v4.0.0-rc.1.31 — Ficha LINK del campo 126

Sobre rc.1.30. Sin migración nueva.

## Ficha de campo · Red LINK · Campo 126 (secndry-rsrvd7-prvt)
- Antes mostraba "Todavía no hay una ficha didáctica para este campo": la tabla de descripciones del C-X-1-2-3 salta del 125 al 127 y el 126 había quedado afuera.
- Nueva ficha armada desde los registros C-X-4 (0200 Output, 0205, 0210, 0215, 0220, 0420) y los anexos de LINK (Nuevo Esquema de Transferencias, Anexo Técnico I Cobro con Transferencias A-8406, Anexo Técnico II DEBIN).
- Sección "Según el código de transacción":
  - Adelanto / consulta en cuotas (01 / 31) · longitud 139.
  - Selección de múltiples cuentas (On Line puro) · longitud 354.
  - Plazo fijo · MULTIPLES-PF (0205 / 0215).
  - Área de tokens: header (&, cantidad, longitud) y tokens PE, Q7, QY, QU, RL, QS (DEBIN) y R8 (Cobro con Transferencias).
- "Ojo con": diferencia de formato entre el manual base (g..680) y los anexos (X(998)); el token R8 es configurable por entidad y no reemplaza al campo 55.

## Archivos
js/field-cards.js y las páginas que lo cargan (versión): atm.html, constructor.html, parser.html, pos.html. README.md, package.json.
