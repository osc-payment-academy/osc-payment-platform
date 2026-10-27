/* OSC Learning layout · v4.0.0-rc.1.37
   Capa compartida para POS, ATM, Wallet y E-Commerce:
   - rc.1.37: se retira el Tutor OSC (sin cuarta columna). Cada fila de Data Elements suma la manito ☝
     que abre la ficha del campo (js/field-cards.js) de la red de la operación.
   - selector de simulador en el encabezado y eventos del modo técnico. */
(()=>{
  'use strict';
  const script=document.currentScript;
  const file=(location.pathname.split('/').pop()||'').toLowerCase();
  const MAP={'pos.html':'pos','atm.html':'atm','wallet.html':'wallet','ecommerce.html':'ecommerce'};
  const moduleKey=script?.dataset?.module||MAP[file]||'';
  if(!moduleKey||window.OSCLearning)return;
  const VERSION='4.0.0-rc.1.37';
  const GRID_SEL={pos:'.workspace',atm:'.atm-grid',wallet:'.workspace',ecommerce:'.workspace'}[moduleKey];
  const KEY='oscTutorDockCollapsed';
  const listeners=[];
  let grid=null,dock=null,on=false,collapsed=false,busy=false,timer=null,pending=null;
  const mq=window.matchMedia?window.matchMedia('(min-width: 1180px)'):{matches:true,addEventListener(){}};

  if(!document.querySelector('link[data-osc-learning]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='/css/osc-learning.css?v='+VERSION;l.dataset.oscLearning='1';document.head.appendChild(l);
  }

  /* ---------- dock ---------- */
  function buildDock(){
    grid=document.querySelector(GRID_SEL);
    if(!grid)return false;
    return true; // rc.1.37 · sin Tutor: no se agrega la columna
    dock=document.createElement('aside');dock.id='oscTutorDock';dock.className='osc-tutor-dock';dock.setAttribute('aria-label','Tutor OSC');
    const tab=document.createElement('button');tab.type='button';tab.className='osc-dock-tab';tab.textContent='🎓 Tutor OSC';tab.title='Abrir Tutor OSC';tab.onclick=()=>setCollapsed(false);
    dock.appendChild(tab);grid.appendChild(dock);
    try{collapsed=localStorage.getItem(KEY)==='1'}catch(e){}
    return true;
  }
  function apply(){
    // rc.1.37 · se mantiene el modo de pantalla (menú ☰ y barra lateral plegada) sin la columna del Tutor.
    on=!!mq.matches&&!!grid;
    document.body.classList.toggle('osc-learning-on',on);
    grid?.classList.toggle('osc-grid-4',false);
    if(dock){dock.hidden=!on;dock.classList.toggle('is-collapsed',collapsed);}
    document.body.classList.toggle('osc-dock-collapsed',on&&collapsed);
    listeners.forEach(f=>{try{f(on)}catch(e){}});
  }
  function setCollapsed(v){collapsed=!!v;try{localStorage.setItem(KEY,collapsed?'1':'0')}catch(e){}apply();}

  /* ---------- barra superior ---------- */
  function decorateHeader(){
    const hdr=document.querySelector('.topbar, header.top');
    if(!hdr||hdr.querySelector('.osc-modswitch'))return;
    if(moduleKey==='pos'||moduleKey==='atm'){
      const t=document.createElement('button');t.type='button';t.className='osc-menu-toggle';t.textContent='☰ Menú';
      t.onclick=()=>document.body.classList.toggle('osc-sidebar-open');hdr.prepend(t);
    }
    const pair=moduleKey==='pos'||moduleKey==='atm'?[['pos.html','POS','pos'],['atm.html','ATM','atm']]:[['wallet.html','Wallet','wallet'],['ecommerce.html','E-Commerce','ecommerce']];
    const nav=document.createElement('nav');nav.className='osc-modswitch';nav.setAttribute('aria-label','Cambiar de simulador');
    pair.forEach(([href,label,key])=>{const a=document.createElement('a');a.href=href;a.textContent=label;if(key===moduleKey){a.className='active';a.setAttribute('aria-current','page');}nav.appendChild(a)});
    const host=hdr.querySelector('.title-block, .title, h1')||hdr.firstElementChild||hdr;
    (host.tagName==='H1'?host.parentNode:host).appendChild(nav);
  }

  /* ---------- eventos del modo técnico ---------- */
  function eventsList(){
    let b=document.getElementById('posTechEvents')||document.getElementById('techEvents');
    if(b)return b;
    b=document.querySelector('#oscEventsBox .osc-events-list');
    if(b)return b;
    const host=grid&&grid.children[1];
    if(!host)return null;
    const box=document.createElement('div');box.id='oscEventsBox';box.className='osc-events-box';
    box.innerHTML='<h3>MODO TÉCNICO · EVENTOS</h3><div class="osc-events-list"></div>';
    host.appendChild(box);return box.querySelector('.osc-events-list');
  }
  function log(text,cls='tutor'){
    const b=eventsList();if(!b)return;
    const d=document.createElement('div');d.className='osc-event '+cls;d.textContent=text;b.appendChild(d);b.scrollTop=b.scrollHeight;
  }
  function watchSteps(){
    if(moduleKey!=='wallet'&&moduleKey!=='ecommerce')return;
    const state=/\b(done|ok|complete|completed|active|current)\b/;
    new MutationObserver(muts=>{
      const steps=[...document.querySelectorAll('.flow .step')];
      if(!steps.some(s=>state.test(s.className)))steps.forEach(s=>delete s.dataset.oscLogged);
      muts.forEach(m=>{
        const s=m.target.closest?.('.flow .step');
        if(!s||s.dataset.oscLogged||!state.test(s.className))return;
        s.dataset.oscLogged='1';
        const name=(s.querySelector('b')||{}).textContent||'etapa';
        log(`stage_${s.dataset.step||''} · ${name.trim()}`,'step');
      });
    }).observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true});
  }

  /* ---------- Data Elements interactivos ---------- */
  function decorateRows(){
    document.querySelectorAll('#deTable tr, .debox tbody tr').forEach(tr=>{
      if(tr.dataset.oscDe)return;
      const c=tr.cells;if(!c||c.length<2)return;
      const key=(c[0].textContent||'').trim().replace(/^DE\s*/i,'');
      if(!/^(\d{1,3}|MTI)$/i.test(key))return;
      tr.dataset.oscDe=key.toUpperCase();
      tr.closest('table')?.classList.add('osc-de-table');
      const nameCell=c[1];
      if(c.length>=5){
        const f=document.createElement('small');f.className='osc-de-fmt';
        f.textContent=[(c[4].textContent||'').trim(),(c[3].textContent||'').trim()].filter(Boolean).join(' · ');nameCell.appendChild(f);
      }
      if(!/^\d{1,3}$/.test(key))return;
      const net=fieldNetwork();
      if(!net||!window.OSCFieldCards?.has?.(Number(key),net))return;
      const b=document.createElement('button');b.type='button';b.className='osc-de-help osc-de-card';
      b.title='Ver la ficha del campo';b.setAttribute('aria-label','Ficha del campo '+key);b.textContent='☝';
      b.onclick=e=>{e.preventDefault();e.stopPropagation();openFieldCard(key)};nameCell.appendChild(b);
    });
  }
  // Red de la operación que se está mirando: Wallet/E-Commerce toman la última transacción; POS/ATM, la tarjeta elegida.
  function fieldNetwork(){
    if(moduleKey==='wallet'||moduleKey==='ecommerce')return String(window.OSCModernLastTx?.network||'').toLowerCase();
    // rc.1.45 · POS y ATM: red de la operación seleccionada (en QR, la del QR). Antes caía siempre en Visa.
    let n='';
    try{
      if(moduleKey==='pos'){const i=window.OSCPosInspect?.();n=String((i?.op?.paymentMethod==='qr'?i.op.network:'')||i?.card?.network||i?.op?.network||'');}
      else if(moduleKey==='atm'){n=String(window.OSCAtmInspect?.()?.network||'');}
    }catch(_){}
    n=(n||String(window.OSCHelp?.selectedNetwork?.()||'')).toLowerCase();
    return n.startsWith('master')?'mastercard':n;
  }
  function openFieldCard(de){
    const net=fieldNetwork();
    if(window.OSCHelp?.openTechnical)return window.OSCHelp.openTechnical(Number(de),net);
    return window.OSCFieldCards?.open?.(Number(de),net);
  }
  function ensureTools(){
    const table=document.querySelector('#deTable')?.closest('table')||document.querySelector('.debox table');
    if(!table)return;
    const wrap=table.closest('.table-wrap')||table.closest('.debox')||table;
    grid?.querySelectorAll(':scope>*').forEach(ch=>ch.classList.toggle('osc-de-panel',ch.contains(table)));
    if(wrap.previousElementSibling?.classList?.contains('osc-de-tools'))return;
    const tools=document.createElement('div');tools.className='osc-de-tools';tools.style.display='none';
    wrap.parentNode.insertBefore(tools,wrap);
    if(!wrap.nextElementSibling?.classList?.contains('osc-de-hint')){
      const h=document.createElement('div');h.className='osc-de-hint';
      h.textContent='Tocá ☝ en un campo para ver su ficha: qué es, cómo se arma y qué mirar.';
      wrap.parentNode.insertBefore(h,wrap.nextSibling);
    }
  }
  function refresh(){
    if(busy)return;busy=true;
    try{decorateRows();ensureTools();}finally{busy=false}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,60)}

  document.addEventListener('click',e=>{
    const tr=e.target.closest?.('tr[data-osc-de]');
    if(!tr||e.target.closest('a,input,select,textarea'))return;
    document.querySelectorAll('tr.osc-de-selected').forEach(x=>x.classList.remove('osc-de-selected'));
    tr.classList.add('osc-de-selected');
    const cells=tr.cells,nameCell=cells[1];
    const info={value:(cells[2]?.textContent||'').trim(),name:(nameCell?.firstChild?.textContent||nameCell?.textContent||'').trim()};
    pending=[tr.dataset.oscDe,info];
  });

  /* ---------- arranque ---------- */
  function init(){
    if(!buildDock())return;
    decorateHeader();apply();watchSteps();
    (mq.addEventListener?mq.addEventListener('change',apply):mq.addListener?.(apply));
    new MutationObserver(schedule).observe(grid,{childList:true,subtree:true});
    refresh();
  }
  window.OSCLearning={
    version:VERSION,moduleKey,log,
    get dock(){return dock},
    isDocked:()=>on,
    isCollapsed:()=>collapsed,
    setCollapsed,
    toggleCollapsed:()=>setCollapsed(!collapsed),
    onChange:f=>listeners.push(f),
    takePending:()=>{const p=pending;pending=null;return p}
  };
  // Los scripts van al final del <body>: si la rejilla ya existe se inicia de inmediato, así el dock está listo antes que el Tutor.
  if(document.querySelector(GRID_SEL)||document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init);
})();
