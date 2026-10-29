# OSC Payment Academy v4.0.0-rc.1.51 — TestLab: importe en «Ejecutar»

Sobre rc.1.50. Sin migración. El agente qa-v2.0 no cambia.

## Corrección
- TestLab → Ejecutar → **Importe**: `5000.00` se interpretaba con el punto como separador de miles y salía **$ 500.000,00** en el DE4.
- Ahora acepta `5000`, `5000,00`, `5000.00`, `5.000,00` y `5,000.00`. Si el último separador tiene 1 o 2 dígitos detrás, es el separador decimal.
- Debajo del campo se muestra lo que se va a enviar, por ejemplo: «Se envía: $ 5.000,00 · DE4 000000500000».

## Archivos
`public/testlab.html`, `README.md`, `package.json`.
