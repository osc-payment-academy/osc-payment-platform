# OSC Payment Academy v4.0.0-rc.1.49 — TestLab (fase 1 · Red LINK)

Sobre rc.1.48. Spec: `claude/SPEC_TESTLAB_v2.md`.

## Qué es
Módulo nuevo **TestLab**, en el menú arriba de "QA / Certificación LINK". La plataforma arma la trama ISO 8583 con las **tarjetas de prueba del banco** y la envía al **ambiente de DESARROLLO** del banco. Ese ambiente es distinto del de QA. La respuesta del banco se interpreta y se valida campo por campo.

## Licencia y aislamiento
- Licencia separada `product_testlab`, que se activa por consultora en Administración ("🔬 TestLab").
- **1 banco = 1 consultora = 1 tenant.** Un tenant no ve nada de otro, aunque usen la misma red.
- Dentro del tenant, **cada usuario ve solo sus pruebas**: resultados, historial, reportes y escenarios. El backend toma el tenant y el usuario de la sesión, nunca del navegador.
- El **perfil del ambiente** (IP, puerto, framing, datos de la institución) y las **tarjetas de prueba** son del banco: los usan todos y los edita solo el TENANT_ADMIN.
- La administración OSC trabaja en su propio espacio y no ve las pruebas de los bancos.
- Sin licencia: el menú no muestra TestLab y `/testlab.html` queda bloqueada.

## Seguridad de los datos
- Las tarjetas (PAN, vencimiento, PIN block, PIN offset) se guardan **cifradas con AES-GCM**, con el secreto del Worker `TESTLAB_KEY`. Sin el secreto no se pueden cargar ni usar tarjetas.
- La evidencia se guarda **enmascarada**: PAN 6+4, y vencimiento, service code y PIN block en asteriscos. El servidor vuelve a enmascarar aunque el navegador no lo haya hecho.
- Los escenarios no aceptan números de tarjeta: la tarjeta se elige por alias.

## Pantalla TestLab (`public/testlab.html`)
- **Ejecutar:** red, canal (ATM/POS), operación, cuenta, importe, tarjeta, **versión del desarrollo (obligatoria)** y código esperado. Permite ejecutar, guardar como escenario o abrir el POS/ATM en Modo Laboratorio.
- **Mis escenarios:** batería propia, con "Correr todos" para la versión indicada.
- **Mis resultados:** KPIs (aprobadas, fallidas, error de comunicación), filtro por versión y detalle.
  - El detalle se agrupa en Comunicación, Estructura, Presencia, Coherencia, Formato y Negocio, con la **ficha del manual** de cada regla.
  - Muestra las tramas enmascaradas y permite descargar el reporte (TXT) o imprimirlo como PDF.
- **Perfil del ambiente** y **Tarjetas de prueba**: los edita el administrador; el resto los ve en solo lectura.
- **Pie fijo en pantalla y reportes:** "No reemplaza ni anticipa la certificación de la red". Cada prueba guarda la versión de reglas (`TL-1.0`) y el manual de referencia.

## Modo Laboratorio en POS y ATM
- Si la empresa tiene TestLab, aparece "🔬 TestLab · Capacitación → pasar a Laboratorio". En Laboratorio se muestra una barra fija abajo con tarjeta, versión, código esperado y estado del agente.
- En Laboratorio, las operaciones con la **tarjeta LINK** del simulador salen al banco. La respuesta que se ve en pantalla, en el visor de tramas y en el ticket es la del banco.
- No se dispensa efectivo, no se generan reversas simuladas y no se tocan los saldos de práctica. Las demás redes siguen simuladas.
- Al terminar aparece el resultado de la validación y el enlace al detalle.
- **Capacitación queda igual que en rc.1.48.**

## Validación LINK (manual C-X-4-03 · Mensaje 0210 Input)
- **Comunicación:** si no hay respuesta, el resultado es "Error de comunicación" y no se evalúan campos.
- **Estructura:** se exige que la trama se lea completa, el header 014000015 (ATM) / 014000055 (POS) y el MTI 0210.
- **Presencia:** se exigen 3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 44, 49, 54, 60, 61, 100, 102, 103, 122, 123, 124, 125 y 127. Si la 0200 llevó el 55, se espera también en la respuesta (advertencia). Un campo no previsto es advertencia.
- **Coherencia con la 0200:** 3, 4, 7, 11, 37 y 41 son bloqueantes; 12, 13, 15, 17, 32, 35, 42, 49, 100, 102 y 103 son advertencias.
- **Formato:** longitudes y valores del manual (32 "11", 35 "37", 44 "25"+"2"+saldos, 49, 60 "012"/"+000", 61 "013"/PRO1/"P", 100, 102/103 "28", 122, 123, 124, 125, 127 "043").
- **Negocio:** DE39 igual al código esperado. Sirve para pruebas positivas y negativas.
- **Resultado:** "Aprobada" solo si no hay errores bloqueantes. Además se informa la conformidad en %.

## Alcance de esta fase (no incluido)
- Visa, Mastercard y Amex: falta el adaptador de formato real (EBCDIC/BCD/bitmap binario). La arquitectura ya lo prevé.
- Transferencias 09/29 y DEBIN (varios mensajes), reversas 0420 y gestión de red 0800.
- Anulaciones y devoluciones desde "Ejecutar ahora": hacerlas desde el POS en Modo Laboratorio, eligiendo la operación original.
- **PIN block:** se envía el que el banco carga en la tarjeta (calculado con su ZPK de desarrollo). El TestLab no lo calcula.

## Agente
Se usa el **agente QA actual** (`POST /api/qa/enviar`), sin cambios: el destino viaja en cada envío. Corre en la PC del usuario, dentro de la red del banco. La URL del agente se configura por usuario en TestLab → "⚙ Agente".

## Archivos
- Nuevos: `public/testlab.html`, `public/js/testlab-core.js`, `public/js/testlab-mode.js`, `MIGRATION_v4.0.0-rc.1.49_TESTLAB.sql`.
- Modificados: `src/index.js`, `public/js/navigation.js` (y `navigation.js` raíz), `public/saas-admin.html`, `public/atm.html`, `public/pos.html`, `public/js/app.js`, `public/js/link-hth.js` (DE43 parametrizable; mismos valores por defecto), `public/parser.html` (versión de caché), `README.md`, `package.json`.
