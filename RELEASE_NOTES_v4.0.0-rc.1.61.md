# OSC Payment Academy v4.0.0-rc.1.61 — Videos de ayuda en el Dashboard

Sobre rc.1.60. Sin migración obligatoria (la tabla nueva se crea sola). Spec: `claude/SPEC_VIDEOS_AYUDA_v1.md`.

## Bienvenida en el primer ingreso
- El video **"Recorrido de la plataforma" (1:50)** se abre solo en una ventana al entrar al Dashboard.
- Tiene la casilla **"No volver a mostrar"**. Deja de abrirse solo cuando el usuario marca la casilla o mira el video hasta el 90 %. Si lo cierra antes, se vuelve a abrir en el próximo ingreso.
- El estado se guarda **en D1 por usuario** (tabla `user_video_views`), así que vale en cualquier equipo.
- La administración OSC no recibe la bienvenida automática.

## Botón permanente en el banner
- **"▶ Ver recorrido de la plataforma · 1:50"** al lado de "Continuar donde quedaste". En celular va debajo.
- Abre el mismo video, sin la casilla.
- Cerrar: ✕, tecla Esc o clic afuera. Al cerrar, el video se pausa.

## Acceso protegido
- Los archivos están en `public/media/videos/` y el Worker los sirve **solo con sesión iniciada** (sin sesión: 401).
- Cabeceras `Cache-Control: private, no-store` y `X-Robots-Tag: noindex, nofollow`, como los manuales.
- Soporta pedidos parciales (`Range` → 206) para adelantar y retroceder, también en Safari.

## Uso de licencias
- Reproducir el video registra la actividad **"Video: Recorrido de la plataforma"** (`video_plataforma`).

## El video
- 1920×1080, H.264, 6,5 MB (antes 25 MB). Nombre de la alumna, cédula y correo del Banco simulado difuminados.
- Subtítulos: el reproductor ya admite la pista `.vtt`; falta el archivo. Cuando esté, se copia como `public/media/videos/plataforma.es.vtt` y se completa `subtitulos` en `js/osc-videos.js`.

## Sumar otro video
1. Copiar el `.mp4` y la miniatura a `public/media/videos/`.
2. Agregar la entrada en `OSC_VIDEOS` (`public/js/osc-videos.js`).
3. Agregar el id en `VIDEO_IDS` (`src/index.js`).

## Archivos
Nuevos: public/js/osc-videos.js, public/media/videos/plataforma.mp4, public/media/videos/plataforma-poster.jpg, MIGRATION_v4.0.0-rc.1.61_VIDEOS.sql.
Modificados: src/index.js, public/index.html, README.md, package.json.

## Probado (wrangler dev local)
- Sin sesión → 401. Con sesión → 200 video/mp4. `Range: bytes=1000-1999` → 206 con los bytes correctos; sufijo → 206; rango inválido → 416.
- `/api/videos/state` y `/api/videos/event` (play, watched90, dont_show) guardan el estado; id desconocido → 400.
- Se registra `video_plataforma` en `user_activity`.
- Dashboard en escritorio y celular: botón en el banner y ventana de bienvenida.
