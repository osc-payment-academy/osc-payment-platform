
/* OSC Academy v3.5.4.4 · Ayuda contextual + referencia técnica
   Baseline padre: v3.5.3.20 VISA/MC Conformance */
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
      summary:'El chip realiza una interacción EMV (Europay, Mastercard y Visa) entre tarjeta y terminal y genera información dinámica utilizada durante la autorización.',
      bullets:[
        '<b>DE22:</b> identifica el modo de captura.',
        '<b>DE55:</b> puede transportar datos ICC/EMV en TLV.',
        '<b>DE35:</b> puede transportar Track 2 Equivalent Data cuando el perfil de la red lo requiere.'
      ],
      iso:'Compará <b>DE22 + DE55</b> con la misma operación realizada por Banda.',
      lab:'Abrí el Modo Técnico para observar los datos EMV que llegan al mensaje.'
    },
    contactless: {
      title:'Contactless / NFC',
      summary:'La tarjeta o dispositivo se comunica con el lector por proximidad. En perfiles EMV Contactless se generan datos dinámicos usando una interfaz sin contacto.',
      bullets:[
        '<b>DE22:</b> refleja la captura contactless según el perfil de la marca.',
        '<b>DE55:</b> puede contener datos ICC/EMV de la operación.',
        '<b>Visa, Mastercard y AMEX:</b> la terminología y reglas exactas dependen de cada red.'
      ],
      iso:'Observá cómo cambian <b>DE22</b> y <b>DE55</b> frente a Banda Magnética.',
      lab:'La referencia técnica por marca se consulta desde Parser/Constructor con 📘.'
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
      title:'Reconciliación ATM',
      summary:'Permite contrastar los totales transaccionales y el efectivo esperado del ATM al cierre del ciclo.',
      bullets:[
        'Relaciona operaciones aprobadas, reversas/ajustes y efectivo dispensado.',
        'Sirve para detectar diferencias operativas.',
        'El detalle exacto depende del operador y del perfil de red.'
      ],
      iso:'Es un proceso operativo de control, no una autorización individual.',
      lab:'Ejecutá varias extracciones y luego abrí Reconciliación.'
    }
  };

  /* Catálogo inicial.
     Si una combinación marca+DE no está mapeada, se muestra "Referencia pendiente":
     nunca se inventa capítulo/página. */
  const refs = {
    visa: {
      2:{name:'Primary Account Number',fmt:'LLVAR N',origin:'Tarjeta / credencial',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:139,translated:'Número de cuenta principal de la tarjeta. En el laboratorio se muestra enmascarado.'},
      3:{name:'Processing Code',fmt:'N6',origin:'Originador / procesador',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:142,translated:'Identifica el tipo de transacción y las cuentas involucradas.'},
      4:{name:'Amount, Transaction',fmt:'N12',origin:'POS / ATM',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:149,translated:'Importe de la transacción expresado sin separador decimal.'},
      7:{name:'Transmission Date and Time',fmt:'N10',origin:'Sistema / red',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:163,translated:'Fecha y hora de transmisión del mensaje.'},
      11:{name:'System Trace Audit Number',fmt:'N6',origin:'Originador',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:167,translated:'Número de trazabilidad para identificar y correlacionar la transacción.'},
      22:{name:'Point-of-Service Entry Mode',fmt:'N3',origin:'Terminal',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:186,translated:'Indica cómo fue capturada la credencial en el punto de servicio.'},
      35:{name:'Track 2 Data',fmt:'LLVAR Z',origin:'Tarjeta / terminal',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:226,translated:'Transporta Track 2 o datos equivalentes según el modo de captura y el perfil Visa.'},
      37:{name:'Retrieval Reference Number',fmt:'AN12',origin:'Procesador / adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:231,translated:'Referencia utilizada para rastrear y relacionar mensajes.'},
      39:{name:'Response Code',fmt:'AN2',origin:'Emisor / red / procesador',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:242,translated:'Indica el resultado de la solicitud.'},
      41:{name:'Card Acceptor Terminal Identification',fmt:'ANS8',origin:'Terminal',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:253,translated:'Identifica la terminal del aceptador.'},
      42:{name:'Card Acceptor Identification Code',fmt:'ANS15',origin:'Adquirente / comercio',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:256,translated:'Identifica al aceptador o comercio.'},
      49:{name:'Currency Code, Transaction',fmt:'N3',origin:'Terminal / adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:336,translated:'Código numérico de la moneda de la transacción.'},
      52:{name:'Personal Identification Number (PIN) Data',fmt:'B / 8 bytes',origin:'Terminal seguro',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:340,translated:'Transporta el PIN Block cifrado; nunca el PIN en claro.'},
      55:{name:'ICC System Related Data',fmt:'LLLVAR B',origin:'Chip / terminal / emisor',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:370,translated:'Contenedor de datos ICC/EMV, normalmente en estructura TLV.'},
      60:{name:'Additional POS Information',fmt:'Variable',origin:'Terminal / adquirente',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:397,translated:'Información adicional del entorno de aceptación.'},
      90:{name:'Original Data Elements',fmt:'N42',origin:'Originador de reversa',manual:'Visa Full Service POS Online Messages – Technical Specifications',page:488,translated:'Relaciona una reversa con la transacción original.'}
    },
    mastercard: {
      22:{name:'Point of Service Entry Mode',fmt:'N3',origin:'Terminal',manual:'Mastercard M/Chip Requirements—for Contact and Contactless · 29 April 2025',page:320,translated:'Documenta los modos de entrada usados para chip, contactless y otros escenarios de captura.'},
      35:{name:'Track 2 Data',fmt:'LLVAR',origin:'Tarjeta / terminal',manual:'Mastercard M/Chip Requirements—for Contact and Contactless · 29 April 2025',page:320,translated:'Puede transportar Track 2 Equivalent Data en chip/contactless o Track 2 real en escenarios magnéticos.'},
      55:{name:'ICC System Related Data',fmt:'b..255 · LLLVAR',origin:'Chip / terminal / emisor',manual:'Mastercard M/Chip Requirements—for Contact and Contactless · 29 April 2025',page:318,translated:'Contiene datos ICC/EMV requeridos por el perfil Mastercard.'}
    },
    amex: {}
  };

  function ensureModal(){
    if(document.getElementById('oscHelpModal')) return;
    const style=document.createElement('style');
    style.textContent=`
      .osc-help-wrap{position:relative;display:block;min-width:0}
      .osc-help-wrap>[data-entry],.osc-help-wrap>[data-atm-entry]{width:100%;height:100%}
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
    const label=net==='mastercard'?'Mastercard':net==='amex'?'American Express':'Visa';
    const ref=(refs[net]||{})[Number(de)];
    if(!ref){
      show(`📘 DE${de} · Referencia técnica`,`<span class="osc-help-chip">${label}</span><span class="osc-help-chip">DE${de}</span>
        <p class="osc-ref-pending"><b>Referencia exacta pendiente de mapeo.</b></p>
        <p>OSC Academy no inventa capítulo ni página. Esta combinación se habilitará cuando la referencia exacta quede validada contra el manual correspondiente.</p>`);
      return;
    }
    show(`📘 DE${de} — ${ref.name}`,`<span class="osc-help-chip">${label}</span><span class="osc-help-chip">DE${de}</span>
      <p><b>Nombre oficial:</b> ${ref.name}</p><p><b>Formato / longitud:</b> ${ref.fmt}<br><b>Origen:</b> ${ref.origin}</p>
      <div class="osc-help-note"><b>Explicación en español</b><br>${ref.translated}</div>
      <div class="osc-help-source"><b>Fuente:</b> ${ref.manual}<br><b>Página:</b> ${ref.page}</div>
      <p style="margin-top:10px;color:#86a4b8">El nombre oficial se conserva en inglés; la explicación se presenta traducida/resumida con fines educativos.</p>`);
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
    if(el.matches?.('[data-entry],[data-atm-entry]')){
      wrap=document.createElement('span');
      wrap.className='osc-help-wrap';
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
    if(el.matches?.('[data-entry],[data-atm-entry]')) wrap.appendChild(b);
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
  }
  window.OSCHelp={contextual,refs,openContext,openTechnical,decorateContext,selectedNetwork};
  document.addEventListener('DOMContentLoaded',()=>{ensureModal();decorateContext()});
})();
