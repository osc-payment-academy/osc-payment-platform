# OSC Payment Academy v4.0.0-rc.1.33 — Wallet: popup del DE 55 y criptograma alterado

Sobre rc.1.32. Sin migración nueva.

## ARQC / ARPC en el campo, como en el POS
- El botón **🔐 ARQC / ARPC** pasa a la fila del **DE 55** (y del DE 23 en Visa), en la solicitud y en la respuesta. Se quita el botón "Ver ARQC / ARPC de esta compra" de arriba del bitmap.

## Popup con explicación de wallet
- Con una operación de Wallet, el popup se titula "Criptograma ARQC y respuesta ARPC · Wallet". Las 4 pestañas son las mismas:
  - **Explicación simple:** firma el teléfono con una clave del token (DPAN); la tarjeta real no participa; la red/TSP detokeniza y se valida la firma.
  - **Detalle técnico:** qué cambia respecto del chip (clave derivada del DPAN, kernels qVSDC / M/Chip / Expresspay, quién valida). Sigue con el detalle técnico del POS.
  - **Flujo paso a paso:** Teléfono → POS → Adquirente → Red · TSP (detokeniza) → Emisor · HSM → POS → Teléfono.
  - **Tu transacción:** "Token (DPAN) / PSN", "Tarjeta real (FPAN) •••• xxxx · no entra en el cálculo", "Clave del token (UDK)" y "Coincide: la compra salió de ese teléfono".
- POS, ATM y Parser siguen mostrando la versión de tarjeta (sin cambios).

## Escenario "Importe alterado en tránsito" (Wallet)
- El teléfono firma el importe original; el DE 4 y el tag 9F02 viajan con +1.000,00. El emisor recalcula el ARQC con lo recibido, no coincide y rechaza: **Visa 82 · Mastercard 88 · Amex 100**. No hay ARPC.
- Paso 7: "ARQC recalculado ≠ recibido → rechazo". Teléfono: "Criptograma inválido (ARQC no coincide)".
- Mismo criterio que "Alterar un dato en tránsito" del POS.

## Archivos
public/wallet.html, public/js/wallet-lab.js, public/js/modern-channel-iso.js, public/js/security-edu.js. README.md, package.json.
