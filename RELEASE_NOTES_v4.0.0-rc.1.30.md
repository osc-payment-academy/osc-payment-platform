# OSC Payment Academy v4.0.0-rc.1.30 — Fichas de campo LINK y campos ampliados

Sobre rc.1.29. Sin migración nueva.

## Fichas de campo · Red LINK
- 35 campos del Host to Host BASE24 (3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41–44, 48, 49, 52, 54, 55, 60–63, 70, 90, 95, 100, 102, 103, 120, 124, 125, 127), armadas desde los registros C-X-1-2-3 y C-X-4.
- Los campos que cambian según la operación (54, 55, 125, 127) muestran la sección "Según el código de transacción" (PAS, saldos, plazo fijo, interbancarias, Pay Key, consulta 69, ticket, Home Banking).
- Parser: con una trama LINK aparece la manito ☝ en cada campo con ficha. Tutor: "Ver ficha del campo LINK".
- Pie: "El acceso a ese manual lo otorga Red LINK a través de tu entidad". El admin OSC ve "Abrir manual original" (visor LINK con el campo resaltado).

## Campos ampliados de las marcas
- Visa: 44, 54, 60, 62, 63, 90, 95. Páginas del manual corregidas en 54, 60 y 90.
- Mastercard (CIS): 54, 63, 90.
- American Express: 30, 31, 56, 60, 61, 62, 63.

## Fichas (todas)
- Nuevo texto al pie: "Esta ficha resume lo esencial para construir el campo. Para el detalle completo (todas las reglas y valores), consultá el manual oficial de [marca]: [manual] · [campo]. El acceso a ese manual lo otorga la marca a través de tu entidad."

## Archivos
js/field-cards.js, js/help-catalog.js, js/tutor-osc.js, parser.html, src/index.js y las páginas que cargan esos scripts (versión).
