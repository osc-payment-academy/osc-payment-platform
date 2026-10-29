# OSC Payment Academy v4.0.0-rc.1.52 — E-Commerce: botón «⇄ Flujo»

Sobre rc.1.51. Sin migración.

## Corrección
- **E-Commerce / 3DS → «⇄ Flujo»:** el botón no hacía nada. La ventana con las infografías (Standard, Intermedio, Completo / Seguridad) estaba en la página, pero le faltaba el código que la abre; en Wallet sí estaba.
- Ahora abre la ventana igual que en Wallet. Se cierra con «✕ Cerrar», con la tecla Esc o tocando fuera de la imagen.

## Archivos
`public/ecommerce.html`, `README.md`, `package.json`.
