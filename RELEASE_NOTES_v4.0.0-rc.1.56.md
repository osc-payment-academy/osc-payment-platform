# OSC Payment Academy v4.0.0-rc.1.56 — Historial de operaciones Red LINK

Sobre rc.1.55. Sin migración.

## POS · las operaciones LINK no quedaban guardadas
- **Causa:** el flujo LINK del POS nunca guardaba la operación en el workspace (Switch Store), como sí lo hacen Visa, Mastercard y Amex.
  - Al salir y volver a entrar, el historial se reconstruía sin ninguna operación LINK.
  - Si se operaba antes de que terminara de cargar el workspace, la restauración inicial borraba de la pantalla las operaciones ya hechas. Por eso se veía solo la última.
- **Corrección:** cada operación LINK se guarda al terminar, con **todos sus mensajes**: 0200 / 0210 y, según el caso, 09 + 29, F3 + F4, 0420 / 0430 o 0220 / 0230.
  - Se guardan las tramas reales, para «Analizar en Parser» y «Copiar trama».
  - Se guardan también los datos que usan anulaciones, devoluciones y preautorizaciones finalizadas para elegir la operación original.
  - Al volver al POS se restauran tal cual.
- Si una operación cambia de estado (ANULADA, DEVUELTA, FINALIZADA, LOTE CERRADO), se actualiza sin perder sus mensajes.
- Las operaciones LINK también aparecen en el Switch adquirente con red LINK. No entran en la compensación Visa / Mastercard / Amex.
- Se conservan las tramas completas de las 150 operaciones LINK más recientes, para no llenar el almacenamiento del navegador.

## ATM · los tramos de una misma operación se fusionaban al volver
- El ATM ya guardaba las operaciones LINK. Pero al restaurar, el control de duplicados usaba MTI + STAN + tarjeta + dirección + importe.
  - Las transferencias (0200 09 y 0200 29) y el DEBIN (F3 y F4) comparten esos datos, así que quedaba un solo tramo de cada dirección.
- **Corrección:** el control de duplicados también tiene en cuenta el rótulo del mensaje LINK, y se restauran los cuatro mensajes.

## Verificado (navegador simulado, jsdom)
- **POS:** débito FCI y extracción LINK seguidos, sin salir de la página. Se ven las 4 filas. Al recargar la página siguen las 4.
- **POS:** una transferencia guardada (4 mensajes) se restaura completa. Un cierre de lote no borra los mensajes.
- **ATM:** una transferencia con 4 mensajes se restauraba en 2 filas (rc.1.55) y ahora en 4.

## Archivos
- `public/js/app.js`, `public/js/switch-store.js`, `public/atm.html`.
- Versión de caché: `public/pos.html`, `constructor.html`, `ecommerce.html`, `index.html`, `parser_guiado.html`, `switch.html`, `wallet.html`.
- `README.md`, `package.json`.
