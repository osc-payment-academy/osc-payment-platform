# OSC Payment Academy v4.0.0-rc.1.46 — ATM: ARQC/ARPC y PIN Block como en el POS

Sobre rc.1.45. Sin migración nueva.

## Problema
En el ATM, la manito ☝ del DE 55 abría solo la ficha del campo. El popup de 4 pestañas (Explicación simple · Detalle técnico · Flujo paso a paso · Tu transacción) estaba en dos botones arriba de la tabla, y "Tu transacción" no mostraba la validación del emisor ni el ARPC.

## Corrección
- **Botones en su campo (como el POS):**
  - **🔐 ARQC / ARPC** en la fila del DE 55 (y del DE 23).
  - **🔑 PIN Block y HSM** en la fila del DE 52 (y del DE 53).
  - Arriba de la tabla queda el aviso "ARQC / ARPC está en el DE 55 y PIN Block y HSM en el DE 52".
  - La manito ☝ sigue abriendo la ficha del campo.
- **"Tu transacción" del ARQC, igual que en el POS:**
  - El emisor recalcula el ARQC con lo que recibió en el DE 55 y lo compara con el de la tarjeta.
  - Muestra el resultado ("Coincide: la tarjeta es auténtica") y, si la operación se aprobó, el **ARPC (tag 91) + ARC**.
  - Funciona con Visa (CVN 10) y Mastercard (EMV CSK).
- **"Tu transacción" del PIN:** suma las filas del HSM del emisor: PIN Block descifrado, formato ISO 0 y verificación del PIN.
- **Datos de cada operación:** los popups usan los datos de la operación del mensaje seleccionado en el historial, no solo los de la última.
- **Flujo paso a paso:** en el ATM dice **Cajero (ATM)** y **Cajero → Tarjeta** donde en el POS dice POS.
- **Red LINK:** no se muestran estos botones, porque el campo 55 de LINK no es EMV.

## Archivos
public/atm.html, public/js/security-edu.js. README.md, package.json.
