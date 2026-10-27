# OSC Payment Academy v4.0.0-rc.1.41 — Encabezado del Dashboard con el banner

Sobre rc.1.40. Sin migración nueva. Reemplaza el encabezado de rc.1.40.

## Dashboard (public/index.html)
- El encabezado sigue el banner de OSC Payment Academy:
  - Arriba, "OSC PAYMENT ACADEMY".
  - El título **«Del manual a la práctica.»**, con "a la práctica." en celeste, en Plus Jakarta Sans 800 (la misma letra de la landing).
  - Debajo, "Construye, envía, interpreta y analiza mensajes ISO 8583 mediante laboratorios interactivos de POS, ATM, Wallet y E-commerce."
  - A la derecha, la ilustración del POS con las pantallas POS · ATM · WALLET · E-COMMERCE.
- La ilustración se funde con el fondo azul del encabezado: ya no se ve como una foto de otro color pegada encima.
- Se quita "Hola, <nombre>." (el nombre sigue en la barra superior).
- "Continuar donde quedaste" queda debajo del texto, como botón del banner.
- Pantallas de menos de 1100 px: se oculta la ilustración y queda solo el texto sobre el fondo azul.
- Nuevo recurso: public/assets/dashboard-hero-banner.webp (37 KB), tomado del banner, sin el texto y con el borde izquierdo transparente.

## Archivos
public/index.html, public/assets/dashboard-hero-banner.webp (nuevo). README.md, package.json.
