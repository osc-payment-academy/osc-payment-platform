# OSC Payment Academy v4.0.0-rc.1.28 — ATM LINK: primero la operación

Acumulativa: incluye rc.1.22 a rc.1.27. Sin migración nueva.

## ATM · Red LINK
- Nuevo selector **"Operación LINK"** arriba del panel, igual que en el POS, con las operaciones agrupadas: Cuenta, Transferencias, Pago de servicios, Plazo fijo, Gestiones y Solicitudes a la institución.
- El panel muestra **solo los datos de la operación elegida** (por ejemplo, plazo fijo: plazo, tipo y renovación; transferencia: CBU y titular). Sin operación elegida no se muestra ninguno.
- Si la operación se elige en el panel, después del PIN el cajero va directo a esa operación. Si no, muestra el menú como antes, y lo que se elija en pantalla se refleja en el panel.
- Nota con el orden sugerido al pie del panel: operación → escenario de prueba → datos → tarjeta y PIN 1234.
- "Gestión de red · 0800 / 0810" con el título en tamaño normal.

## Archivos
atm.html, js/link-hth.js (y las páginas que lo cargan, por la versión del script).
