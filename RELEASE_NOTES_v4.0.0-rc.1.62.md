# OSC Payment Academy v4.0.0-rc.1.62 — Videos del POS

Sobre rc.1.61 (el paquete incremental es acumulativo: incluye también rc.1.61). Sin migración nueva.

## Botón «🎬 Videos del POS»
- En el encabezado del POS, al lado de «Switch del Adquirente», con el mismo estilo. Muestra la cantidad de videos (4).
- Abre una ventana con el reproductor a la izquierda y la lista a la derecha (en celular, la lista va debajo).
- Orden:
  1. La pantalla del POS (3:27)
  2. Compra de crédito con chip (2:44)
  3. Compra de crédito con chip · rechazada (2:21)
  4. Compra con QR (2:06)
- Cada video de la lista tiene miniatura y duración. Al terminar uno, arranca el siguiente.
- Los videos vistos al 90 % muestran «✓ visto» (se guarda por usuario en D1, en la misma tabla de rc.1.61).
- Sin bienvenida automática: el POS solo se abre con el botón.

## Acceso y uso de licencias
- Mismo esquema de rc.1.61: `/media/videos/*` solo con sesión, con soporte de Range.
- Cada reproducción registra la actividad «Video: POS · …» en Uso de licencias.

## Videos
- 1920×1080, H.264, entre 8,5 y 13 MB cada uno (antes 30 a 51 MB). Revisados: no muestran datos personales (solo tarjetas de prueba y el comercio ficticio).

## Cambios técnicos
- `js/osc-videos.js`: campo `grupo` en cada video ("inicio" = Dashboard; "pos" = lista del POS). Una lista aparece donde haya `<span data-osc-videos="pos"></span>`. Para agregar listas en otras pantallas (ATM, Wallet…) alcanza con sumar videos con otro grupo, el nombre en `OSC_VIDEO_GROUPS` y ese `<span>` en la página.
- `src/index.js`: 4 ids nuevos en `VIDEO_IDS`.

## Archivos
Nuevos: public/media/videos/pos-pantalla.mp4, pos-credito-chip.mp4, pos-credito-chip-rechazada.mp4, pos-qr.mp4 y sus `-poster.jpg`.
Modificados: public/js/osc-videos.js, public/pos.html, public/index.html (versión del script), src/index.js, README.md, package.json.

## Probado (wrangler dev local)
- Botón en el encabezado (escritorio y celular), lista con miniaturas, paso automático al siguiente video, marca «✓ visto».
- `/media/videos/pos-qr.mp4` con sesión → 200; los eventos de los ids nuevos se guardan.
- Dashboard: la bienvenida y el botón de rc.1.61 siguen funcionando.
