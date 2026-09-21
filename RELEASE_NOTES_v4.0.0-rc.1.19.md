# OSC Payment Academy v4.0.0-rc.1.19 — Tutor OSC anclado y layout de 4 columnas

Se instala sobre la v4.0.0-rc.1.17 (o sobre la rc.1.18). Es acumulativa: incluye todo lo de la rc.1.18 (ver `RELEASE_NOTES_v4.0.0-rc.1.18.md`) más el rediseño del Tutor OSC. No requiere migración D1 ni cambios en `src/index.js`.

## Tutor OSC anclado
- **Layout de 4 columnas** en POS, ATM, Wallet y E-Commerce: dispositivo · flujo · Data Elements · Tutor OSC. El Tutor deja de ser un panel flotante y pasa a ser la cuarta columna, fija a la altura de la pantalla.
- **Formato chat:** línea de "Contexto actual" (marca, canal y campo), línea "Recuerdo tu intento" (marca, operación y resultado en español), historial de conversación que se acumula, sugerencias como chips, campo de pregunta con envío por Enter, botón ↺ para empezar una conversación nueva y botón ✕ para contraer el Tutor a una barra lateral (🎓 lo reabre; se recuerda la preferencia).
- **Citas:** las respuestas del backend muestran "Según: <manual, página — campo>" en un rótulo destacado.
- **Wallet y E-Commerce:** tarjeta de recorrido (token o pago) con el botón "Hacer una prueba" y la nota aclaratoria de que es un recorrido pedagógico.
- **Debajo de 1180 px** de ancho vuelve el Tutor flotante de siempre.

## Data Elements interactivos
- Cada fila tiene un **"?"**; el clic en la fila o en el "?" hace que el Tutor explique ese campo con el valor real del intento (el PAN o token sale enmascarado).
- Botones **"Explícame esta pantalla"** y **"Buscar por nombre"** sobre la tabla.
- En pantallas angostas la tabla muestra Campo · Nombre · Valor y el formato queda bajo el nombre.
- Cada consulta se registra en el modo técnico como `tutor:field_selected · DE n = valor`. Wallet y E-Commerce suman un panel de eventos por etapa del flujo.

## Otros cambios de pantalla
- Selector **POS | ATM** y **Wallet | E-Commerce** en la barra superior.
- En POS y ATM el menú lateral se pliega para dar lugar a las 4 columnas; se abre con "☰ Menú".
- El botón flotante viejo "Explícame esta pantalla" del POS y el ATM se oculta con el Tutor anclado; su recorrido guiado queda como chip "Recorrido guiado de la pantalla" dentro del Tutor.
- Los bitmaps ya no se cortan en la columna de Data Elements.
- Wallet y E-Commerce: el DE22 mostrado y guardado es el de Visa (0710 y 0120) y el DE42 tiene 15 posiciones.

## Decisiones a revisar
- Se mantiene el **tema oscuro** de la plataforma. La paleta clara de la maqueta obliga a rehacer los estilos de todos los componentes y queda como paso aparte.
- **"Explícame esta pantalla"** no cita láminas del Curso interactivo, porque el curso no tiene sección de Data Elements ni numeración de láminas; muestra el rótulo "Pantalla: Mensaje ISO 8583 · Data Elements".
- El chip "Según: …" depende de la referencia que devuelva `/api/tutor/query`.

## Verificado
- Estructura y funcionamiento en los cuatro módulos (jsdom y Chromium): Tutor anclado, selector de módulo, filas interactivas, "?" con respuesta y evento en modo técnico, "Explícame esta pantalla", "Buscar por nombre", contraer y expandir, nueva conversación, envío por Enter.
- Renderizado en Chromium a 1440, 1280 y 1100 px, sin desborde horizontal ni errores de JavaScript.
- Regresión de la rc.1.18: mensajes del POS (Visa, Mastercard y Amex) sin desalineaciones en el Parser, solicitudes y reversas del ATM, Parser Guiado, Constructor, clearing Amex 1240.

## Pendientes conocidos
- El ATM se probó con filas de Data Elements de prueba, no con una operación completa.
- Las respuestas del Tutor se probaron con un backend simulado.
- En POS y ATM las filas de Data Elements con nombres largos quedan altas en la columna angosta.
- Layout claro de la maqueta (paleta beige y teal).
