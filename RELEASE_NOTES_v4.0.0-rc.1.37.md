# OSC Payment Academy v4.0.0-rc.1.37 — Se retira el Tutor OSC · ficha del campo en cada fila

Sobre rc.1.36. Sin migración nueva.

## ⚠ Corrección del paquete rc.1.36
- La rc.1.36 traía **`package.json` vacío** por un error al generar el paquete. Esta versión lo restaura completo (scripts `dev`/`deploy`/`db:*` y `wrangler` en devDependencies).

## Tutor OSC retirado
- Se quita de **POS, ATM, Wallet, E-Commerce, Constructor y el curso interactivo** (portada y las 23 láminas). Ya no aparece la cuarta columna, el botón "?" de cada fila ni los botones "Buscar por nombre" / "Explícame esta pantalla".
- Los simuladores ganan el ancho de esa columna. POS y ATM conservan el menú ☰ y el selector POS/ATM.
- Se quitan los accesos a "Tutor OSC · Conocimiento" del menú (index.html) y de la Administración SaaS.
- **No se borra nada:** `js/tutor-osc.js`, `tutor-admin.html`, la API `/api/tutor/query` y las tablas del Tutor en D1 (conocimiento y preguntas pendientes) siguen en el repositorio. La administración puede abrir `tutor-admin.html` por URL para revisar las preguntas que ya hicieron los alumnos.

## Ficha del campo (☝) en cada fila
- Hasta ahora, en los simuladores la ficha del campo se abría **solo desde el Tutor**. Ahora cada fila de Data Elements suma la manito **☝**, que abre la ficha (`js/field-cards.js`) de la red de la operación:
  - Wallet / E-Commerce: la red de la última transacción.
  - POS / ATM: la tarjeta seleccionada (incluida LINK).
- Solo aparece en los campos que tienen ficha. El texto debajo de la tabla ahora dice: "Tocá ☝ en un campo para ver su ficha".
- Wallet y E-Commerce cargan `help-catalog.js` y `field-cards.js`.
- Los textos que nombraban al Tutor (guía de pantalla y ayuda del DE 55) ahora remiten a la ficha del campo.

## Archivos
public/pos.html, atm.html, wallet.html, ecommerce.html, constructor.html, curso_interactivo.html, curso/slide-02…23 (incluye 05b), index.html, saas-admin.html, js/osc-learning.js, js/module-guide.js, js/de55-popup.js. README.md, package.json.
