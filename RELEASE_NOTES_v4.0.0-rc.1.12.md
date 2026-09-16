# OSC Payment Academy v4.0.0-rc.1.12

## Tutor OSC · POS

- Las consultas de DE1 a DE128 solicitan primero la marca: Visa, Mastercard o AMEX.
- Las consultas Visa y Mastercard dejan de enviarse automáticamente a la Bandeja de conocimiento pendiente.
- Para los campos documentados, el Tutor presenta un botón que abre el manual oficial en inglés y se posiciona en la página correspondiente.
- Si la interfaz de la marca no define individualmente el campo consultado, el Tutor abre el índice oficial y lo informa sin inventar contenido.
- Se mantienen disponibles las consultas de cualquier MTI.

## Tutor OSC · ATM

- Se creó una configuración independiente del Tutor para el ATM.
- Se eliminaron del ATM las guías propias del POS: compra, devolución, anulación y cierre de lote.
- Se agregó la guía inicial **Cómo hago una extracción**.
- Se agregó la guía **Cómo hago una conciliación**.
- Se mantienen las consultas de cualquier MTI y cualquier DE1 a DE128.

## POS · Herramientas técnicas

- Se agregaron los botones **Copiar trama** y **Analizar en Parser** debajo del detalle ISO 8583.
- Copiar trama incluye la representación didáctica y la trama continua.
- Analizar en Parser transfiere el mensaje seleccionado, su MTI, marca y campos al Parser.

## eBook

- El acceso desde el menú utiliza una URL versionada para evitar reutilizar la pantalla anterior.
- Se reforzaron las cabeceras de no-cache para `ebook.html`.
- Los administradores y usuarios con licencia vigente acceden al botón **Descargar eBook**.
- La ruta del EPUB permanece protegida por sesión y licencia de OSC Payment Academy.

## Documentación AMEX

- La autorización de OSC para consultar los manuales está registrada.
- El Tutor no inventa definiciones de marca.
- Para abrir cada Bit de AMEX en su página exacta aún debe incorporarse el PDF técnico **American Express GNS Network Specifications – Authorization**. Las guías de códigos y operación comercial no sustituyen ese documento.

## Validaciones

- Sintaxis del Worker y scripts JavaScript modificados.
- Inicialización local completa del esquema D1.
- Presencia de manuales Visa/Mastercard y del EPUB.
- Integridad de los paquetes ZIP.
