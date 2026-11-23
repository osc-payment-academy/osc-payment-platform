# v4.0.0-rc.1.60 · Publicación del Parser gratuito en Google (SEO)

## Nueva dirección pública
- https://oscpaymentacademy.com/parser-iso8583 → abre el Parser gratuito (la dirección /free/parser.html sigue funcionando
  y le indica a Google que la principal es /parser-iso8583).
- La landing, el registro y la versión gratuita ahora enlazan a /parser-iso8583.

## Página del Parser gratuito
- Título y descripción para Google: "Parser ISO 8583 online gratis · Visa, Mastercard y Amex".
- Vista previa para LinkedIn / WhatsApp (título, descripción e imagen og-image.png).
- Texto explicativo debajo del Parser: cómo usarlo, qué es ISO 8583, partes de una trama (MTI, bitmap, campos),
  privacidad y preguntas frecuentes (incluye Wallet/Tokenización y E-commerce/3DS en la plataforma completa).
- Datos estructurados (WebApplication + FAQPage). Un solo H1. Se quitó de esta copia el texto oculto "Acceso Restringido".

## robots.txt y sitemap.xml (nuevos, servidos por src/free.js)
- robots.txt: permite el sitio, excluye /api/, /free/ (salvo recursos), /login, /reset, /expired.
- sitemap.xml: la landing (/) y /parser-iso8583.

## Archivos
- src/free.js, src/index.js (se amplió la misma línea de derivación: + /parser-iso8583, /robots.txt, /sitemap.xml)
- public/free/parser.html, public/free/x/free-guard.js, public/free/registro.html, public/landing.html
- Regresión de la plataforma productiva antes/después: sin cambios.
