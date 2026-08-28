# OSC Payment Academy v4.0.0-rc.1.7

## Cambios incluidos

- ATM Virtual: el botón y los textos principales pasan de **Reconciliación** a **Conciliación**.
- ATM/Switch: toda operación se registra como `ROUTED` inmediatamente al ejecutarse. La Conciliación 0520/0530 queda documentada como un control posterior de totales y no como condición para el envío online.
- Ayuda en POS, ATM, Parser, Constructor y Switch: botones **Conocer la pantalla** y **Practicar paso a paso**, con foco amarillo, pasos Anterior/Siguiente y salida libre.
- POS Virtual: se retiran **Sonidos** y **Pantalla Completa**. **Reimprimir ticket** informa al alumno cuando todavía no existe un comprobante.
- Authorization Analytics: se oculta temporalmente la sección completa **Profundización DE39**. El código queda preservado y marcado con `data-temporarily-disabled="json-1.1"` para reactivarlo después del curso.
- Panel de alumnos: nueva función administrativa para reinicializar la clave de un alumno, invalidar sus sesiones y generar una clave temporal copiable.

## Instalación

1. Hacer una copia del despliegue y de la base D1 actuales.
2. Reemplazar los archivos por esta versión.
3. Ejecutar `npm install`.
4. Aplicar las migraciones pendientes con `npm run db:migrate:remote` si corresponde.
5. Desplegar con `npm run deploy`.
6. Validar login, POS, ATM, Switch, Parser, Constructor y Panel OSC.

## Reactivar Profundización DE39

Cuando el agente produzca JSON 1.1, retirar de la sección `.de39-deep` los atributos `hidden`, `aria-hidden="true"` y `data-temporarily-disabled="json-1.1"`.
