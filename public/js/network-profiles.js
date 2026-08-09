(() => {
  const clean = value => String(value || '').replace(/\D/g, '');
  const profiles = {
    visa: {id:'visa', name:'Visa', short:'VISA', color:'#1a66ff', manual:'Visa Base I / perfil educativo Visa', status:'Activo'},
    mastercard: {id:'mastercard', name:'Mastercard', short:'MC', color:'#ff5f00', manual:'Mastercard authorization profile / perfil educativo', status:'Activo'},
    amex: {id:'amex', name:'American Express', short:'AMEX', color:'#2f78c4', manual:'American Express GNS Network Specifications - Authorization · Oct 2023', status:'Core Online activo'}
  };
  function detect(pan){
    const n=clean(pan);
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
  function badge(profile){
    const p=profile||profiles.visa;
    return `<span class="osc-network-dot" style="background:${p.color}"></span><strong>${p.name}</strong><small>${p.manual}</small>`;
  }
  window.OSCNetworks={profiles,detect,luhn,resolve,clean,badge};
})();