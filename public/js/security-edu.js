/* OSC Payment Academy v4.0.0-rc.1.22 · Popups educativos en dos niveles
   ARQC/ARPC · PIN Block y HSM · Cuotas. Uso: OSCSecurityEdu.open('arqc'|'pin'|'cuotas', trace?) */
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const mono = (s) => `<code class="osc-sec-code">${esc(s)}</code>`;
  const flow = (steps) => `<ol class="osc-sec-flow">${steps.map(([who, what], i) => `<li style="--i:${i}"><b>${who}</b><span>${what}</span></li>`).join("")}</ol>`;
  const table = (head, rows) => `<table class="osc-sec-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  const CONTENT = {
    arqc: {
      title: "Criptograma ARQC y respuesta ARPC",
      simple: () => `
        <p>En cada compra con chip o contactless, <b>la tarjeta firma la operación</b> con una clave secreta que solo conocen ella y su banco. Esa firma se llama <b>ARQC</b>.</p>
        <p>El banco recalcula la firma con los mismos datos. Si coincide, sabe que la tarjeta es auténtica y que nadie cambió el importe en el camino. Entonces responde con <b>su propia firma (ARPC)</b>, para que la tarjeta también confíe en la respuesta.</p>
        <div class="osc-sec-note">Probalo: activá <b>«Alterar un dato en tránsito»</b> en los escenarios del POS. El importe cambia después de que la tarjeta firmó, el banco detecta que la firma no coincide y la compra se rechaza.</div>`,
      technical: () => `
        <h4>Qué datos entran en el cálculo</h4>
        ${table(["Tag", "Dato", "Bytes"], (window.OSCEmvCrypto?.ARQC_ORDER || []).map(([t, n, l]) => [mono(t), n, l || "4–6"]))}
        <h4>Jerarquía de claves</h4>
        <ul>
          <li><b>IMK</b> (Issuer Master Key): vive en el HSM del emisor.</li>
          <li><b>Clave de la tarjeta (UDK)</b>: se deriva de la IMK con el PAN y el PSN (EMV Book 2, Anexo A1.4, Opción A). Se graba en el chip al personalizarlo.</li>
          <li><b>Clave de sesión</b>: Mastercard M/Chip con <i>Cryptogram Version Number</i> «EMV CSK» deriva una clave por transacción con el ATC (M/Chip Requirements, Tabla 25). Visa CVN 10 calcula directamente con la clave de la tarjeta.</li>
        </ul>
        <h4>Algoritmo</h4>
        <p>MAC ISO/IEC 9797-1 Algoritmo 3 (DES/3DES). Resultado: 8 bytes en el tag ${mono("9F26")}. El ${mono("9F27")} = 80 indica que es un ARQC. El ${mono("9F10")} lleva la versión del criptograma (CVN) y el CVR.</p>
        <h4>Respuesta del emisor</h4>
        <p>Tag ${mono("91")} (Issuer Authentication Data) = ARPC (8 bytes) + ARC (2 bytes). <b>ARPC Método 1</b>: 3DES(clave, ARQC XOR (ARC ‖ 00 00 00 00 00 00)).</p>
        <ul>
          <li><b>Mastercard M/Chip</b> RI178.15: la 0110 debe traer DE 55 con el tag 91 si DE 22 = 05, el ARQC validó y la respuesta es aprobada.</li>
          <li><b>Mastercard M/Chip</b> RI209.15: si el ARQC no valida, el emisor no debe enviar un ARPC válido.</li>
        </ul>
        <h4>Códigos cuando el ARQC no valida</h4>
        ${table(["Red", "Respuesta", "Manual"], [
          ["Visa", "DE 39 = <b>82</b> · Negative online CAM, dCVV, iCVV, CVV…", "Full Service POS · Field 39"],
          ["Mastercard", "DE 39 = <b>88</b> · Cryptographic failure", "Customer Interface Specification · DE 39"],
          ["American Express", "Action Code <b>100</b> (Deny) · resultado de validación <b>01</b> Invalid Cryptogram", "Codes Reference Guide"],
        ])}
        <div class="osc-sec-note">Las claves del laboratorio son <b>claves de práctica públicas</b>. Los algoritmos (DES/3DES, MAC, derivaciones) son reales.</div>`,
      flow: () => flow([
        ["Tarjeta", "Calcula el ARQC con su clave y los datos de la compra (GENERATE AC)."],
        ["POS", "Arma el DE 55 con 9F26, 9F27, 9F10, 9F36, 9F37… y envía la solicitud."],
        ["Adquirente y red", "Transportan el DE 55 sin modificarlo."],
        ["Emisor · HSM", "Deriva la clave de la tarjeta, recalcula el ARQC y lo compara."],
        ["Emisor", "Si coincide y aprueba: genera el ARPC y lo envía en el tag 91."],
        ["POS → Tarjeta", "La tarjeta verifica el ARPC (EXTERNAL AUTHENTICATE / 2º GENERATE AC)."],
      ]),
    },
    // rc.1.33 · Variante Wallet: firma el teléfono con una clave derivada del token (DPAN), no de la tarjeta.
    arqc_wallet: {
      title: "Criptograma ARQC y respuesta ARPC · Wallet",
      simple: () => `
        <p>En una compra con la wallet, <b>el teléfono firma la operación</b>. Usa una clave secreta que se generó para el <b>token (DPAN)</b> cuando agregaste la tarjeta. La tarjeta real (FPAN) no participa. Esa firma se llama <b>ARQC</b>.</p>
        <p>La red o el TSP traduce el token a la tarjeta real (detokenización). El emisor, o el TSP en su nombre, recalcula la firma con los mismos datos. Si coincide, sabe que la compra salió de ese teléfono y que nadie cambió el importe. Entonces responde con <b>su propia firma (ARPC)</b>.</p>
        <div class="osc-sec-note">Probalo: elegí el escenario <b>«Importe alterado en tránsito»</b>. El importe cambia después de que el teléfono firmó, la firma no coincide y la compra se rechaza (Visa 82 · Mastercard 88 · Amex 100).</div>`,
      technical: () => `
        <h4>Qué cambia respecto de una tarjeta con chip</h4>
        <ul>
          <li><b>Clave:</b> se deriva del <b>DPAN</b> y su PSN, no del PAN de la tarjeta. Por eso en «Tu transacción» el PAN es el token.</li>
          <li><b>Kernel:</b> Visa qVSDC (Visa Token Service), Mastercard M/Chip desde el teléfono (MDES), Amex Expresspay.</li>
          <li><b>Quién valida:</b> según el programa, el TSP valida el criptograma antes de detokenizar, o lo reenvía al emisor para que lo valide.</li>
        </ul>
        ${CONTENT.arqc.technical()}`,
      flow: () => flow([
        ["Teléfono (wallet)", "Calcula el ARQC con la clave del token y los datos de la compra."],
        ["POS", "Recibe el DE 55 por NFC y arma la solicitud con el DPAN en el DE 2."],
        ["Adquirente", "Transporta el DE 55 sin modificarlo."],
        ["Red · TSP", "Detokeniza DPAN → FPAN y valida o reenvía el criptograma."],
        ["Emisor · HSM", "Recalcula el ARQC y lo compara. Si coincide y aprueba, genera el ARPC (tag 91)."],
        ["POS → Teléfono", "La respuesta vuelve con el resultado; el teléfono muestra aprobado o rechazado."],
      ]),
    },
    // rc.1.35 · 3-D Secure (E-commerce): autenticación EMV 3DS 2.x y cómo su resultado viaja en la autorización.
    threeds: {
      title: "3-D Secure · autenticación del comprador",
      simple: () => `
        <p>En una compra online no hay chip ni PIN. Para saber que quien compra es el titular, <b>el banco emisor lo autentica antes de autorizar</b>: a veces sin molestarlo (<b>frictionless</b>), a veces pidiéndole un código (<b>challenge</b>).</p>
        <p>El resultado de esa autenticación es un <b>ECI</b> (qué tan autenticada quedó la compra) y un <b>valor criptográfico</b> (CAVV en Visa, AAV en Mastercard, AEVV en Amex). El comercio los agrega al mensaje de autorización ISO 8583. El emisor verifica ese valor y, si la compra fue autenticada, la responsabilidad por fraude pasa al emisor.</p>
        <div class="osc-sec-note">Probalo: elegí <b>«Challenge fallido»</b> en los escenarios de autenticación. Si el código no es correcto, la compra se corta y la autorización nunca se envía.</div>`,
      technical: () => `
        <h4>Mensajes de EMV 3-D Secure 2.x (no son ISO 8583)</h4>
        ${table(["Mensaje", "De → a", "Para qué"], [
          ["AReq / ARes", "3DS Server → Directory Server → ACS", "Datos de la compra y del dispositivo. El ACS responde transStatus: Y (autenticado), C (challenge), A (intento), N (no autenticado)."],
          ["CReq / CRes", "Navegador ↔ ACS", "Pantalla del banco con el código (OTP). Resultado del challenge."],
          ["RReq / RRes", "ACS → DS → 3DS Server", "Resultado final del challenge con el ECI y el valor de autenticación."],
        ])}
        <h4>Del resultado 3DS al mensaje ISO 8583</h4>
        ${table(["Red", "Autenticado", "Intento", "Sin 3DS", "Campos"], [
          ["Visa", "ECI 05 + CAVV", "ECI 06 + CAVV", "ECI 07, sin CAVV", "60.8 (pos. 9-10) · 126.9 CAVV"],
          ["Mastercard", "SLI 212 + AAV", "SLI 211 + AAV", "SLI 210, sin SE 43", "DE 48 SE 42 · SE 43"],
          ["American Express", "ECI 05 + AEVV", "ECI 06 + AEVV", "ECI 07, sin AEVV", "Bit 61 SafeKey (AX · ASK · ECI · AEVV)"],
        ])}
        <p>En los mensajes 3DS, Mastercard usa ECI 02 (autenticado) / 01 (intento); en la autorización se traducen al SLI 212 / 211 del DE 48 SE 42.</p>
        <h4>Código de seguridad de la tarjeta</h4>
        ${table(["Red", "Campo", "Formato"], [
          ["Visa", "126.10 CVV2", "Presencia (1) · tipo de respuesta (1 = devolver resultado en 44.10) · valor justificado a derecha"],
          ["Mastercard", "DE 48 SE 92 CVC 2", "n-3"],
          ["American Express", "Bit 53", "Largo 03/04 + CSC (4DBC de 4 dígitos)"],
        ])}
        <div class="osc-sec-note">Fuentes: Visa Full Service POS (Field 60.8, 126.9, 126.10, 44.10) · Mastercard CIS (DE 48 SE 42 Tabla 418, SE 43, SE 92) · Amex Network Specifications Authorization (Bit 53, Bit 61 Tabla 5-1).</div>`,
      flow: () => flow([
        ["Checkout", "El comprador confirma la compra; el 3DS Server del comercio arma el AReq."],
        ["Directory Server", "La red (Visa Secure · Identity Check · SafeKey) ubica al ACS del emisor."],
        ["ACS del emisor", "Analiza el riesgo: aprueba sin fricción o pide un challenge."],
        ["Challenge", "El comprador ingresa el código en la pantalla del banco (CReq/CRes)."],
        ["Resultado 3DS", "ECI + CAVV/AAV/AEVV vuelven al comercio (RReq)."],
        ["Autorización", "El comercio envía la 0100/1100 con esos datos; el emisor verifica el valor y aprueba o rechaza."],
      ]),
    },
    pin: {
      title: "PIN Block, cifrado y HSM",
      simple: () => `
        <p><b>El PIN nunca viaja a la vista.</b> Apenas lo tipeás, el teclado lo mezcla con el número de la tarjeta y lo cifra con una clave secreta.</p>
        <p>En el camino, cada tramo usa su propia clave: el equipo de seguridad del adquirente (HSM) <b>traduce</b> el bloque de una clave a otra sin ver nunca el PIN. Al final, el HSM del banco emisor lo descifra y lo verifica.</p>
        <div class="osc-sec-note">En el laboratorio, el PIN de prueba de todas las tarjetas es <b>1234</b>. Si ingresás otro, el HSM del emisor lo rechaza.</div>`,
      technical: () => `
        <h4>Armado del PIN Block · ISO 9564 Formato 0</h4>
        ${table(["Paso", "Contenido"], [
          ["Bloque PIN", `${mono("0")} + largo del PIN + PIN + relleno ${mono("F")} hasta 16 dígitos`],
          ["Bloque PAN", `${mono("0000")} + los 12 dígitos del PAN más a la derecha, sin el dígito verificador`],
          ["PIN Block", "Bloque PIN XOR Bloque PAN"],
          ["DE 52", "PIN Block cifrado con 3DES y la clave de PIN (PEK/ZPK)"],
        ])}
        <h4>DE 53 · cómo se cifró</h4>
        ${table(["Red", "Valor", "Significado"], [
          ["Visa", mono(window.OSCIsoSpec?.VISA_DE53 || "2001010100000000"), "20 Zone Encryption · 01 DES · 01 ISO formato 0 · 01 índice de clave"],
          ["Mastercard", mono(window.OSCIsoSpec?.MC_DE53 || "9701100001000000"), "97 claves indexadas · 01 DES · 10 ISO formato 0 · 0001 índice"],
          ["American Express", "Bit 52", "PIN online cifrado (sin Bit 53 en el perfil del simulador)"],
        ])}
        <h4>Claves que maneja el HSM</h4>
        <ul>
          <li><b>ZMK</b> (Zone Master Key): transporta otras claves entre instituciones.</li>
          <li><b>ZPK / PEK</b> (PIN Encryption Key): cifra el PIN Block en cada tramo.</li>
          <li><b>PVK</b> (PIN Verification Key): el emisor la usa para verificar el PIN (PVV u offset).</li>
        </ul>
        <h4>PIN incorrecto</h4>
        ${table(["Red", "Respuesta"], [["Visa", "Field 39 = <b>55</b> PIN incorrect or missing"], ["Mastercard", "DE 39 = <b>55</b> Invalid PIN"], ["American Express", "Action Code <b>117</b> Incorrect PIN"]])}
        <h4>Reglas de seguridad (PCI)</h4>
        <ul>
          <li>El PIN y el PIN Block nunca se guardan, ni siquiera cifrados, después de autorizar.</li>
          <li>Las claves solo existen en claro dentro del HSM; afuera viajan cifradas bajo otra clave.</li>
          <li>Las claves se cargan por componentes con control dual (dos personas, ninguna conoce la clave completa).</li>
          <li>PAN enmascarado en pantallas y tickets; datos de tarjeta protegidos según PCI DSS.</li>
        </ul>`,
      flow: () => flow([
        ["Teclado (PIN pad)", "Arma el PIN Block formato 0 y lo cifra con su PEK."],
        ["POS → Adquirente", "Viaja en el DE 52 con el DE 53."],
        ["HSM del adquirente", "Traduce: descifra con la PEK del terminal y cifra con la ZPK compartida con la red."],
        ["Red", "Vuelve a traducir hacia la ZPK del emisor."],
        ["HSM del emisor", "Descifra, quita el PAN, recupera el PIN y lo verifica con la PVK."],
        ["Emisor", "Responde 00 si el PIN es correcto, 55 / 117 si no."],
      ]),
    },
    // rc.1.26 · Red LINK (BASE24 Host to Host). Fuentes: C-X-1-2-3 (formato de mensajes), C-X-4 (registros 0200/0210/0220),
    // C-X-6 (códigos de resultado) y Anexo Técnico I Cobro con Transferencias A-8406.
    link_pin: {
      title: "PIN en la Red LINK · campo 52",
      simple: () => `
        <p><b>El PIN nunca viaja a la vista.</b> El teclado del cajero lo cifra apenas lo tipeás, y LINK lo envía al banco emisor en el <b>campo 52</b> del 0200, siempre cifrado.</p>
        <p>Entre LINK y el banco, el PIN viaja cifrado con la <b>clave de comunicación</b> que comparten. El banco emisor lo descifra en su equipo de seguridad (HSM), lo compara con el PIN de la tarjeta y responde en el 0210: <b>00</b> si es correcto o <b>55</b> si es incorrecto.</p>
        <div class="osc-sec-note">En el laboratorio, el PIN de prueba de todas las tarjetas es <b>1234</b>. El Cambio de PIN se puede practicar, pero no modifica el PIN de prueba.</div>`,
      technical: () => `
        <h4>Campos de LINK relacionados con el PIN</h4>
        ${table(["Campo", "Nombre / atributo", "Qué dice el manual"], [
          [mono("52"), "pin · X(16)", "Número de PIN, en forma encriptada (C-X-1-2-3). Los anexos lo describen como el PIN del tarjetahabiente <i>encriptado por la clave de comunicación</i>."],
          [mono("63"), "pri-rsrvd4-prvt · PIN-OFFSET", "Campo de PIN offset (C-X-1-2-3)."],
          [mono("54"), "add-amts · Cambio de PIN (32)", "En el cambio de PIN encriptado lleva el <b>nuevo PIN offset</b> X(16) + blancos. El PIN nuevo nunca viaja en claro."],
          [mono("42"), "crd-accpt-id-cde", "En dispositivos que no son cajeros se informa <b>CIT</b>: el host valida la clave telefónica en lugar del PIN de cajero."],
        ])}
        <p>El campo 53 (sec-cntrl-info) figura en la tabla de bits de BASE24, pero no está entre los campos que LINK describe para su implementación: a diferencia de Visa y Mastercard, el mensaje LINK no informa cómo se cifró el bloque.</p>
        <h4>Casos especiales</h4>
        <ul>
          <li><b>Cobro con Transferencias (A-8406):</b> el campo 52 viaja con 16 «F» (no hay PIN del tarjetahabiente).</li>
          <li><b>DEBIN:</b> en el simulador no se valida PIN (la autorización la da el comprador al aceptar el DEBIN).</li>
        </ul>
        <h4>Códigos de resultado vinculados al PIN (C-X-6)</h4>
        ${table(["Código", "Descripción"], [
          [mono("55"), "El PIN ingresado es incorrecto · PIN para compras en comercio no existe"],
          [mono("38"), "Cantidad de intentos fallidos de ingreso de PIN excedida · captura de la tarjeta"],
          [mono("75"), "Excede la cantidad de ingresos fallidos de PIN para compras"],
          [mono("85"), "El usuario debe cambiar el PIN"],
        ])}
        <h4>Cómo lo arma el simulador</h4>
        <p>El manual de LINK define el campo 52 como PIN encriptado X(16) pero no fija el formato del bloque. El laboratorio usa <b>ISO 9564 formato 0</b> (PIN XOR PAN) cifrado con 3DES y una clave de práctica, y el HSM del emisor simulado lo descifra y verifica.</p>
        <div class="osc-sec-note">Fuentes: LINK C-X-1-2-3 Tipo y formato de mensajes · C-X-4 registros 0200 / 0210 / 0220 · C-X-6 Códigos de resultado · Anexo Técnico I Cobro con Transferencias A-8406.</div>`,
      flow: () => flow([
        ["Teclado del cajero", "Cifra el PIN apenas se ingresa."],
        ["BASE24 (LINK)", "Arma el 0200 y envía el PIN cifrado en el campo 52 con la clave de comunicación del host."],
        ["Host del emisor · HSM", "Descifra el campo 52 y verifica el PIN con su método (LINK define el campo 63 PIN-OFFSET)."],
        ["Host del emisor", "Responde el 0210: 00 aprobada o 55 PIN incorrecto (38 si se superaron los intentos)."],
        ["Cajero", "Continúa la operación o muestra el rechazo."],
      ]),
    },
    link_chip: {
      title: "Chip y criptograma en la Red LINK",
      simple: () => `
        <p>En Visa y Mastercard, el criptograma del chip (<b>ARQC</b>) viaja al banco dentro del <b>campo 55</b>, y el banco contesta con su propia firma (<b>ARPC</b>).</p>
        <p>En la mensajería Host to Host de LINK es distinto: <b>el campo 55 no lleva datos del chip</b>. Lo usa para los datos de transferencias interbancarias, los pagos (PAS) o las cuentas relacionadas a la tarjeta. El banco recibe la tarjeta por el <b>track 2 (campo 35)</b> y el PIN cifrado (<b>campo 52</b>).</p>
        <div class="osc-sec-note">Por eso, en una prueba LINK no hay ARQC ni ARPC para mostrar: la seguridad que ves en el mensaje es la del PIN. Mirá «PIN Block y HSM».</div>`,
      technical: () => `
        <h4>El campo 55 según la red</h4>
        ${table(["Red", "Campo 55", "Fuente"], [
          ["Visa / Mastercard", "ICC data: tags EMV (9F26 ARQC, 9F27, 9F10, 9F36…). La respuesta trae el tag 91 (ARPC).", "Full Service · CIS"],
          ["Red LINK", "pri-rsrvd1-iso LLLVAR: datos para transacciones interbancarias (09 / 29 / 39, longitud 120), datos del pago PAS o cuentas relacionadas a la tarjeta. En DEBIN, los datos del débito (anexo II).", "C-X-1-2-3 · C-X-4 · Anexos"],
        ])}
        <h4>Qué identifica a la tarjeta en un mensaje LINK</h4>
        ${table(["Campo", "Contenido"], [
          [mono("35"), "Track 2 de la tarjeta, alineado a izquierda y relleno con blancos"],
          [mono("52"), "PIN encriptado X(16)"],
          [mono("61"), "Institución emisora de la tarjeta, red y tipos de cuenta"],
          [mono("102 / 103"), "Cuentas desde / hacia"],
        ])}
        <div class="osc-sec-note">Los manuales Host to Host de LINK cargados en la plataforma (C-X y anexos de Transferencias y DEBIN) no definen tags EMV. Si LINK los incorpora en otra especificación, se suma a este simulador.</div>`,
      flow: () => flow([
        ["Cajero", "Lee la tarjeta y captura el PIN."],
        ["BASE24 (LINK)", "Envía el 0200 con track 2 (35), PIN cifrado (52) y cuentas (102 / 103)."],
        ["Host del emisor", "Valida PIN, cuenta y saldo. No recibe ARQC en este mensaje."],
        ["Host del emisor", "Responde el 0210 con el código de resultado (campo 39) y los saldos (campo 44)."],
      ]),
    },
    cuotas: {
      title: "Compras en cuotas",
      simple: () => `
        <p>El cliente paga la compra en varias cuotas mensuales con su <b>tarjeta de crédito</b>.</p>
        <ul>
          <li><b>Sin interés:</b> el cliente paga lo mismo que de contado; el costo de financiar lo absorbe el comercio.</li>
          <li><b>Con interés:</b> lo financia el banco emisor, que cobra un interés al cliente.</li>
        </ul>
        <p>El POS informa en el mensaje cuántas cuotas y qué tipo de plan. El banco puede aprobar o rechazar si ese plan no está permitido para la tarjeta.</p>`,
      technical: () => `
        ${table(["Red", "Dónde viaja", "Rechazos"], [
          ["Visa", `Field 104 Usage 2, Dataset ID ${mono("5D")}: tags 01 total · 02 moneda · 03 cantidad · 04 cuota · 17 tipo (1 sin interés / 2 con interés / 3 compre hoy pague después) · 80 dueño del plan (01 emisor / 03 comercio). Field 126.13 = ${mono("I")}.`, "Reject 0494 si el dataset es inválido · 57 si el emisor no participa"],
          ["Mastercard", `DE 48 SE 95 = ${mono("ARGCTA")} (cuotas en Argentina) + DE 112 SE 001 = tipo de plan (20 emisor · 21 comercio · 22 adquirente · 23 promedio · 24/25 financiación al consumidor) + cantidad. En 24/25 el emisor responde el SE 003 con cuota, tasas y cargos.`, "DE 39 = 30 + DE 44 = 1120nn si el formato del DE 112 es incorrecto"],
          ["American Express", `Bit 48 DPP. <b>Plan del emisor</b> (DP05): 1100 con función 108 (consulta) → 1110 con los planes → 1100 con función 100. <b>Plan del adquirente</b> (DP03): una sola 1100.`, "Action Code 115 si el emisor o el adquirente no soportan DPP · sin Stand-In en el plan del emisor"],
        ])}
        <div class="osc-sec-note">Fuentes: Visa Full Service POS (abr 2025) · Mastercard Customer Interface Specification (feb 2025), sección «Cuotas: Payment Transactions» · American Express Network Specifications Authorization (oct 2023), «Deferred Payment Plan».</div>`,
      flow: () => flow([
        ["Cliente", "Elige pagar en cuotas y el tipo de plan."],
        ["POS", "Agrega los datos de cuotas que pide cada red (5D / SE 95 + DE 112 / Bit 48)."],
        ["Red", "Valida el formato y rutea al emisor."],
        ["Emisor", "Verifica que el plan esté permitido para la tarjeta y aprueba o rechaza."],
        ["POS", "Imprime el ticket con la cantidad y el importe de cada cuota."],
      ]),
    },
  };

  function traceHtml(kind, t) {
    if (!t) return `<p class="osc-sec-muted">Todavía no hay una operación con este dato. Hacé una compra en el simulador y volvé a abrir esta ayuda para ver tus propios valores.</p>`;
    if (kind === "arqc" || kind === "arqc_wallet") {
      const wallet = kind === "arqc_wallet";
      const rows = [
        [wallet ? "Token (DPAN) / PSN" : "PAN / PSN", mono(`${t.pan} / ${t.psn || "00"}`)],
        ...(wallet && t.fpanLast4 ? [["Tarjeta real (FPAN)", `•••• ${esc(t.fpanLast4)} · no entra en el cálculo; la red la recupera al detokenizar`]] : []),
        ["Y (16 dígitos de PAN‖PSN)", mono(t.y)],
        [wallet ? "Clave del token (UDK)" : "Clave de la tarjeta (UDK)", mono(t.udk)],
        ...(t.scheme === "CSK" ? [["ATC", mono(t.atc)], ["Clave de sesión (EMV CSK)", mono(t.sk)]] : [["Esquema", "Visa CVN 10 · MAC directo con la UDK (padding método 1)"]]),
        ["Datos firmados", mono(t.data)],
        ["ARQC (9F26)", mono(t.arqc)],
      ];
      if (t.validation) {
        rows.push(["ARQC recalculado por el emisor", mono(t.validation.recomputed)]);
        rows.push(["Resultado", t.validation.ok ? (wallet ? "✅ Coincide: la compra salió de ese teléfono" : "✅ Coincide: la tarjeta es auténtica") : `❌ No coincide · ${esc(t.validation.reason || "dato alterado")}`]);
      }
      if (t.arpc) rows.push(["ARPC (tag 91)", mono(`${t.arpc.arpc} + ARC ${t.arpc.arc}`)]);
      return table(["Paso", "Valor"], rows);
    }
    if (kind === "threeds") {
      const modeTxt = { full: "Autenticado", attempt: "Intento (ACS no disponible)", none: "Sin autenticación 3DS" }[t.mode] || t.mode;
      return table(["Dato", "Valor"], [
        ["Red", esc(String(t.network || "").toUpperCase())],
        ["Escenario", esc(t.scenarioLabel || modeTxt)],
        ...(t.version ? [["Versión 3DS", mono(t.version)]] : []),
        ...(t.threeDSServerTransID ? [["threeDSServerTransID", mono(t.threeDSServerTransID)]] : []),
        ...(t.aresStatus ? [["ARes · transStatus", mono(t.aresStatus)]] : []),
        ...(t.challenge ? [["Challenge", t.challenge]] : []),
        ...(t.finalStatus ? [["Resultado final · transStatus", mono(t.finalStatus)]] : []),
        ...(t.dsEci ? [["ECI en el mensaje 3DS", mono(t.dsEci)]] : []),
        [t.network === "mastercard" ? "SLI en la autorización (DE 48 SE 42)" : `ECI en la autorización (${t.network === "visa" ? "60.8" : "Bit 61"})`, mono(t.eci)],
        [`${esc(t.valueName || "Valor")} (${t.network === "visa" ? "126.9" : t.network === "mastercard" ? "DE 48 SE 43" : "Bit 61"})`, t.value ? mono(t.value) : "— no viaja (sin autenticación)"],
        ...(t.cvcField ? [["Código de seguridad", `${esc(t.cvcField)} · ${mono("•".repeat(t.cvcLength || 3))}`]] : []),
      ]);
    }
    if (kind === "link_chip") return `<p class="osc-sec-muted">Esta prueba es de la Red LINK: el mensaje no lleva criptograma del chip. El campo 55 de tu operación, si está presente, contiene datos de transferencia o DEBIN.</p>`;
    if (kind === "pin" || kind === "link_pin") {
      const rows = [
        ["PIN ingresado", mono("•".repeat(t.pinLength || 4)) + " (no se muestra)"],
        ["Bloque PIN", mono(t.pinFieldMasked)],
        ["Bloque PAN", mono(t.panField)],
        [kind === "link_pin" ? "PIN cifrado (campo 52)" : "PIN Block cifrado (DE 52)", mono(t.encrypted)],
        ["Clave de práctica (ZPK)", mono(t.zpk)],
      ];
      if (t.hsm) {
        rows.push(["HSM del emisor: PIN Block descifrado", mono("•".repeat(16))]);
        rows.push(["Formato ISO 0", t.hsm.formatOk ? "✅ válido" : "❌ inválido"]);
        rows.push(["Verificación", t.hsm.match ? "✅ PIN correcto" : "❌ PIN incorrecto"]);
      }
      return table(["Paso", "Valor"], rows);
    }
    if (kind === "cuotas") {
      return table(["Dato", "Valor"], [
        ["Red", esc(t.network)], ["Cuotas", esc(t.count)], ["Plan", t.interest ? "Con interés (emisor)" : "Sin interés (comercio)"],
        ["Importe de cada cuota", esc(t.installmentLabel)], ["Total financiado", esc(t.totalLabel)],
        ...(t.fields || []).map(([de, v]) => [`DE ${esc(de)}`, mono(v)]),
      ]);
    }
    return "";
  }

  function ensure() {
    if (document.getElementById("oscSecModal")) return;
    const st = document.createElement("style");
    st.textContent = `
      .osc-sec-overlay{position:fixed;inset:0;z-index:100000;display:none;place-items:center;background:rgba(3,12,22,.68);padding:16px}
      .osc-sec-overlay.show{display:grid}
      .osc-sec-modal{width:min(860px,100%);max-height:90vh;overflow:auto;background:#fff;color:#172a38;border-radius:14px;border:1px solid #c9d8e2;box-shadow:0 24px 70px rgba(0,0,0,.3);font-family:Inter,Segoe UI,Arial,sans-serif}
      .osc-sec-head{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;background:#f8fbfd;border-bottom:1px solid #dce7ee}
      .osc-sec-head strong{font-size:17px;color:#102a3a}
      .osc-sec-close{border:0;background:transparent;font-size:24px;color:#587284;cursor:pointer}
      .osc-sec-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:12px 18px 0}
      .osc-sec-tabs button{border:1px solid #bfd3df;background:#f7fbfd;color:#315b73;border-radius:999px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:12px}
      .osc-sec-tabs button.active{background:#0b5cad;color:#fff;border-color:#0b5cad}
      .osc-sec-body{padding:14px 18px 20px;font-size:13.5px;line-height:1.55;color:#263d4d}
      .osc-sec-body h4{margin:16px 0 6px;color:#0f3550;font-size:14px}
      .osc-sec-table{width:100%;border-collapse:collapse;margin:6px 0;font-size:12.5px}
      .osc-sec-table th,.osc-sec-table td{border:1px solid #dbe6ee;padding:6px 8px;text-align:left;vertical-align:top}
      .osc-sec-table th{background:#eef5fa;color:#173a52}
      .osc-sec-code{font-family:Consolas,Menlo,monospace;background:#eef4f8;border-radius:4px;padding:1px 5px;word-break:break-all;color:#0b3a5a}
      .osc-sec-note{margin-top:12px;border:1px solid #c7dbe8;background:#f3f9fd;border-radius:9px;padding:10px 12px;color:#24495f}
      .osc-sec-muted{color:#587284}
      .osc-sec-flow{list-style:none;padding:0;margin:8px 0;display:grid;gap:8px;counter-reset:s}
      .osc-sec-flow li{counter-increment:s;display:grid;grid-template-columns:34px 170px 1fr;gap:10px;align-items:center;border:1px solid #d6e4ee;border-radius:10px;padding:9px 10px;background:#fbfdff;opacity:0;animation:oscSecIn .35s ease forwards;animation-delay:calc(var(--i) * .25s)}
      .osc-sec-flow li::before{content:counter(s);display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#0b5cad;color:#fff;font-weight:800}
      .osc-sec-flow b{color:#0f3550}
      @keyframes oscSecIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      @media (max-width:640px){.osc-sec-flow li{grid-template-columns:30px 1fr}.osc-sec-flow li span{grid-column:2}}
      @media (prefers-reduced-motion:reduce){.osc-sec-flow li{animation:none;opacity:1}}
      .osc-edu-buttons{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
      .osc-edu-buttons button{border:1px solid #2f6f9f;background:#0d2a44;color:#e6f2fb;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer}
      .osc-edu-buttons button:hover{background:#13406a}
    `;
    document.head.appendChild(st);
    const o = document.createElement("div");
    o.id = "oscSecModal";
    o.className = "osc-sec-overlay";
    o.innerHTML = `<section class="osc-sec-modal" role="dialog" aria-modal="true" aria-labelledby="oscSecTitle">
      <div class="osc-sec-head"><strong id="oscSecTitle"></strong><button class="osc-sec-close" type="button" aria-label="Cerrar">×</button></div>
      <div class="osc-sec-tabs" role="tablist"></div><div class="osc-sec-body" id="oscSecBody"></div></section>`;
    document.body.appendChild(o);
    o.querySelector(".osc-sec-close").onclick = () => o.classList.remove("show");
    o.addEventListener("click", (e) => { if (e.target === o) o.classList.remove("show"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") o.classList.remove("show"); });
  }

  // rc.1.26 · Con la tarjeta LINK seleccionada, las ayudas de PIN y chip muestran la versión de los manuales LINK.
  function activeNetwork() {
    const b = document.querySelector("[data-atm-card].active, [data-test-card].active");
    return String(b?.dataset.atmCard || b?.dataset.testCard || "").startsWith("link") ? "link" : "";
  }
  function open(kind, trace, startTab) {
    if (activeNetwork() === "link" && (kind === "pin" || kind === "arqc")) kind = kind === "pin" ? "link_pin" : "link_chip";
    if (kind === "arqc" && trace?.channel === "WALLET") kind = "arqc_wallet";
    const c = CONTENT[kind];
    if (!c) return;
    ensure();
    const o = document.getElementById("oscSecModal");
    document.getElementById("oscSecTitle").textContent = c.title;
    const tabs = [["simple", "Explicación simple"], ["technical", "Ver detalle técnico"], ["flow", "Flujo paso a paso"], ["trace", "Tu transacción"]];
    const bar = o.querySelector(".osc-sec-tabs"), body = document.getElementById("oscSecBody");
    const show = (k) => {
      bar.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.k === k));
      body.innerHTML = k === "trace" ? traceHtml(kind, trace) : c[k]();
    };
    bar.innerHTML = tabs.map(([k, l]) => `<button type="button" role="tab" data-k="${k}">${l}</button>`).join("");
    bar.querySelectorAll("button").forEach((b) => (b.onclick = () => show(b.dataset.k)));
    show(startTab || "simple");
    o.classList.add("show");
  }

  window.OSCSecurityEdu = { open };
})();
