# v4.0.0-rc.1.58 · Versión gratuita (Parser libre + cuenta gratis)

## Resumen
Nueva versión gratuita, **aislada de la plataforma productiva**, bajo `/free/`.

### Nivel 1 · Visitante anónimo — `/free/parser.html`
- Parser ISO 8583 para **Visa, Mastercard y American Express** (sin Red LINK).
- Aviso visible de privacidad arriba de la caja de texto: la trama se decodifica en el navegador, no se envía ni se almacena.
- Combo **Probar trama Visa / Mastercard / American Express** + botón **Cargar trama de ejemplo** (tramas de prueba con PAN enmascarado).
- **3 tramas por día** (las de ejemplo no cuentan). A la 4.ª: invitación a crear la cuenta gratis.
- Fichas de campo (☝) ocultas.
- Landing: botón destacado **🆓 Parser Gratuito** en la barra y **Probá el Parser ISO 8583 gratis** en el hero.

### Nivel 2 · Cuenta gratuita — `/free/registro.html`
- Registro: nombre, email, empresa, rol, país y contraseña. Confirmación por email (ver Instalación).
- Incluye:
  - Parser sin límite.
  - **POS Virtual**: 1 compra de prueba, solo Visa, 1 cuota. Puede ver la trama en el Parser. Sin anulaciones, devoluciones, reversas, consultas ni cierre de lote.
  - **ATM Virtual**: 1 extracción de prueba, solo Visa. Sin consulta, transferencia, cambio de PIN, dispensación parcial ni retracto.
  - **Parser Guiado**: solo la trama más sencilla (L1-01, Nivel 1).
  - **Curso Interactivo**: láminas 2 y 3.
- Resto de los módulos visibles con 🔒 y botón **Solicitar demo** (WhatsApp 54 9 11 3231-8122).
- El cupo de POS/ATM se controla en el servidor (tabla `free_usage`), por usuario.

## Aislamiento de lo productivo
- Las páginas de `/free/` son **copias congeladas**: no se modificó ninguna página, JS ni CSS de la plataforma.
- `src/free.js` (nuevo) atiende solo `/free/*` y `/api/free/*`. En `src/index.js` se agregaron **2 líneas** (import + derivación de esas rutas).
- Usuarios y sesiones propios (`free_users`, `free_sessions`, cookie `osc_free_session`). Un usuario gratis no tiene acceso a ninguna página paga (el login productivo no lo reconoce).
- En las páginas gratuitas: `localStorage`/`sessionStorage` con prefijo `oscFree:` y bloqueo en el navegador de toda llamada a `/api/*` que no sea `/api/free/*`. Si un alumno pago abre la versión gratuita, su workspace no se toca.

## Verificación
- Regresión antes/después (local con wrangler + D1) en Dashboard, POS, ATM, Parser, Constructor, Parser Guiado, Curso, Switch, Wallet, E-Commerce, Login y Landing: mismo resultado (solo cambia el reloj en pantalla). Compra completa en el POS productivo OK.
- Flujos gratuitos probados: Parser anónimo (3 tramas y bloqueo), registro, confirmación por email, login, compra POS + trama en Parser + segunda compra bloqueada, extracción ATM + segunda bloqueada, operaciones bloqueadas, Parser Guiado, Curso, cierre de sesión.

## Observación (preexistente, no cambiada)
- En la plataforma productiva, al llevar el 0110 del POS al Parser aparece "Campo 63: se esperaban 108 caracteres pero la trama se acabó". Ocurre igual en la versión gratuita porque es copia.
