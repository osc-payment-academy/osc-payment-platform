# OSC Payment Academy v4.0.0-rc.1.23 — Mastercard ISO y Compensación visibles · Investigación actualizada

Se instala sobre la v4.0.0-rc.1.22. Si todavía no instalaste la rc.1.22, el paquete incremental de esta versión ya la incluye (se instala sobre la rc.1.21). La migración D1 es la misma de la rc.1.22 (`MIGRATION_v4.0.0-rc.1.22_LICENCIAS_MODULOS_USO.sql`); no hay migración nueva.

## Cambios
- **Mastercard ISO visible** en el menú y en el Dashboard, junto con **Compensación Visa (BASE II)** y **Compensación Mastercard (IPM)**, que también pasan a verse en el menú.
  - Las tres se habilitan con la casilla **Switch del Adquirente** (consultoras y ediciones). El servidor bloquea `mastercard_iso.html` a quien no la tenga.
- **Investigación:**
  - Apple Pay y Google Pay se dan por cubiertos con el módulo Wallet y salen de la lista.
  - Queda **SoftPOS y Tap to Phone**.
  - Se suma **ISO 20022** (mensajería XML para transferencias y pagos inmediatos; mensajes pain/pacs/camt y convivencia con ISO 8583).

## Verificado
- Alumno con Switch del Adquirente: ve Switch, Compensación Visa, Compensación Mastercard y Mastercard ISO.
- Consultora sin Switch del Adquirente: no las ve.
