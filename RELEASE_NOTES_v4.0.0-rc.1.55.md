# OSC Payment Academy v4.0.0-rc.1.55 — Red LINK: Fondo común de inversión (F1 / F2)

Sobre rc.1.54. Sin migración.

Fuente: **Anexo FCI BCBA · Mensajería Host to Host y Extract** (vigente 09/09/2024, versión 2).

## Manual
- Se agrega a los manuales confidenciales de LINK: `public/manuals/link/original/anexo-fci-bcba-mensajeria-hth-y-extract.pdf`, su versión `.md` en `texto/` y la entrada en `index.json`.
- El acceso es el mismo que el de los otros manuales LINK: solo OSC_ADMIN.

## POS · panel Red LINK
Nuevo grupo **Fondo común de inversión (Anexo FCI)**:
- **Débito asociado a FCI · F1XX00** (XX = cuenta debitada).
- **Crédito asociado a FCI · F200XX** (XX = cuenta acreditada).

El panel pide:
- **Terminal (canal):** B3 o D4 (Homebanking custom), D1 (billetera), D0 o 45 (Banca empresa, solo on-line).
- **FIID, canal, código de FCI, tipo de operación** (S suscripción / A anulación), **FCI-SEQ-NUM** (se propone solo) y **número de cuotapartista**.

Cuentas en pesos y en dólares: con FCI, el POS habilita también las cuentas 15 y 07.

### Mensajes (según las tablas 4.2 a 4.5 del anexo)
- **0200** (header 014000050): campos 3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 41, 42, 43, 49, 52, 54, 60, 61, 62, 63, 100, 102, 103, 120, 126 y 127.
  - Campo 52: 16 «F».
  - Campo 54: redefinición FCI de 120.
  - Campo 62: tipo de terminal.
  - Campo 126: token RL con TYP1 = «M». Largo total 34.
- **0210** (header 014000055): campos 3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 45, 49, 54, 60, 61, 102, 103, 120, 124, 125 y 127. En el F2 también va el 126.
  - Campo 15: mismo valor que el 17.
  - Campo 45: SINTRACK1.
  - Campo 49: moneda de la cuenta, o 000 si hay rechazo.

### Reglas del anexo en el simulador
- **Límites:** LINK no los controla. Solo el F1 puede responder 51 si no hay fondos. Los escenarios 55, 61, 65 y los de PAS o plazo fijo no aplican y se cursan como aprobados.
- **Reversos:** solo por time out (68): 0420 / 0430. La opción «el cliente cancela (17)» queda deshabilitada, porque el anexo no acepta reversos desde el canal.
- **SAF:** con la entidad fuera de línea, LINK autoriza, impacta el saldo y avisa con 0220 / 0230.
  - En Banca empresa (D0 / 45), que es solo on-line, no hay SAF: la operación no se aprueba y no se toca el saldo.
- **Duplicados:** si FIID + CANAL + CODIGO-FCI + TIPO-OPER + FCI-SEQ-NUM repite la clave de una operación aprobada, BASE24 la rechaza y no envía la 0200 a la entidad. Después de cada aprobación la secuencia avanza sola.
- **Ticket:** muestra el código de FCI, el tipo de operación, la secuencia y el canal. En dólares, el saldo sale en U$S.

## Parser
- El campo 3 reconoce F1 y F2.
- El campo 54 se desglosa con la redefinición FCI cuando el código es F1 o F2 y el largo es 120.
- El campo 126 desglosa los tags del token RL (por ejemplo, TYP1 = "M").

## Fichas de campo · Red LINK
- **Nueva ficha:** 45 (Track 1 / SINTRACK1).
- **Actualizadas:** 3, 4, 15, 49, 52, 54 (variante FCI de 120), 55, 62 (terminales FCI), 102 y 126 (variante token RL, campo por campo).
- **Tutor OSC:** se agregan los campos 45 y 62, y se actualizan 54 y 126.
- **Ayuda «PIN en la Red LINK»:** se agrega el caso FCI (16 «F»).

## Ojo con (diferencias dentro del anexo)
- **Campo 54:** las tablas de mensajes dicen X(023), pero la redefinición 4.6 suma 120 y pide informar «120». Se usa 120.
- **Campo 126 en la 0210:** figura en la del F2 y no en la del F1. Se respetan las tablas tal como están.
- **Saldo del PBF:** el anexo dice que se actualiza con el saldo que informa la entidad en la 0210, pero ninguna tabla de la 0210 incluye el campo 44. No se agregó.
- **Campo 55:** el FCI que nombra el C-X-4-01 (códigos 08, 28, 36…) es otra operatoria. Este anexo no usa el 55.
- **Código de respuesta:** el anexo no define el código del rechazo por duplicado ni el de Banca empresa fuera de línea. En el simulador se ven como «RECHAZADA POR BASE24 · CLAVE DUPLICADA» (código «--») y como 91, respectivamente.

## Alcance (no incluido)
- **ATM:** las terminales del anexo son Homebanking, billetera y Banca empresa, no cajeros.
- **TestLab:** sus reglas validan contra la 0210 del C-X-4-03, y la del FCI es distinta. Queda fuera, igual que transferencias y DEBIN.
- **Extract de TLF** (T-CDE F1 / F2, TIPO-TRAN «M», IMP-IND «1», CBU X(22) desde la posición 631; el anexo lo rotula 631-634): la plataforma no simula el archivo Extract. Queda documentado en el manual.
- **Tarjetas en estado 2 / 3 (perdida / robada):** sin cambios.

## Archivos
- **Nuevos:** `public/manuals/link/original/anexo-fci-bcba-mensajeria-hth-y-extract.pdf`, `public/manuals/link/texto/anexo-fci-bcba-mensajeria-hth-y-extract.md`, `RELEASE_NOTES_v4.0.0-rc.1.55.md`.
- **Modificados:**
  - `public/js/link-hth.js`, `public/js/app.js`, `public/js/field-cards.js`, `public/js/security-edu.js`, `public/js/testlab-core.js`.
  - `public/manuals/link/index.json`, `src/index.js` (Tutor), `public/saas-admin.html`.
  - Versión de caché: `public/pos.html`, `atm.html`, `parser.html`, `testlab.html`, `constructor.html`, `wallet.html`, `ecommerce.html`, `qa-certificacion.html`.
  - `README.md`, `package.json`.
