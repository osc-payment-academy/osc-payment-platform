# OSC Payment Academy v4.0.0-rc.1.20 — Curso interactivo: láminas nuevas y reordenamiento

Se instala sobre la v4.0.0-rc.1.19. Solo cambia el Curso interactivo (`public/curso/` y `public/curso_interactivo.html`). No requiere migración D1 ni cambios en `src/index.js`.

## Cambios en el curso (queda en 23 láminas, antes 21 + 1 sin numerar)
- **Lámina 3 · Circuito de medios de pago:** gráfico nuevo (8 pasos, del POS al emisor y la respuesta) y popup reescrito con los 8 puntos.
- **Lámina 6 · Cuatro capas: de la trama cruda al stored procedure (NUEVA):** gráfico y popup nuevos. En el gráfico, "MTI (4 bytes)" se corrigió a "MTI (4 dígitos)".
- **Lámina 7 · El mismo dato, diferentes representaciones (NUEVA):** reemplaza a la lámina sin numerar "Fundamentos técnicos antes de ISO 8583". Popup nuevo.
- **Lámina 12 · ISO 8583 – Bitmaps:** reemplaza a "Bitmap primario". Gráfico y popup nuevos.
- **Lámina 19:** título cambiado a "Flujo de una autorización" (antes "Respuesta a una autorización (0210)"), en la barra superior de la imagen y en la página.
- **Lámina 20:** título cambiado a "Flujo de una reversa" (antes "Mensaje de Reversa 0400"), en la barra superior de la imagen y en la página.
- **Orden final:** 0800/0810 pasa a la lámina 21 y Manejo de Rejects a la 22; el Cierre queda como lámina 23.
- Las láminas desde "Anatomía de una trama" en adelante se desplazaron dos lugares: numeración, Anterior/Siguiente e índice actualizados.
- Las imágenes llevan `?v=N` para que el navegador no muestre las versiones anteriores.

## Archivos eliminados (a pedido)
- `public/curso/slide-05b.html`
- `public/curso/assets/slide-05b.svg`

## Verificado
- Recorrido completo con "Siguiente" de la lámina 2 a la 23 en Chromium: numeración correcta, todas las imágenes cargan, sin errores de JavaScript ni recursos faltantes.
- Índice del curso: 22 tarjetas con su miniatura.
- Popups de las láminas 3, 6 y 7 revisados en pantalla.

## Pendientes conocidos
- **Lámina 12 (Bitmaps), errores en el gráfico:** el hexadecimal correcto es 62 04 08 00 01 00 00 00 (el gráfico dice 60 10 10 04 00 00 00 00; el popup ya tiene el valor correcto); números de columna repetidos ("3 3", "7 2", "12 12", "14 14"); DE21 no es Card Sequence Number (es DE23) y DE40 no es Additional Response Data (es DE44).
- **Lámina 13 (Bitmap primario y secundario):** se superpone en parte con la nueva lámina 12.
- **Lámina 19:** el título interno del gráfico sigue diciendo "RESPUESTA A UNA AUTORIZACIÓN: 0210".
- **Lámina 20:** el gráfico muestra signos "?" donde iban flechas o viñetas.
- **Lámina 7:** se perdió el ejemplo de binario (01 E2 40) de la lámina eliminada.
- El botón flotante "Tutor OSC" tapa el botón "Siguiente" del curso (ya ocurría antes).
