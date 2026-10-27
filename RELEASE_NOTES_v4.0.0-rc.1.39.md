# OSC Payment Academy v4.0.0-rc.1.39 — Pestañas del panel Data Elements en ATM, Wallet y E-Commerce

Sobre rc.1.38. Sin migración nueva.

## Pestañas del panel Data Elements (como en el POS)
ATM, Wallet y E-Commerce suman las mismas cuatro pestañas del POS: **Data Elements · Vista TLV · Explicación · Validaciones**. En Wallet y E-Commerce funcionan sobre la solicitud y la respuesta, y la pestaña elegida se mantiene entre operaciones.

- **Vista TLV (ATM y Wallet):** decodifica el DE 55 tag por tag, con las longitudes en hexadecimal. Reconoce el Dataset 01 de Visa. En la Wallet aclara que los datos los genera el teléfono con la clave del token. En el ATM con banda magnética avisa que no viaja DE 55. En la Red LINK aclara que el campo 55 no es EMV.
- **Autenticación 3DS (E-Commerce, reemplaza a Vista TLV):** muestra en qué campo ISO 8583 viaja el resultado de 3-D Secure y qué significa:
  - Visa: DE 22, DE 25 = 59, DE 60.8 (ECI), DE 126.9 (CAVV) y 126.10 (CVV2).
  - Mastercard: DE 22 = 81, DE 48 TCC, SE 42 (SLI), SE 43 (AAV) y SE 92 (CVC 2).
  - Amex: Bit 22 posiciones 4 y 5, Bit 61 SafeKey (ECI y AEVV) y Bit 53 (CSC).
  - Arriba muestra el resultado de la autenticación: escenario, versión EMV 3DS, ARes/RReq y challenge.
  - Con "Sin 3-D Secure" muestra que el CAVV/AAV/AEVV **no viaja**.
  - Los códigos de seguridad se muestran enmascarados.
- **Explicación:** lectura del mensaje adaptada al canal: retiro y consulta de saldo, MCC 6011, PIN Block, token (DPAN) en el DE 2, datos de 3DS, saldos en el DE 54, reversas (DE 90 / DE 95) y código de respuesta. Debajo va la tabla de campos con su origen.
- **Validaciones:** detecta el caso de uso y muestra el checklist con el mismo formato del POS (✅ ❌ ⚠️ ❔ y bitmap coloreado). Se puede elegir otro caso a mano.
  - **C08** Compra wallet NFC: DE 22 = 07 (Amex Bit 22 pos. 6 = Y), DE 55 en la solicitud y ARPC en la respuesta.
  - **C09** Compra e-commerce 3DS: ECI / SLI coherente con el escenario 3DS (05/212 autenticado · 06/211 intento · 07/210 sin 3DS) y CAVV/AAV/AEVV presente solo si hubo autenticación. Visa además DE 25 = 59. Mastercard además TCC = T y DE 61.
  - **C17** Extracción ATM chip · **C18** Dispensación parcial (0420 con DE 90 y DE 95) · **C19** Consulta de saldo (DE 54 en la respuesta).
  - Red LINK: la batería v1 no tiene casos LINK y la pestaña lo indica.
  - Todos los casos de ATM, y los casos Amex de Wallet y E-Commerce, siguen como **Borrador** hasta tener los casos oficiales de la marca.
- Nuevo **js/de-tabs.js**, compartido por los tres simuladores. El POS sigue con js/pos-validations.js, sin cambios de lógica.

## Dashboard
- La tarjeta **"Continuar donde quedaste"** pasa a la derecha del encabezado, entre el texto y la ilustración. En celular queda debajo del texto.

## POS
- La fila "💳 Cuotas · ARQC / ARPC está en el DE 55…" ahora pasa a la línea siguiente si no entra, y ya no se superpone con las pestañas.

## Hallazgos de las pruebas (no se tocaron los simuladores)
Las Validaciones nuevas marcan tres puntos. Hay que confirmarlos contra el manual antes de cambiar nada:
- **ATM Visa y Mastercard, extracción (C17):** la 0200 no envía **DE 18 = 6011**, que la batería pide.
- **ATM Mastercard:** envía **DE 25**. En el POS se quitó en rc.1.22 porque Mastercard no lo usa.
- **ATM, consulta de saldo (C19):** el simulador envía DE 3 = **31**0000 y la batería dice 30. Queda "a validar".

Errores previos encontrados al probar (no son de esta versión):
- ATM, consulta de saldo: el historial muestra la 0200/0210 **dos veces** con la misma STAN. send0200 se llama una sola vez; el duplicado se arma al registrar el mensaje.
- ATM Amex: la 1210 con Action Code **000** figura como "Rechazada" en el historial, porque el estado compara contra "00". Esto también afecta el contador Aprobadas / Rechazadas del Dashboard.

## Archivos
Nuevo: public/js/de-tabs.js. Modificados: public/atm.html, public/wallet.html, public/ecommerce.html, public/js/modern-channel-iso.js, public/index.html, public/pos.html. README.md, package.json.
