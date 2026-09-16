# OSC Payment Academy v4.0.0-rc.1.11

## eBook con licencia

- El eBook “ISO 8583 Desde Cero” puede descargarse desde su pantalla mediante el botón **Descargar eBook**.
- La descarga requiere una sesión autenticada y una licencia vigente de OSC Payment Academy.
- La ruta directa del EPUB también está protegida en el Worker.
- Los usuarios sin licencia son derivados a la pantalla de licencia vencida.

## Wallet y E-commerce

- El historial muestra la fecha y la hora en columnas independientes.
- La fecha se calcula también para los movimientos restaurados desde D1.
- Se agregó un tratamiento seguro para fechas antiguas o inválidas.
- El botón **Flujo** de E-commerce abre correctamente el popup didáctico.
- El flujo de E-commerce conserva las vistas Standard, Intermedio/Frictionless y Completo/Challenge.
- El popup puede cerrarse con el botón, haciendo clic fuera del contenido o presionando Escape.

## Switch Adquiriente

- Se eliminó el aviso visual “Workspace personal persistido en D1 y aislado por usuario y consultora”.
- La persistencia y el aislamiento multi-tenant en D1 no fueron modificados.

## Tutor OSC

- Se mantiene la selección de Visa, Mastercard o AMEX incorporada en RC1.10.
- La plataforma no inventa definiciones específicas de AMEX. Para ampliar la consulta campo por campo deberá integrarse el manual oficial American Express GNS Network Specifications – Authorization.

## Validaciones

- Sintaxis del Worker.
- Inicialización local completa del esquema D1.
- Presencia del EPUB y de todas las imágenes utilizadas por el flujo de E-commerce.
- Integridad de los paquetes ZIP.
