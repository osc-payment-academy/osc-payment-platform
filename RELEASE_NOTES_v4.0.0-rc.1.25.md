# OSC Payment Academy v4.0.0-rc.1.25 — Red LINK: operaciones de ATM, compras Maestro y reversas

Acumulativa: incluye rc.1.22, rc.1.23 y rc.1.24. Sin migración nueva.

## ATM · Red LINK (menú del cajero con páginas)
| Operación | Código C-X-5 | Detalle según manual |
|---|---|---|
| Extracción en pesos | 01XX00 | Saldos en 44, disponibles en 54 |
| Extracción en dólares | 01XX02 | Cuenta 15 / 07, moneda 840; el 127 lleva el tipo de cambio si se consultó en el último minuto |
| Adelanto de efectivo | 013000 | Desde la cuenta tarjeta de crédito (30) |
| Consulta de saldo | 31XX00 | Cuentas en pesos y en dólares |
| Últimos movimientos | 94XX00 | Campo 125 · statement print data (372: página, fecha, cabecera, 40 caracteres por línea) |
| Transferencia entre cuentas propias | 40XXYY | 102 cuenta desde / 103 cuenta hacia, misma moneda |
| Transferencia a terceros | 09XX00 + 2900YY | (rc.1.24) |
| DEBIN pendiente | F3XX00 + F400XX | (rc.1.24) |
| Depósito en cuenta propia | 2100YY | Campo 54 TIPO-DEP: E/U efectivo, C/W cheque; campo 123 = monto que suma al disponible (cheque en ceros) |
| Depósito a terceros | 2200YY | CBU destino del panel LINK |
| Pago de resumen de tarjeta | 50XX30 / 500030 | Con débito en cuenta o en efectivo |
| Consulta de tipo de cambio | 350000 | Respuesta en el campo 127 (comprador / vendedor) |
| Cambio de PIN | 320000 | Campo 54 "cambio de PIN encriptado": nuevo PIN offset (el PIN nunca viaja en claro) |

## POS · Compras con débito Maestro (panel LINK)
Compra 71 (con cuotas en el campo 48) · Compra con cash-back 76 (efectivo en el campo 54) · Consulta 73 · Preautorización 78 · Preautorización finalizada 79 · Anulación 72 · Devolución 74 (ORIG-NUM / ORIG-DATE en el campo 48) · Anulación de devolución 75 · Anulación de cash-back 77.
Las operaciones que referencian otra eligen la operación original aprobada; al aprobarse, la original queda ANULADA / DEVUELTA / FINALIZADA.

## Reversas 0420 / 0430 (C-X-4-11, C-X-4-12, C-X-8)
Selector "Evento después de la respuesta" en POS y ATM:
- **17** El cliente cancela después de aprobada → 0420 + 0430.
- **32** Entrega parcial de dinero (ATM, extracciones) → 0420 con el monto realmente dispensado en el campo 95.
- **68** Sin respuesta del host → no hay 0210; 0420 con la leyenda "** REVERSAL FOR LATE/UNSOL RESPONSE **" en el campo 43 y 0430.
El campo 90 lleva la clave de la original (0200 + secuencia + fecha + hora + fecha de negocio). Los saldos vuelven a su lugar.

## Parser
Reconoce 0420/0430 (header 014000005) y desglosa los campos 90, 95, 125 (movimientos), 54 (depósito, cash-back, cambio de PIN y respuesta) y el código de reverso del campo 39.

## Limpieza
Se elimina `03-Analisis-Horario-TCPHandler.ps1` (absorbido por el agente Go de Monitoreo en Vivo).
