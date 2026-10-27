# OSC Payment Academy v4.0.0-rc.1.44 — POS: QR sin falsos rojos en Validaciones

Sobre rc.1.43. Sin migración nueva.

## Problema
Al pagar con QR (por ejemplo Mastercard QR) con la pestaña **Validaciones** abierta, el bitmap se llenaba de rojo y el checklist marcaba 65 %.

La operación estaba bien. El error era de la validación:
- La batería de escenarios v1 no tiene casos de QR. Como el QR viaja con DE 22 = 010, la pestaña lo detectaba como **C05 · Compra manual**.
- Tomaba la red de la tarjeta de prueba seleccionada (Visa) en lugar de la del QR (Mastercard).
- Contra C05 Visa faltaban los campos 12, 13, 18, 19, 32, 37, 43 y 63, que en el QR no corresponden. Esos son los rojos.

## Corrección (public/js/pos-validations.js)
- **Validaciones:** con un pago QR muestra "Pago con QR: la batería v1 todavía no tiene casos de uso de QR" y no colorea el bitmap.
- **Explicación:** para QR dice que no se leyó una tarjeta física, sino que viaja la credencial de la wallet (DE 22 = 010), y que los datos del QR van en el DE 48.
- **Red de los mensajes QR:** se toma la del QR elegido.
- Las compras con tarjeta no cambian.

## Pendiente
- Definir casos de uso de QR en la batería (Visa QR y Mastercard QR, Merchant Presented) para validarlos contra el manual de cada marca.

## Archivos
public/js/pos-validations.js. README.md, package.json.
