# OSC Payment Academy v4.0.0-rc.1.50 — TestLab: tarjetas en el agente del banco

Sobre rc.1.49. Sin migración nueva. Va junto con el **Agente QA / TestLab qa-v2.0**, que reemplaza a qa-v1.0 y es compatible con él.

## Qué cambia
Cada banco elige dónde se guardan sus tarjetas de prueba (TestLab → Perfil del ambiente → "Tarjetas de prueba"):
- **En la plataforma**, como en la rc.1.49: cifradas en la nube con `TESTLAB_KEY`.
- **En el agente**: el PAN, el vencimiento, el PIN block y las cuentas **no salen de la red del banco**. La plataforma solo ve el alias y el PAN enmascarado.

## Cómo funciona con tarjetas en el agente
1. La plataforma arma la 0200 con el mismo constructor del POS y el ATM, pero con **marcadores** en lugar de los datos de la tarjeta:
   - PAN: `#` × largo
   - vencimiento: `@@@@`
   - service code: `^^^`
   - PIN block: `~` × 16
   - PIN offset: `` ` `` × 16
   - cuentas: `{ANN}`
2. El agente reemplaza los marcadores con la tarjeta del alias, envía la trama al ambiente de desarrollo y devuelve **solicitud y respuesta enmascaradas**.
3. El TestLab valida igual que siempre. La evidencia guardada nunca tiene datos reales.

## Agente qa-v2.0 (`cmd/agentes-qa`, proyecto `agentes-go`)
- **Compatible con qa-v1.0:** puerto 8082, `/api/qa/ping`, `/api/qa/enviar`, framing none / 2bin / 4ascii y `-mock`. La pantalla de QA no cambia.
- **Nuevo:** `GET /api/testlab/tarjetas` (solo alias y datos enmascarados) y `POST /api/testlab/enviar`.
- **Tarjetas por línea de comando:** `tarjeta-agregar`, `tarjeta-listar` y `tarjeta-borrar`.
- **Almacenamiento:** AES-256-GCM, con la clave protegida por **DPAPI de Windows** (usuario actual, o PC con `-tarjetas-maquina`). El archivo copiado a otra PC u otro usuario no se puede abrir.
- **Seguridad:**
  - Solo las páginas autorizadas (`-origenes`, por defecto oscpaymentacademy.com) pueden usar las tarjetas.
  - `-destinos` limita a qué IP:puerto se pueden enviar.
  - Escucha solo en 127.0.0.1.
- **El mock (`-mock`) ahora responde una 0210 completa según C-X-4-03.** Sirve para ver un "Aprobada" sin banco.

## Probado
- Tarjetas en el agente: extracción y consulta ATM y compra POS, contra el mock del agente (Aprobada 100 %) y contra OSC_Host_Sim (llegan PAN, PIN block y cuentas reales; la plataforma solo ve datos enmascarados).
- Tarjetas en la plataforma: sin cambios.
- QA: `/api/qa/enviar` igual que antes.

## Archivos
- Plataforma: `public/js/testlab-core.js`, `public/js/testlab-mode.js`, `public/testlab.html`, `public/atm.html`, `public/pos.html` (versión de caché), `src/index.js` (perfil: `cardsSource`), `README.md`, `package.json`.
- Agente: `agentes-go/cmd/agentes-qa/` (main.go, tcp.go, tarjetas.go, mock.go, dpapi_windows.go, dpapi_other.go), `OSC_QA_Agent.exe` qa-v2.0, `LEEME-QA-TestLab.txt`.
