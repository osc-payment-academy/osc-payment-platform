# v4.0.0-rc.1.57 · Parser: validación de MTI + retiro del badge de versión

## Parser ISO 8583 (public/parser.html)
- Nueva validación de MTI: la trama debe iniciar con un MTI válido (versión 0-2, clase 1-8, función 0-5, origen 0-5).
  Si no, se muestra "Trama no reconocida" y no se parsea.
- En Visa / Mastercard / Amex, una trama que empieza con letras (ej. "ISO...") se rechaza.
  Si el prefijo es "ISO" + 9 dígitos, se sugiere seleccionar "Red LINK".
- Se quitó la auto-detección que cambiaba la red a LINK de forma silenciosa.
  El formato BASE24 ("ISO" + header + MTI) solo se interpreta con "Red LINK" seleccionada, y también valida el MTI.

## UI
- Se eliminó el badge fijo `#osc-version-badge` ("Baseline v3.5.4.23 · REJECT seleccionable en Parser" / "Entregable v3.5.4.50 · ATM DOMÉSTICO")
  de parser, constructor, atm, compensacion, compensacion_mastercard, mastercard_iso (public/ y copias raíz) e index.html raíz.

## Archivos
- public/parser.html (validación MTI + badge)
- public/{constructor,atm,compensacion,compensacion_mastercard,mastercard_iso}.html y sus copias en raíz, index.html
