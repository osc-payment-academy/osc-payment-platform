# OSC Payment Academy v4.0.0-rc.1.10

## Tutor OSC en POS

- Se separó la ayuda de uso de pantalla en ocho puntos: las cuatro zonas principales, escenario de respuesta, respuesta automática, Nueva Prueba y Operaciones.
- Se incorporaron recorridos independientes para generar una compra, una anulación, una devolución y un cierre de lote.
- Las devoluciones pueden partir de compras aprobadas del mismo día o de días anteriores y admitir un importe menor al original.
- El cierre de lote muestra los totales y deja las transacciones preparadas para su envío al clearing de Visa, Mastercard o AMEX.
- Las consultas rápidas ya no sugieren que el Tutor está limitado al DE39: permiten ingresar cualquier DE1 a DE128 o cualquier MTI.

## Consulta técnica por marca

- Cuando una consulta de Data Element requiere reglas particulares, el Tutor solicita elegir Visa, Mastercard o AMEX.
- Se añadió información aprobada para DE22 de Visa y Mastercard, con referencia precisa al manual y sección correspondiente.
- Si todavía no existe respaldo documental aprobado para la combinación de marca y campo, la consulta ingresa a la Bandeja de conocimiento pendiente en lugar de inventar una respuesta.

## Curso interactivo

- El Tutor presenta preguntas vinculadas con la lámina que el alumno está visualizando.
- La portada del curso utiliza preguntas generales del recorrido y ya no hereda las preguntas del POS.
- Se reemplazó la vista previa atípica de “Fundamentos técnicos antes de ISO 8583” por una miniatura consistente con el resto de las láminas.

## Validación

- Sintaxis JavaScript del frontend y del Worker.
- Inicialización local completa del esquema D1.
- Integridad de los paquetes ZIP de actualización y respaldo completo.
