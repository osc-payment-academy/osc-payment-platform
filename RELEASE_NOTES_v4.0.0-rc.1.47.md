# OSC Payment Academy v4.0.0-rc.1.47 — ATM Visa: campos obligatorios según el manual

Sobre rc.1.46. Sin migración nueva.

## Problema
En una extracción Visa en el ATM, la pestaña Validaciones marcaba ❌ el DE 18. Al revisar el manual se encontraron otros cuatro campos obligatorios que la 0200 tampoco enviaba.

Fuente: Visa *Full Service ATM Online Messages – Technical Specifications* (21 oct 2024), secciones "Usage" y "Field Edits" de cada campo.

| Campo | Qué dice el manual | Reject si falta |
|---|---|---|
| **Field 18 – Merchant Type** | Requerido en 0200, 0220, 0400/0420. "Must be 6011 for all ATM transactions". Con Field 3 = 01, debe ser 6011. "The value in a reversal must match the request". | 0283 |
| **Field 12 – Time, Local Transaction** | "Acquirers must submit this field in 0200 requests, 0220 advices, 0400 requests, and 0420 reversals". En los mensajes siguientes va el valor de la solicitud original. | 0278 |
| **Field 13 – Date, Local Transaction** | "Required in 02xx requests and advices for card transactions, in related 04xx reversal requests and advices". | 0279 |
| **Field 19 – Acquiring Institution Country Code** | "Required in all messages related to a cardholder". | 0306 |
| **Field 43 – Card Acceptor Name/Location** | "Required in all messages related to a cardholder transaction (02xx, 04xx)". Posiciones 39-40 = código de país alfa. | — |

## Corrección (public/atm.html · solo tarjetas Visa)
- **0200 (extracción, consulta y transferencia):** suma DE 12 (hhmmss), DE 13 (MMDD), DE 18 = **6011**, DE 19 = 032 y DE 43 = "OSC BANK ATM001" + "BUENOS AIRES" + "AR" (25 + 13 + 2).
- **0420 (reversa total y parcial):** lleva los mismos campos. El 12, el 13 y el 18 repiten el valor de la 0200 original.
- La respuesta 0210 no cambia: el manual dice que el Field 18 "is not used in responses".
- Mastercard, Amex y LINK no cambian. El DE 18 de Mastercard en ATM sigue pendiente de cruzar con el CIS/MDS.

## Validaciones (public/js/de-tabs.js)
- El caso **C17 · Extracción ATM chip · Visa** controla DE 12, 13, 18 = 6011, 19 y 43, citando el manual. Con la corrección da **100 %**.
- El caso sigue como "Borrador": el resto de la lista de obligatorios se completará con los casos oficiales.

## Archivos
public/atm.html, public/js/de-tabs.js. README.md, package.json.
