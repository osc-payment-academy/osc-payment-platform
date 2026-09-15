(()=>{
  const script=document.currentScript;
  const moduleKey=script?.dataset?.module||document.body?.dataset?.tutorModule||'';
  const labels={course_iso8583:'Curso interactivo',pos:'POS Virtual',atm:'ATM Virtual',constructor:'Constructor ISO 8583',wallet:'Wallet',ecommerce:'E-commerce'};
  if(!labels[moduleKey])return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='/css/tutor-osc.css';document.head.appendChild(link);
  const launch=document.createElement('button');launch.className='tutor-osc-launch';launch.innerHTML='🎓 <span>Tutor OSC</span>';
  const panel=document.createElement('section');panel.className='tutor-osc-panel';panel.setAttribute('aria-label','Tutor OSC');
  panel.innerHTML=`<header class="tutor-osc-head"><div><b>🎓 Tutor OSC</b><small>Módulo: ${labels[moduleKey]} · conocimiento aprobado</small></div><button class="tutor-osc-close" aria-label="Cerrar">✕</button></header><div class="tutor-osc-chat"><div class="tutor-osc-msg bot">Hola. Puedo explicar conceptos, guiarte para analizar una trama y referenciar material aprobado por OSC.<span class="ref">No compartas PAN completo, PIN, CVV ni documentación interna.</span></div><div class="tutor-osc-suggestions"><button>¿Qué significa el MTI 0200?</button><button>¿Para qué sirve el DE39?</button><button>No entiendo esta trama</button></div></div><form class="tutor-osc-form"><textarea maxlength="1200" placeholder="Escribí tu consulta técnica…" required></textarea><div class="tutor-osc-actions"><small>Solo conocimiento aprobado por OSC</small><button class="tutor-osc-send">Enviar</button></div></form>`;
  document.body.append(launch,panel);
  const chat=panel.querySelector('.tutor-osc-chat'),form=panel.querySelector('form'),input=form.querySelector('textarea'),send=form.querySelector('button');
  const add=(text,kind='bot',reference='')=>{const el=document.createElement('div');el.className=`tutor-osc-msg ${kind.toLowerCase()}`;el.textContent=text;if(reference){const ref=document.createElement('span');ref.className='ref';ref.textContent=`Referencia: ${reference}`;el.appendChild(ref);}chat.appendChild(el);chat.scrollTop=chat.scrollHeight;};
  launch.onclick=()=>{panel.classList.toggle('open');if(panel.classList.contains('open'))input.focus();};panel.querySelector('.tutor-osc-close').onclick=()=>panel.classList.remove('open');
  panel.querySelectorAll('.tutor-osc-suggestions button').forEach(b=>b.onclick=()=>{input.value=b.textContent;form.requestSubmit();});
  form.onsubmit=async e=>{e.preventDefault();const question=input.value.trim();if(!question)return;add(question,'user');input.value='';send.disabled=true;send.textContent='Consultando…';try{const r=await fetch('/api/tutor/query',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({moduleKey,question,context:{path:location.pathname}})});const j=await r.json();if(!r.ok)throw new Error(j.error||'No disponible');add(j.answer||'No fue posible responder.',j.kind||'bot',j.reference||'');}catch(err){add('Tutor OSC no está disponible en este momento. Intentá nuevamente.','pending');}finally{send.disabled=false;send.textContent='Enviar';}};
})();
