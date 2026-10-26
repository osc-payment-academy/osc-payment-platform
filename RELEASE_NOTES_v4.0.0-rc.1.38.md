# OSC Payment Academy v4.0.0-rc.1.38 — Dashboard, menú y ayudas de Fraude

Sobre rc.1.37. Sin migración nueva.

## Dashboard (index.html)
- **Encabezado más chico** con saludo por nombre y tarjeta **"Continuar donde quedaste"** (último módulo visitado).
- **Contadores reales** del workspace del alumno:
  - Operaciones realizadas.
  - Simuladores usados (x de 4, con los que faltan).
  - Prácticas de mensajes (Constructor y Parser Guiado).
  - Aprobadas / rechazadas.
  - Reemplazan los números fijos "5 · 5 · 1 · 1".
- **Tarjetas agrupadas como el menú:** Operar transacciones (POS, ATM, E-Commerce, Wallet) · Mensajes ISO 8583 · Back office · Banco simulado · Aprendizaje. Lo que la licencia no incluye se oculta, y si un grupo queda vacío se oculta el grupo entero.
- Se quitan el cartel "Entregable v3.5.4.45 · CLIENTES" y el texto "Baseline funcional consolidada".
- Se corrige el error de consola "Cannot set properties of null (setting 'onclick')" (pendiente desde rc.1.22).

## Menú lateral (js/navigation.js)
- Grupos por recorrido: Aprendizaje · Operar transacciones · Mensajes ISO 8583 · Back office · Banco simulado. Siguen Soluciones profesionales, Administración y Cuenta.
- "Clientes / Pasivas / Solicitudes" dejan de estar en mayúsculas.
- Se guarda el último módulo visitado (localStorage `oscLastModule`) para el Dashboard.

## Navegación unificada
- «← Plataforma» arriba a la izquierda en Curso Interactivo, eBook, Soporte Online y Mi cuenta. En Soporte se quita el botón "Dashboard".

## Soporte Online
- El selector y las etiquetas de cada consulta muestran nombres legibles: "Switch Emisor", "Red LINK", "Wallet / Tokenización", etc. Los códigos internos no cambian, así que las consultas existentes siguen funcionando. También cambia en topic.html.

## Fraude · ayudas (js/fraud-help.js, nuevo)
- **Monitoreo en Vivo de Fraude** y **Análisis Diario de Fraude** suman dos botones:
  - **🧭 Cómo funciona:** diagrama Log ISO 8583 → Agente → Normalizador → Motor antifraude → Alertas, con una línea de explicación por paso. La versión diaria explica la lectura completa del día y el pico por tarjeta.
  - **📋 Reglas:** catálogo F01–F12 con explicación breve, estado **Habilitada / Pendiente** (con motivo) y marca de las reglas que están disparando (en vivo) o que dispararon en el día (diario). En vivo muestra además el umbral de config-fraude.txt.
- Catálogo tomado de los agentes entregados: OSC_Monitoreo_Fraude **fraude-v1.8** y agentes-analisis-fraude **analisis-fraude-v1.0**. Los dos implementan F01–F08 y F10–F12. **F09 no existe en ninguno: queda Pendiente (reservada).**
- Para cambiar un estado o un texto se edita solo la lista `OSC_FRAUD_RULES` al inicio del archivo.

## Archivos
public/index.html, js/navigation.js, curso_interactivo.html, ebook.html, support.html, topic.html, account.html, monitoreo-fraude.html, analisis-diario-fraude.html, js/fraud-help.js (nuevo). README.md, package.json.
