/* OSC Academy v3.5.4.27 - navegación + habilitación progresiva por cohorte. */
(async()=>{
  const modules=[
    {href:'index.html',icon:'⌂',label:'Dashboard'},
    {href:'clientes.html',icon:'👤',label:'CLIENTES'},
    {href:'curso_interactivo.html',icon:'🎓',label:'Curso Interactivo',key:'course_iso8583',day:1},
    {href:'ebook.html',icon:'📖',label:'eBook ISO 8583'},
    {href:'constructor.html',icon:'⌘',label:'Constructor ISO8583',key:'constructor',day:1},
    {href:'pos.html',icon:'▣',label:'POS Virtual',key:'pos',day:1},
    {href:'atm.html',icon:'🏧',label:'ATM Virtual',key:'atm',day:2},
    {href:'wallet.html',icon:'📱',label:'Wallet / Tokenización',key:'wallet',day:4},
    {href:'ecommerce.html',icon:'🛒',label:'E-Commerce / 3DS',key:'ecommerce',day:3},
    {href:'switch.html',icon:'🏦',label:'Switch del Adquirente'},
    {href:'switch_emisor.html',icon:'🌎',label:'Switch Emisor',key:'switch_emisor',day:5},
    {href:'parser.html',icon:'◉',label:'Parser ISO8583',key:'parser',day:1},
    {href:'documentacion.html',icon:'📚',label:'Documentación Técnica'},
    {href:'research.html',icon:'🧪',label:'Investigación'},
    {href:'account.html',icon:'🔐',label:'Mi cuenta'},
    {href:'mastercard_iso.html',icon:'◉',label:'Mastercard ISO',visible:false},
    {href:'cuenta_cliente.html',icon:'💳',label:'Cuenta del Cliente',visible:false},
    {href:'ondemand_lab.html',icon:'🧩',label:'Laboratorio de Nuevas Funcionalidades',visible:false},
    {href:'production_diagnostic.html',icon:'🔎',label:'Diagnóstico de Procesos Productivos',visible:false}
  ];
  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  let access={progressive:false,enabled:[]};
  try{const r=await fetch('/api/auth/me',{credentials:'same-origin'});if(r.ok){const d=await r.json();access=d.moduleAccess||access;}}catch(_){ }
  const enabled=new Set(access.enabled||[]),currentModule=modules.find(m=>m.href.toLowerCase()===current);
  if(access.progressive&&currentModule?.key&&!enabled.has(currentModule.key)){
    document.body.innerHTML=`<main style="min-height:100vh;display:grid;place-items:center;background:#06111d;color:#f5f8fc;font-family:Inter,Segoe UI,Arial,sans-serif"><section style="max-width:560px;text-align:center;border:1px solid #1d405c;border-radius:16px;padding:36px;background:#0a1928"><div style="font-size:42px">🔒</div><h1>${currentModule.label}</h1><p style="color:#9cb2c6">Este módulo forma parte del programa progresivo y estará disponible después de la clase del Día ${currentModule.day}.</p><a href="index.html" style="display:inline-block;margin-top:14px;padding:11px 18px;border-radius:9px;background:#0875dc;color:white;text-decoration:none">← Volver a la plataforma</a></section></main>`;
    return;
  }
  const sidebar=document.querySelector('aside.side, aside.sidebar, aside.osc-sidebar');
  if(!sidebar)return;
  const managed=new Set(modules.map(item=>item.href));
  const style=document.createElement('style');style.textContent=`.osc-primary-navigation{display:grid!important;gap:4px!important;margin:14px 0 16px!important}.osc-primary-navigation .nav{display:block!important;position:static!important;margin:0!important;padding:10px 12px!important;text-decoration:none!important}.osc-primary-navigation .nav.locked{opacity:.52}.future-resources{display:none!important}aside a[href="mastercard_iso.html"],aside a[href="cuenta_cliente.html"],aside a[href="ondemand_lab.html"],aside a[href="production_diagnostic.html"]{display:none!important}`;document.head.appendChild(style);
  sidebar.querySelectorAll('a[href]').forEach(link=>{const href=(link.getAttribute('href')||'').split(/[?#]/)[0].split('/').pop();if(managed.has(href))link.remove();});
  sidebar.querySelectorAll('nav').forEach(nav=>{if(!nav.querySelector('a,button,[data-op],[data-section]'))nav.remove();});sidebar.querySelectorAll(':scope > .section:not(.instructor)').forEach(section=>section.remove());
  const nav=document.createElement('nav');nav.className='osc-primary-navigation';nav.setAttribute('aria-label','Navegación principal');
  modules.filter(item=>item.visible!==false).forEach(item=>{const locked=access.progressive&&item.key&&!enabled.has(item.key),link=document.createElement('a');link.className='nav'+(current===item.href.toLowerCase()?' active':'')+(locked?' locked':'');link.href=new URL(item.href,location.origin+'/').href;link.textContent=`${locked?'🔒':item.icon} ${item.label}${locked?` · Día ${item.day}`:''}`;nav.appendChild(link);});
  const brand=sidebar.querySelector('.brand,.osc-brand');if(brand)brand.insertAdjacentElement('afterend',nav);else sidebar.prepend(nav);
})();
