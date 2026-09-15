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
      ['#testCardGrid','Seleccioná la tarjeta con la que vas a probar. Visa, Mastercard y AMEX simulan tarjetas del exterior.'],
      ['#testCardGrid','Para una operación DOMÉSTICA, primero creá el cliente, una caja de ahorro o cuenta corriente, depositá fondos y generá su tarjeta de débito. El número de tarjeta lo asigna automáticamente la plataforma.'],
      ['#keypad','Después de seleccionar la tarjeta, digitá el importe utilizando el teclado del POS y presioná el botón VERDE para aceptar.'],
      ['.terminal','Luego el POS te pedirá seleccionar el modo de entrada de la tarjeta: Chip EMV, Contactless, Banda magnética o Manual.'],
      ['.history-panel','Una vez ejecutada la operación, el Historial de Transacciones mostrará dos registros: la solicitud enviada y la respuesta recibida.'],
      ['.history-panel','Al hacer clic en cualquiera de los dos registros, la trama ISO 8583 se visualizará en la zona técnica del lado derecho con su MTI, bitmaps y Data Elements. Cada campo podrá analizarse con Tutor OSC o consultarse en el manual aprobado de la marca correspondiente.']
    ],
    atm:[['header','Navegación del ATM y acceso a Conciliación.'],['.atm-machine','Pantalla y teclado del cajero virtual.'],['.flow-panel','Seguimiento de cada paso de la operación.'],['#reconcileAtm','La Conciliación confirma totales después de las operaciones; no habilita su envío online.']],
    parser:[['header','Navegación del analizador ISO 8583.'],['textarea','Pegá o recibí aquí la trama que querés interpretar.'],['button','Ejecutá el análisis para separar MTI, bitmap y Data Elements.'],['table','Revisá cada campo interpretado y su significado.']],
    constructor:[['header','Navegación del Constructor ISO 8583.'],['select','Elegí la red y el tipo de mensaje.'],['form','Completá los Data Elements requeridos.'],['pre','Revisá la trama y el bitmap generados antes de enviarlos al Parser.']],
    switch:[['header','Vista del Switch adquiriente compartida por POS y ATM.'],['table','Las operaciones aparecen al ejecutarse: la conciliación ATM no es una compuerta.'],['#generate','El clearing es un proceso posterior y separado del enrutamiento online.'],['.clearing-grid','Archivos didácticos por marca: Visa, Mastercard y American Express.']]
  };
  const practice={pos:[['#testCardGrid','Elegí una tarjeta de prueba.'],['#keypad','Ingresá un importe y confirmá la compra.'],['#scenarioGrid','Seleccioná 00 - APROBADA y enviá la respuesta 0210.'],['.atm-like-message-head','Seleccioná la trama 0200/0210 generada.'],['a[href="parser.html"]','Abrí Parser para estudiar el mensaje campo por campo.']]};
  const find=(selector)=>document.querySelector(selector);
  function start(steps,title){let index=0,target=null,overlay=document.createElement('div'),card=document.createElement('aside');overlay.className='osc-guide-overlay';card.className='osc-guide-card';document.body.append(overlay,card);
    const close=()=>{target?.classList.remove('osc-guide-target');overlay.remove();card.remove()};
    const show=()=>{target?.classList.remove('osc-guide-target');const [selector,text]=steps[index];target=find(selector)||document.querySelector('main')||document.body;target.classList.add('osc-guide-target');target.scrollIntoView({behavior:'smooth',block:'center'});card.innerHTML=`<div class="osc-guide-step">${title} · PASO ${index+1} DE ${steps.length}</div><h3>${index? 'Continuamos':'Empecemos'}</h3><p>${text}</p><div class="osc-guide-actions"><button class="osc-guide-close">Salir</button><button class="osc-guide-prev" ${index?'':'disabled'}>Anterior</button><button class="osc-guide-next">${index===steps.length-1?'Finalizar':'Siguiente'}</button></div>`;card.querySelector('.osc-guide-close').onclick=close;card.querySelector('.osc-guide-prev').onclick=()=>{if(index){index--;show()}};card.querySelector('.osc-guide-next').onclick=()=>{if(index===steps.length-1)close();else{index++;show()}}};show()}
  const steps=tours[module];
  if(steps)window.OSCModuleGuide={
    startScreen:()=>start(steps,'CÓMO UTILIZAR ESTA PANTALLA'),
    startPractice:()=>start(practice[module]||steps,'PRÁCTICA GUIADA')
  };
  // Lanzadores retirados: Tutor OSC ocupa ahora ese acceso en cada módulo.
  return;
})();
