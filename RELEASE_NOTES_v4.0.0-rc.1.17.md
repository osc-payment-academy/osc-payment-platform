# OSC Payment Academy v4.0.0-rc.1.17 — DE55/DE22 Visa, Parser y clearing Amex 1240

Se instala sobre la v4.0.0-rc.1.16. No requiere migración D1 ni cambios en `src/index.js`.

## 1. Parser ISO8583
- **DE55 en el perfil Visa:** ahora se lee en tramas de texto con prefijo decimal (antes desalineaba todo lo que venía después).
- **Desglose TLV del DE55:** bajo el valor se muestra la lista de tags con su nombre (9F26 Application Cryptogram, 9F10, 9F37, etc.). Los tags sensibles (PAN, Track 2 equivalente, nombre, vencimiento, secuencia del PAN) se muestran enmascarados.
- Reconoce el encabezado de dataset de Visa (Dataset ID 01 + longitud) y avisa si la longitud declarada no coincide. Funciona también con TLV plano (Mastercard y Amex).

## 2. Visa Field 22, Field 42 y Field 55
- **Field 22 (Visa) = 4 dígitos** (modo de ingreso 2 + capacidad de PIN 1 + relleno 0): POS 0510 / 0710 / 0210 / 0110 (QR 0100), ATM (con el texto de ayuda según la marca), Wallet 0710 y E-Commerce 0120. En E-Commerce el valor 81 no existe en Visa. Mastercard sigue en 3 dígitos y Amex en 12 posiciones.
- **Field 42 = 15 posiciones** en el POS para Visa y Mastercard (enviaba 10 y desalineaba la trama en el Parser). Wallet y E-Commerce también.
- **Field 55 de Visa (Usage 1)** se arma como Dataset ID 01 + longitud del dataset (2 bytes) + TLV, en POS, ATM, presets del Constructor y banco de tramas del Parser Guiado. El Constructor advierte si el DE55 Visa no lo cumple.
- Se corrigieron los TLV de ejemplo del Constructor (el criptograma declaraba 8 bytes y tenía 7).
- Verificado: las tramas de solicitud del POS (Visa, Mastercard y Amex, chip, contactless y banda) se leen sin desalineaciones en el Parser (antes fallaban 4 de 5).

## 3. Clearing American Express 1240 (Switch adquirente)
Según Network Specifications – Financial/Non-Financial (oct 2023), POS First and Second Presentment (1240), 1400 bytes:
- El detalle 1240 ahora completa **todos los campos obligatorios** (fecha y hora de la transacción, POS Data Code, Function Code 200, longitud y código de aprobación, nombre, dirección, ciudad y país del aceptador, decimalización, importe y moneda de presentación, tasa de conversión 1,0, Format Code, secuencia, pagos extendidos). Los campos numéricos reservados van en ceros y los alfanuméricos en espacios, como exige el manual.
- **File Header (9824) y File Trailer (9825)** de 1400 bytes con posiciones fijas (antes eran líneas de texto con "|"): fecha y hora de transmisión, institución que envía y recibe (90000000002 = Global Network Services), número de secuencia de archivo, y en el trailer cantidad y total de créditos y débitos y hash total.
- Numeración de mensajes: header = 1, detalles desde 2, trailer = total de registros.
- Verificado con un script que valida cada uno de los 135 campos del layout oficial.

## Decisiones a revisar
- Format Code 20 (General Format); no se generan addenda (9240).
- POS Data Code del 1240: se toma de la transacción si existe; si no, se deriva del modo de ingreso.
- Action Code 000 y File Sequence Number 000001 fijos en header y trailer.

## Pendientes conocidos (sin modificar)
- POS: el DE63 de las reversas Visa va como fijo de 4 caracteres y el DE60 del cierre de lote como fijo de 6; Visa los define variables.
- No se probaron de punta a punta las respuestas 0110 del POS ni las tramas completas del ATM (el ambiente de prueba no tiene el Banco Virtual).
- Reconciliación ATM Amex: se verificó el largo de 500 bytes y el header; el detalle no se auditó.
- Los intentos ya guardados del Parser Guiado en tramas de nivel 3 corresponden al DE55 anterior (sin dataset).
