# OSC Payment Academy v4.0.0-rc.1.48 — Correcciones pendientes (Wallet, ATM, fichas)

Sobre rc.1.47. Sin migración nueva.

## Wallet · "Importe alterado en tránsito" (public/js/de-tabs.js, public/js/modern-channel-iso.js)
- Validaciones detecta el caso nuevo **C14 · Criptograma alterado (wallet)**. Antes lo tomaba como C08 (compra aprobada) y marcaba ❌ la respuesta.
- Respuesta esperada: Visa **82**, Mastercard **88**, Amex **100**.
- Controla que la respuesta **no** lleve ARPC (DE 55), porque el emisor no firma una operación que rechazó.
- Con la Wallet de Visa, Mastercard y Amex da **100 %**.

## ATM Mastercard · campos según el manual (public/atm.html)
Fuente: *Mastercard Debit Switch (MDS) Online Specifications*, Financial Transaction Request/0200 y DE 18 / DE 25 / DE 33 / DE 61.
- **0200:** suma **DE 12**, **DE 13**, **DE 18 = 6011** ("6011—ATM cash transaction - Processing Code = 01, 30, or 40"), **DE 33** (processor ID 9000000xxx), **DE 43** (nombre 22 + ciudad 13 + país 3) y **DE 61** (POS Data, Tabla 4.29: terminal desatendida, CAT nivel 1, banda + chip, país y código postal).
- **Se quita el DE 25:** "The MasterCard Debit Switch (MDS) does not use this data element".
- **0420:** suma DE 12, DE 13 y DE 33 con el valor de la solicitud original.
- El caso C17 Mastercard controla esos campos. Con la corrección da **100 %**.

## ATM · consulta de saldo (public/atm.html, public/js/de-tabs.js)
- El DE 3 pasa de 310000 a **300000**. Los manuales definen **30 = Balance Inquiry** (Visa Full Service ATM, Tabla 28 · Mastercard MDS); el 31 no figura.
- C19 controla DE 3 = 300000 y DE 18 = 6011.
- **Historial duplicado corregido:** la consulta aparecía dos veces porque el importe "0" y "000000000000" no se reconocían como iguales al reconstruir el historial.

## ATM · Amex
- La 1210 con Action Code **000** ahora figura como **Aprobada** en el historial y en el Switch, así que también cuenta bien en el contador del Dashboard.

## Fichas del campo en el ATM (public/js/field-cards.js, public/js/help-catalog.js)
- Con tarjeta Visa, en el ATM las fichas citan **Visa Full Service ATM Online Messages (21 oct 2024)**, no el manual POS.
- Hay fichas propias de cajero para los DE **12, 13, 18 (ejemplo 6011), 19, 43, 90 y 95**.
- El botón "Abrir manual original" (solo administración OSC) abre el PDF de ATM en la página del campo.

## Revisado sin cambios
- **Visa E-Commerce, Field 126.8 (XID):** no corresponde. El manual lo pide para CAVV usage 2 (3-D Secure 1.0) y "is not required if field 126.9, usage 3, is being used". El simulador usa EMV 3DS 2.2.

## Para decidir (no se tocó)
- **ATM Visa, dispensación parcial:** según el manual, la reversa parcial 0420 con Field 95 y 63.3 = 2504 corresponde a adquirentes *V.I.P. Authorization-Only*. Un adquirente *Full Service* que envió una 0200 corrige con un **ajuste 0220** (Field 3 = 22, 63.3 = 2002 "Wrong amount due to ATM misdispense"). Visa convierte la 0420 parcial en 0220 para emisores Full Service. Hoy el simulador muestra la 0420.

## Archivos
public/atm.html, public/js/de-tabs.js, public/js/modern-channel-iso.js, public/js/field-cards.js, public/js/help-catalog.js. README.md, package.json.
