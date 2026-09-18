# OSC Payment Academy v4.0.0-rc.1.18 — Visa DE22/DE55/DE63, Parser y clearing Amex 1240

Se instala sobre la v4.0.0-rc.1.16. No requiere migración D1 ni cambios en `src/index.js`.
Es acumulativa: incluye todo lo preparado como rc.1.17 (que no llegó a instalarse) más los cambios nuevos de las secciones 4 y 5.

## 1. Parser ISO8583
- **DE55 en el perfil Visa:** ahora se lee en tramas de texto con prefijo decimal (antes desalineaba todo lo que venía después).
- **Desglose TLV del DE55:** bajo el valor se muestra la lista de tags con su nombre (9F26 Application Cryptogram, 9F10, 9F37, etc.). Los tags sensibles (PAN, Track 2 equivalente, nombre, vencimiento, secuencia del PAN) se muestran enmascarados.
- Reconoce el encabezado de dataset de Visa (Dataset ID 01 + longitud) y avisa si la longitud declarada no coincide. Funciona también con TLV plano (Mastercard y Amex).

## 2. Visa Field 22, Field 42 y Field 55
- **Field 22 (Visa) = 4 dígitos** (modo de ingreso 2 + capacidad de PIN 1 + relleno 0): POS 0510 / 0710 / 0210 / 0110 (QR 0100), ATM (con el texto de ayuda según la marca), Wallet 0710 y E-Commerce 0120. En E-Commerce el valor 81 no existe en Visa. Mastercard sigue en 3 dígitos y Amex en 12 posiciones.
- **Field 42 = 15 posiciones** en el POS para Visa y Mastercard (enviaba 10 y desalineaba la trama en el Parser). Wallet y E-Commerce también.
- **Field 55 de Visa (Usage 1)** se arma como Dataset ID 01 + longitud del dataset (2 bytes) + TLV, en POS, ATM, presets del Constructor y banco de tramas del Parser Guiado. El Constructor advierte si el DE55 Visa no lo cumple.
- Se corrigieron los TLV de ejemplo del Constructor (el criptograma declaraba 8 bytes y tenía 7).

## 3. Clearing American Express 1240 (Switch adquirente)
Según Network Specifications – Financial/Non-Financial (oct 2023), POS First and Second Presentment (1240), 1400 bytes:
- El detalle 1240 ahora completa **todos los campos obligatorios** (fecha y hora de la transacción, POS Data Code, Function Code 200, longitud y código de aprobación, nombre, dirección, ciudad y país del aceptador, decimalización, importe y moneda de presentación, tasa de conversión 1,0, Format Code, secuencia, pagos extendidos). Los campos numéricos reservados van en ceros y los alfanuméricos en espacios, como exige el manual.
- **File Header (9824) y File Trailer (9825)** de 1400 bytes con posiciones fijas (antes eran líneas de texto con "|"): fecha y hora de transmisión, institución que envía y recibe (90000000002 = Global Network Services), número de secuencia de archivo, y en el trailer cantidad y total de créditos y débitos y hash total.
- Numeración de mensajes: header = 1, detalles desde 2, trailer = total de registros.
- Verificado con un script que valida cada uno de los 135 campos del layout oficial.

## 4. Visa Field 63 y Field 22 en reversas (POS, ATM y Constructor)
- **Field 63 de Visa** ahora lleva su estructura real: bitmap 63.0 de 3 bytes + 63.1 Network ID (0002) + 63.3 Message Reason Code (2501, 2502, 2503, 2504), con prefijo LLLVAR. Antes se enviaba solo el código (4 caracteres fijos), lo que desalineaba la trama.
- **Field 22** se incluye en las reversas Visa (obligatorio en 0400/0420 según el manual) y no viaja en las respuestas 0410/0430; tampoco el Field 63.
- El **Parser** desglosa el Field 63 (bitmap, Network ID con su nombre y motivo de la reversa).
- El **Constructor** agrega el DE63 al preset de reversa Visa, lo valida y lo explica en el modo estudio.

## 5. POS: cierre de lote y Parser
- **DE48 del cierre de lote (0500/0510)** salía sin prefijo de longitud por un error de código; corregido. El DE60 pasa a longitud variable y se rotula "didáctico: número de lote" (el layout de 0500/0510 no está en los manuales cargados).
- **Amex:** el 0510 usa el Action Code de 3 dígitos.
- **Parser:** una trama solo numérica con 4 o más espacios seguidos (relleno de un campo alfanumérico) ya no se interpreta como HEX BCD. Esto arreglaba la respuesta 1430 de Amex.
- Verificado de punta a punta con el POS real (compra, respuesta, anulación, cierre de lote y respuesta, en Visa, Mastercard y Amex): **18 de 18 mensajes se leen sin desalineaciones en el Parser** (en la rc.1.16 se leían 4 de 18). También las solicitudes 0200 del ATM (Visa y Mastercard, chip, contactless y banda) y sus reversas total y parcial.

## Decisiones a revisar
- E-Commerce: Field 22 = 0120 (01 manual + 2 = terminal que no puede enviar PIN online); el manual de Visa no define un código específico de e-commerce.
- Format Code 20 (General Format); no se generan addenda (9240).
- POS Data Code del 1240: se toma de la transacción si existe; si no, se deriva del modo de ingreso.
- Action Code 000 y File Sequence Number 000001 fijos en header y trailer.

## Pendientes conocidos (sin modificar)
- Layout de los mensajes 0500/0510 (cierre de lote): no está en los manuales cargados; solo se corrigió lo estructural. Amex no define mensajes 05xx.
- ATM: las respuestas 0210 no se probaron con el Parser (sí las solicitudes 0200 y las reversas).
- Reconciliación ATM Amex: se verificó el largo de 500 bytes y el header; el detalle no se auditó.
- Los intentos ya guardados del Parser Guiado en tramas de nivel 3 corresponden al DE55 anterior (sin dataset).
