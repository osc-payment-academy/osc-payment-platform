
/* OSC Academy v3.5.4.12 · Navegación directa por campo Visa / Mastercard
   Baseline padre: v3.5.4.11 */
(() => {
  const contextual = {
    magstripe: {
      title:'Banda Magnética',
      summary:'La banda magnética puede contener hasta tres pistas (tracks). En medios de pago, Track 1 y Track 2 son las más relevantes.',
      bullets:[
        '<b>Track 1:</b> puede contener PAN, nombre del titular, vencimiento, código de servicio y datos discrecionales.',
        '<b>Track 2:</b> contiene principalmente PAN, vencimiento, código de servicio y datos discrecionales. Es la pista más utilizada en el procesamiento financiero.',
        '<b>Track 3:</b> es menos utilizada en tarjetas de pago y su utilización depende de la aplicación/emisor.'
      ],
      iso:'Observá especialmente <b>DE22</b> (modo de entrada), <b>DE35</b> (Track 2 Data) y, cuando corresponda al perfil, <b>DE45</b> (Track 1 Data).',
      lab:'Ejecutá la misma operación por Banda, Chip y Contactless y compará la trama.'
    },
    chip: {
      title:'Chip EMV',
      summary:'El chip realiza una interacción EMV entre la tarjeta y el terminal, generando información dinámica utilizada durante la autorización.',
      bullets:[
        '<b>DE22:</b> Identifica el modo de captura de la transacción.',
        '<b>DE35:</b> Suele estar presente al igual que en banda, pero el dato clave diferenciador es el <b>DE55</b> (ausente en banda).',
        '<b>DE55:</b> Es el campo “estrella” del chip — concentra la mayor parte de los datos criptográficos (ARQC, TVR, TSI, etc.).'
      ],
      glossary:[
        '<b>EMV:</b> Europay, Mastercard y Visa (estándar creado en los años 90).',
        '<b>ARQC</b> (<i>Authorization Request Cryptogram</i>): Firma digital única generada por el chip por transacción; prueba autenticidad y evita clonación.',
        '<b>TVR</b> (<i>Terminal Verification Results</i>): Resultados de verificación del terminal; indica qué validaciones pasaron o fallaron.',
        '<b>TSI</b> (<i>Transaction Status Information</i>): Resumen de los procesos ejecutados durante la transacción.',
        '<b>AID</b> (<i>Application Identifier</i>): Identifica la aplicación de pago del chip utilizada (Visa, Mastercard, etc.).',
        '<b>ATC</b> (<i>Application Transaction Counter</i>): Contador de transacciones de la aplicación que aumenta con cada operación y ayuda a detectar clonación.',
        '<b>CVM</b> (<i>Cardholder Verification Method</i>): Indica cómo se verificó al titular (PIN, firma, sin verificación).'
      ],
      iso:'Compará <b>DE22</b> y <b>DE55</b> frente a la misma operación realizada por Banda Magnética.',
      lab:'Abrí el Modo Técnico para inspeccionar los datos EMV que llegan en el mensaje.'
    },
    contactless: {
      title:'Contactless / NFC (Tarjeta física)',
      summary:'El cliente acerca la tarjeta física al lector, sin insertarla ni pasarla. La comunicación es por proximidad (NFC) y, al igual que el chip insertado, genera datos dinámicos únicos por transacción.',
      bullets:[
        '<b>DE22:</b> identifica que la captura fue contactless, según el perfil de la marca.',
        '<b>DE55:</b> puede contener los mismos datos ICC/EMV que una transacción con chip insertado (criptograma, TVR, TSI, etc.), ya que contactless usa el mismo motor EMV.',
        '<b>DE35:</b> puede transportar Track 2 Equivalent Data, igual que en chip.',
        '<b>Validación por marca (Visa, Mastercard, AMEX):</b> Asegura que se cumplan las reglas de lectura de proximidad de cada red.'
      ],
      iso:'Verificá los cambios en el <b>DE22</b> y <b>DE55</b> en comparación con una lectura por banda magnética o chip insertado.',
      lab:'Consultá la referencia técnica detallada por marca desde Parser/Constructor con 📖.'
    },
    manual: {
      title:'Ingreso Manual',
      summary:'El operador ingresa los datos de la tarjeta sin leer banda, chip ni interfaz contactless.',
      bullets:[
        'No existe una lectura física de Track ni una interacción EMV con la tarjeta.',
        '<b>DE22</b> identifica el método de ingreso según el perfil de la red.',
        'Su disponibilidad y reglas dependen de la marca y del entorno de aceptación.'
      ],
      iso:'Revisá DE22 y la ausencia de datos propios de una lectura física.',
      lab:'Disponible en POS cuando el escenario lo permite.'
    },
    refund: {
      title:'Devolución / Refund',
      summary:'Es una nueva operación de crédito al tarjetahabiente. No es una reversa técnica.',
      bullets:[
        'Puede ser total o parcial.',
        'Se relaciona con una compra aprobada previa.',
        'Posteriormente viaja a clearing con el tratamiento correspondiente a la marca.'
      ],
      iso:'Observá el Processing Code y la referencia a la operación original.',
      lab:'Seleccioná una compra aprobada y probá devolución total y parcial.'
    },
    partial: {
      title:'Dispensación parcial',
      summary:'El emisor aprobó un importe, pero el ATM entregó físicamente sólo una parte. La diferencia debe tratarse con el flujo específico de la red.',
      bullets:[
        'No es lo mismo que detectar falta de efectivo antes de autorizar.',
        'La operación original debe quedar correlacionada con el ajuste/reversa parcial.',
        'Visa, Mastercard y AMEX pueden tener reglas diferentes.'
      ],
      iso:'Revisá MTI, importe y campos de correlación en Modo Técnico.',
      lab:'El laboratorio permite comparar importe aprobado, dispensado y diferencia.'
    },
    reconcile: {
      title:'Conciliación ATM',
      summary:'Permite contrastar los totales transaccionales y el efectivo esperado del ATM al cierre del ciclo. Es posterior e independiente del envío online al Switch adquiriente.',
      bullets:[
        'Relaciona operaciones aprobadas, reversas/ajustes y efectivo dispensado.',
        'Sirve para detectar diferencias operativas.',
        'El detalle exacto depende del operador y del perfil de red.'
      ],
      iso:'Es un proceso operativo de control, no una autorización individual.',
      lab:'Ejecutá varias extracciones y luego abrí Conciliación.'
    },
    dispenserFail: {
      title:'00 + falla del dispensador',
      summary:'El emisor aprueba la extracción, pero el dispositivo físico del ATM falla y no entrega el efectivo. Para restituir el saldo, el ATM genera automáticamente una reversa total.',
      bullets:[
        '<b>1 · Solicitud:</b> el ATM envía 0200 para Visa/Mastercard o 1200 para AMEX.',
        '<b>2 · Aprobación:</b> el emisor responde 0210 con código 00 o 1210 con Action Code 000.',
        '<b>3 · Autorización:</b> la operación queda inicialmente aprobada y el importe podría haberse debitado de la cuenta.',
        '<b>4 · Falla física:</b> el dispensador no abre, no entrega efectivo ni descuenta billetes de su inventario. La pantalla muestra “ERROR DE DISPENSADOR – No se entregó efectivo”.',
        '<b>5 · Reversa automática:</b> aproximadamente 850 milisegundos después, el ATM genera 0420 → 0430 para Visa/Mastercard o 1420 → 1430 para AMEX.',
        '<b>6 · Resultado:</b> la pantalla informa “OPERACIÓN REVERSADA” y “Saldo restituido”.'
      ],
      glossary:[
        '<b>Visa:</b> DE90 relaciona la reversa con el 0200 original. DE63.3 lleva el motivo 2503: no se recibió confirmación del punto de servicio.',
        '<b>Mastercard:</b> DE90 relaciona la operación original. DE60 lleva 4500018: falla del punto de interacción/sin dispensación.',
        '<b>AMEX:</b> Bit 24 = 400 (reversa total), Bit 25 = 4017 (posible falla del ATM), Bit 4 = cero (no se entregó dinero) y el 1430 devuelve Action Code 400 (reversa aceptada).'
      ],
      iso:'El visor conserva la solicitud de extracción, la respuesta aprobada, la solicitud de reversa y la respuesta de reversa.',
      lab:'En el Switch, la extracción termina como <b>REVERSED</b>; la reversa queda registrada por separado y ambas operaciones se excluyen del clearing porque el cliente no recibió efectivo.'
    }
  };

  /* Catálogo inicial.
     Si una combinación marca+DE no está mapeada, se muestra "Referencia pendiente":
     nunca se inventa capítulo/página. */
  const refs = {
    visa: {
      2:{name:'Primary Account Number',fmt:'LLVAR N',origin:'Tarjeta / credencial',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:173,translated:'Número de cuenta principal de la tarjeta. En el laboratorio se muestra enmascarado.'},
      3:{name:'Processing Code',fmt:'N6',origin:'Originador / procesador',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:177,validPage:185,translated:'Identifica el tipo de transacción y las cuentas involucradas.'},
      4:{name:'Amount, Transaction',fmt:'N12',origin:'POS / ATM',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:186,translated:'Importe de la transacción expresado sin separador decimal.'},
      7:{name:'Transmission Date and Time',fmt:'N10',origin:'Sistema / red',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:206,translated:'Fecha y hora de transmisión del mensaje.'},
      11:{name:'System Trace Audit Number',fmt:'N6',origin:'Originador',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:212,translated:'Número de trazabilidad para identificar y correlacionar la transacción.'},
      12:{name:'Time, Local Transaction',fmt:'N6',origin:'Terminal / adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:215,translated:'Hora local de la transacción.'},
      13:{name:'Date, Local Transaction',fmt:'N4',origin:'Terminal / adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:217,translated:'Fecha local de la transacción.'},
      14:{name:'Date, Expiration',fmt:'N4',origin:'Tarjeta / terminal',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:219,translated:'Fecha de vencimiento de la tarjeta.'},
      18:{name:'Merchant Type',fmt:'N4',origin:'Adquirente / comercio',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:227,translated:'Código de categoría del comercio.'},
      22:{name:'Point-of-Service Entry Mode',fmt:'N3',origin:'Terminal',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:235,validPage:239,translated:'Indica cómo fue capturada la credencial en el punto de servicio.'},
      23:{name:'Card Sequence Number',fmt:'N3',origin:'Chip / terminal',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:241,translated:'Número de secuencia de la tarjeta.'},
      25:{name:'Point-of-Service Condition Code',fmt:'N2',origin:'Terminal / adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:244,validPage:248,translated:'Describe la condición de la transacción en el punto de servicio.'},
      32:{name:'Acquiring Institution Identification Code',fmt:'LLVAR N',origin:'Adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:255,translated:'Identifica a la institución adquirente.'},
      35:{name:'Track 2 Data',fmt:'LLVAR Z',origin:'Tarjeta / terminal',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:279,translated:'Transporta Track 2 o datos equivalentes según el modo de captura y el perfil Visa.'},
      37:{name:'Retrieval Reference Number',fmt:'AN12',origin:'Procesador / adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:284,translated:'Referencia utilizada para rastrear y relacionar mensajes.'},
      38:{name:'Authorization Identification Response',fmt:'AN6',origin:'Emisor',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:288,translated:'Código de autorización generado por el emisor para una respuesta aprobada.'},
      39:{name:'Response Code',fmt:'AN2',origin:'Emisor / red / procesador',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:292,validPage:303,translated:'Indica el resultado de la solicitud.'},
      41:{name:'Card Acceptor Terminal Identification',fmt:'ANS8',origin:'Terminal',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:310,translated:'Identifica la terminal del aceptador.'},
      42:{name:'Card Acceptor Identification Code',fmt:'ANS15',origin:'Adquirente / comercio',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:313,translated:'Identifica al aceptador o comercio.'},
      43:{name:'Card Acceptor Name/Location',fmt:'ANS40',origin:'Adquirente / comercio',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:318,translated:'Nombre y ubicación del aceptador.'},
      49:{name:'Currency Code, Transaction',fmt:'N3',origin:'Terminal / adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:449,translated:'Código numérico de la moneda de la transacción.'},
      52:{name:'Personal Identification Number (PIN) Data',fmt:'B / 8 bytes',origin:'Terminal seguro',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:455,translated:'Transporta el PIN Block cifrado; nunca el PIN en claro.'},
      53:{name:'Security Related Control Information',fmt:'N16',origin:'Terminal / procesador',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:457,validPage:458,translated:'Información de control relacionada con seguridad.'},
      54:{name:'Additional Amounts',fmt:'LLLVAR',origin:'Emisor / procesador',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:459,validPage:473,translated:'Importes adicionales asociados a la transacción.'},
      55:{name:'ICC System Related Data',fmt:'LLLVAR B',origin:'Chip / terminal / emisor',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:477,translated:'Contenedor de datos ICC/EMV, normalmente en estructura TLV.'},
      59:{name:'National Point-of-Service Geographic Data',fmt:'LLLVAR',origin:'Terminal / adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:502,validPage:506,translated:'Datos geográficos del punto de servicio.'},
      60:{name:'Additional POS Information',fmt:'Variable',origin:'Terminal / adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:507,validPage:521,translated:'Información adicional del entorno de aceptación.'},
      66:{name:'Settlement Code',fmt:'N1',origin:'Procesador / red',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:676,validPage:677,translated:'Código usado en el proceso de liquidación.'},
      70:{name:'Network Management Information Code',fmt:'N3',origin:'Red / procesador',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:681,validPage:682,translated:'Identifica la función de gestión de red.'},
      90:{name:'Original Data Elements',fmt:'N42',origin:'Originador de reversa',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:698,translated:'Relaciona una reversa con la transacción original.'},
      91:{name:'File Update Code',fmt:'AN1',origin:'Procesador / red',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:700,validPage:701,translated:'Código de actualización de archivo.'},
      101:{name:'File Name',fmt:'LLVAR',origin:'Procesador / red',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:713,validPage:714,translated:'Identifica el archivo involucrado.'},
      104:{name:'Transaction Description',fmt:'LLLVAR',origin:'Originador / procesador',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:721,validPage:722,translated:'Descripción y datos ampliados de la transacción.'}
    },
    mastercard: {},
    amex: {}
  };

  /* Páginas físicas verificadas en MasterCard Debit Switch Online Specifications (jun03).
     Cada destino corresponde al encabezado inicial "DE n—Nombre" del Capítulo 4. */
  const mastercardPages={
    1:201,2:202,3:203,4:206,5:207,6:209,7:210,8:211,9:212,10:213,11:214,12:215,13:216,14:217,15:218,16:219,17:220,18:221,19:223,20:224,21:225,22:226,23:228,24:229,25:230,26:231,27:232,28:233,29:234,30:235,31:236,32:237,33:238,34:239,35:240,36:242,37:243,38:244,39:245,40:250,41:251,42:252,43:253,44:255,45:257,46:259,47:260,48:261,49:273,50:274,51:275,52:276,53:277,54:278,55:280,56:284,57:285,58:286,59:287,60:288,61:295,62:298,63:299,64:302,65:303,66:304,67:305,68:306,69:307,70:308,71:309,72:310,73:311,74:312,75:313,76:314,77:315,78:316,79:317,80:318,81:319,82:320,83:321,84:322,85:323,86:324,87:325,88:326,89:327,90:328,91:329,92:331,93:332,94:333,95:334,96:336,97:337,98:339,99:340,100:341,101:342,102:343,103:344,104:345,112:347,120:353,121:359,122:360,126:362,127:363,128:364
  };

  function ensureModal(){
    if(document.getElementById('oscHelpModal')) return;
    const style=document.createElement('style');
    style.textContent=`
      .osc-help-wrap{position:relative;display:block;min-width:0}
      .osc-help-wrap.osc-help-inline{display:inline-flex}
      .osc-help-wrap>[data-entry],.osc-help-wrap>[data-atm-entry],.osc-help-wrap>[data-scenario]{width:100%;height:100%}
      .osc-help-wrap>.osc-help-trigger{
        position:absolute;right:7px;top:7px;z-index:30;margin:0;
        border:1px solid rgba(20,78,112,.28);background:#ffffff;color:#0e5f91;
        border-radius:999px;padding:4px 5px;cursor:pointer;font-size:11px;line-height:1;
        box-shadow:0 2px 8px rgba(0,0,0,.18);
        opacity:0;visibility:hidden;transform:scale(.82);
        transition:opacity .16s ease,transform .16s ease,visibility .16s ease;
        pointer-events:none
      }
      .osc-help-wrap.osc-help-ready>.osc-help-trigger,
      .osc-help-wrap:focus-within>.osc-help-trigger{
        opacity:1;visibility:visible;transform:scale(1);pointer-events:auto
      }
      .osc-help-trigger{
        margin-left:5px;border:1px solid #b9ccd9;background:#fff;color:#176b9d;
        border-radius:7px;padding:5px 7px;cursor:pointer;font-size:12px;line-height:1
      }
      .osc-help-trigger.context{color:#9a6400}
      .osc-help-trigger.manual{color:#176b9d}
      .osc-help-trigger:hover{border-color:#4caeff;color:#084b74;background:#f4fbff}

      .osc-help-overlay{
        position:fixed;inset:0;background:rgba(4,14,22,.62);display:none;
        align-items:center;justify-content:center;padding:22px;z-index:99999
      }
      .osc-help-overlay.show{display:flex}
      .osc-help-modal{
        width:min(760px,96vw);max-height:88vh;overflow:auto;
        border:1px solid #c9d8e2;border-radius:14px;
        background:#ffffff;color:#172a38;
        box-shadow:0 24px 70px rgba(0,0,0,.28)
      }
      .osc-help-head{
        display:flex;justify-content:space-between;gap:14px;align-items:center;
        padding:16px 18px;border-bottom:1px solid #dce7ee;background:#f8fbfd
      }
      .osc-help-head strong{font-size:17px;color:#102a3a}
      .osc-help-close{border:0;background:transparent;color:#587284;font-size:22px;cursor:pointer}
      .osc-help-body{padding:17px 18px;line-height:1.55;font-size:13px;color:#263d4d}
      .osc-help-body p{color:#405867}
      .osc-help-body ul{padding-left:20px}
      .osc-help-body li{margin:7px 0;color:#304b5c}
      .osc-help-note{
        margin-top:13px;border:1px solid #c7dbe8;background:#f3f9fd;
        border-radius:9px;padding:10px 12px;color:#24495f
      }
      .osc-help-source{
        margin-top:14px;border-top:1px dashed #b8cbd7;padding-top:12px;color:#587284
      }
      .osc-help-source b{color:#203847}
      .osc-ref-pending{color:#8d6300}
      .osc-help-chip{
        display:inline-block;border:1px solid #bfd3df;border-radius:999px;
        padding:4px 8px;color:#315b73;font-size:11px;margin-right:5px;background:#f7fbfd
      }
    `;
    document.head.appendChild(style);
    const overlay=document.createElement('div');
    overlay.id='oscHelpModal'; overlay.className='osc-help-overlay';
    overlay.innerHTML=`<section class="osc-help-modal" role="dialog" aria-modal="true" aria-labelledby="oscHelpTitle">
      <div class="osc-help-head"><strong id="oscHelpTitle">Ayuda</strong><button type="button" class="osc-help-close" aria-label="Cerrar">×</button></div>
      <div id="oscHelpBody" class="osc-help-body"></div>
    </section>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.osc-help-close').addEventListener('click',()=>overlay.classList.remove('show'));
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('show')});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.classList.remove('show')});
  }
  function show(title,html){
    ensureModal();
    document.getElementById('oscHelpTitle').textContent=title;
    document.getElementById('oscHelpBody').innerHTML=html;
    document.getElementById('oscHelpModal').classList.add('show');
  }
  function openContext(key){
    const h=contextual[key]; if(!h) return;
    show(`☝️ ${h.title}`,`<p>${h.summary}</p><ul>${h.bullets.map(x=>`<li>${x}</li>`).join('')}</ul>
      ${h.glossary?`<div class="osc-help-note"><b>Significado de las siglas</b><ul>${h.glossary.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''}
      <div class="osc-help-note"><b>Campos ISO relacionados</b><br>${h.iso}</div>
      <div class="osc-help-note"><b>Qué observar en OSC Academy</b><br>${h.lab}</div>`);
  }
  function selectedNetwork(fallback='visa'){
    for(const id of ['parserNetworkSelect','constructorNetworkSelect']){
      const el=document.getElementById(id);
      if(el&&el.value&&el.value!=='auto') return el.value;
    }
    return fallback;
  }
  function openTechnical(de, network){
    const net=(network||selectedNetwork()).toLowerCase();
    const number=Number(de);
    if(net==='amex') return false;
    if(net==='visa'){
      const page=refs.visa[number]?.page;
      if(!page) return false;
      window.open(`manuals/full-service-pos-online-messages-tech-specs.pdf#page=${page}`,'_blank','noopener');
      return true;
    }
    if(net==='mastercard'){
      const page=mastercardPages[number];
      if(!page) return false;
      window.open(`manuals/mastercard-debit-switch-online-specifications-jun03.pdf#page=${page}`,'_blank','noopener');
      return true;
    }
    return false;
  }
  function hasTechnical(de,network){
    const net=String(network||'').toLowerCase(),number=Number(de);
    return net==='visa' ? Boolean(refs.visa[number]?.page) : net==='mastercard' ? Boolean(mastercardPages[number]) : false;
  }
  function showNetworkRequired(de){
    show(`☝ DE${de} · Seleccione la marca`,`<p>Para abrir la referencia técnica correcta, primero ingrese el <b>DE2 / PAN</b> para detectar la marca automáticamente o seleccione manualmente Visa, Mastercard o American Express.</p><p>OSC Academy no toma Visa como marca predeterminada.</p>`);
  }
  function armHoverHelp(wrap){
    let timer=null;
    const showLater=()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>wrap.classList.add('osc-help-ready'),750);
    };
    const hide=()=>{
      clearTimeout(timer);
      wrap.classList.remove('osc-help-ready');
    };
    wrap.addEventListener('mouseenter',showLater);
    wrap.addEventListener('mouseleave',hide);
    wrap.addEventListener('focusin',showLater);
    wrap.addEventListener('focusout',hide);
  }

  function attachHelpAfter(el,key){
    if(!el) return;
    let wrap=el.parentElement;
    if(wrap?.classList?.contains('osc-help-wrap') && wrap.querySelector(`.osc-help-trigger[data-help-key="${key}"]`)){armHoverHelp(wrap);return;}

    // En los selectores de captura, el CSS del Core aplica estilos a TODOS los <button>.
    // Por eso la ayuda usa <span role="button"> y comparte una envoltura con el botón original.
    const integrated=el.matches?.('[data-entry],[data-atm-entry],[data-operation="refund"],[data-scenario="dispenserFail"]') || key==='reconcile';
    if(integrated){
      wrap=document.createElement('span');
      wrap.className=`osc-help-wrap${key==='reconcile'?' osc-help-inline':''}`;
      el.parentNode.insertBefore(wrap,el);
      wrap.appendChild(el);
      armHoverHelp(wrap);
    } else {
      wrap=el.parentElement;
    }

    const b=document.createElement('span');
    b.className='osc-help-trigger context';
    b.dataset.helpKey=key;
    b.textContent='☝';
    b.title='Abrir ayuda contextual';
    b.setAttribute('role','button');
    b.setAttribute('tabindex','0');
    b.setAttribute('aria-label',`Abrir ayuda: ${key}`);
    const open=e=>{e.preventDefault();e.stopPropagation();openContext(key)};
    b.addEventListener('click',open);
    b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){open(e)}});
    if(integrated) wrap.appendChild(b);
    else el.insertAdjacentElement('afterend',b);
  }
  function decorateContext(root=document){
    [
      ['[data-entry="magstripe"]','magstripe'],['[data-entry="chip"]','chip'],['[data-entry="contactless"]','contactless'],['[data-entry="manual"]','manual'],
      ['[data-atm-entry="magstripe"]','magstripe'],['[data-atm-entry="chip"]','chip'],['[data-atm-entry="contactless"]','contactless']
    ].forEach(([sel,key])=>root.querySelectorAll(sel).forEach(el=>attachHelpAfter(el,key)));
    root.querySelectorAll('[data-operation="refund"]').forEach(el=>attachHelpAfter(el,'refund'));
    attachHelpAfter(document.getElementById('partialCash'),'partial');
    attachHelpAfter(document.getElementById('reconcileAtm'),'reconcile');
    attachHelpAfter(document.querySelector('[data-scenario="dispenserFail"]'),'dispenserFail');
  }
  window.OSCHelp={contextual,refs,mastercardPages,openContext,openTechnical,hasTechnical,showNetworkRequired,decorateContext,selectedNetwork};
  document.addEventListener('DOMContentLoaded',()=>{ensureModal();decorateContext()});
})();
