# OSC Payment Academy v4.0.0-rc.1.43 — Módulos sin demora ni pantalla a medio llenar

Sobre rc.1.42. Sin migración nueva.

## Problema
Al entrar a POS, ATM, Wallet, E-Commerce, Constructor, Parser, Parser Guiado, Switch del Adquirente o Switch Emisor, la página se mostraba enseguida pero sin las tarjetas de prueba. Se completaba recién uno o dos segundos después.

Causa: desde rc.1.26 las tarjetas quedan ocultas hasta que vuelve **/api/auth/me** (redes habilitadas por licencia), y esa consulta se repetía cada vez que se entraba a un módulo.

## Solución
- **Sesión cacheada en la pestaña:** la respuesta de /api/auth/me se guarda en sessionStorage (`oscMeV1`). Al entrar a otro módulo se usa al instante y se confirma con el servidor en segundo plano. Si las redes habilitadas cambiaron, se vuelven a aplicar.
- **Sin pantalla a medio llenar:** mientras las redes no están resueltas, la página entera queda oculta (antes solo las tarjetas) y aparece completa con un fundido corto. El tiempo máximo de espera baja de 6 a 4 segundos.
- **Al iniciar sesión** se borra la caché, así que otro usuario en la misma pestaña no hereda los datos del anterior.
- El servidor sigue controlando el acceso a cada página y API: la caché solo acelera la pantalla.

Medición local con /api/auth/me demorado 1,5 s:

| Caso | Antes | Ahora |
|---|---|---|
| Entrar a un módulo desde el Dashboard | ~1,7 s a medio llenar | ~0,2 s completo |
| Entrar a otro módulo | ~1,6 s a medio llenar | ~0,2 s completo |
| Primera página de la sesión, sin pasar por el Dashboard | ~2,2 s a medio llenar | ~1,8 s oculta y después completa |

## Archivos
public/js/network-access.js, public/js/navigation.js, public/js/field-cards.js, public/login.html y la regla de carga de public/atm.html, public/constructor.html, public/ecommerce.html, public/parser.html, public/parser_guiado.html, public/pos.html, public/switch.html, public/switch_emisor.html, public/wallet.html. README.md, package.json.
