# OSC Payment Academy — v4.0.0-rc.1.31

Ficha de campo LINK del campo 126 (cuotas, múltiples cuentas, plazo fijo y área de tokens). Ver RELEASE_NOTES_v4.0.0-rc.1.31.md.

## v4.0.0-rc.1.30

Fichas de campo para Red LINK y campos ampliados de Visa, Mastercard y Amex. Ver RELEASE_NOTES_v4.0.0-rc.1.30.md.

## v4.0.0-rc.1.27

Red LINK completa (pago de servicios, plazo fijo, gestiones, 0220/0230, 0800/0810), pestaña Validaciones del POS por caso de uso, Soporte Online para consultoras con capturas, Tutor LINK con desglose y visor del manual. Ver RELEASE_NOTES_v4.0.0-rc.1.27.md.

## v4.0.0-rc.1.26

Ajustes LINK (entrega de billetes con reversa parcial/total, trama al Parser, logo nuevo), PIN fijo 1234 en todas las redes, Tutor y ayudas de PIN/chip según la red, sin parpadeo de redes y vista previa de evaluaciones. Ver RELEASE_NOTES_v4.0.0-rc.1.26.md.

## v4.0.0-rc.1.25

Red LINK ampliada: operaciones de ATM, compras Maestro en POS y reversas 0420/0430. Ver RELEASE_NOTES_v4.0.0-rc.1.25.md.

## v4.0.0-rc.1.24

Red LINK (Host to Host BASE24) en POS, ATM y Parser · redes habilitadas por consultora · autogestión de licencias · evaluaciones inicial/intermedia/final con informe de evolución. Ver RELEASE_NOTES_v4.0.0-rc.1.24.md.

# OSC Payment Academy — Baseline v3.0 Sprint 1

POS Multi Network, tarjetas de prueba, QR educativo y ticket profesional.

## Baseline v2.8

Ajustes POS, Constructor y Curso Interactivo.

## Baseline v2.6 Consolidada

# OSC Payment Academy — Baseline v2.4

Baseline consolidada a partir de **OSC-ACADEMY Lab v2.3 ATM Transferencia USD**.

## Incluye
- Dashboard “Del manual a la práctica”.
- Curso interactivo con modo instructor.
- Constructor y Parser ISO 8583.
- POS Virtual con compra, reversa, anulación, cierre, ticket y bitmaps.
- ATM Full v2.3 con extracción, consulta, transferencia, USD y reversa técnica.
- Visa BASE II, Mastercard ISO y Mastercard IPM.
- eBook `ISO 8583 Desde Cero` en EPUB.
- Roadmap Próximamente: Tokenización, e-Commerce, Contactless, QR, Wallets, Google Pay, Seguridad e ISO 20022.
- Área privada de Instructor preparada para los manuales técnicos.
- Configuración Cloudflare Workers Static Assets.

## Despliegue
Subir todo el contenido del ZIP a la raíz del repositorio. Cloudflare usará `wrangler.jsonc` y publicará `./public`.


## Baseline v2.5
Se incorpora el modo **Sin plantilla** del Constructor ISO8583 para estudiar Data Elements individualmente desde el bitmap.


## Baseline v2.5.2
Agrega valores posibles expandibles en el Modo Estudio y simplifica la lectura visual.

## Baseline v2.9
Incorpora el **Laboratorio Interactivo ISO 8583 – Construcción de Mensajes**, con construcción libre, aprendizaje por Data Element y validación al finalizar.


## Baseline v3.0 — Multi Network Edition
Perfiles Visa, Mastercard y arquitectura preparada para American Express. Detección automática por PAN compartida por POS, ATM, Parser y Constructor.

## v4.0.0-rc.1.22
Licencias por módulo para consultoras y ediciones, Análisis Diario y Monitoreo en Vivo con licencias separadas, panel **Uso de licencias** (admin OSC y administrador de cada consultora) con recordatorio por correo, cuotas en el POS (Visa 5D, Mastercard ARGCTA + DE 112, Amex DPP), ARQC/ARPC y PIN Block/HSM con algoritmos reales y claves de práctica, Wallet y E-Commerce por red, y manuales Mastercard CIS / M/Chip y Amex Network Specifications con manito. Requiere `MIGRATION_v4.0.0-rc.1.22_LICENCIAS_MODULOS_USO.sql`. Ver `RELEASE_NOTES_v4.0.0-rc.1.22.md`.

## v4.0.0-rc.1.23
Mastercard ISO y Compensación Visa/Mastercard visibles con la casilla Switch del Adquirente. Investigación: Apple/Google Pay cubiertos por Wallet; quedan SoftPOS e ISO 20022.
