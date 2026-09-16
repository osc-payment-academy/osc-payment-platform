# OSC Payment Academy v4.0.0-rc.1.13 — Tutor OSC Blueprint v1.0

## Tutor OSC
- Se reemplazó la navegación anterior por los cinco botones principales del Blueprint funcional v1.0.
- Se incorporó contexto real de POS y ATM: marca, canal, operación, Request, Response, MTI, Bitmap, Data Elements, escenario y resultado.
- Se implementaron los modos Orientación, Transacción, Resultado, Estudio de Campo y Pregunta Libre.
- Se separan hechos observados, reglas documentadas e interpretaciones didácticas.
- Se evita inferir obligatoriedad, causalidad, origen de campos o Reject Codes sin respaldo.
- Se agregó estudio de Data Elements, comparación Request/Response, presencia en la transacción y posición en Bitmap.
- Se conserva marca + canal al consultar otro campo.
- Mastercard MDS junio 2003 muestra advertencia de documento antiguo.
- Visa ATM no reutiliza silenciosamente las páginas de Visa POS.

## Ayuda de pantalla
- “Explícame esta pantalla” queda separado de Tutor OSC.
- POS y ATM usan recorrido guiado de 8 pasos según el texto aprobado.

## Validación
- Sintaxis JavaScript validada con node --check.
- Worker validado con node --check.
- Sin cambios de esquema D1.
