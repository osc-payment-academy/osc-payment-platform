# OSC Payment Academy v4.0.0-rc.1.29 — Fichas de campo, operaciones del POS, ARQC y PIN en su campo

Acumulativa: incluye rc.1.22 a rc.1.28. Sin migración nueva.

## Manuales de las marcas: uso restringido
- La manito ☝ del Parser y del Constructor abre ahora la **Ficha del campo**: resumen didáctico en español con los términos en inglés, basado en el manual de cada marca. Incluye formato, qué contiene, cómo se arma (posición por posición), valores frecuentes, cuándo va, puntos de atención y un ejemplo.
- Fichas disponibles: Visa (Full Service POS, abr 2025) 25 campos · Mastercard (CIS, feb 2025) 24 campos · American Express (Network Specifications – Authorization, oct 2023) 22 campos. Los demás campos muestran la descripción general.
- Los PDF de Visa, Mastercard y Amex (/manuals/*) quedan **solo para la administración OSC** (el servidor devuelve 404 al resto). En la ficha, el admin ve el botón "Abrir manual original".
- Tutor OSC: el alumno recibe "☝ Ver ficha del campo" en lugar del enlace al PDF.
- El Centro de Documentación Técnica sigue siendo solo para la administración OSC.

## POS
- El botón "Operaciones" se reemplazó por **🏦 Switch del Adquirente**.
- Nuevo selector **Operación** (compra, anulación, devolución, consulta, cierre de lote, reimpresión, último ticket). Después de una anulación, consulta o cierre vuelve a "Compra". Con tarjeta LINK se oculta.
- **🔐 ARQC / ARPC** ahora está en el DE 55 (y en el DE 23) y **🔑 PIN Block y HSM** en el DE 52 (y en el DE 53) de la tabla Data Elements. Hacer clic en la fila del 55 o del 52 abre esa explicación.
- "Tu transacción" muestra los datos del mensaje seleccionado, también después de recargar la página (la traza se guarda con la operación).

## Archivos
Nuevo: js/field-cards.js. Modificados: pos.html, js/app.js, js/help-catalog.js, js/tutor-osc.js, js/switch-store.js, src/index.js y las páginas que cargan esos scripts (versión).
