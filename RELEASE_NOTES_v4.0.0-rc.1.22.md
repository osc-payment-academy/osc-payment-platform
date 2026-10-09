# OSC Payment Academy v4.0.0-rc.1.22 — Licencias por módulo, uso de licencias, cuotas, ARQC/ARPC y PIN Block

Se instala sobre la v4.0.0-rc.1.21. **Requiere ejecutar una migración D1** (`MIGRATION_v4.0.0-rc.1.22_LICENCIAS_MODULOS_USO.sql`).

## 1. Administración y licencias

### Uso de licencias (NUEVO · `uso-licencias.html`)
- Lo ven el **administrador OSC** (todas las empresas y grupos) y el **administrador de cada consultora** (solo su gente).
- Indicadores: licencias asignadas · nunca ingresaron · activos (7 días) · inactivos.
- Tabla por alumno: estado 🟢 hasta 7 días / 🟡 8 a 14 / 🔴 más de 14 o nunca, último uso, días de uso, módulos usados, preguntas al Tutor y mensajes en el foro, días de licencia restantes y último recordatorio.
- **Detalle por alumno:** calendario de 90 días y módulos usados por día.
- **Recordatorio (opción A):** abre el programa de correo con el mensaje armado (distinto si nunca ingresó o si está inactivo). Queda registrado en `audit_log` (`USAGE_REMINDER`). Botón "Recordar a todos los inactivos" (en copia oculta).
- Exportar a CSV (Excel).
- **Registro de actividad:** cada página abierta suma un renglón por usuario, día y módulo (`user_activity`). No registra al administrador OSC. El último ingreso (`users.last_login_at`) existe desde versiones anteriores; el uso por módulo cuenta desde esta versión.

### Consultoras con licencia por módulo (Panel OSC)
- Ficha de consultora con casillas:
  - Curso Interactivo · eBook · **Banco simulado** (Clientes, Pasivas, Solicitudes y Cuenta del Cliente) · Constructor · POS · ATM · Wallet · E-Commerce · **Switch del Adquirente** (incluye Compensación Visa/Mastercard) · Switch Emisor · **Parser** (Parser ISO8583 + Parser Guiado).
  - **Análisis Diario** y **Monitoreo en Vivo** con licencias separadas.
- Los usuarios se cargan por **correo o ID**; si el correo no existe se crea con clave temporal.
- Se puede **editar** después: agregar o quitar módulos y productos, sumar usuarios, cambiar licencias y vencimiento, y designar al administrador de la cuenta.
- Las consultoras creadas antes de esta versión siguen viendo todos los módulos hasta que se editen.

### Ediciones de curso
- La habilitación progresiva (Alumnos) suma eBook, Banco simulado y Switch del Adquirente. En ediciones existentes quedan habilitados (antes estaban siempre visibles).

### Menú y protección del lado servidor
- El menú muestra solo lo habilitado. Edición de curso: lo pendiente aparece con 🔒 y el día. Consultora: lo no incluido no aparece. También se ocultan las tarjetas del Dashboard.
- El servidor bloquea cada página aunque se escriba la URL (página "Módulo no disponible").
- **Monitoreo en Vivo** ahora exige su propia licencia (`product_live_monitoring`). La migración copia la licencia a quien ya tenía Analytics, para no quitarle acceso.
- **Documentación Técnica** e **Investigación**: solo administración OSC. Los alumnos abren los manuales desde la manito ☝ del Parser y del Constructor.
- Manuales PDF: requieren sesión con licencia, `Cache-Control: private, no-store` y `X-Robots-Tag: noindex`.

## 2. Simuladores revisados contra los manuales

| Hallazgo | Corrección |
|---|---|
| POS Visa 0100: faltaban campos obligatorios (Tabla 289) | Se agregan 12, 13, 18, 19, 32, 37, 43 y 63 (63.1 = 0002); 23 en chip. Respuesta 0110 con 19, 25, 32, 37, 42 y 63. |
| POS Mastercard crédito 0100: faltaban DE 18, 32, 48 (TCC) y 61; enviaba DE 25, que Mastercard no usa | Se agregan según CIS Tabla 14 (18, 32, 48 TCC R, 61, y 23/37/43 en lectura de tarjeta) y se quita el DE 25. Respuesta 0110 con 15, 32, 37, 48 y 63, sin DE 42. |
| Banda magnética con DE 22 = 02 (pista no completa) | Ahora 90 (pista completa), según Visa Field 22 y CIS DE 22. |
| DE 53 "2000000000000000" no pasaba las validaciones de Visa | Visa `2001010100000000`. Mastercard CIS `9701100001000000`. Mastercard débito (MDS) y ATM Mastercard ya no envían DE 53 (el MDS no lo usa). |
| TLV del DE 55 con longitud en decimal (9F10 de Mastercard = "17") | Longitud en hexadecimal ("11"). |
| Amex POS ignoraba el escenario elegido (siempre aprobaba) | Ahora respeta 51/54/05/91/TO/57 con los Action Codes de Amex. |
| Wallet y E-Commerce armaban siempre el mismo mensaje Visa con valores fijos | Mensajes por red: Visa, Mastercard y Amex (ver punto 4). |

## 3. POS: compras en cuotas (solo crédito)
- Selector de cuotas (2 a 24) y plan: **sin interés** (financia el comercio) o **con interés** (financia el emisor).
- **Visa:** Field 104 Usage 2, Dataset ID 5D (tags 01, 02, 03, 04, 17, 80) + Field 126.13 = I. El 5D vuelve en la 0110.
- **Mastercard:** DE 48 SE 95 = `ARGCTA` + DE 112 SE 001 (20 = emisor / 21 = comercio + cantidad). Sección "Cuotas: Payment Transactions" (Argentina y Uruguay) del CIS.
- **Amex:** Bit 48 DPP. Plan del comercio (DP03) en una sola 1100. Plan del emisor (DP05) en dos pasos: 1100 con función 108 → 1110 con planes → 1100 con función 100. Bitmaps internos y longitudes del manual.
- Escenario nuevo **57 · Cuotas no permitidas** (Amex: 115).
- El ticket imprime la cantidad de cuotas, el importe de cada una y el total financiado.

## 4. ARQC/ARPC y PIN Block/HSM (algoritmos reales con claves de práctica)
- `js/emv-crypto.js`: DES/3DES, MAC ISO 9797-1 Alg. 3, derivación de clave de tarjeta (EMV Opción A), clave de sesión EMV CSK, ARQC, ARPC Método 1, PIN Block ISO 9564 formato 0 y HSM simulado. Verificado contra una implementación independiente (pycryptodome).
- **POS y ATM:** el ARQC se calcula con los datos reales de la compra (Visa CVN 10; Mastercard M/Chip EMV CSK). El emisor lo recalcula: si coincide y aprueba, responde el **tag 91 (ARPC + ARC)**; si no, rechaza con **Visa 82 / Mastercard 88 / Amex 100**.
- **"Alterar un dato en tránsito":** cambia el importe después de que la tarjeta firmó, para ver el rechazo.
- **PIN:** el DE 52 es el PIN Block real cifrado con 3DES. El HSM del emisor lo descifra y verifica. **PIN de prueba: 1234**; otro PIN → 55 (Visa/Mastercard) o 117 (Amex).
- **Wallet:** ARQC y ARPC reales desde el token.
- **Popups en dos niveles** (explicación simple · detalle técnico · flujo paso a paso · "Tu transacción" con los valores reales): ARQC/ARPC, PIN Block y HSM, Cuotas. En POS, ATM, Wallet y Parser (tags 9F26 y 91).

## 5. Wallet y E-Commerce por red
- **Wallet NFC con token:** Visa 0100 (DE 22 0710, DE 55 Dataset 01), Mastercard 0100 (DE 22 071, DE 61 con capacidad contactless), Amex 1100 (Bit 22 posición 6 = Y, Digital Wallet). Respuesta con ARPC.
- **E-Commerce 3-D Secure:** selector de red. Visa (Field 25 = 59, 60.8 = 05, 126.9 CAVV), Mastercard (DE 22 812, DE 48 TCC T + SE 42 = 212 + SE 43 AAV, DE 61 de comercio electrónico), Amex (Bit 22 posiciones 4 y 5 = S, Bit 61 SafeKey AX/ASK/ECI 05/AEVV).
- Panel ISO con solicitud y respuesta, bitmap calculado y escenarios de prueba que funcionan.

## 6. Manuales nuevos (`public/manuals/`)
- Mastercard: Customer Interface Specification (feb 2025), M/Chip Requirements (abr 2025), Issuer Credit and Debit Test Cases (jun 2025).
- American Express: Network Specifications Authorization y Financial/Non-Financial (oct 2023), Business and Operational Policies, Merchant Regulations, GNS Daily Activity Process, Test Simulator.
- **Manito ☝:** Mastercard crédito abre el Customer Interface Specification (página del DE); débito por MDS sigue en el MDS. **Amex ahora tiene manito** (Network Specifications Authorization, página del Bit).

## 7. Investigación
- Se retiraron los temas ya implementados: QR, Contactless/DE55, Wallets y tokenización, ARQC/ARPC, Seguridad/HSM/PIN Block. Quedan Apple Pay/Google Pay y SoftPOS/Tap to Phone.

## Verificado
- Worker con `wrangler dev` y D1 local: alta de consultora con módulos POS + ATM y Análisis Diario; el usuario ve solo esos módulos; Wallet, Parser, Clientes, Documentación e Investigación devuelven 403; Monitoreo redirige a "licencia vencida" hasta habilitarlo; al editar la ficha se habilitan al instante.
- Alumno de edición: módulos del Día 1 + eBook, Banco y Switch; ATM bloqueado con "Día 2".
- Uso de licencias: el admin OSC ve todo; el administrador de la consultora ve solo su gente (403 al pedir otro grupo); el alumno recibe 403.
- POS: Visa / Mastercard / Amex, chip, contactless y banda, cuotas con y sin interés, PIN correcto e incorrecto, dato alterado. ATM: PIN correcto (00) e incorrecto (55).

## Pendientes conocidos
- El Monitoreo en Vivo se protege por licencia; los datos siguen viniendo del agente local (`agentes-rt.exe`).
- Mastercard débito (POS y ATM) sigue el manual MDS (2003). El CIS cubre crédito.
- Los recordatorios se envían desde el correo de quien los manda (opción A). Para envío automático hace falta un servicio de correo.
- Error previo, no introducido en esta versión: el Dashboard registra en consola "Cannot set properties of null (setting 'onclick')".
- Quedan ocultos y sin casilla: Mastercard ISO, Laboratorio de Nuevas Funcionalidades y Diagnóstico de Procesos Productivos.
