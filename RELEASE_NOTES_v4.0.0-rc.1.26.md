# OSC Payment Academy v4.0.0-rc.1.26 — Ajustes LINK, entrega de billetes, PIN fijo y vista previa de evaluaciones

Acumulativa: incluye rc.1.22, rc.1.23, rc.1.24 y rc.1.25. Sin migración nueva.

## Redes habilitadas por consultora
- Los simuladores (POS, ATM, Wallet, E-Commerce, Constructor, Parser, Parser Guiado, Switch y Switch Emisor) ya no muestran por un instante las redes no habilitadas: las tarjetas quedan ocultas hasta resolver la licencia.

## PIN de prueba fijo: 1234 en todas las redes
- Visa, Mastercard, Amex, Doméstica y LINK validan siempre contra 1234.
- El Cambio de PIN se cursa completo (request / response) pero no modifica el PIN de prueba, para que nadie quede bloqueado.
- LINK: la pantalla acepta exactamente 4 dígitos. El HSM del emisor simulado descifra el campo 52 y lo verifica; Eventos técnicos explica el 55.

## ATM · Red LINK
- **Entrega de billetes** en extracción en pesos, en dólares y adelanto de efectivo, con los mismos botones que Visa / Mastercard:
  - Retirar efectivo → operación finalizada.
  - Dispensación parcial 80% → reversa parcial 0420 / 0430 (32) por el 20%; el campo 95 lleva el monto entregado.
  - No retirar o vencimiento de la cuenta regresiva (9 s) → retracto y reversa total 0420 / 0430 (17; el C-X-8 no tiene un código propio para billetes retractados).
- **Escenario de prueba** en un solo selector: respuestas del host (00, 51, 55, 61, 65, 76, 91) y "Aprobada y luego reversada" (reversa total 17, reversa parcial 32 al 80%, timeout 68). Igual en el POS (17 y 68).
- La tarjeta física del lector muestra LINK (y OSC en Doméstica); antes quedaba la cara VISA.
- **Trama copiada al Parser:** el historial guarda la trama real. Antes, al recargar la página, se copiaban los valores de pantalla (con los "·" que marcan blancos) y el Parser no la reconocía. El Parser además limpia esas marcas si las recibe.
- Nuevo logo de Red LINK.

## Tutor OSC
- Toma la red de la tarjeta seleccionada (antes quedaba fija la primera, por ejemplo VISA en una prueba LINK).
- Con LINK responde con la definición de los manuales LINK (C-X-1-2-3): nombre, atributo y descripción del campo. El enlace al manual LINK solo aparece para la administración OSC (manual confidencial).
- "Cambiar marca" suma la opción LINK.

## Ayudas "PIN Block y HSM" y "ARQC del chip" para LINK
- Con la tarjeta LINK seleccionada, abren su versión según los manuales LINK:
  - **PIN en la Red LINK · campo 52:** campos 52, 63, 54 (cambio de PIN) y 42 (CIT); campo 53 no descripto por LINK; casos Cobro con Transferencias (16 «F») y DEBIN; códigos 55, 38, 75 y 85 (C-X-6); "Tu transacción" con el campo 52 real y la verificación del HSM.
  - **Chip y criptograma en la Red LINK:** en la mensajería Host to Host el campo 55 no lleva datos EMV (lleva transferencias, PAS o cuentas), por eso no hay ARQC / ARPC.

## Evaluaciones
- **Vista previa de preguntas** (administración OSC, en Evaluaciones): elegís etapa y red, y ves un examen de ejemplo con las respuestas correctas y cómo se puntúa. No se guarda ni consume intentos.

## Archivos
- Modificados: atm.html, pos.html, wallet.html, ecommerce.html, constructor.html, parser.html, parser_guiado.html, switch.html, switch_emisor.html, evaluaciones-informe.html, js/link-hth.js, js/network-access.js, js/tutor-osc.js, js/security-edu.js, js/network-profiles.js, assets/brand-link.png, img/link-logo.png, src/index.js (y las páginas que cargan el Tutor, por la versión del script).
