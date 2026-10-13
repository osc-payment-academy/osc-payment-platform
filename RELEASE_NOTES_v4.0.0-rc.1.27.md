# OSC Payment Academy v4.0.0-rc.1.27 — Red LINK completa, pestaña Validaciones, Soporte para consultoras

Acumulativa: incluye rc.1.22 a rc.1.26. Sin migración nueva (las tablas nuevas se crean solas).

## Red LINK · transacciones que faltaban (C-X-5, registros C-X-4)
En el ATM, nuevos menús **🧾 Pago de servicios**, **📈 Plazo fijo**, y dentro de Más operaciones **🗂 Gestiones** y **✉ Solicitudes**.

| Grupo | Códigos | Campos según manual |
|---|---|---|
| Pago de servicios (PAS) | 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 8K, 8L, 8M, 8P, 90 (900000 / 90XX20 / 90XX00) | 0200: campo 54 = ente 3 + cliente 19 + opción 1 (orden de débito 90XX00: cantidad de comprobantes). 0210: campo 54 (100) = ente + cliente + cuota/año; ticket en el campo 125 |
| Plazo fijo | 37, 18, 38, 63, 68 | 0200: campo 55 (120) = plazo + importe + renovación N/T/P + auto-renovación S/A + tipo T/P/V/B/C + opción. 0210: campo 54 (120) y comprobante en el 125 |
| Gestiones | 11 COVISUR, 17 compra en ATM (Pay Key, campo 55 de 38), 1C carga, 33 cambio de CIT, 34 Home Banking (respuesta en el campo 127: usuario 28 + clave 8 + PIN 6), 39 verificación de cuenta (campo 55 interbancario), 3A–3D | |
| Mensajes a la institución | 610207, 610210, 610310, 62, 64, 66, 69 (consulta de pago on line, campo 55 de 199), 91, 912000, 93 | |
| Store-and-forward | 0220 / 0230 | Escenario "Host no disponible · STAND-IN + forzada 0220 / 0230": BASE24 autoriza en stand-in, envía la 0220 con el campo 90 y el host contesta 0230 (header 014000005) |
| Mensajes de control | 0800 / 0810 | Panel LINK → "Gestión de red": LOGON 001, LOGOFF 002, ECHO-TEST 301 (header 004000040, campo 70; 0810 con 00 / 01 / 91) |

- Panel LINK: datos de PAS (ente y código de cliente) y de plazo fijo (plazo, tipo, renovación, auto-renovación).
- Escenarios nuevos: 80, 81, 82, 86 (servicios) y 68 (plazo fijo).
- Parser LINK: desglosa los campos 54 y 55 de PAS, plazo fijo, Pay Key y consulta on line, el 127 de Home Banking, el 70 y reconoce los headers 004000040 y 014000005 de la 0230.
- **FCI no se incluyó:** el manual define la estructura del campo 55 para FCI (códigos 08, 28, 36, 37, 38, 48, 63, 68, A8, B8, C8) pero el C-X-5 no dice qué operación es cada código. Falta el anexo de FCI.

## ATM · Red LINK
- Con el escenario "Reversa parcial 32" elegido en el selector se ve la animación de entrega de billetes. La ranura dice "RETIRE SU DINERO".
- Billetes no retirados: reversa con código 17. Cuenta regresiva: 9 segundos (confirmado).

## Tutor OSC con LINK
- El valor del campo se muestra limpio y desglosado según el manual (por ejemplo, campo 90: tipo de mensaje original, secuencia, fecha, hora, fecha de negocios, ceros).
- "Abrir manual LINK" abre un visor con formato y el campo resaltado (campos 90 y 95 → registro 0420). Solo administración OSC.

## POS · pestañas del panel Data Elements
- **Vista TLV:** decodifica el DE 55 (tags EMV, longitudes en hexadecimal; reconoce el Dataset 01 de Visa).
- **Explicación:** lectura del mensaje (MTI, DE 3, DE 4, DE 22, DE 52, DE 55, DE 39) y tabla de campos.
- **Validaciones:** detecta el caso de uso (C01 a C20 de la batería de escenarios) y muestra el checklist: ✅ obligatorio presente, ❌ faltante o no corresponde, ⚠️ condicional con su regla, ❔ a validar. Colorea el bitmap (rojo faltante, amarillo condicional). Se puede elegir otro caso a mano. Cada caso indica si está verificado contra el manual o es borrador.
- El paso 4 del flujo muestra el MTI real (0100, 0200 o 1100).

## Soporte Online
- Ahora también para **consultoras** (responde OSC). Antes era solo para ediciones del curso y el menú no lo mostraba a los alumnos.
- Administración OSC: todos los grupos con la cantidad de consultas pendientes y el total en el menú, "Soporte Online (N)".
- La consulta muestra la pregunta original. Si el usuario repregunta, vuelve a quedar pendiente.
- **Capturas de pantalla:** pegar con Ctrl+V o "📎 Adjuntar captura", hasta 3 por mensaje. Se achican en el navegador y solo las ve el grupo y OSC.
- Tablas nuevas (se crean solas): support_topics, support_replies, support_images.

## Archivos
Nuevos: js/pos-validations.js, js/support-images.js, manual-link.html. Modificados: atm.html, pos.html, support.html, topic.html, js/link-hth.js, js/app.js, js/tutor-osc.js, js/navigation.js, src/index.js y las páginas que cargan esos scripts (versión).
