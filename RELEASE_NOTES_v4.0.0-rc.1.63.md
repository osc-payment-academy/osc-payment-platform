# OSC Payment Academy v4.0.0-rc.1.63 — Fundamentos y Arquitectura (escenas 3D)

Sobre rc.1.62. Sin migración obligatoria (la tabla nueva se crea sola). Spec: `claude/SPEC_MODULO_FUNDAMENTOS_v1.md` · Guion: `claude/GUION_ESCENAS_PILOTO_FUNDAMENTOS_v1.md`.

## Módulo nuevo: «🏙️ Fundamentos y Arquitectura»
- En el menú, grupo **Aprendizaje** (debajo del eBook), y tarjeta en el Dashboard.
- Temario de la capacitación de Banco Bolivariano: 4 bloques, 34 temas.
- **Ciudad de Pagos (índice 3D):** cada edificio es un bloque (Marca / Red = Bloque 1 · Emisor = 2 · Adquirente = 3 · Cámara de compensación = 4). Muestra el avance por bloque. Tocar un edificio filtra sus lecciones.
- **17 lecciones con escena animada:** Bloque 1 completo (1.1 a 1.7) y Bloque 4 completo (4.1 a 4.10). Los Bloques 2 y 3 aparecen como «En preparación».

## Cada lección
- Escena 3D sobre la misma ciudad: los actores se iluminan y un paquete viaja entre ellos (solicitud, aprobada, rechazada, disputa, dinero, archivo, token, llave).
- Controles: Reproducir / Pausa, Siguiente, Repetir, **Paso a paso** y velocidad (lenta, normal, rápida). Se puede saltar a cualquier paso desde la lista.
- Narración en texto sincronizada, etiquetas sobre los actores, reloj de plazos y tablas comparativas en pantalla.
- Tocar un edificio abre su ficha.
- Al terminar: **Decisiones para Tecnología**, **Autoevaluación** de 3 preguntas (una se responde tocando el actor en la escena) y **Velo en la plataforma** (enlaces a los simuladores; solo aparecen los que la licencia incluye).
- Solo la administración OSC ve las notas «verificar antes de publicar» de cada lección.

## 3D y 2D
- 3D con Three.js 0.170 (incluido en `public/js/vendor/`, sin CDN).
- **Modo 2D automático** si el equipo no tiene WebGL o si el 3D va lento; botón «Ver en 2D / Ver en 3D». La secuencia y la narración son las mismas.
- Funciona en celular (la escena arriba, el panel debajo).

## Licencia y progreso
- Módulo habilitable `fundamentos`: casilla nueva en la ficha de consultora (Panel OSC) y en la habilitación por edición de curso.
- **Consultoras y ediciones existentes lo tienen apagado:** hay que habilitarlo (por ejemplo, en la consultora de Banco Bolivariano).
- El servidor bloquea `fundamentos.html` sin el módulo (página «Módulo no disponible»).
- Progreso por alumno en D1 (`user_fundamentos_progress`): lección vista y mejor resultado de la autoevaluación. Contador «x de 34 lecciones evaluadas».

## Archivos
Nuevos: public/fundamentos.html, public/js/fundamentos/engine.js, app.js, lecciones.js, public/js/vendor/three.module.min.js (+ licencia MIT), MIGRATION_v4.0.0-rc.1.63_FUNDAMENTOS.sql.
Modificados: src/index.js, public/js/navigation.js, public/index.html, public/saas-admin.html, public/students.html, README.md, package.json.

## Contenido editable
Textos, pasos, preguntas y enlaces de cada lección están en `public/js/fundamentos/lecciones.js`. Para sumar una lección de los Bloques 2 o 3 alcanza con agregarla ahí: el índice la habilita sola.

## Probado (wrangler dev local, Chrome)
- Ciudad en 3D y 2D, las 17 lecciones paso por paso sin errores, autoevaluación (opciones y toque en la escena), progreso guardado, celular.
- Validación automática del contenido: todos los actores, rutas y respuestas existen y están visibles en su paso.
