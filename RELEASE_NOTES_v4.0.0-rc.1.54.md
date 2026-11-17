# OSC Payment Academy v4.0.0-rc.1.54 — TestLab: tarjetas solo en el agente

Sobre rc.1.53. Sin migración obligatoria. Requiere el Agente QA / TestLab **qa-v2.0** o superior.

## Qué cambia
- Se quitó la opción **«En la plataforma (cifradas en la nube)»**. Las tarjetas de prueba se cargan **solo en el agente del banco**: PAN, vencimiento, PIN block y cuentas no pasan por la plataforma ni por el navegador.
- **Perfil del ambiente:** el campo «Tarjetas de prueba» queda fijo en «En el agente (no salen del banco)». Los perfiles guardados con «En la plataforma» pasan solos a «En el agente».
- **Pestaña Tarjetas de prueba:** ya no tiene el formulario «Agregar tarjeta». Muestra las tarjetas del agente, los comandos para cargarlas y el botón «Leer tarjetas del agente».
- **POS y ATM en Modo Laboratorio:** usan solo tarjetas del agente.

## Backend
- `POST /api/testlab/cards` y `GET /api/testlab/cards/<id>/secret` responden **410 `CARDS_ONLY_IN_AGENT`**. Se cierra así que cualquier usuario del tenant pudiera leer el PAN y el PIN block completos.
- `/api/testlab/context` devuelve `cards: []` y ya no informa `keyConfigured`.
- `DELETE /api/testlab/cards/<id>` se mantiene para dar de baja tarjetas viejas.

## Tarjetas ya cargadas en la plataforma
Quedan en la tabla `testlab_cards` sin uso. Se recomienda borrarlas (opcional):
```sql
DELETE FROM testlab_cards;
```
Después de borrarlas se puede quitar el secreto `TESTLAB_KEY` del Worker.

## Pendiente
- Carga masiva de tarjetas en el agente (por ejemplo, desde Excel o CSV): a definir.

## Archivos
`src/index.js`, `public/testlab.html`, `public/js/testlab-core.js`, `public/js/testlab-mode.js`, `public/pos.html` y `public/atm.html` (versión de caché), `README.md`, `package.json`.
