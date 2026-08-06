(function(){
  const KEY='oscAcademyIssuerWorkspaceV1';
  const now=()=>new Date().toISOString();
  const initial=()=>({version:1,studentId:'demo-oscar',updatedAt:now(),files:[],records:[],accounts:[{id:'ACC-001',customer:'Cliente Demo OSC',panLast4:'1111',currency:'ARS',movements:[]}],events:[]});
  function read(){try{return {...initial(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){return initial()}}
  function write(db){db.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(db));window.dispatchEvent(new CustomEvent('osc-issuer-updated',{detail:db}));return db}
  function moneyCode(code){return code||'USD'}
  function makeSample(){
    const db=read(), stamp=Date.now();
    const visa=[
      {id:`V-${stamp}-1`,network:'VISA',recordType:'05',panLast4:'1111',amountMinor:12500,currency:'EUR',country:'ES',merchant:'MADRID BOOKS',date:'20260805',status:'PENDING',direction:'INCOMING'},
      {id:`V-${stamp}-2`,network:'VISA',recordType:'07',panLast4:'1111',amountMinor:20000,currency:'USD',country:'CL',merchant:'ATM SANTIAGO',date:'20260805',status:'PENDING',direction:'INCOMING'}
    ];
    const mc=[
      {id:`M-${stamp}-1`,network:'MASTERCARD',recordType:'1240',panLast4:'1111',amountMinor:8500,currency:'USD',country:'US',merchant:'MIAMI MARKET',date:'20260805',status:'PENDING',direction:'INCOMING'}
    ];
    const all=[...visa,...mc]; db.records.unshift(...all);
    db.files.unshift({id:`IN-VISA-${stamp}`,network:'VISA',type:'INCOMING_CTF',createdAt:now(),recordIds:visa.map(r=>r.id),status:'RECEIVED'}, {id:`IN-MC-${stamp}`,network:'MASTERCARD',type:'INCOMING_IPM',createdAt:now(),recordIds:mc.map(r=>r.id),status:'RECEIVED'});
    db.events.unshift({at:now(),text:'Se recibieron archivos Incoming Visa y Mastercard de demostración.'}); return write(db)
  }
  function processFile(id){
    const db=read(), f=db.files.find(x=>x.id===id); if(!f)return null;
    const account=db.accounts[0];
    f.recordIds.forEach(rid=>{const r=db.records.find(x=>x.id===rid); if(!r||r.status==='PROCESSED')return; r.status='PROCESSED'; account.movements.unshift({id:'MOV-'+rid,createdAt:now(),network:r.network,merchant:r.merchant,country:r.country,originalAmountMinor:r.amountMinor,originalCurrency:r.currency,postedAmountMinor:r.amountMinor,postedCurrency:r.currency,panLast4:r.panLast4,sourceRecordId:r.id});});
    f.status='PROCESSED'; db.events.unshift({at:now(),text:`${f.type} procesado y contabilizado en la cuenta demo.`}); return write(db)
  }
  function reset(){localStorage.removeItem(KEY);return write(initial())}
  window.OSCIssuerStore={read,write,makeSample,processFile,reset,key:KEY};
})();