(() => {
  const clean = value => String(value || '').replace(/\D/g, '');
  const profiles = {
    visa: {id:'visa', name:'Visa', short:'VISA', color:'#1a66ff', manual:'Visa Base I / perfil educativo Visa', status:'Activo'},
    mastercard: {id:'mastercard', name:'Mastercard', short:'MC', color:'#ff5f00', manual:'Mastercard authorization profile / perfil educativo', status:'Activo'},
    amex: {id:'amex', name:'American Express', short:'AMEX', color:'#2f78c4', manual:'American Express GNS Network Specifications - Authorization · Oct 2023', status:'Core Online activo'},
    domestic: {id:'domestic', name:'Banco Virtual OSC', short:'DOM', color:'#18b981', manual:'Ruteo doméstico educativo · BIN 990001', status:'Banco Virtual activo'},
    link: {id:'link', name:'Red LINK', short:'LINK', color:'#e9eef5', manual:'LINK · Conexión Host to Host ISO 8583 (BASE24) · C-X-1 a C-X-8 + anexos Transferencias y DEBIN', status:'Activo'}
  };
  function detect(pan){
    const n=clean(pan);
    if(/^990001/.test(n)) return profiles.domestic;
    if(/^990002/.test(n)) return profiles.link;
    if(/^4/.test(n)) return profiles.visa;
    const first2=Number(n.slice(0,2));
    const first6=Number(n.slice(0,6));
    if((first2>=51 && first2<=55) || (first6>=222100 && first6<=272099)) return profiles.mastercard;
    if(first2===34 || first2===37) return profiles.amex;
    if(/^(34|37)/.test(n)) return profiles.amex;
    return {id:'unknown',name:'No identificada',short:'?',color:'#64748b',manual:'Perfil ISO 8583 genérico',status:'Revisar BIN'};
  }
  function luhn(pan){
    const n=clean(pan); if(n.length<12) return false;
    let sum=0, alt=false;
    for(let i=n.length-1;i>=0;i--){let d=Number(n[i]);if(alt){d*=2;if(d>9)d-=9;}sum+=d;alt=!alt;}
    return sum%10===0;
  }
  function resolve(selected, pan){ return selected && selected!=='auto' ? profiles[selected] : detect(pan); }
  function logo(profile,size=''){
    const p=profile||profiles.visa;
    if(!profiles[p.id]) return `<strong>${p.name}</strong>`;
    if(p.id==='link') return `<img class="network-brand-logo link ${size}" src="assets/brand-link.png" alt="Red LINK" style="height:22px;width:22px;border-radius:50%;box-shadow:0 0 0 1px #fff">`;
    if(p.id==='domestic') return `<strong class="network-brand-logo domestic ${size}" style="color:#55e6ae;font-size:11px;letter-spacing:.06em">DOMÉSTICA</strong>`;
    const file=p.id==='visa'?'brand-visa-blue.png':p.id==='mastercard'?'brand-mastercard.png':'brand-amex-white.png';
    return `<img class="network-brand-logo ${p.id} ${size}" src="assets/${file}" alt="${p.name}">`;
  }
  function badge(profile){
    const p=profile||profiles.visa;
    return `<span class="network-profile-brand">${logo(p)}</span><small>${p.manual}</small>`;
  }
  window.OSCNetworks={profiles,detect,luhn,resolve,clean,badge,logo};
})();
