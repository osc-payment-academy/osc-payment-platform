const $=id=>document.getElementById(id);
const number=n=>new Intl.NumberFormat('es-AR').format(Number(n||0));
const pct=n=>`${Number(n||0).toFixed(2).replace('.',',')}%`;
const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const de39={
  '05':{name:'No honrar',type:'Negocio / genérico',category:'4 · Respuesta genérica',action:'Revisar reglas del emisor y segmentar por comercio, canal y producto.'},
  '12':{name:'Transacción inválida',type:'Datos / negocio',category:'1 · No reintentar',action:'Validar tipo de operación, processing code y consistencia de campos.'},
  '14':{name:'Número de cuenta inválido',type:'Datos',category:'1 · No reintentar',action:'Revisar captura/tokenización sin exponer el PAN.'},
  '46':{name:'Cuenta cerrada',type:'Negocio',category:'1 · No reintentar',action:'No atribuir al switch: solicitar otro medio de pago.'},
  '51':{name:'Fondos insuficientes',type:'Negocio',category:'2 · Condición temporal',action:'Correlacionar la concentración horaria con saldos, límites y respuesta del emisor.'},
  '52':{name:'Sin cuenta corriente',type:'Negocio',category:'2 · Condición temporal',action:'Validar tipo de cuenta seleccionado y reglas del producto.'},
  '54':{name:'Tarjeta vencida o fecha ausente',type:'Datos / negocio',category:'3 · Corregir datos',action:'Verificar fecha de expiración y actualización de credenciales.'},
  '61':{name:'Excede límite de aprobación',type:'Negocio',category:'2 · Condición temporal',action:'Revisar límites por importe, producto y moneda.'},
  '64':{name:'No cumple requisito AML',type:'Cumplimiento',category:'4 · Respuesta genérica',action:'Escalar a Cumplimiento; no inferir la regla AML desde la trama.'},
  '76':{name:'Reversa no solicitada / original no localizada',type:'Técnico',category:'No aplicable',action:'Correlacionar reversa, STAN, RRN y Field 90 con el historial.'},
  '83':{name:'Código dependiente del entorno',type:'Contrato local',category:'Requiere validación local',action:'Confirmar la tabla del procesador; no figura como autorización estándar en la tabla VisaNet consultada.'},
  '91':{name:'Emisor no disponible o switch inoperativo',type:'Técnico',category:'2 · Condición temporal',action:'Correlacionar timeouts, disponibilidad y logs de base de datos.'},
  '99':{name:'Código dependiente del entorno',type:'Contrato local',category:'Requiere validación local',action:'Confirmar la tabla propietaria del banco/procesador.'}
};
let currentData=null;
const codeMeta=code=>de39[String(code)]||{name:'Código no catalogado',type:'Contrato local',category:'Requiere validación local',action:'Validar contra la especificación contractual del procesador.'};
const hourKey=value=>String(value||'').slice(0,2)+':00';

function renderCodeDetail(code){
  const d=currentData,summary=d.resumen||{},totalRejects=Number(summary.rechazadas||0),meta=codeMeta(code);
  const total=Number((d.codigos||[]).find(x=>String(x.de39)===String(code))?.cantidad||0);
  const hourlySource=d.codigos_por_hora||[],slotSource=d.codigos_por_intervalo_15_minutos||[];
  if(!hourlySource.length||!slotSource.length){
    $('codeTotal').textContent=number(total);$('codeShare').textContent=pct(total/Math.max(totalRejects,1)*100);$('codePeakHour').textContent='Requiere JSON 1.1';$('codePeakSlot').textContent='Requiere JSON 1.1';
    $('codeChart').innerHTML='<div class="upgrade-note">Vuelve a ejecutar el agente horario actualizado para incorporar el detalle por código. Los checkpoints existentes se reutilizan.</div>';
    $('codeInsights').innerHTML=`<div class="insight"><strong>${safe(meta.type)}</strong>${safe(meta.name)}. ${safe(meta.action)}</div>`;$('codeSlots').innerHTML='';return;
  }
  const byHour=new Map(hourlySource.filter(x=>String(x.DE39)===String(code)).map(x=>[hourKey(x.Hora),Number(x.Cantidad||0)]));
  const hours=Array.from({length:24},(_,h)=>({hour:String(h).padStart(2,'0')+':00',count:byHour.get(String(h).padStart(2,'0')+':00')||0}));
  const peakHour=hours.slice().sort((a,b)=>b.count-a.count)[0];
  const intervals=slotSource.filter(x=>String(x.DE39)===String(code)).map(x=>({slot:String(x.FranjaInicio),count:Number(x.Cantidad||0)})).sort((a,b)=>b.count-a.count);
  const peakSlot=intervals[0]||{slot:'—',count:0},max=Math.max(...hours.map(x=>x.count),1),hourTotals=new Map((d.horas||[]).map(x=>[String(x.Hora),x])),slots=new Map((d.intervalos_15_minutos||[]).map(x=>[String(x.FranjaInicio),x]));
  $('codeTotal').textContent=number(total);$('codeShare').textContent=pct(total/Math.max(totalRejects,1)*100);$('codePeakHour').textContent=`${peakHour.hour} · ${number(peakHour.count)}`;$('codePeakSlot').textContent=`${peakSlot.slot} · ${number(peakSlot.count)}`;
  $('codeChart').innerHTML=hours.map(x=>{const hr=hourTotals.get(x.hour),share=x.count/Math.max(Number(hr?.Rechazadas||0),1)*100;return `<div class="code-bar-wrap" title="${safe(x.hour)}: ${number(x.count)} · ${pct(share)} de los rechazos"><div class="code-bar" style="height:${Math.max(x.count?2:0,x.count/max*100)}%"></div></div>`}).join('');
  const dailyShare=total/Math.max(totalRejects,1)*100,peakHourRow=hourTotals.get(peakHour.hour),peakShare=peakHour.count/Math.max(Number(peakHourRow?.Rechazadas||0),1)*100,delta=peakShare-dailyShare,isConcentrated=delta>=15&&peakHour.count>=50;
  const concentration=isConcentrated?`En ${peakHour.hour} representó ${pct(peakShare)} de los rechazos, ${pct(delta)} puntos por encima de su peso diario.`:`Su mayor hora fue ${peakHour.hour}, donde representó ${pct(peakShare)} de los rechazos.`;
  const signal=meta.type==='Técnico'?'Este código es una señal técnica: conviene cruzarlo con timeouts, conexiones y logs de infraestructura.':'Este código no demuestra por sí solo una falla técnica; debe interpretarse con reglas del emisor y comportamiento del cliente.';
  $('codeInsights').innerHTML=`<div class="insight"><strong>${safe(meta.type)} · ${safe(meta.name)}</strong>${safe(meta.category)}.</div><div class="insight ${isConcentrated?'alert':''}"><strong>${isConcentrated?'Concentración anormal':'Concentración observada'}</strong>${safe(concentration)}</div><div class="insight"><strong>Interpretación</strong>${safe(signal)}</div><div class="insight"><strong>Próxima acción</strong>${safe(meta.action)}</div>`;
  $('codeSlots').innerHTML=intervals.slice(0,10).map(x=>{const row=slots.get(x.slot)||{},rejects=Number(row.Rechazadas||0),share=x.count/Math.max(rejects,1)*100;return `<tr><td><b>${safe(x.slot)}</b></td><td>${number(x.count)}</td><td>${number(rejects)}</td><td>${pct(share)}</td><td>${pct(row.TasaRechazoPct)}</td></tr>`}).join('');
}

function render(d){
  currentData=d;const r=d.resumen||{},hours=d.horas||[];
  $('date').textContent=d.fecha||'—';$('total').textContent=number(r.total_financieras);$('approved').textContent=pct(r.tasa_aprobacion_pct);$('rejected').textContent=number(r.rechazadas);$('rejectRate').textContent=pct(r.tasa_rechazo_pct);$('worst').textContent=r.peor_hora||'—';$('worstRate').textContent=pct(r.peor_hora_tasa_rechazo_pct);
  const max=Math.max(...hours.map(x=>Number(x.TasaRechazoPct||0)),1);
  $('hourChart').innerHTML=hours.map(x=>`<div class="bar-wrap" title="${safe(x.Hora)}: ${pct(x.TasaRechazoPct)} · ${number(x.Rechazadas)} rechazadas"><div class="bar" style="height:${Math.max(1,Number(x.TasaRechazoPct||0)/max*100)}%"></div></div>`).join('');
  const peak=(d.intervalos_15_minutos||[]).slice().sort((a,b)=>b.TasaRechazoPct-a.TasaRechazoPct)[0];
  $('findings').innerHTML=`<div class="callout"><strong>Pico crítico: ${safe(r.peor_hora)}</strong>${number(hours.find(x=>x.Hora===r.peor_hora)?.Rechazadas)} rechazos; tasa ${pct(r.peor_hora_tasa_rechazo_pct)}.</div><div class="callout"><strong>Intervalo prioritario: ${safe(peak?.FranjaInicio||r.peor_intervalo_15m)}</strong>${number(peak?.Rechazadas)} rechazos sobre ${number(peak?.TotalFinancieras)} operaciones; tasa ${pct(peak?.TasaRechazoPct)}.</div><div class="callout"><strong>Hipótesis inicial, no causa raíz</strong>DE39 ${safe(r.codigo_rechazo_principal)} concentra ${number(r.cantidad_codigo_principal)} rechazos. Para confirmar una falla técnica deben correlacionarse logs del switch, Sybase/Oracle y métricas.</div>`;
  const total=Number(r.rechazadas||1),codes=(d.codigos||[]).slice().sort((a,b)=>b.cantidad-a.cantidad);
  $('codes').innerHTML=codes.map((x,i)=>{const m=codeMeta(x.de39);return `<tr><td class="rank">${i+1}</td><td><b>${safe(x.de39)}</b></td><td>${safe(m.name)}</td><td>${number(x.cantidad)}</td><td>${pct(x.cantidad/total*100)}</td><td>${safe(m.category)}</td><td>${safe(m.action)}</td></tr>`}).join('');
  $('codeSelect').innerHTML=codes.map(x=>`<option value="${safe(x.de39)}">DE39 ${safe(x.de39)} · ${safe(codeMeta(x.de39).name)}</option>`).join('');$('codeSelect').value=String(r.codigo_rechazo_principal||codes[0]?.de39||'');renderCodeDetail($('codeSelect').value);
}

async function load(date){
  const qs=new URLSearchParams();if(date)qs.set('date',date);const response=await fetch('/api/authorization-analytics?'+qs),d=await response.json();if(response.status===403)return location.href='/expired?product=authorization-analytics';if(!response.ok){$('empty').textContent='No fue posible cargar el análisis.';return}
  $('analysisDate').innerHTML=(d.analyses||[]).map(x=>`<option value="${safe(x.analysis_date)}">${safe(x.analysis_date)} · ${safe(x.source_name)}</option>`).join('');if(!d.data){$('empty').textContent='Todavía no hay análisis cargados. El administrador OSC puede importar el JSON generado por el agente horario.';$('dashboard').hidden=true;return}$('empty').textContent='';$('dashboard').hidden=false;render(d.data)
}
$('analysisDate').onchange=e=>load(e.target.value);$('codeSelect').onchange=e=>renderCodeDetail(e.target.value);
(async()=>{const r=await fetch('/api/auth/me'),me=await r.json();if(me.user?.platform_role==='OSC_ADMIN')$('adminPanel').classList.add('visible');load()})();
$('uploadForm').onsubmit=async e=>{e.preventDefault();const file=$('jsonFile').files[0];if(!file)return;try{const payload=JSON.parse((await file.text()).replace(/^\uFEFF/,''));const r=await fetch('/api/admin/authorization-analytics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tenantId:$('tenantId').value.trim()||'tenant_osc',payload})}),d=await r.json();$('uploadMessage').textContent=r.ok?`Análisis ${d.analysisDate} cargado correctamente.`:`Carga rechazada: ${d.error||'error'}`;if(r.ok)load(d.analysisDate)}catch{$('uploadMessage').textContent='El archivo no contiene un JSON válido.'}};
