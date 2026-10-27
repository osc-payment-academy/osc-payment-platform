# OSC Payment Academy v4.0.0-rc.1.45 — Ficha del campo según la red de la operación

Sobre rc.1.44. Sin migración nueva.

## Problema
En una compra Mastercard QR, la manito ☝ del DE 48 no abría la ficha, y la del DE 22 abría la ficha de **Visa**.

Causa: en POS y ATM la red para la ficha del campo se buscaba en el selector de red del Parser o del Constructor. Como esas pantallas no tienen ese selector, siempre caía en **Visa**, aunque la operación fuera Mastercard, Amex o LINK. Visa no tiene ficha del DE 48, por eso no se abría nada.

## Corrección (public/js/osc-learning.js)
- **POS:** la ficha usa la red del mensaje seleccionado. En QR es la red del QR; con tarjeta, la de la tarjeta.
- **ATM:** la ficha usa la red del mensaje seleccionado (Visa, Mastercard, Amex o LINK).
- Wallet y E-Commerce no cambian (ya usaban la red de la operación).
- Afecta a todas las operaciones de POS y ATM con Mastercard, Amex o LINK, no solo al QR.

## Nota
- Visa no tiene ficha del DE 48. En una compra Visa QR ese campo no muestra manito; los datos del QR se explican en la pestaña Explicación.

## Archivos
public/js/osc-learning.js. README.md, package.json.
