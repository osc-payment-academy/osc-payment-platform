# OSC Payment Academy v4.0.0-rc.1.32 — Simulador Wallet: alta y pago separados, paso a paso, perfil Guayaquil

Sobre rc.1.31. Sin migración nueva. Origen: revisión de la grabación de la demo Wallet (spec `SPEC_WALLET_correcciones_v1`).

## Flujo
- **Alta de la tarjeta (pasos 1-3) separada del pago (pasos 4-8).** Cada tarjeta arranca sin token; el botón **"Agregar a la wallet"** ejecuta Token Requestor → TSP → Emisor. El panel 3 muestra el alta: FPAN → DPAN, TSP de la red (VTS, MDES, Amex Token Service) y aclara que el alta no genera mensaje de compra.
- **Pago** solo corre los pasos 4-8. Los pasos 1-3 quedan atenuados con ✓ ("hecha").
- **Detokenización visible** en el paso 6 (Marca / Red): "token •••• DPAN → tarjeta •••• FPAN".
- **Resultado en el teléfono** (paso 8): aprobado/rechazado, monto, código (DE 39 o Action Code Amex) y autorización. Botón "Nueva compra".

## Modo paso a paso
- Casilla **"Paso a paso"** con botón **Siguiente**. Aplica al alta y al pago.
- Paso 4 → abre la **solicitud** (0100/1100); paso 7 → cambia a la **respuesta** (0110/1110).
- DE resaltados: solicitud 2 (DPAN), 22 y 55; respuesta 38, 39 y 55.

## Datos
- **Monto incremental** (+50 por prueba): ahora se aplica al iniciar la compra siguiente (o con "Nueva compra"), no al terminar la anterior. Antes el teléfono mostraba el monto nuevo mientras el panel tenía la 1100 del monto anterior.
- **Tarjeta y token por red:** la tarjeta muestra el FPAN; el estado del dispositivo muestra tarjeta y token de la red seleccionada (antes decía siempre "Token •••• 7818", el de Visa).
- **Historial:** "token •••• DPAN (tarjeta •••• FPAN)".
- **Escenarios con Amex:** con Amex seleccionado, cada escenario muestra su Action Code (000, 116, 100, 111; mismo mapeo que rc.1.22).
- Nota: el DE 2 ya llevaba el DPAN. Lo que confundía era la tarjeta, que mostraba los últimos 4 del token.

## Perfil de comercio
- Selector **Comercio**: Buenos Aires · ARS (por defecto) o **Guayaquil · USD**.
- Guayaquil: DE 49 = 840, país del adquirente 218 (Visa DE 19, Amex Bit 19, Mastercard DE 61), DE 43 con GUAYAQUIL EC / ECU, tag 9F1A = 0218. Código postal de práctica 090101.
- `js/iso-network-spec.js`: nuevo `withAcquirer(perfil, fn)` y `ACQ_PROFILES`. Sin perfil, POS, ATM, Constructor, Parser y E-Commerce generan lo mismo que antes (verificado: DE 43 Visa/MC y DE 61 sin cambios).

## Pantalla
- Entra en 1920×1080: escenarios arriba del flujo (una fila), pasos más bajos, panel del Tutor ajustado a la altura disponible.
- Historial y "Modo técnico · eventos" plegables, abajo.
- **Reiniciar demo:** quita los tokens, vuelve el monto a 2.500,00, deja el escenario 00 y oculta el historial anterior de esta sesión. No borra datos del Switch.

## Archivos
public/wallet.html, public/js/wallet-lab.js (nuevo), public/js/modern-channel-iso.js, public/js/iso-network-spec.js. README.md, package.json.

## Pendiente
- Validación C08 en la pestaña Validaciones (spec F).
- Escenario de token suspendido o inválido (rechazo del TSP).
