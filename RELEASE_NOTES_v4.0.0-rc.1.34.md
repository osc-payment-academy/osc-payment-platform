# OSC Payment Academy v4.0.0-rc.1.34 — Wallet: historial y monto inicial

Sobre rc.1.33. Sin migración nueva.

## Historial
- "Reiniciar demo" ya **no oculta** el historial (en rc.1.32 filtraba lo anterior al reinicio en esa pestaña; por eso parecía que solo quedaba la última operación). Las transacciones nunca se borraban del Switch.
- El historial arranca **desplegado** y muestra hasta 50 operaciones de Wallet.
- Se actualiza solo cuando el workspace se sincroniza.

## Monto
- El monto **nunca se repite**: al abrir la página (en cualquier pestaña o equipo) y al reiniciar, arranca en el **último importe de Wallet + 50**. Solo empieza en 2.500,00 si no hay operaciones previas.
- Durante una compra, el teléfono y el DE 4 siguen coincidiendo; "Nueva compra" suma 50.

## Archivos
public/wallet.html, public/js/wallet-lab.js. README.md, package.json.
