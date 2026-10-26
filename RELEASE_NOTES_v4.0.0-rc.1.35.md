# OSC Payment Academy v4.0.0-rc.1.35 — E-Commerce: 3-D Secure al centro

Sobre rc.1.34. Sin migración nueva. Origen: `SPEC_ECOMMERCE_correcciones_v1`.

## Autenticación separada de la autorización (como alta/pago en Wallet)
- **Fase A · Autenticación 3-D Secure (no es ISO 8583):** Checkout → Directory Server (AReq) → ACS del emisor (ARes) → Resultado 3DS.
  - El panel 3 muestra los mensajes EMV 3DS 2.2.0: AReq, ARes, CReq/CRes y RReq. Incluye transStatus, ECI y valor de autenticación.
  - Al final muestra el mapa "resultado 3DS → campos ISO".
- **Challenge real en la laptop:** se abre la ventana del banco sobre el checkout (Visa Secure · Mastercard Identity Check · American Express SafeKey) con el código por SMS. El código de prueba es **123456**; con cualquier otro, la compra se corta (transStatus N) y **no se envía la autorización**.
- **Fase B · Autorización ISO 8583:** Request → Adquirente/Marca → Emisor → Response → Confirmación. El CAVV/AAV/AEVV que devolvió el ACS es el mismo que viaja en el mensaje.

## Escenarios de autenticación (nuevo selector)
| Escenario | Visa | Mastercard | Amex |
|---|---|---|---|
| Challenge / Frictionless | 60.8 = 05 + 126.9 CAVV | DE 48 SE 42 = 212 + SE 43 AAV | Bit 61 ECI 05 + AEVV (1.er dígito 0) |
| Intento · ACS no disponible | 60.8 = 06 + CAVV | SE 42 = 211 + AAV | ECI 06 + AEVV (1.er dígito 8) |
| Sin 3-D Secure | 60.8 = 07, sin CAVV | SE 42 = 210, sin SE 43 | ECI 07, sin AEVV |
| Challenge fallido | no hay autorización | no hay autorización | no hay autorización |

En el mensaje 3DS, Mastercard informa ECI 02 / 01, que en la autorización se traducen a SLI 212 / 211.

## Código de seguridad (A6 · verificado contra manuales)
- **Visa:** Field 126.10 CVV2 = `11 123` (presencia 1, resultado en 44.10, valor justificado a derecha). El 126.0 bitmap se arma según los subcampos presentes.
- **Mastercard:** DE 48 SE 92 CVC 2 (n-3). No se devuelve en la 0110.
- **Amex:** Bit 53 = `04` + CSC de 4 dígitos.
- Fuentes: Visa Full Service POS (Field 60.8 tabla de posiciones 9-10, 126.9, 126.10 Tabla 253, 44.10 Tabla 74) · Mastercard CIS feb 2025 (DE 48 SE 42 Tablas 415-418, SE 92 Tabla 687) · Amex Network Specifications Authorization oct 2023 (Bit 53, Bit 61 Tabla 5-1).

## Popup 🛡️ 3-D Secure
- Botón en la fila del campo de autenticación: Visa 126, Mastercard 48, Amex 61.
- 4 pestañas: Explicación simple · Detalle técnico (mensajes 3DS, tabla por red, código de seguridad) · Flujo · Tu transacción (IDs, transStatus, ECI, valor, campo del CVC).

## Correcciones de la spec
- **A1 · Monto:** se ve antes de pagar y nunca se repite. Arranca en el último importe de E-commerce + 20 y sube al iniciar la compra siguiente.
- **A2 · Precios:** producto, resumen y botón muestran siempre el mismo importe.
- **A3 · Barra de etapas:** Checkout → 3-D Secure → Autorización → Resultado avanza con el flujo. Marca en rojo el fallo de autenticación y tacha lo omitido.
- **A4 · Historial:** red, tarjeta y ECI/SLI de cada compra. Se conserva y muestra hasta 50 operaciones.
- **A5 · Amex:** los escenarios de autorización muestran el Action Code.
- Modo **paso a paso**, DE resaltados por red (Visa 22/25/60/126 · MC 22/48/61 · Amex 22/53/61; respuesta 38/39) y **Reiniciar demo**.
- **Laptop nueva:** navegador con barra y URL segura, tienda, formulario de tarjeta, pantalla del banco y página de resultado.
- Las solicitudes y respuestas se registran en el Switch también en modo paso a paso (`OSCModernMessages.record`).

## Archivos
public/ecommerce.html, public/js/ecommerce-lab.js (nuevo), public/js/modern-channel-iso.js, public/js/iso-network-spec.js, public/js/security-edu.js, public/js/modern-payment-messages.js, public/wallet.html (versiones de scripts). README.md, package.json.

## Pendiente
- El "Mapa conceptual" del Tutor sigue mostrando las 7 etapas anteriores de E-commerce (tutor-osc.js).
- Validaciones C09 y C17–C19.
- Perfil de comercio Guayaquil en E-commerce (hoy país del adquirente 032).
