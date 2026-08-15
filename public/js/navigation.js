/* OSC Academy v3.5.4.14 - navegación global estable.
   Los módulos ocultos permanecen declarados para poder reactivarlos más adelante. */
(() => {
  const modules=[
    {href:'index.html',icon:'⌂',label:'Dashboard'},
    {href:'curso_interactivo.html',icon:'🎓',label:'Curso Interactivo'},
    {href:'ebook.html',icon:'📖',label:'eBook ISO 8583'},
    {href:'constructor.html',icon:'⌘',label:'Constructor ISO8583'},
    {href:'pos.html',icon:'▣',label:'POS Virtual'},
    {href:'atm.html',icon:'🏧',label:'ATM Virtual'},
    {href:'switch.html',icon:'🏦',label:'Switch del Adquirente'},
    {href:'parser.html',icon:'◉',label:'Parser ISO8583'},
    {href:'documentacion.html',icon:'📚',label:'Documentación Técnica'},
    {href:'research.html',icon:'🧪',label:'Investigación'},
    {href:'mastercard_iso.html',icon:'◉',label:'Mastercard ISO',visible:false},
    {href:'cuenta_cliente.html',icon:'💳',label:'Cuenta del Cliente',visible:false}
  ];
  const managed=new Set(modules.map(item=>item.href));
  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const sidebar=document.querySelector('aside.side, aside.sidebar, aside.osc-sidebar');
  if(!sidebar)return;

  const style=document.createElement('style');
  style.textContent=`
    .osc-primary-navigation{display:grid!important;gap:4px!important;margin:14px 0 16px!important}
    .osc-primary-navigation .nav{display:block!important;position:static!important;margin:0!important;padding:10px 12px!important;text-decoration:none!important}
    aside a[href="mastercard_iso.html"],aside a[href="cuenta_cliente.html"]{display:none!important}
  `;
  document.head.appendChild(style);

  sidebar.querySelectorAll('a[href]').forEach(link=>{
    const href=(link.getAttribute('href')||'').split(/[?#]/)[0].split('/').pop();
    if(managed.has(href))link.remove();
  });
  sidebar.querySelectorAll('nav').forEach(nav=>{
    if(!nav.querySelector('a,button,[data-op],[data-section]'))nav.remove();
  });
  sidebar.querySelectorAll(':scope > .section:not(.instructor)').forEach(section=>section.remove());

  const nav=document.createElement('nav');
  nav.className='osc-primary-navigation';
  nav.setAttribute('aria-label','Navegación principal');
  modules.filter(item=>item.visible!==false).forEach(item=>{
    const link=document.createElement('a');
    link.className='nav'+(current===item.href.toLowerCase()?' active':'');
    link.href=item.href;
    link.textContent=`${item.icon} ${item.label}`;
    nav.appendChild(link);
  });
  const brand=sidebar.querySelector('.brand,.osc-brand');
  if(brand)brand.insertAdjacentElement('afterend',nav);else sidebar.prepend(nav);
})();
