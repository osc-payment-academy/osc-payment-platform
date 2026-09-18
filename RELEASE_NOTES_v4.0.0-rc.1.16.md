# OSC Payment Academy v4.0.0-rc.1.16 — Parser Guiado + definiciones por marca

## 1. Parser Guiado (nuevo módulo, `parser_guiado.html`)
- Decodificación manual de una trama en 6 pasos: trama cruda → aislar bitmap → hex→binario dígito por dígito → campos activos → extracción de valores (fijos, LLVAR, LLLVAR) → autocorrección.
- Ningún paso avanza solo. "Analizar en Parser" se habilita recién al terminar el paso 4 y funciona como corrección.
- Pistas opcionales (−5 c/u); errores y reintentos no restan. Se informa además la precisión al primer intento.
- Banco de 9 tramas de práctica (3 por nivel). N1: bitmap primario / campos fijos. N2: bitmap secundario + LLVAR. N3: incluye LLLVAR (DE54/55/60).
- Persistencia por intento (trama, paso, intentos por dígito, bits, campos, pistas, tiempo por paso, score) en el workspace del alumno (D1), dentro de `constructorPractices` con `mode: "guided-parser"`.
- Acceso: hereda el módulo `parser` (Día 1). Nueva entrada en menú y Dashboard. `?trama=L2-01` fuerza una trama del banco.
- Perfil de campos Visa verificado contra el manual oficial (Full Service POS, 14 abr 2025).

## 2. Constructor ISO8583: definiciones según el manual de cada marca
- El modo constructor y el modo "Sin plantilla" toman nombre, formato y longitud del campo según la marca elegida (o detectada por PAN; sin PAN se usa Visa).
- **Visa** (manual oficial): DE22 = N4 (antes N3), DE25 = N2 (antes N4), DE26 = PIN Capture Code N2 (antes MCC N4), DE32/33 máx. 11 (antes 14), DE56 = Customer Related Data, DE62/63 máx. 255 bytes. Advierte si se usan DE24/30/31, que Visa no define.
- **Mastercard, autorización (MTI 0xxx)**, según la Customer Interface Specification (25 feb 2025): DE26 = PIN Capture Code n-2 (antes MCC N4), DE32/33 máx. 6, DE54 hasta 240, DE56 = Payment Account Data, DE60 = Advice Reason Code, DE62 máx. 100, DE63 máx. 50. DE24, 25, 30 y 31 no los usa Mastercard: se rotulan y el Constructor advierte. El preset Mastercard ya no incluye DE25.
- **Mastercard, clearing IPM (MTI 1xxx)**, según IPM Clearing Formats (7 nov 2023): al escribir un MTI que empieza con 1 los campos cambian a DE12 N12, DE22 AN12 (12 subfields), DE24 N3, DE25 N4, DE26 MCC N4, DE31 N23, DE43 LLVAR, DE63 Transaction Life Cycle ID, etc.
- **American Express** (Network Specifications – Authorization, oct 2023): Bit 22 = AN(12) (no existe variante de 4 dígitos). Bit 2 hasta 21; Bit 24 AN3; Bit 31 numérico hasta 40; Bits 32/33 hasta 13; Bit 43 LLVAR hasta 101; Bit 53 = Security Related Control Information AN(8); Bit 54 hasta 123; Bit 56 ANS hasta 37; Bit 60 = Market Specific Data. Se agregan DE19 (obligatorio en 1100) y DE23. Advierte los Bits 18 (reservado), 70, 90 y 100, que Amex no define en autorización. Los presets usan un Bit 22 válido según la Codes Reference Guide (el anterior, "C10101010110", no lo era).
- **Visa:** se contrastó también la edición del 15 oct 2025 y el Authorization-Only: los atributos son idénticos.
- Presets: DE22 = 0510 con Visa, 051 con Mastercard.
- Efecto verificado: las 9 combinaciones marca × operación (compra, extracción, reversa) generadas por el Constructor se leen campo por campo en el Parser sin desalineaciones. Antes fallaban 5 de las 9 (extracción y reversa en Visa y en Mastercard, y la compra en Amex) y en las demás el DE22 de Mastercard se leía mal.
- Ayuda contextual Visa DE22: N3 → N4.
- Detalle campo por campo: `MANUAL_MAPPING_CONSTRUCTOR_DEFINICIONES_v4.0.0-rc.1.16.txt`.

## 3. Parser ISO8583 (perfiles por marca)
- Perfil **Amex** alineado con el Authorization Spec (Bit 43 LLVAR, Bit 31 numérico, Bit 24 alfanumérico, más los Bits 5, 7, 13, 14, 23, 34, 44, 45, 48, 53, 54, 60, 61, 62, 63).
- Nuevo perfil **Mastercard de autorización** (Customer Interface Specification): DE22 n-3, DE26 n-2, DE32/33, DE54–DE63. Antes usaba el perfil Visa y desalineaba las tramas.
- PIN Data (DE52/Bit 52) en tramas de texto: se prueban 16 caracteres hex primero (8 bytes en las tres marcas) y 32 solo como respaldo.

## Pendientes conocidos (sin modificar)
- POS, ATM, Wallet y E-Commerce generan DE22 de 3 dígitos para Visa; el manual exige 4. Es correcto en Mastercard y en Amex el POS ya usa 12 posiciones.
- Parser, perfil Visa: no interpreta DE55 en tramas de texto con prefijo decimal.
- Los PDFs de /manuals son la edición Visa del 14 abr 2025; los números de página de la ayuda contextual corresponden a esa edición.

Sin cambios en `src/index.js`. No requiere migración D1.
