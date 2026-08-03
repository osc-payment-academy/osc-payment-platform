
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
    modalMode:null
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
  const field = (de,name,value,length,format,origin='POS') => [String(de),name,String(value),String(length),format,origin];

  function amountField(amountDigits=state.amountDigits){
    return field(4,'Transaction Amount',String(amountDigits||'0').padStart(12,'0'),'12','FIXED','Monto de la operación');
  }

  function entryFields(){
    const mode=entryModes[state.entryMode]||entryModes.chip;
    const rows=[
      field(2,'Primary Account Number (PAN)','4556123412341234','16','LLVAR','Tarjeta'),
      field(3,'Processing Code','000000','6','FIXED','Aplicación POS'),
      amountField(),
      field(14,'Expiration Date','2512','4','FIXED','Tarjeta'),
      field(22,'Point of Service Entry Mode',mode.de22,'3','FIXED',mode.label),
      field(25,'Point of Service Condition Code','00','2','FIXED','Aplicación POS'),
      field(41,'Terminal ID','TERMID01','8','FIXED','Configuración terminal'),
      field(42,'Merchant ID','MERCHANT01','10','FIXED','Configuración comercio'),
      field(49,'Transaction Currency Code','032','3','FIXED','Configuración comercio')
    ];
    if(mode.hasDE35) rows.push(field(35,'Track 2 Data','4556123412341234=25121011234567890','37','LLVAR',mode.de35Origin));
    if(mode.hasDE55) rows.push(field(55,'ICC Data (EMV)','9F2608A1B2C3D4E5F607','20','LLLVAR',mode.label));
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
      field(2,'Primary Account Number (PAN)','4556123412341234','16','LLVAR','Eco de solicitud'),
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
      field(2,'Primary Account Number (PAN)','4556123412341234','16','LLVAR','Operación original'),
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
      field(2,'Primary Account Number (PAN)','4556123412341234','16','LLVAR','Operación original'),
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
    if(wrap) wrap.classList.toggle('hidden',!hasSecondary);
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
    const mode=entryModes[state.entryMode]||entryModes.chip;
    const status=op.status==='APROBADA'?'APROBADO':op.status;
    const date=new Date(op.createdAt||Date.now());
    const operationNumber=`${date.getTime()}`.slice(-12);
    const brand=op.type==='purchase'?'CRÉDITO VISA 6875':operationLabels[op.type];
    const aid=mode.hasDE55?'A0000000031010':'NO APLICA';
    return `
      <div class="ticket-head">
        <div class="ticket-brand">OSC<br>PAY</div>
        <div><span class="ticket-badge">TICKET VENDEDOR</span><div class="ticket-date">${date.toLocaleDateString('es-AR')} · ${date.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</div></div>
      </div>
      <div class="ticket-meta">
        <strong>Operación #${operationNumber}</strong>
        <span class="ticket-link" data-de="2">${brand}</span><br>
        <span class="ticket-link" data-de="22">${mode.label.toUpperCase()}</span>
        <span style="float:right" class="ticket-link" data-de="55">AID: ${aid}</span>
      </div>
      <div class="ticket-box">
        <div class="ticket-total"><strong>Total</strong><b class="ticket-link" data-de="4">${formatCents(op.amountCents)}</b></div>
        <div class="ticket-installments">Cuotas <span style="float:right">(1 x ${formatCents(op.amountCents)})</span></div>
        <div class="ticket-status ticket-link" data-de="39">${status}</div>
      </div>
      <div class="ticket-meta">
        <span>Autorización: <b class="ticket-link" data-de="38">${op.auth||'—'}</b></span><br>
        <span>STAN: <b class="ticket-link" data-de="11">${op.stan||'—'}</b></span><br>
        <span>RRN: <b class="ticket-link" data-de="37">${op.rrn||'—'}</b></span>
        ${source?`<br><span>Original: ${source.stan}</span>`:''}
      </div>
      <div class="ticket-foot">
        <strong class="ticket-link" data-de="42">BORJA SPECIALTY COFFEE</strong>
        <span style="float:right">30716739844</span><br>
        Juncal 2303, Recoleta, Capital Federal, Argentina<br>
        Terminal: <span class="ticket-link" data-de="41">TERMID01</span> · Lote ${op.batch}
      </div>`;
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

  function renderFields(fields){
    $('deTable').innerHTML=fields.length
      ?fields.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')
      :`<tr><td colspan="6" style="text-align:center;color:#7f93a8;padding:22px">Los campos se activarán paso a paso durante la operación.</td></tr>`;
    $('deCount').textContent=fields.length;
    $('totalLength').textContent=fields.length?`${fields.reduce((a,r)=>a+(parseInt(r[3])||8),0)} bytes`:'0 bytes';
    const bits=activeBits(fields);
    const shown=[1,2,3,4,7,11,14,22,25,35,37,38,39,41,42,48,49,52,53,55,60,64,90];
    $('bitmapRow').innerHTML=shown.map(bit=>`<span class="bit ${bits.has(bit)?'on':''}"><b>${bit}</b><i></i></span>`).join('');
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
      createdAt:new Date().toISOString()
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
      state.step='entry';
      $('entryModePanel').classList.remove('hidden');
      screen('FORMA DE CAPTURA','<small>Seleccione</small><strong>TIPO DE ENTRADA</strong><span>Use las opciones debajo</span>');
      setStep(2);
    }else if(state.step==='pin'&&state.pinDigits.length>=4){
      $('time3').textContent=timeNow();
      sendPurchase0200();
    }
  }

  function startCaptureAnimation(modeKey){
    state.step='capturing';state.entryMode=modeKey;$('entryModePanel').classList.add('hidden');
    const stage=$('captureStage');stage.classList.remove('hidden','success');
    ['captureChip','captureContactless','captureMagstripe','captureManual'].forEach(id=>$(id).classList.add('hidden'));
    const map={chip:['captureChip','Insertando tarjeta con chip…'],contactless:['captureContactless','Leyendo tarjeta contactless…'],magstripe:['captureMagstripe','Leyendo banda magnética…'],manual:['captureManual','Validando datos ingresados…']};
    const [scene,status]=map[modeKey];$(scene).classList.remove('hidden');$('captureStatusText').textContent=status;
    screen('LEYENDO TARJETA',`<small>${entryModes[modeKey].label}</small><strong>...</strong><span>No retire la tarjeta</span>`);
    setTimeout(()=>{
      stage.classList.add('success');$('captureStatusText').textContent='Lectura completada';
      const mode=entryModes[modeKey];$('time2').textContent=timeNow();document.querySelector('#step2 small').textContent=`VISA · ${mode.label}`;
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
    const approvedCents=approved.reduce((a,o)=>a+o.amountCents,0);
    const voidedCents=voided.reduce((a,o)=>a+o.amountCents,0);
    const reversedCents=reversed.reduce((a,o)=>a+o.amountCents,0);
    return{
      approvedCount:approved.length,voidedCount:voided.length,reversedCount:reversed.length,
      approvedCents,voidedCents,reversedCents,netCents:approvedCents,
      totalMessages:state.messages.filter(m=>m.batch===state.batchNumber).length
    };
  }

  function openBatchModal(){
    const s=batchSummary();
    $('batchSummary').innerHTML=`
      <div class="batch-stat"><span>Número de lote</span><strong>${state.batchNumber}</strong></div>
      <div class="batch-stat"><span>Mensajes generados</span><strong>${s.totalMessages}</strong></div>
      <div class="batch-stat"><span>Compras aprobadas</span><strong>${s.approvedCount} · ${formatCents(s.approvedCents)}</strong></div>
      <div class="batch-stat"><span>Anuladas</span><strong>${s.voidedCount}</strong></div>
      <div class="batch-stat"><span>Reversadas</span><strong>${s.reversedCount}</strong></div>
      <div class="batch-stat batch-total"><span>Total neto del lote</span><strong>${formatCents(s.netCents)}</strong></div>`;
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
      state.operations.filter(o=>o.batch===state.batchNumber&&o.id!==op.id).forEach(o=>o.closed=true);
      renderMessage(state.messages[0]);screen('LOTE CERRADO','<small>Cierre confirmado</small><strong>00</strong><span>Nuevo lote habilitado</span>');
      printReceipt(op);refreshHistoryStatuses();
      state.batchNumber++;state.batchOpen=true;state.step='done';
    },900);
  }

  function printReceipt(op){
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
    $('entryModePanel').classList.add('hidden');$('captureStage').classList.add('hidden');$('captureStage').classList.remove('success');
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
  $('copyBtn').addEventListener('click',copySelectedMessage);
  $('analyzeBtn').addEventListener('click',openSelectedInParser);
  $('terminalModel').addEventListener('change',e=>applyTerminalModel(e.target.value));
  $('operationMenuButton').addEventListener('click',()=>$('operationDrawer').classList.toggle('hidden'));
  $('closeOperationDrawer').addEventListener('click',()=>$('operationDrawer').classList.add('hidden'));
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

  applyTerminalModel('ingenico');reset();updateDualBitmaps();
})();
