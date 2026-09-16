(function(){
  const module=(location.pathname.split('/').pop()||'index.html').replace('.html','');
  const tours={
    pos:[
      ['.terminal-column','La pantalla tiene cuatro secciones. Sobre el lado izquierdo está el POS, donde se selecciona la tarjeta y se ejecuta la operación.'],
      ['.flow-panel','En la parte central están el flujo de procesamiento y los Escenarios de Respuesta. El flujo permite seguir el recorrido de la transacción.'],
      ['.iso-panel','Sobre el lado derecho está la zona técnica. Aquí se visualizan el MTI, el bitmap y los Data Elements de la operación seleccionada.'],
      ['.history-panel','En la parte inferior está el Historial de Transacciones. Al finalizar podrás ver y seleccionar los dos registros: la solicitud y la respuesta.'],
      ['#scenarioGrid','Escenarios de Respuesta define el resultado que querés probar. Por defecto está seleccionado 00 - APROBADA, por lo que la operación responderá como aprobada.'],
      ['.auto-response-control','Encendé Respuesta Automática para que el simulador genere la respuesta sin intervención. Si está apagada, después de ingresar el tipo de entrada deberás presionar Enviar Respuesta.'],
      ['#newTest','Nueva Prueba reinicia el POS y permite comenzar una nueva simulación sin eliminar las operaciones guardadas en el historial.'],
      ['#operationMenuButton','Operaciones abre las demás funciones disponibles en el POS: devolución, anulación, consulta, cierre de lote y reimpresión.']
    ],
    atm:[['header','Navegación del ATM y acceso a Conciliación.'],['.atm-machine','Pantalla y teclado del cajero virtual.'],['.flow-panel','Seguimiento de cada paso de la operación.'],['#reconcileAtm','La Conciliación confirma totales después de las operaciones; no habilita su envío online.']],
    parser:[['header','Navegación del analizador ISO 8583.'],['textarea','Pegá o recibí aquí la trama que querés interpretar.'],['button','Ejecutá el análisis para separar MTI, bitmap y Data Elements.'],['table','Revisá cada campo interpretado y su significado.']],
    constructor:[['header','Navegación del Constructor ISO 8583.'],['select','Elegí la red y el tipo de mensaje.'],['form','Completá los Data Elements requeridos.'],['pre','Revisá la trama y el bitmap generados antes de enviarlos al Parser.']],
    switch:[['header','Vista del Switch adquiriente compartida por POS y ATM.'],['table','Las operaciones aparecen al ejecutarse: la conciliación ATM no es una compuerta.'],['#generate','El clearing es un proceso posterior y separado del enrutamiento online.'],['.clearing-grid','Archivos didácticos por marca: Visa, Mastercard y American Express.']]
  };
  const purchase=[['#testCardGrid','Seleccioná la tarjeta con la que vas a probar. Visa, Mastercard y AMEX simulan tarjetas del exterior.'],['#testCardGrid','Para una operación DOMÉSTICA, primero creá el cliente, una caja de ahorro o cuenta corriente, depositá fondos y generá su tarjeta de débito. El número lo asigna la plataforma.'],['#keypad','Digitá el importe con el teclado del POS y presioná el botón VERDE para aceptar.'],['.terminal','Seleccioná el modo de entrada: Chip EMV, Contactless, Banda magnética o Manual.'],['.history-panel','Al ejecutarse, el historial mostrará la solicitud enviada y la respuesta recibida.'],['.history-panel','Seleccioná cualquiera de los dos registros para revisar MTI, bitmaps y Data Elements en la zona técnica, con Tutor OSC o el manual aprobado.']];
  const voidGuide=[['#operationMenuButton','Presioná Operaciones para abrir las funciones adicionales del POS.'],['[data-operation="void"]','Seleccioná Anulación. El POS mostrará las compras aprobadas del lote abierto que todavía pueden anularse.','openDrawer'],['#transactionSelectionList','Elegí la compra que querés anular. Una anulación deja sin efecto esa compra dentro del lote actual.','openVoid'],['#confirmTransactionSelection','Presioná Continuar para generar la anulación y sus mensajes de solicitud y respuesta.']];
  const refundGuide=[['#operationMenuButton','Presioná Operaciones para abrir las funciones adicionales del POS.'],['[data-operation="refund"]','Seleccioná Devolución. El POS mostrará las compras que todavía tienen un importe disponible para devolver.','openDrawer'],['#transactionSelectionList','Elegí una compra del mismo día o de días anteriores. La devolución es una nueva operación de crédito relacionada con esa compra.','openRefund'],['#refundControls','Indicá si la devolución es total o parcial. El importe parcial no puede superar el saldo pendiente de devolver.'],['#confirmTransactionSelection','Presioná Continuar para generar la nueva operación de crédito y su respuesta.']];
  const batchGuide=[['#operationMenuButton','Al cierre del día, presioná Operaciones para iniciar el cierre de lote.'],['[data-operation="batch"]','Seleccioná Cierre de lote.','openDrawer'],['#batchSummary','El POS presenta los totales del lote: compras, devoluciones, anulaciones, reversas y total neto.','openBatch'],['#confirmBatchClose','Revisá los totales y presioná Confirmar cierre de lote.'],['#batchModal','Después del cierre, las transacciones quedan listas para enviarse al Clearing de Visa, Mastercard o AMEX.']];
  const find=(selector)=>document.querySelector(selector);
  function start(steps,title){let index=0,target=null,overlay=document.createElement('div'),card=document.createElement('aside');overlay.className='osc-guide-overlay';card.className='osc-guide-card';document.body.append(overlay,card);
    const close=()=>{target?.classList.remove('osc-guide-target');overlay.remove();card.remove()};
    const show=()=>{target?.classList.remove('osc-guide-target');const [selector,text,action]=steps[index];if(action==='openDrawer')document.getElementById('operationMenuButton')?.click();if(action==='openVoid')document.querySelector('[data-operation="void"]')?.click();if(action==='openRefund')document.querySelector('[data-operation="refund"]')?.click();if(action==='openBatch')document.querySelector('[data-operation="batch"]')?.click();target=find(selector)||document.querySelector('main')||document.body;target.classList.add('osc-guide-target');target.scrollIntoView({behavior:'smooth',block:'center'});card.innerHTML=`<div class="osc-guide-step">${title} · PASO ${index+1} DE ${steps.length}</div><h3>${index? 'Continuamos':'Empecemos'}</h3><p>${text}</p><div class="osc-guide-actions"><button class="osc-guide-close">Salir</button><button class="osc-guide-prev" ${index?'':'disabled'}>Anterior</button><button class="osc-guide-next">${index===steps.length-1?'Finalizar':'Siguiente'}</button></div>`;card.querySelector('.osc-guide-close').onclick=close;card.querySelector('.osc-guide-prev').onclick=()=>{if(index){index--;show()}};card.querySelector('.osc-guide-next').onclick=()=>{if(index===steps.length-1)close();else{index++;show()}}};show()}
  const steps=tours[module];
  if(steps)window.OSCModuleGuide={
    startScreen:()=>start(steps,'CÓMO UTILIZAR ESTA PANTALLA'),
    startPurchase:()=>start(purchase,'CÓMO GENERAR UNA COMPRA'),
    startVoid:()=>start(voidGuide,'CÓMO GENERAR UNA ANULACIÓN'),
    startRefund:()=>start(refundGuide,'CÓMO GENERAR UNA DEVOLUCIÓN'),
    startBatch:()=>start(batchGuide,'CÓMO GENERAR EL CIERRE DE LOTE')
  };
  // Lanzadores retirados: Tutor OSC ocupa ahora ese acceso en cada módulo.
  return;
})();
