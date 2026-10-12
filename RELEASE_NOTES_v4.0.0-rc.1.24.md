# OSC Payment Academy v4.0.0-rc.1.24 — Red LINK, redes por consultora, autogestión de licencias y evaluaciones

Acumulativa: incluye rc.1.22 y rc.1.23. No requiere migración nueva (las tablas nuevas se crean solas la primera vez que se usan). La migración de la rc.1.22 debe estar ejecutada.

## 1. Autogestión de licencias (consultoras)
- **Uso de licencias** muestra el cupo: "1 de 5 en uso · 4 disponibles", con barra y vencimiento.
- El administrador de la consultora puede **dar de alta** usuarios hasta completar el cupo (nombre + correo; la plataforma genera la clave inicial y ofrece el correo de bienvenida) y **dar de baja** (libera la licencia y cierra la sesión).
- Los usuarios nuevos heredan módulos, redes y vencimiento de la consultora. El administrador no puede darse de baja a sí mismo.
- El historial de prácticas queda guardado por persona: si se vuelve a dar de alta el mismo correo, lo recupera.
- El encabezado del Dashboard muestra "Administrador de la cuenta" y el correo al pasar el mouse.

## 2. POS y ATM: tarjetas Doméstica y LINK
- Después de las dos tarjetas Amex quedan fijas **Doméstica** (una sola, con la tarjeta más reciente del Banco simulado; si no hay, indica emitirla en Solicitudes) y **LINK** (con logo).
- **Red LINK · Host to Host BASE24** (manuales C-X-1 a C-X-8, Anexo Nuevo Esquema de Transferencias 22/06/2026 y Anexo Técnico II DEBIN 29/06/2026):
  - Extracción 01XX00 · Consulta de saldo 31XX00 (saldos en campo 44) · Transferencia 09XX00 (débito) + 2900YY (orden de acreditación) con campo 55 y tokens PE/Q7 en el 126 · DEBIN F3XX00 (débito) + F400XX (crédito) con campo 55 (247) y token QS.
  - Trama "ISO" + header + MTI + bitmaps; respuesta del host según códigos C-X-6 (00, 51, 55, 61, 65, 76, 91).
  - ATM: operación y tipo de cuenta en la pantalla del cajero. POS: operación en el panel LINK.
  - Destino Banelco (FIID 5892) para transferencias.

## 3. Redes habilitadas por consultora
- Panel OSC → consultora → **Redes habilitadas**: Visa, Mastercard, American Express, Red LINK y Doméstica.
- POS y ATM muestran solo esas tarjetas; QR se oculta si no hay Visa/Mastercard.
- Wallet y E-commerce requieren Visa, Mastercard o Amex; Compensación Visa requiere Visa; Compensación Mastercard y Mastercard ISO requieren Mastercard (menú y servidor).
- Parser, E-commerce, Constructor y Switch filtran sus selectores/tarjetas.
- Administración OSC y ediciones del curso ven todas las redes. Consultoras anteriores: todas hasta que se editen.

## 4. Parser con Red LINK
- Opción "Red LINK" y detección automática de tramas que empiezan con "ISO".
- Muestra header BASE24 y origen; desglosa campos 3, 39, 43, 44, 49, 55 (transferencia/DEBIN), 60, 61, 126 (tokens) y 127.
- "Analizar en Parser" desde POS y ATM abre la trama LINK reconocida.

## 5. Evaluaciones (grupo técnico): inicial, intermedia y final
- Página del alumno **Evaluaciones**. Tramas generadas en el servidor, distintas para cada alumno y cada intento, con las redes de su grupo (Visa/Mastercard en formato texto ISO 8583, American Express 1100/1110, Red LINK BASE24).
- Ejercicios de **Decodificar** (fin del MTI con clic sobre la trama, 2 nibbles → 8 bits y campos activos, extracción de campos fijos/LLVAR/LLLVAR) e **Interpretar** (DE 3 / Bit 3 en Amex).
- Cada respuesta tiene botón **Guardar** (queda en firme). Al guardar la última se habilita **Validar respuestas**: puntaje 0 a 100 + Decodificar/Interpretar.
- Inicial e intermedia: un solo intento, sin posibilidad de repetir.
- Final: 30 minutos controlados por el servidor, aprueba con 70/100, hasta 5 intentos guardados; se informa en qué intento aprobó.
- **Informe de evaluaciones** (Administración OSC y administrador de la consultora): habilitación de etapas por grupo (solo OSC), promedios, detalle por alumno, intentos del final, evolución, CSV e Imprimir/PDF.

## Verificado (entorno local)
- Alta/baja por el administrador, cupo completo, duplicados, permisos entre empresas.
- LINK en POS y ATM (4 transacciones), bitmap de la extracción igual al ejemplo del manual C-X-4-01; Parser LINK sin desalineaciones.
- Consultora solo LINK vs. consultora Visa/Mastercard/Amex: tarjetas, menú, bloqueo de páginas y Parser.
- Evaluaciones: inicial perfecta (100), intermedia con errores, final aprobada en el intento 3, cierre por tiempo, Amex 1100/1110, informe para OSC y para el dueño.
