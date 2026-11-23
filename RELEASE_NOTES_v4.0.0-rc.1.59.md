# v4.0.0-rc.1.59 · Versión gratuita: ficha del DE 55 bloqueada

- En la versión gratuita (/free/) se ocultó el botón "☝ ARQC/ARPC" del DE 55 en el Parser, y la barra de ayudas
  "ARQC / ARPC · PIN Block y HSM · Cuotas" del POS y del ATM.
- Si una de esas fichas se intenta abrir por otro camino (por ejemplo, clic en la fila del DE 55 o DE 52 en POS/ATM),
  se muestra el candado con "Solicitar demo" en lugar de la ficha.
- Archivos: public/free/x/free-guard.js, public/free/x/free.css. La plataforma productiva no cambia.
