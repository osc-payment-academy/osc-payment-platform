
(() => {
  const $ = id => document.getElementById(id);

  const state = {
    step:'amount',
    currentOperation:'purchase',
    amountDigits:'',
    pinDigits:'',
    pinBlock:null,
    entryMode:null,
    responseCode:'00',
    transactions:0,
    sessionStarted:Date.now(),
    currentStan:null,
    currentAuth:null,
    messages:[],
    selectedMessageId:null,
    terminalModel:'ingenico',
    batchNumber:1,
    batchOpen:true,
    operations:[],
    selectedSourceOperationId:null,
    modalMode:null,
    network:'auto',
    pan:'4111111111111111',
    paymentMethod:'card',
    testCard:'visa-credit',
    qrType:'mastercard-qr',
    showIsoTicket:true
  };


  const TEST_CARDS = {
    'visa-credit':{id:'visa-credit',label:'Visa Crédito',network:'visa',product:'Crédito',pan:'4111111111111111',expiry:'2912',track2:'4111111111111111=29122011234567890',aid:'A0000000031010'},
    'visa-debit':{id:'visa-debit',label:'Visa Débito',network:'visa',product:'Débito',pan:'4000000000000002',expiry:'2912',track2:'4000000000000002=29122011234567890',aid:'A0000000032010'},
    'mc-credit':{id:'mc-credit',label:'Mastercard Crédito',network:'mastercard',product:'Crédito',pan:'5555555555554444',expiry:'2912',track2:'5555555555554444=29122011234567890',aid:'A0000000041010'},
    'mc-debit':{id:'mc-debit',label:'Mastercard Débito',network:'mastercard',product:'Débito',pan:'2223000048408210',expiry:'2912',track2:'2223000048408210=29122011234567890',aid:'A0000000043060'}
  };
  const QR_PROFILES = {
    'mastercard-qr':{label:'Mastercard QR',network:'mastercard',card:'mc-credit',mode:'Merchant Presented'},
    'visa-qr':{label:'Visa QR',network:'visa',card:'visa-credit',mode:'Merchant Presented'}
  };
  const selectedCard = () => TEST_CARDS[state.testCard] || TEST_CARDS['visa-credit'];
  const selectedQr = () => QR_PROFILES[state.qrType] || QR_PROFILES['mastercard-qr'];
  function syncPaymentProfile(){
    const card = state.paymentMethod==='qr' ? TEST_CARDS[selectedQr().card] : selectedCard();
    state.pan=card.pan; state.network=card.network;
  }

  function selectTestCard(cardId,{resetFlow=true}={}){
    if(!TEST_CARDS[cardId]) return;
    state.testCard=cardId;
    const card=TEST_CARDS[cardId];
    state.pan=card.pan;
    state.network=card.network;
    document.querySelectorAll('[data-test-card]').forEach(button=>{
      const active=button.dataset.testCard===cardId;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
    const summary=$('selectedTestCardSummary');
    if(summary) summary.textContent=`${card.label} · PAN asignado automáticamente · •••• ${card.pan.slice(-4)} · BIN ${card.pan.slice(0,6)}`;
    refreshNetworkProfile();
    if(resetFlow) reset();
    return card;
  }
  // Public API used by inline controls. This avoids event-binding/cache issues in deployed static assets.
  window.OSCSelectTestCard = function(cardId){
    return selectTestCard(cardId,{resetFlow:true});
  };

  const entryModes = {
    chip:{label:'Chip EMV',de22:'051',hasPin:true,hasDE55:true,hasDE35:true,de35Origin:'Track 2 Equivalent Data del chip'},
    contactless:{label:'Contactless EMV',de22:'071',hasPin:false,hasDE55:true,hasDE35:true,de35Origin:'Track 2 Equivalent Data contactless'},
    magstripe:{label:'Banda magnética',de22:'021',hasPin:true,hasDE55:false,hasDE35:true,de35Origin:'Track 2 leído de la banda'},
    manual:{label:'Ingreso manual',de22:'011',hasPin:false,hasDE55:false,hasDE35:false,de35Origin:'No aplica'}
  };

  const terminalModels = {
    ingenico:{brand:'ingenico',model:'ICT250'},
    verifone:{brand:'VERIFONE',model:'VX520'},
    pax:{brand:'PAX',model:'A920'},
    android:{brand:'OSC SMART POS',model:'ANDROID'}
  };

  const scenarios = {
    '00':{label:'APROBADA',detail:'TRANSACCIÓN COMPLETADA'},
    '51':{label:'FONDOS INSUFICIENTES',detail:'TRANSACCIÓN RECHAZADA'},
    '54':{label:'TARJETA VENCIDA',detail:'TRANSACCIÓN RECHAZADA'},
    '05':{label:'NO APROBAR',detail:'TRANSACCIÓN RECHAZADA'},
    '91':{label:'EMISOR NO DISPONIBLE',detail:'TRANSACCIÓN RECHAZADA'},
    'TO':{label:'SIN RESPUESTA',detail:'TIME OUT'}
  };

  const operationLabels = {
    purchase:'COMPRA',
    reversal:'REVERSA',
    void:'ANULACIÓN',
    batch:'CIERRE'
  };

  const formatAmount = digits =>
    (Number(digits || '0') / 100).toLocaleString('es-AR',{style:'currency',currency:'ARS'});
  const formatCents = cents =>
    (Number(cents || 0) / 100).toLocaleString('es-AR',{style:'currency',currency:'ARS'});

  const now = () => new Date();
  const timeNow = () => now().toLocaleTimeString('es-AR',{hour12:false});
  const dateTimeNow = () => `${now().toLocaleDateString('es-AR')} ${timeNow()}`;
  const de7Now = () => {
    const d=now();
    return [
      String(d.getMonth()+1).padStart(2,'0'),
      String(d.getDate()).padStart(2,'0'),
      String(d.getHours()).padStart(2,'0'),
      String(d.getMinutes()).padStart(2,'0'),
      String(d.getSeconds()).padStart(2,'0')
    ].join('');
  };
  const random6 = () => String(Math.floor(100000+Math.random()*900000));
  const createPinBlock = () => Array.from({length:16},()=>Math.floor(Math.random()*16).toString(16).toUpperCase()).join('');
  const profile = () => window.OSCNetworks ? OSCNetworks.resolve(state.network,state.pan) : {id:'visa',name:'Visa',short:'VISA'};
  const field = (de,name,value,length,format,origin='POS') => [String(de),name,String(value),String(length),format,origin];

  function amountField(amountDigits=state.amountDigits){
    return field(4,'Transaction Amount',String(amountDigits||'0').padStart(12,'0'),'12','FIXED','Monto de la operación');
  }

  function entryFields(){
    const mode=entryModes[state.entryMode]||entryModes.chip;
    const rows=[
      field(2,'Primary Account Number (PAN)',state.pan,String(state.pan.length),'LLVAR',state.paymentMethod==='qr'?'Credencial/token de la wallet':'Tarjeta'),
      field(3,'Processing Code','000000','6','FIXED','Aplicación POS'),
      amountField(),
      field(14,'Expiration Date',selectedCard().expiry,'4','FIXED',state.paymentMethod==='qr'?'Credencial asociada':'Tarjeta'),
      field(22,'Point of Service Entry Mode',state.paymentMethod==='qr'?'010':mode.de22,'3','FIXED',state.paymentMethod==='qr'?'QR educativo / wallet':mode.label),
      field(25,'Point of Service Condition Code','00','2','FIXED','Aplicación POS'),
      field(41,'Terminal ID','TERMID01','8','FIXED','Configuración terminal'),
      field(42,'Merchant ID','MERCHANT01','10','FIXED','Configuración comercio'),
      field(49,'Transaction Currency Code','032','3','FIXED','Configuración comercio')
    ];
    if(state.paymentMethod!=='qr' && mode.hasDE35) rows.push(field(35,'Track 2 Data',selectedCard().track2,String(selectedCard().track2.length),'LLVAR',mode.de35Origin));
    if(state.paymentMethod!=='qr' && mode.hasDE55) rows.push(field(55,'ICC Data (EMV)','9F2608A1B2C3D4E5F607','20','LLLVAR',mode.label));
    if(state.paymentMethod==='qr') rows.push(field(48,'Additional Data - QR',`QR|${selectedQr().mode}|${profile().name}`,'Variable','LLLVAR','Wallet / aplicación QR'));
    return rows;
  }

  function purchaseRequestFields(){
    const mode=entryModes[state.entryMode]||entryModes.chip;
    const rows=entryFields();
    rows.splice(3,0,
      field(7,'Transmission Date & Time',de7Now(),'10','FIXED','Reloj del sistema'),
      field(11,'System Trace Audit Number (STAN)',state.currentStan,'6','FIXED','Generado por el POS')
    );
    if(mode.hasPin){
      rows.push(field(52,'PIN Data (Encrypted PIN Block)',state.pinBlock||'—','8 bytes','B64','PIN cifrado'));
      rows.push(field(53,'Security-Related Control Information','2000000000000000','16','FIXED','Seguridad PIN'));
    }
    return rows.sort((a,b)=>Number(a[0])-Number(b[0]));
  }

  function purchaseResponseFields(code, operation){
    const rows=[
      field(2,'Primary Account Number (PAN)',state.pan,'16','LLVAR','Eco de solicitud'),
      field(3,'Processing Code','000000','6','FIXED','Eco de solicitud'),
      amountField(operation.amountDigits),
      field(7,'Transmission Date & Time',de7Now(),'10','FIXED','Host'),
      field(11,'System Trace Audit Number (STAN)',operation.stan,'6','FIXED','Eco de solicitud'),
      field(37,'Retrieval Reference Number',operation.rrn,'12','FIXED','Host'),
      field(39,'Response Code',code,'2','FIXED','Host emisor'),
      field(41,'Terminal ID','TERMID01','8','FIXED','Eco de solicitud'),
      field(42,'Merchant ID','MERCHANT01','10','FIXED','Eco de solicitud'),
      field(49,'Transaction Currency Code','032','3','FIXED','Eco de solicitud')
    ];
    if(code==='00') rows.splice(6,0,field(38,'Authorization Identification Response',operation.auth,'6','FIXED','Host emisor'));
    return rows;
  }

  function originalDataElements(source, originalMti='0200'){
    return `${originalMti}${source.stan}${source.de7}${String(source.acquirerId||'12345678901').padStart(11,'0')}`.padEnd(42,'0').slice(0,42);
  }

  function reversalRequestFields(source){
    return [
      field(2,'Primary Account Number (PAN)',state.pan,'16','LLVAR','Operación original'),
      field(3,'Processing Code','000000','6','FIXED','Operación original'),
      amountField(source.amountDigits),
      field(7,'Transmission Date & Time',de7Now(),'10','FIXED','Reloj del sistema'),
      field(11,'System Trace Audit Number (STAN)',state.currentStan,'6','FIXED','Nueva reversa'),
      field(37,'Retrieval Reference Number',source.rrn,'12','FIXED','Operación original'),
      field(41,'Terminal ID','TERMID01','8','FIXED','Configuración terminal'),
      field(42,'Merchant ID','MERCHANT01','10','FIXED','Configuración comercio'),
      field(49,'Transaction Currency Code','032','3','FIXED','Operación original'),
      field(90,'Original Data Elements',originalDataElements(source),'42','FIXED','Relación con 0200 original')
    ];
  }

  function reversalResponseFields(source, code){
    const rows=reversalRequestFields(source).filter(r=>!['90'].includes(r[0]));
    rows.push(field(39,'Response Code',code,'2','FIXED','Host'));
    return rows.sort((a,b)=>Number(a[0])-Number(b[0]));
  }

  function voidRequestFields(source){
    return [
      field(2,'Primary Account Number (PAN)',state.pan,'16','LLVAR','Operación original'),
      field(3,'Processing Code','020000','6','FIXED','Anulación'),
      amountField(source.amountDigits),
      field(7,'Transmission Date & Time',de7Now(),'10','FIXED','Reloj del sistema'),
      field(11,'System Trace Audit Number (STAN)',state.currentStan,'6','FIXED','Nueva anulación'),
      field(37,'Retrieval Reference Number',source.rrn,'12','FIXED','Operación original'),
      field(38,'Authorization Identification Response',source.auth,'6','FIXED','Autorización original'),
      field(41,'Terminal ID','TERMID01','8','FIXED','Configuración terminal'),
      field(42,'Merchant ID','MERCHANT01','10','FIXED','Configuración comercio'),
      field(49,'Transaction Currency Code','032','3','FIXED','Operación original'),
      field(90,'Original Data Elements',originalDataElements(source),'42','FIXED','Relación con 0200 original')
    ];
  }

  function voidResponseFields(source,code){
    const rows=voidRequestFields(source).filter(r=>r[0]!=='90');
    rows.push(field(39,'Response Code',code,'2','FIXED','Host'));
    return rows.sort((a,b)=>Number(a[0])-Number(b[0]));
  }

  function batchRequestFields(summary){
    return [
      field(3,'Processing Code','920000','6','FIXED','Cierre de lote'),
      field(7,'Transmission Date & Time',de7Now(),'10','FIXED','Reloj del sistema'),
      field(11,'System Trace Audit Number (STAN)',state.currentStan,'6','FIXED','Generado por el POS'),
      field(41,'Terminal ID','TERMID01','8','FIXED','Configuración terminal'),
      field(42,'Merchant ID','MERCHANT01','10','FIXED','Configuración comercio'),
      field(48,'Additional Data - Private',`BATCH=${state.batchNumber};COUNT=${summary.approvedCount};TOTAL=${summary.netCents}`,'LLLVAR','ANS','Totales de lote'),
      field(60,'Reserved Private',String(state.batchNumber).padStart(6,'0'),'6','FIXED','Número de lote')
    ];
  }

  function batchResponseFields(summary,code){
    return [
      field(3,'Processing Code','920000','6','FIXED','Eco de solicitud'),
      field(7,'Transmission Date & Time',de7Now(),'10','FIXED','Host'),
      field(11,'System Trace Audit Number (STAN)',state.currentStan,'6','FIXED','Eco de solicitud'),
      field(39,'Response Code',code,'2','FIXED','Host'),
      field(41,'Terminal ID','TERMID01','8','FIXED','Eco de solicitud'),
      field(48,'Additional Data - Private',`BATCH=${state.batchNumber};STATUS=CLOSED;NET=${summary.netCents}`,'LLLVAR','ANS','Confirmación de cierre'),
      field(60,'Reserved Private',String(state.batchNumber).padStart(6,'0'),'6','FIXED','Número de lote')
    ];
  }

  function activeBits(fields){return new Set(fields.map(r=>Number(r[0])))}
  function bitmapHex(fields){
    document.querySelectorAll('#deTable .de-learning-row').forEach(row=>row.addEventListener('click',()=>openConceptDiscovery(row.dataset.de)));
    const bits=activeBits(fields);
    const hasSecondary=[...bits].some(bit=>bit>64);
    if(hasSecondary) bits.add(1);
    const limit=hasSecondary?128:64;
    let binary='';
    for(let i=1;i<=limit;i++) binary+=bits.has(i)?'1':'0';
    return binary.match(/.{4}/g).map(n=>parseInt(n,2).toString(16).toUpperCase()).join('');
  }


  function bitmapBitsHtml(fields,startBit=1,count=64){
    const bits=activeBits(fields);
    if([...bits].some(bit=>bit>64)) bits.add(1);
    return Array.from({length:count},(_,index)=>{
      const bit=startBit+index;
      return `<i data-bit="${bit}" class="${bits.has(bit)?'on':''}" title="Bit ${bit}${bits.has(bit)?' presente':' ausente'}"></i>`;
    }).join('');
  }

  function fieldsLabel(fields){
    if(!fields?.length)return 'Sin campos';
    return fields.map(row=>`DE${row[0]}`).join(' · ');
  }

  function latestMessage(mti){
    return state.messages.find(message=>message.mti===mti);
  }

  function updateDualBitmaps(){
    const message=state.messages.find(item=>item.id===state.selectedMessageId) || state.messages[0];
    const fields=message?.fields||[];
    const hasSecondary=fields.some(row=>Number(row[0])>64);
    const primaryHex=message?.bitmap?.slice(0,16)||'0000000000000000';
    const secondaryHex=hasSecondary?(message?.bitmap?.slice(16,32)||'0000000000000000'):'0000000000000000';
    const primary=document.getElementById('selectedBitmapPrimaryBits');
    if(primary) primary.innerHTML=bitmapBitsHtml(fields,1,64);
    const secondary=document.getElementById('selectedBitmapSecondaryBits');
    if(secondary) secondary.innerHTML=bitmapBitsHtml(fields,65,64);
    const wrap=document.getElementById('selectedBitmapSecondaryWrap');
    if(wrap) wrap.classList.add('hidden');
    const pHex=document.getElementById('selectedBitmapPrimaryHex');
    if(pHex) pHex.textContent=primaryHex;
    const sHex=document.getElementById('selectedBitmapSecondaryHex');
    if(sHex) sHex.textContent=secondaryHex;
    const label=document.getElementById('selectedBitmapFields');
    if(label) label.textContent=message?`${message.mti} · ${fields.length} campos presentes`:'Sin mensaje seleccionado';
  }

  function highlightDataElement(de){
    document.querySelectorAll('#deTable tr').forEach(row=>{
      row.classList.toggle('de-highlight',row.firstElementChild?.textContent===String(de));
    });
    document.querySelectorAll('.ticket-link').forEach(el=>el.classList.toggle('active',el.dataset.de===String(de)));
    const row=[...document.querySelectorAll('#deTable tr')].find(item=>item.firstElementChild?.textContent===String(de));
    row?.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function ticketHtml(op){
    const source=op.sourceOperationId?state.operations.find(item=>item.id===op.sourceOperationId):null;
    const mode=entryModes[op.entryMode||state.entryMode]||entryModes.chip;
    const status=op.status==='APROBADA'?'APROBADO':op.status;
    const date=new Date(op.createdAt||Date.now());
    const card=TEST_CARDS[op.cardId]||selectedCard();
    const p=window.OSCNetworks?OSCNetworks.profiles[op.network]||profile():profile();
    const isQr=op.paymentMethod==='qr';
    const paymentLabel=isQr?(QR_PROFILES[op.qrType]?.label||'QR'):`${card.label}`;
    const readingLabel=isQr?'QR · WALLET':mode.label.toUpperCase();
    const aid=isQr?'NO APLICA':(mode.hasDE55?card.aid:'NO APLICA');
    const selectedMessage=state.messages.find(m=>m.operationId===op.id && m.mti==='0210')||state.messages.find(m=>m.operationId===op.id);
    const isoRows=(selectedMessage?.fields||[]).filter(r=>['2','3','4','7','11','14','22','35','37','38','39','48','55'].includes(String(r[0])));
    const isoBlock=state.showIsoTicket?`<div class="ticket-iso"><strong>INFORMACIÓN ISO8583</strong>${selectedMessage?`<div><span>MTI</span><b>${selectedMessage.mti}</b></div>`:''}${isoRows.map(r=>`<div><span>DE${r[0]}</span><b>${r[0]==='2'?String(r[2]).replace(/.(?=.{4})/g,'•'):r[2]}</b></div>`).join('')}</div>`:'';
    const brandClass=isQr?'qr':p.id;
    const brandMain=isQr?'QR':p.short;
    const brandSub=isQr?paymentLabel:p.name;
    const operationLabel=op.type==='purchase'?(card.product==='Débito'?'COMPRA DÉBITO':'COMPRA CRÉDITO'):(operationLabels[op.type]||'OPERACIÓN');
    return `
      <div class="ticket-network ticket-network-${brandClass}"><span>${brandMain}</span><small>${brandSub}</small></div>
      <div class="ticket-merchant">
        <strong>LA PERLA COFFEE</strong>
        <span>CUIT: 30-23566776-5</span>
        <span>Olazábal 3020</span>
        <span>Recoleta · Capital Federal · Argentina</span>
      </div>
      <div class="ticket-separator"></div>
      <div class="ticket-kv"><span>FECHA</span><b>${date.toLocaleDateString('es-AR')}</b></div>
      <div class="ticket-kv"><span>HORA</span><b>${date.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</b></div>
      <div class="ticket-kv"><span>TICKET N°</span><b>${String(date.getTime()).slice(-6)}</b></div>
      <div class="ticket-kv"><span>TERMINAL</span><b>TERMID01</b></div>
      <div class="ticket-kv"><span>LOTE</span><b>${String(op.batch).padStart(4,'0')}</b></div>
      <div class="ticket-separator"></div>
      <div class="ticket-operation">${operationLabel}</div>
      <div class="ticket-box">
        <div class="ticket-total"><strong>Total</strong><b class="ticket-link" data-de="4">${formatCents(op.amountCents)}</b></div>
        <div class="ticket-installments">Cuotas <span>(1 x ${formatCents(op.amountCents)})</span></div>
        <div class="ticket-status ticket-link" data-de="39">${status}</div>
      </div>
      <div class="ticket-card-block">
        <strong>${paymentLabel.toUpperCase()}</strong>
        <b>•••• •••• •••• ${String(op.pan||card.pan).slice(-4)}</b>
      </div>
      <div class="ticket-kv"><span>MODO DE LECTURA</span><b>${readingLabel}</b></div>
      <div class="ticket-kv"><span>AID</span><b>${aid}</b></div>
      <div class="ticket-kv"><span>TVR</span><b>${isQr?'NO APLICA':'0000000000'}</b></div>
      <div class="ticket-kv"><span>TSI</span><b>${isQr?'NO APLICA':'E800'}</b></div>
      <div class="ticket-kv"><span>CVM</span><b>${isQr?'WALLET':'1A0300'}</b></div>
      <div class="ticket-separator"></div>
      <div class="ticket-auth"><span>Autorización</span><b class="ticket-link" data-de="38">${op.auth||'—'}</b></div>
      <div class="ticket-auth"><span>STAN</span><b class="ticket-link" data-de="11">${op.stan||'—'}</b></div>
      <div class="ticket-auth"><span>RRN</span><b class="ticket-link" data-de="37">${op.rrn||'—'}</b></div>
      ${source?`<div class="ticket-auth"><span>Original</span><b>${source.stan}</b></div>`:''}
      <div class="ticket-thanks"><strong>¡GRACIAS!</strong><span>CONSERVE ESTE COMPROBANTE</span></div>
      ${isoBlock}
      <div class="ticket-disclaimer">POS Virtual · Ticket educativo · Datos ficticios</div>`;
  }

  function downloadTicket(){
    const paper=$('receiptPaper');
    if(!paper.innerHTML.trim()){alert('Primero complete una operación.');return}
    const documentHtml=`<!doctype html><html><head><meta charset="utf-8"><title>Ticket OSC Academy</title>
    <style>body{font-family:Arial;padding:30px}.ticket{width:310px;margin:auto;border:1px solid #aaa;padding:20px}
    .ticket-head,.ticket-total{display:flex;justify-content:space-between}.ticket-box{border:1px solid #555;margin:12px 0}
    .ticket-total,.ticket-installments,.ticket-status{padding:9px}.ticket-status{text-align:center;border-top:1px solid #555;font-weight:bold}
    .ticket-meta,.ticket-foot{font-size:12px;line-height:1.5}.ticket-badge{background:#111;color:#fff;padding:4px}</style></head>
    <body><div class="ticket">${paper.innerHTML}</div></body></html>`;
    const blob=new Blob([documentHtml],{type:'text/html;charset=utf-8'});
    const anchor=document.createElement('a');
    anchor.href=URL.createObjectURL(blob);
    anchor.download=`ticket-osc-${Date.now()}.html`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }


  const discoveryConcepts={
    '55':{title:'DE55 — ICC System Related Data',summary:'Contiene datos EMV codificados en formato TLV. Puede incluir tags como 9F26, 95, 82, 9F10, 9F36 y 9F37.',lab:'Contactless, DE55 y ARQC'},
    '52':{title:'DE52 — Personal Identification Number Data',summary:'Transporta el PIN Block cifrado. Su construcción y protección se relacionan con HSM, llaves y PCI PIN.',lab:'Seguridad, HSM y PIN Block'},
    '35':{title:'DE35 — Track 2 Data',summary:'Representa datos capturados de banda o equivalentes y requiere tratamiento seguro por contener información sensible.',lab:'Seguridad de datos de tarjeta'},
    '38':{title:'DE38 — Authorization Identification Response',summary:'Código asignado en una aprobación y utilizado posteriormente para trazabilidad y clearing.',lab:'Ciclo completo de una transacción'},
    '39':{title:'DE39 — Response Code',summary:'Expresa la decisión de autorización o el resultado del procesamiento.',lab:'Escenarios y respuestas'}
  };
  function ensureDiscoveryModal(){
    let modal=document.getElementById('conceptDiscoveryModal');if(modal)return modal;
    modal=document.createElement('div');modal.id='conceptDiscoveryModal';modal.className='concept-discovery hidden';
    modal.innerHTML=`<div class="concept-dialog"><button class="concept-close" type="button">✕</button><span class="concept-kicker">🔬 NUEVO CONCEPTO DESCUBIERTO</span><h2 id="conceptTitle"></h2><p id="conceptSummary"></p><div class="concept-lab"><span>Próximo nivel</span><strong id="conceptLab"></strong><small>Este tema forma parte del Laboratorio de Investigación.</small></div><div class="concept-actions"><button id="conceptInterest" type="button">👍 Me interesa</button><a href="research.html">Ver investigación →</a></div></div>`;
    document.body.appendChild(modal);modal.querySelector('.concept-close').onclick=()=>modal.classList.add('hidden');modal.onclick=e=>{if(e.target===modal)modal.classList.add('hidden')};return modal;
  }
  function openConceptDiscovery(de){
    const concept=discoveryConcepts[String(de)];if(!concept)return;
    const modal=ensureDiscoveryModal();modal.querySelector('#conceptTitle').textContent=concept.title;modal.querySelector('#conceptSummary').textContent=concept.summary;modal.querySelector('#conceptLab').textContent=concept.lab;
    const interest=modal.querySelector('#conceptInterest');interest.textContent='👍 Me interesa';interest.disabled=false;interest.onclick=()=>{const key='oscConceptInterest'+de;localStorage.setItem(key,String(Number(localStorage.getItem(key)||0)+1));interest.textContent='✓ Interés registrado';interest.disabled=true};modal.classList.remove('hidden');
  }

  function renderFields(fields){
    $('deTable').innerHTML=fields.length
      ?fields.map(r=>`<tr data-de="${String(r[0]).replace('DE','')}" class="de-learning-row">${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')
      :`<tr><td colspan="6" style="text-align:center;color:#7f93a8;padding:22px">Los campos se activarán paso a paso durante la operación.</td></tr>`;
    $('deCount').textContent=fields.length; const fc=document.getElementById('fieldCount'); if(fc) fc.textContent=fields.length;
    $('totalLength').textContent=fields.length?`${fields.reduce((a,r)=>a+(parseInt(r[3])||8),0)} bytes`:'0 bytes';
    const bits=activeBits(fields);
    const shown=[1,2,3,4,7,11,14,22,25,35,37,38,39,41,42,48,49,52,53,55,60,64,90];
    $('bitmap').textContent=fields.length?bitmapHex(fields):'0000000000000000';
  }

  function renderMessage(message){
    if(!message)return;
    state.selectedMessageId=message.id;
    $('mti').textContent=message.mti;
    $('messageSubtitle').textContent=`${message.mti} - ${message.operation} ${message.direction==='SALIENTE'?'Request':'Response'}`;
    renderFields(message.fields);
    $('bitmap').textContent=message.bitmap;
    document.querySelectorAll('#historyBody tr').forEach(tr=>tr.classList.toggle('selected',tr.dataset.id===message.id));
    updateDualBitmaps();
  }

  function addMessage(message){
    state.messages.unshift(message);
    const tr=document.createElement('tr');
    tr.dataset.id=message.id;
    const op=state.operations.find(o=>o.id===message.operationId);
    tr.innerHTML=`
      <td>${message.dateTime}</td>
      <td>${((op?.network||'').toLowerCase()==='mastercard')?'<span class="brand-logo mc-mark" title="Mastercard"><i></i><i></i></span>':'<span class="brand-logo visa-mark" title="Visa">VISA</span>'}</td>
      <td class="${message.direction==='SALIENTE'?'direction-out':'direction-in'}">${message.direction}</td>
      <td><span class="message-badge">${message.mti}</span></td>
      <td><span class="operation-tag">${message.operation}</span></td>
      <td>${message.amountCents!=null?formatCents(message.amountCents):'—'}</td>
      <td>${message.responseCode||'—'}</td>
      <td>${message.stan||'—'}</td>
      <td>${message.batch||state.batchNumber}</td>
      <td class="${statusClass(op?.status)}">${op?.status||'EN PROCESO'}</td>`;
    tr.addEventListener('click',()=>renderMessage(message));
    $('historyBody').prepend(tr);
    updateDualBitmaps();
  }

  function refreshHistoryStatuses(){
    document.querySelectorAll('#historyBody tr').forEach(tr=>{
      const msg=state.messages.find(m=>m.id===tr.dataset.id);
      const op=msg?state.operations.find(o=>o.id===msg.operationId):null;
      const cell=tr.children[8];
      if(cell&&op){cell.textContent=op.status;cell.className=statusClass(op.status);}
    });
  }

  function statusClass(status){
    if(status==='APROBADA')return'status-approved';
    if(status==='REVERSADA')return'status-reversed';
    if(status==='ANULADA')return'status-voided';
    if(status==='LOTE CERRADO')return'status-closed';
    return'';
  }

  function persistSwitchTransaction(op){
    if(!window.OSCSwitchStore||!op||op.type==='batch')return;
    const network=(window.OSCNetworks&&window.OSCNetworks.detect(state.pan)?.key)||((state.pan||'').startsWith('4')?'VISA':'MASTERCARD');
    const req=state.messages.find(m=>m.operationId===op.id && /00$/.test(m.mti));
    const res=state.messages.find(m=>m.operationId===op.id && /10$/.test(m.mti));
    window.OSCSwitchStore.addTransaction({id:op.id,channel:'POS',network,type:op.type,amountCents:op.amountCents,status:op.status||'APPROVED',responseCode:op.responseCode||state.responseCode||'00',stan:op.stan,rrn:op.rrn,auth:op.auth,batch:op.batch,closed:op.closed,clearingStatus:op.closed?'READY':'PENDING',mtiRequest:req?.mti||'0200',mtiResponse:res?.mti||'0210',panLast4:(state.pan||'').slice(-4),raw:req?rawMessage(req):null,requestFields:req?.fields||null,responseFields:res?.fields||null,operationLabel:op.type||'purchase',dateTime:op.createdAt||new Date().toISOString()});
  }
  function restoreWorkspaceHistory(){
    if(!window.OSCSwitchStore) return;
    const db=window.OSCSwitchStore.read();
    const txs=(db.transactions||[]).filter(t=>t.channel==='POS').slice().reverse();
    if(!txs.length) return;
    state.operations=[]; state.messages=[]; $('historyBody').innerHTML='';
    txs.forEach((tx,index)=>{
      const op={
        id:tx.id,type:tx.type||'purchase',amountDigits:String(tx.amountCents||0),amountCents:Number(tx.amountCents||0),
        stan:tx.stan||'',auth:tx.auth||'',rrn:tx.rrn||'',batch:Number(tx.batch||1),
        status:tx.status==='APPROVED'?'APROBADA':(tx.status||'APROBADA'),closed:Boolean(tx.closed),
        createdAt:tx.createdAt||tx.dateTime||new Date().toISOString(),responseCode:tx.responseCode||'00'
      };
      state.operations.unshift(op);
      const reqFields=Array.isArray(tx.requestFields)?tx.requestFields:[
        field(3,'Processing Code','000000','6','FIXED','Restaurado'),
        field(4,'Transaction Amount',String(tx.amountCents||0).padStart(12,'0'),'12','FIXED','Restaurado'),
        field(11,'System Trace Audit Number (STAN)',tx.stan||'','6','FIXED','Restaurado'),
        field(37,'Retrieval Reference Number',tx.rrn||'','12','FIXED','Restaurado'),
        field(39,'Response Code',tx.responseCode||'00','2','FIXED','Restaurado')
      ];
      const resFields=Array.isArray(tx.responseFields)?tx.responseFields:reqFields;
      const dateLabel=new Date(tx.createdAt||Date.now()).toLocaleString('es-AR');
      const req={id:`REST-${tx.id}-REQ`,operationId:tx.id,mti:tx.mtiRequest||'0200',operation:(tx.type||'purchase').toUpperCase(),direction:'SALIENTE',dateTime:dateLabel,responseCode:'',fields:reqFields,bitmap:bitmapHex(reqFields),amountCents:tx.amountCents,stan:tx.stan,batch:tx.batch};
      const res={id:`REST-${tx.id}-RES`,operationId:tx.id,mti:tx.mtiResponse||'0210',operation:(tx.type||'purchase').toUpperCase(),direction:'ENTRANTE',dateTime:dateLabel,responseCode:tx.responseCode||'00',fields:resFields,bitmap:bitmapHex(resFields),amountCents:tx.amountCents,stan:tx.stan,batch:tx.batch};
      state.messages.unshift(req,res); addMessage(req); addMessage(res);
    });
    state.batchNumber=Math.max(1,...txs.map(t=>Number(t.batch||1)));
    $('sessionTx').textContent=txs.length;
    if(state.messages.length) renderMessage(state.messages[0]);
  }

  function createOperation(type,source=null){
    const amountDigits=source?source.amountDigits:state.amountDigits;
    const op={
      id:`OP-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      amountDigits,
      amountCents:Number(amountDigits||0),
      stan:state.currentStan,
      auth:state.currentAuth||'',
      rrn:source?.rrn||`${state.currentStan}${String(Date.now()).slice(-6)}`.slice(0,12),
      de7:de7Now(),
      acquirerId:'12345678901',
      batch:state.batchNumber,
      status:'EN PROCESO',
      sourceOperationId:source?.id||null,
      createdAt:new Date().toISOString(),
      paymentMethod:state.paymentMethod,
      cardId:state.testCard,
      qrType:state.qrType,
      network:profile().id,
      pan:state.pan,
      entryMode:state.entryMode
    };
    state.operations.push(op);
    return op;
  }

  function setStep(n){
    document.querySelectorAll('.flow-list article').forEach((el,index)=>{
      el.classList.toggle('active',index===n-1);
      el.classList.toggle('done',index<n-1);
    });
  }

  function screen(title,html){
    $('screenTitle').textContent=title;
    $('screenContent').innerHTML=html;
  }

  function updateAmount(){
    const amount=formatAmount(state.amountDigits);
    const el=$('screenAmount');if(el)el.textContent=amount;
    $('flowAmount').textContent=amount;
    renderFields(state.amountDigits?[field(3,'Processing Code','000000','6','FIXED','Aplicación POS'),amountField()]:[]);
  }

  function pressNumber(key){
    if(state.step==='amount'){
      if(state.amountDigits.length<10)state.amountDigits+=key;
      updateAmount();
    }else if(state.step==='pin'){
      if(state.pinDigits.length<6)state.pinDigits+=key;
      if(state.pinDigits.length===1&&!state.pinBlock)state.pinBlock=createPinBlock();
      screen('PIN',`<small>Ingrese PIN</small><strong>${'•'.repeat(state.pinDigits.length)}</strong><span>Presione VERDE para continuar</span>`);
      $('flowPin').textContent='•'.repeat(state.pinDigits.length);
      const f=entryFields();
      f.push(field(52,'PIN Data (Encrypted PIN Block)',state.pinBlock,'8 bytes','B64','PIN cifrado'));
      f.push(field(53,'Security-Related Control Information','2000000000000000','16','FIXED','Seguridad PIN'));
      renderFields(f.sort((a,b)=>Number(a[0])-Number(b[0])));
    }
  }

  function accept(){
    if(state.currentOperation!=='purchase')return;
    if(state.step==='amount'){
      if(!state.amountDigits||Number(state.amountDigits)===0)return;
      $('time1').textContent=timeNow();
      if(state.paymentMethod==='qr'){
        startQrPayment();
      }else{
        state.step='entry';
        $('entryModePanel').classList.remove('hidden');
        screen('FORMA DE CAPTURA','<small>Seleccione</small><strong>TIPO DE ENTRADA</strong><span>Use las opciones debajo</span>');
        setStep(2);
      }
    }else if(state.step==='pin'&&state.pinDigits.length>=4){
      $('time3').textContent=timeNow();
      sendPurchase0200();
    }
  }

  function startQrPayment(){
    state.step='qr'; state.entryMode='qr';
    $('entryModePanel').classList.add('hidden');
    const qr=$('qrStage'); qr.classList.remove('hidden');
    $('qrStageNetwork').textContent=selectedQr().label;
    $('qrStageStatus').textContent='Esperando escaneo desde la wallet…';
    screen('PAGO CON QR',`<small>${selectedQr().mode}</small><strong>${selectedQr().label}</strong><span>Escanee y confirme desde la wallet</span>`);
    setStep(2);
    setTimeout(()=>{
      $('qrStageStatus').textContent='QR escaneado · Confirmando pago…';
      document.querySelector('#step2 strong').textContent='Lectura / Escaneo';
      document.querySelector('#step2 small').textContent=`${selectedQr().label} · Wallet`;
      $('time2').textContent=timeNow();
      $('flowPin').textContent='No requerido'; $('time3').textContent=timeNow();
      renderFields(entryFields().sort((a,b)=>Number(a[0])-Number(b[0])));
      setTimeout(()=>{ qr.classList.add('hidden'); sendPurchase0200(); },1100);
    },1800);
  }

  function startCaptureAnimation(modeKey){
    document.querySelectorAll('[data-entry]').forEach(b=>b.classList.toggle('active',b.dataset.entry===modeKey));
    state.step='capturing';state.entryMode=modeKey;$('entryModePanel').classList.add('hidden');
    const stage=$('captureStage');stage.classList.remove('hidden','success');
    ['captureChip','captureContactless','captureMagstripe','captureManual'].forEach(id=>$(id).classList.add('hidden'));
    const map={chip:['captureChip','Insertando tarjeta con chip…'],contactless:['captureContactless','Leyendo tarjeta contactless…'],magstripe:['captureMagstripe','Leyendo banda magnética…'],manual:['captureManual','Validando datos ingresados…']};
    const [scene,status]=map[modeKey];$(scene).classList.remove('hidden');$('captureStatusText').textContent=status;
    screen('LEYENDO TARJETA',`<small>${entryModes[modeKey].label}</small><strong>...</strong><span>No retire la tarjeta</span>`);
    setTimeout(()=>{
      stage.classList.add('success');$('captureStatusText').textContent='Lectura completada';
      const mode=entryModes[modeKey];$('time2').textContent=timeNow();document.querySelector('#step2 small').textContent=`${profile().name} · ${mode.label}`;
      renderFields(entryFields().sort((a,b)=>Number(a[0])-Number(b[0])));
      setTimeout(()=>{
        stage.classList.add('hidden');
        if(mode.hasPin){state.step='pin';setStep(3);screen('PIN','<small>Ingrese PIN</small><strong></strong><span>Presione VERDE para continuar</span>')}
        else{$('flowPin').textContent='No requerido';$('time3').textContent=timeNow();sendPurchase0200()}
      },650);
    },1500);
  }

  function sendPurchase0200(){
    state.step='processing';state.currentStan=random6();state.currentAuth='';setStep(4);
    const op=createOperation('purchase');
    const fields=purchaseRequestFields();
    renderFields(fields);
    screen('PROCESANDO','<small>Enviando 0200</small><strong>...</strong><span>Aguarde</span>');
    setTimeout(()=>{
      $('time4').textContent=timeNow();
      addMessage({
        id:`MSG-${Date.now()}-0200`,operationId:op.id,mti:'0200',operation:'COMPRA',
        direction:'SALIENTE',dateTime:dateTimeNow(),responseCode:'',fields,bitmap:bitmapHex(fields),
        amountCents:op.amountCents,stan:op.stan,batch:op.batch
      });
      state.selectedSourceOperationId=op.id;state.step='waiting';setStep(5);
      screen('PROCESANDO','<small>Esperando 0210</small><strong>...</strong><span>Aguarde</span>');
    },800);
  }

  function sendPurchaseResponse(){
    if(state.step!=='waiting'||state.currentOperation!=='purchase')return;
    const op=state.operations.find(o=>o.id===state.selectedSourceOperationId);
    const response=scenarios[state.responseCode];
    state.currentAuth=state.responseCode==='00'?random6():'-';
    op.auth=state.currentAuth;op.status=state.responseCode==='00'?'APROBADA':'RECHAZADA';
    $('time5').textContent=timeNow();$('flowResponse').textContent=`${state.responseCode} - ${response.label}`;
    $('resultText').textContent=response.label;$('resultCode').textContent=state.responseCode;$('resultDetail').textContent=response.detail;$('authCode').textContent=state.currentAuth;
    screen(op.status==='APROBADA'?'APROBADA':'RECHAZADA',`<small>${response.label}</small><strong>${state.responseCode}</strong><span>${op.status==='APROBADA'?'Retire tarjeta':'Operación finalizada'}</span>`);
    if(state.responseCode!=='TO'){
      const fields=purchaseResponseFields(state.responseCode,op);
      addMessage({
        id:`MSG-${Date.now()}-0210`,operationId:op.id,mti:'0210',operation:'COMPRA',
        direction:'ENTRANTE',dateTime:dateTimeNow(),responseCode:state.responseCode,fields,bitmap:bitmapHex(fields),
        amountCents:op.amountCents,stan:op.stan,batch:op.batch
      });
      renderMessage(state.messages[0]);
    }else op.status='TIMEOUT';
    setStep(6);
    setTimeout(()=>{$('time6').textContent=timeNow();printReceipt(op);state.transactions++;$('sessionTx').textContent=state.transactions;state.step='done';refreshHistoryStatuses()},600);
  }

  function eligibleOperations(mode){
    return state.operations.filter(op=>{
      if(op.batch!==state.batchNumber)return false;
      if(mode==='reversal')return ['APROBADA','TIMEOUT'].includes(op.status)&&op.type==='purchase';
      if(mode==='void')return op.status==='APROBADA'&&op.type==='purchase';
      return false;
    });
  }

  function openTransactionModal(mode){
    state.modalMode=mode;state.selectedSourceOperationId=null;
    const list=eligibleOperations(mode);
    $('transactionModalTitle').textContent=mode==='reversal'?'Seleccionar compra para reversar':'Seleccionar compra para anular';
    $('transactionModalSubtitle').textContent=mode==='reversal'?'Compras aprobadas o con timeout del lote abierto.':'Solo compras aprobadas del lote abierto.';
    $('transactionSelectionList').innerHTML=list.length?list.map(op=>`
      <div class="transaction-choice" data-op="${op.id}">
        <span>○</span><div><small>${new Date(op.createdAt).toLocaleString('es-AR')} · STAN ${op.stan}</small><strong>${formatCents(op.amountCents)} · Aut. ${op.auth||'—'}</strong></div><b>${op.status}</b>
      </div>`).join(''):'<div class="transaction-choice"><div></div><div><strong>No hay operaciones elegibles.</strong><small>Primero genere una compra aprobada.</small></div></div>';
    $('transactionModal').classList.remove('hidden');
    document.querySelectorAll('.transaction-choice[data-op]').forEach(el=>el.addEventListener('click',()=>{
      document.querySelectorAll('.transaction-choice').forEach(x=>x.classList.remove('selected'));
      el.classList.add('selected');state.selectedSourceOperationId=el.dataset.op;
    }));
  }

  function confirmSelectedOperation(){
    const source=state.operations.find(o=>o.id===state.selectedSourceOperationId);
    if(!source){alert('Seleccione una operación.');return}
    $('transactionModal').classList.add('hidden');
    if(state.modalMode==='reversal')runReversal(source);else runVoid(source);
  }

  function runReversal(source){
    state.currentOperation='reversal';state.currentStan=random6();
    screen('REVERSA','<small>Generando 0400</small><strong>...</strong><span>Aguarde</span>');
    const op=createOperation('reversal',source);op.rrn=source.rrn;
    const req=reversalRequestFields(source);
    addMessage({
      id:`MSG-${Date.now()}-0400`,operationId:op.id,mti:'0400',operation:'REVERSA',
      direction:'SALIENTE',dateTime:dateTimeNow(),responseCode:'',fields:req,bitmap:bitmapHex(req),
      amountCents:op.amountCents,stan:op.stan,batch:op.batch
    });
    setTimeout(()=>{
      const code='00';op.status='APROBADA';source.status='REVERSADA';
      const res=reversalResponseFields(source,code);
      addMessage({
        id:`MSG-${Date.now()}-0410`,operationId:op.id,mti:'0410',operation:'REVERSA',
        direction:'ENTRANTE',dateTime:dateTimeNow(),responseCode:code,fields:res,bitmap:bitmapHex(res),
        amountCents:op.amountCents,stan:op.stan,batch:op.batch
      });
      renderMessage(state.messages[0]);
      screen('REVERSA APROBADA','<small>Operación original reversada</small><strong>00</strong><span>Proceso finalizado</span>');
      printReceipt(op);refreshHistoryStatuses();state.step='done';
    },850);
  }

  function runVoid(source){
    state.currentOperation='void';state.currentStan=random6();
    screen('ANULACIÓN','<small>Enviando solicitud</small><strong>...</strong><span>Aguarde</span>');
    const op=createOperation('void',source);op.rrn=source.rrn;op.auth=source.auth;
    const req=voidRequestFields(source);
    addMessage({
      id:`MSG-${Date.now()}-VOIDREQ`,operationId:op.id,mti:'0200',operation:'ANULACIÓN',
      direction:'SALIENTE',dateTime:dateTimeNow(),responseCode:'',fields:req,bitmap:bitmapHex(req),
      amountCents:op.amountCents,stan:op.stan,batch:op.batch
    });
    setTimeout(()=>{
      const code='00';op.status='APROBADA';source.status='ANULADA';
      const res=voidResponseFields(source,code);
      addMessage({
        id:`MSG-${Date.now()}-VOIDRES`,operationId:op.id,mti:'0210',operation:'ANULACIÓN',
        direction:'ENTRANTE',dateTime:dateTimeNow(),responseCode:code,fields:res,bitmap:bitmapHex(res),
        amountCents:op.amountCents,stan:op.stan,batch:op.batch
      });
      renderMessage(state.messages[0]);
      screen('ANULACIÓN APROBADA','<small>Compra anulada</small><strong>00</strong><span>Proceso finalizado</span>');
      printReceipt(op);refreshHistoryStatuses();state.step='done';
    },850);
  }

  function batchSummary(){
    const batchOps=state.operations.filter(o=>o.batch===state.batchNumber);
    const purchases=batchOps.filter(o=>o.type==='purchase');
    const approved=purchases.filter(o=>o.status==='APROBADA');
    const voided=purchases.filter(o=>o.status==='ANULADA');
    const reversed=purchases.filter(o=>o.status==='REVERSADA');
    const sum=items=>items.reduce((a,o)=>a+(o.amountCents||0),0);
    const byNetwork=network=>{
      const rows=purchases.filter(o=>(o.network||o.cardBrand||'VISA').toUpperCase()===network);
      const ok=rows.filter(o=>o.status==='APROBADA');
      const an=rows.filter(o=>o.status==='ANULADA');
      const rv=rows.filter(o=>o.status==='REVERSADA');
      return {network,approvedCount:ok.length,approvedCents:sum(ok),voidedCount:an.length,voidedCents:sum(an),reversedCount:rv.length,reversedCents:sum(rv),netCents:sum(ok)};
    };
    const approvedCents=sum(approved),voidedCents=sum(voided),reversedCents=sum(reversed);
    return{
      approvedCount:approved.length,voidedCount:voided.length,reversedCount:reversed.length,
      approvedCents,voidedCents,reversedCents,netCents:approvedCents,
      totalMessages:state.messages.filter(m=>m.batch===state.batchNumber).length,
      networks:[byNetwork('VISA'),byNetwork('MASTERCARD')],
      detail:purchases.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''))
    };
  }

  function openBatchModal(){
    const s=batchSummary(),d=new Date();
    const networkRows=s.networks.map(n=>`<div class="batch-network-block"><div class="batch-network-name">${n.network}</div><div class="batch-ticket-row"><span>Aprobadas</span><b>${n.approvedCount} · ${formatCents(n.approvedCents)}</b></div><div class="batch-ticket-row"><span>Anuladas</span><b>${n.voidedCount} · ${formatCents(n.voidedCents)}</b></div><div class="batch-ticket-row"><span>Reversadas</span><b>${n.reversedCount} · ${formatCents(n.reversedCents)}</b></div><div class="batch-ticket-row batch-network-net"><span>Neto</span><b>${formatCents(n.netCents)}</b></div></div>`).join('');
    $('batchSummary').innerHTML=`
      <h3>OSC ACADEMY</h3><h4>CIERRE DE LOTE POS</h4>
      <div class="batch-ticket-row"><span>Terminal</span><b>TERMID01</b></div>
      <div class="batch-ticket-row"><span>Número de lote</span><b>${String(state.batchNumber).padStart(4,'0')}</b></div>
      <div class="batch-ticket-row"><span>Fecha</span><b>${d.toLocaleDateString('es-AR')}</b></div>
      <div class="batch-ticket-row"><span>Hora</span><b>${d.toLocaleTimeString('es-AR',{hour12:false})}</b></div>
      <div class="batch-ticket-rule"></div>
      ${networkRows}
      <div class="batch-ticket-rule"></div>
      <div class="batch-ticket-row"><span>Compras aprobadas</span><b>${s.approvedCount} · ${formatCents(s.approvedCents)}</b></div>
      <div class="batch-ticket-row"><span>Anuladas</span><b>${s.voidedCount} · ${formatCents(s.voidedCents)}</b></div>
      <div class="batch-ticket-row"><span>Reversadas</span><b>${s.reversedCount} · ${formatCents(s.reversedCents)}</b></div>
      <div class="batch-ticket-row"><span>Mensajes generados</span><b>${s.totalMessages}</b></div>
      <div class="batch-ticket-rule"></div>
      <div class="batch-ticket-row batch-grand-total"><span>TOTAL NETO DEL LOTE</span><b>${formatCents(s.netCents)}</b></div>
      <div class="batch-ticket-status">✓ LISTO PARA CIERRE</div>
      <div class="batch-ticket-rule"></div>
      <div class="batch-ticket-iso">Se generarán los mensajes<br><b>0500 → 0510</b></div>`;
    const detail=$('batchTxDetail');
    if(detail) detail.innerHTML=s.detail.length?`<table><thead><tr><th>RED</th><th>STAN</th><th>IMPORTE</th><th>ESTADO</th></tr></thead><tbody>${s.detail.map(t=>`<tr><td>${(t.network||t.cardBrand||'VISA').toUpperCase()}</td><td>${t.stan||'—'}</td><td>${formatCents(t.amountCents||0)}</td><td>${t.status||'—'}</td></tr>`).join('')}</tbody></table>`:'<p>No hay transacciones en el lote actual.</p>';
    $('batchModal').classList.remove('hidden');
  }

  function closeBatch(){
    const s=batchSummary();state.currentOperation='batch';state.currentStan=random6();
    $('batchModal').classList.add('hidden');
    screen('CIERRE DE LOTE','<small>Enviando cierre</small><strong>...</strong><span>Aguarde</span>');
    const op=createOperation('batch');op.amountCents=s.netCents;op.amountDigits=String(s.netCents).padStart(12,'0');
    const req=batchRequestFields(s);
    addMessage({
      id:`MSG-${Date.now()}-BATCHREQ`,operationId:op.id,mti:'0500',operation:'CIERRE',
      direction:'SALIENTE',dateTime:dateTimeNow(),responseCode:'',fields:req,bitmap:bitmapHex(req),
      amountCents:s.netCents,stan:op.stan,batch:state.batchNumber
    });
    setTimeout(()=>{
      const res=batchResponseFields(s,'00');op.status='LOTE CERRADO';
      addMessage({
        id:`MSG-${Date.now()}-BATCHRES`,operationId:op.id,mti:'0510',operation:'CIERRE',
        direction:'ENTRANTE',dateTime:dateTimeNow(),responseCode:'00',fields:res,bitmap:bitmapHex(res),
        amountCents:s.netCents,stan:op.stan,batch:state.batchNumber
      });
      state.operations.filter(o=>o.batch===state.batchNumber&&o.id!==op.id).forEach(o=>{o.closed=true;persistSwitchTransaction(o)});
      if(window.OSCSwitchStore) window.OSCSwitchStore.closeBatch({channel:'POS',batch:state.batchNumber});
      renderMessage(state.messages[0]);screen('LOTE CERRADO','<small>Cierre confirmado</small><strong>00</strong><span>Nuevo lote habilitado</span>');
      printReceipt(op);refreshHistoryStatuses();
      state.batchNumber++;state.batchOpen=true;state.step='done';
    },900);
  }

  function printReceipt(op){
    persistSwitchTransaction(op);
    const paper=$('receiptPaper');
    paper.innerHTML=ticketHtml(op);
    paper.querySelectorAll('.ticket-link[data-de]').forEach(element=>{
      element.addEventListener('click',()=>highlightDataElement(element.dataset.de));
    });
    paper.classList.remove('printing');
    requestAnimationFrame(()=>paper.classList.add('printing'));
  }

  function reset(){
    state.currentOperation='purchase';state.step='amount';state.amountDigits='';state.pinDigits='';state.pinBlock=null;state.entryMode=null;state.currentStan=null;state.currentAuth=null;state.selectedMessageId=null;state.selectedSourceOperationId=null;
    $('entryModePanel').classList.add('hidden');$('qrStage')?.classList.add('hidden');$('captureStage').classList.add('hidden');$('captureStage').classList.remove('success');
    ['captureChip','captureContactless','captureMagstripe','captureManual'].forEach(id=>$(id).classList.add('hidden'));
    $('receiptPaper').classList.remove('printing');$('receiptPaper').textContent='';
    screen('COMPRA','<small>Ingrese Importe</small><strong id="screenAmount">$ 0,00</strong><span>Presione VERDE para continuar</span>');
    setStep(1);['time1','time2','time3','time4','time5','time6'].forEach(id=>$(id).textContent='—');
    $('flowAmount').textContent='$ 0,00';$('flowPin').textContent='••••';$('flowResponse').textContent='Pendiente';
    $('resultText').textContent='EN ESPERA';$('resultCode').textContent='--';$('resultDetail').textContent='Ingrese una compra para comenzar.';$('authCode').textContent='------';
    renderFields([]);
    updateDualBitmaps();
    document.getElementById('comparePanel')?.classList.add('hidden');
    document.querySelectorAll('.operation-card').forEach(b=>b.classList.toggle('active',b.dataset.operation==='purchase'));
  }

  function serializeField(row){
    const v=String(row[2]);const f=row[4];
    if(f==='LLVAR')return String(v.length).padStart(2,'0')+v;
    if(f==='LLLVAR')return String(v.length).padStart(3,'0')+v;
    return v;
  }
  function annotatedMessage(message){return`${message.mti}|${message.bitmap}|${message.fields.map(r=>`${r[0]}=${r[2]}`).join('|')}`}
  function rawMessage(message){return message.mti+message.bitmap+message.fields.map(serializeField).join('')}
  function copySelectedMessage(){
    const msg=state.messages.find(m=>m.id===state.selectedMessageId);if(!msg)return;
    const payload=`TRAMA DIDÁCTICA - CON POSICIONES Y SEPARADORES
${annotatedMessage(msg)}

TRAMA COMO VIAJA EN EL MENSAJE
(SIN PIPE, SIN NÚMERO DE CAMPO Y SIN SIGNO IGUAL)
${rawMessage(msg)}`;
    navigator.clipboard?.writeText(payload);$('copyBtn').textContent='✓ Copiado';setTimeout(()=>$('copyBtn').textContent='▣ Copiar',1200);
  }
  function openSelectedInParser(){
    const msg=state.messages.find(m=>m.id===state.selectedMessageId);if(!msg){alert('Seleccione un mensaje del historial.');return}
    localStorage.setItem('oscAcademyParserPayload',JSON.stringify({source:'POS Virtual',mti:msg.mti,annotated:annotatedMessage(msg),raw:rawMessage(msg),createdAt:new Date().toISOString()}));
    location.href='parser.html';
  }

  function applyTerminalModel(key){
    state.terminalModel=key;const terminal=document.querySelector('.terminal');
    terminal.classList.remove('ingenico','verifone','pax','android');terminal.classList.add(key);
    $('terminalBrand').textContent=terminalModels[key].brand;document.querySelector('.model').textContent=terminalModels[key].model;
  }

  function selectOperation(type){
    $('operationDrawer').classList.add('hidden');
    document.querySelectorAll('.operation-card').forEach(b=>b.classList.toggle('active',b.dataset.operation===type));
    if(type==='purchase')reset();
    else if(type==='reversal')openTransactionModal('reversal');
    else if(type==='void')openTransactionModal('void');
    else if(type==='batch')openBatchModal();
    else if(type==='query'){alert(`Lote actual ${state.batchNumber} · ${state.operations.filter(o=>o.batch===state.batchNumber).length} operaciones registradas.`)}
    else if(type==='reprint')openTransactionModal('reprint');
    else if(type==='lastTicket'){const op=state.operations.find(o=>o.type!=='batch');if(op)printReceipt(op);else alert('Todavía no hay tickets.');}
  }

  document.querySelectorAll('[data-key]').forEach(btn=>btn.addEventListener('click',()=>{if(/^\d$/.test(btn.dataset.key))pressNumber(btn.dataset.key)}));
  document.querySelector('[data-action="accept"]').addEventListener('click',accept);
  document.querySelector('[data-action="clear"]').addEventListener('click',()=>{if(state.step==='amount'){state.amountDigits=state.amountDigits.slice(0,-1);updateAmount()}});
  document.querySelector('[data-action="cancel"]').addEventListener('click',reset);
  document.querySelectorAll('[data-entry]').forEach(btn=>btn.addEventListener('click',()=>startCaptureAnimation(btn.dataset.entry)));
  document.querySelectorAll('[data-code]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-code]').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');state.responseCode=btn.dataset.code}));
  $('sendResponse').addEventListener('click',sendPurchaseResponse);
  $('newTest').addEventListener('click',reset);
  $('printAgain').addEventListener('click',()=>{const op=state.operations.find(o=>o.id===state.selectedSourceOperationId);if(op)printReceipt(op)});
  $('copyBtn')?.addEventListener('click',copySelectedMessage);
  $('analyzeBtn')?.addEventListener('click',openSelectedInParser);
  $('terminalModel').addEventListener('change',e=>applyTerminalModel(e.target.value));
  $('operationMenuButton')?.addEventListener('click',()=>{const d=$('operationDrawer');if(d)d.classList.toggle('hidden')});
  $('closeOperationDrawer')?.addEventListener('click',()=>$('operationDrawer')?.classList.add('hidden'));
  document.querySelectorAll('[data-operation]').forEach(btn=>btn.addEventListener('click',()=>selectOperation(btn.dataset.operation)));
  $('closeTransactionModal').addEventListener('click',()=>$('transactionModal').classList.add('hidden'));
  $('cancelTransactionSelection').addEventListener('click',()=>$('transactionModal').classList.add('hidden'));
  $('confirmTransactionSelection').addEventListener('click',confirmSelectedOperation);
  $('closeBatchModal').addEventListener('click',()=>$('batchModal').classList.add('hidden'));
  $('cancelBatchClose').addEventListener('click',()=>$('batchModal').classList.add('hidden'));
  $('confirmBatchClose').addEventListener('click',closeBatch);
  document.getElementById('compareMessagesBtn')?.addEventListener('click',()=>document.getElementById('comparePanel')?.classList.toggle('hidden'));
  $('downloadTicket').addEventListener('click',downloadTicket);

  setInterval(()=>{
    $('posClock').textContent=timeNow();
    const e=Math.floor((Date.now()-state.sessionStarted)/1000);
    $('sessionTime').textContent=[Math.floor(e/3600),Math.floor((e%3600)/60),e%60].map(v=>String(v).padStart(2,'0')).join(':');
  },1000);

  applyTerminalModel('ingenico');reset();restoreWorkspaceHistory();updateDualBitmaps();
  function refreshNetworkProfile(){
    if(!window.OSCNetworks) return;
    syncPaymentProfile();
    const p=profile();
    const badge=$('posNetworkBadge'), validation=$('posNetworkValidation');
    if(badge) badge.innerHTML=OSCNetworks.badge(p);
    if(validation){
      const ok=OSCNetworks.luhn(state.pan);
      validation.textContent=state.paymentMethod==='qr'
        ?`${selectedQr().label} · ${selectedQr().mode} · Perfil ${p.name}`
        :`${selectedCard().label} · BIN ${state.pan.slice(0,6)} · Luhn ${ok?'válido':'demo/no válido'}`;
      validation.className='network-validation '+(ok?'ok':'warn');
    }
    document.querySelectorAll('.card-demo strong,.capture-card strong,.virtual-card strong').forEach(el=>el.textContent=p.short);
    document.querySelectorAll('[data-test-card]').forEach(button=>button.classList.toggle('active',button.dataset.testCard===state.testCard));
    const summary=$('selectedTestCardSummary');
    if(summary && state.paymentMethod==='card') summary.textContent=`${selectedCard().label} · PAN de prueba asignado automáticamente · •••• ${state.pan.slice(-4)} · ${p.name}`;
    const step=document.querySelector('#step2 small');
    if(step && state.entryMode) step.textContent=state.paymentMethod==='qr'?`${selectedQr().label} · Wallet`:`${p.name} · ${(entryModes[state.entryMode]||entryModes.chip).label}`;
  }
  function setPaymentMethod(method){
    state.paymentMethod=method;
    document.querySelectorAll('[data-payment-method]').forEach(b=>b.classList.toggle('active',b.dataset.paymentMethod===method));
    $('cardPaymentConfig').classList.toggle('hidden',method!=='card');
    $('qrPaymentConfig').classList.toggle('hidden',method!=='qr');
    refreshNetworkProfile(); reset();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-payment-method]').forEach(btn=>btn.addEventListener('click',()=>setPaymentMethod(btn.dataset.paymentMethod)));
    const qr=$('qrTypeSelect'), iso=$('showIsoTicket');
    const testCardGrid=$('testCardGrid');
    if(testCardGrid){
      testCardGrid.addEventListener('click',event=>{
        const cardButton=event.target.closest('[data-test-card]');
        if(!cardButton || cardButton.disabled) return;
        event.preventDefault();
        event.stopPropagation();
        selectTestCard(cardButton.dataset.testCard);
      });
    }
    if(qr){qr.value=state.qrType;qr.addEventListener('change',()=>{state.qrType=qr.value;refreshNetworkProfile();reset();});}
    if(iso){iso.checked=state.showIsoTicket;iso.addEventListener('change',()=>{state.showIsoTicket=iso.checked;const op=state.operations.find(o=>o.id===state.selectedSourceOperationId);if(op&&$('receiptPaper').innerHTML.trim())$('receiptPaper').innerHTML=ticketHtml(op);});}
    selectTestCard(state.testCard,{resetFlow:false});
  });

})();
