# OSC Payment Academy v4.0.0-rc.1.42 — Íconos propios por módulo

Sobre rc.1.41. Sin migración nueva.

## Íconos (opción C · color por módulo)
- Los 4 simuladores y las 3 herramientas de mensajes tienen íconos dibujados para la plataforma. Reemplazan a los emojis; en Windows el del POS se veía como un recuadro blanco.

| Módulo | Dibujo | Color |
|---|---|---|
| POS Virtual | Terminal con pantalla, teclado y tarjeta | Azul #39a9ff |
| ATM Virtual | Cajero con pantalla y ranura de billetes | Turquesa #2fd3c4 |
| E-Commerce / 3DS | Notebook con carrito | Violeta #a78bfa |
| Wallet / Tokenización | Celular con tarjeta y ondas NFC | Rosa #f472b6 |
| Constructor ISO 8583 | Bloques que se arman (+) | Ámbar #fbbf24 |
| Parser ISO 8583 | Lupa sobre líneas de trama | Verde #34d399 |
| Parser Guiado | Lápiz con tilde | Naranja #fb923c |

- **Dashboard:** mosaico de 54 px en cada tarjeta, con fondo suave y borde del color del módulo. El tamaño de las tarjetas no cambia.
- **"Continuar donde quedaste":** muestra el ícono del módulo cuando es uno de estos siete.
- **Menú lateral:** el mismo ícono en chico (16 px) en todas las páginas con menú. Con candado (Día N) se sigue viendo 🔒.
- Back office, Banco simulado y Aprendizaje siguen con sus íconos actuales.
- Nuevo **js/osc-icons.js**: dibujos y colores en un solo archivo. Lo cargan index.html y js/navigation.js (este último lo carga solo si la página no lo tiene).

## Archivos
Nuevo: public/js/osc-icons.js. Modificados: public/index.html, public/js/navigation.js. README.md, package.json.
