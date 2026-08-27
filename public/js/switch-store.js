(function(){
  const KEY='oscAcademyAcquirerWorkspaceV1';
  const now=()=>new Date().toISOString();
  const initial=()=>({version:3,ownerUserId:null,ownerTenantId:null,createdAt:now(),updatedAt:now(),retention:{active:'indefinite',expiredDays:90},transactions:[],batches:[],artifacts:[],events:[],atmMessages:[],lastAtmReconciliation:null,constructorPractices:[]});
  function read(){try{return {...initial(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){return initial()}}
  let syncTimer=null,syncInFlight=Promise.resolve(),hydrated=false;
  function pushRemote(db){
    const snapshot=JSON.parse(JSON.stringify(db));
    clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>{
      syncInFlight=syncInFlight.catch(()=>null).then(async()=>{
        const response=await fetch('/api/workspace/payment',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({data:snapshot})});
        if(!response.ok)throw new Error(`Workspace D1: ${response.status}`);
        window.dispatchEvent(new CustomEvent('osc-workspace-synced',{detail:{updatedAt:snapshot.updatedAt}}));
      }).catch(error=>console.warn('No se pudo sincronizar el workspace con D1',error));
    },120);
  }
  function write(db,options={}){db.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(db));window.dispatchEvent(new CustomEvent('osc-switch-updated',{detail:db}));if(hydrated&&options.remote!==false)pushRemote(db);return db}
  async function hydrate(){
    const local=read();
    try{
      const response=await fetch('/api/workspace/payment',{headers:{accept:'application/json'}});
      if(!response.ok)throw new Error(`Workspace D1: ${response.status}`);
      const result=await response.json();
      const owner={ownerUserId:result.workspace?.userId||null,ownerTenantId:result.workspace?.tenantId||null};
      if(result.data&&typeof result.data==='object'){
        const remote={...initial(),...result.data,...owner,version:3};
        localStorage.setItem(KEY,JSON.stringify(remote));
      }else{
        const sameOwner=local.ownerUserId===owner.ownerUserId&&local.ownerTenantId===owner.ownerTenantId;
        const next=sameOwner?{...initial(),...local,...owner,version:3}:{...initial(),...owner,version:3};
        localStorage.setItem(KEY,JSON.stringify(next));
        hydrated=true;pushRemote(next);
      }
    }catch(error){
      console.warn('D1 no disponible; se mantiene la copia local temporal',error);
    }finally{
      hydrated=true;
      window.dispatchEvent(new CustomEvent('osc-workspace-ready',{detail:read()}));
    }
    return read();
  }
  const ready=hydrate();
  function addTransaction(tx){const db=read();const record={id:tx.id||crypto.randomUUID?.()||('tx-'+Date.now()),createdAt:tx.createdAt||now(),channel:tx.channel||'POS',network:tx.network||'UNKNOWN',type:tx.type||'purchase',amountCents:Number(tx.amountCents||0),currency:tx.currency||'ARS',status:tx.status||'APPROVED',responseCode:tx.responseCode||'00',stan:tx.stan||'',rrn:tx.rrn||'',auth:tx.auth||'',batch:Number(tx.batch||1),closed:Boolean(tx.closed),clearingStatus:tx.clearingStatus||'PENDING',mtiRequest:tx.mtiRequest||'0200',mtiResponse:tx.mtiResponse||'0210',panLast4:tx.panLast4||'',cardId:tx.cardId||'',product:tx.product||'',raw:tx.raw||null,requestFields:tx.requestFields||null,responseFields:tx.responseFields||null,operationLabel:tx.operationLabel||'',dateTime:tx.dateTime||''};
    const idx=db.transactions.findIndex(x=>x.id===record.id);if(idx>=0)db.transactions[idx]={...db.transactions[idx],...record};else db.transactions.unshift(record);db.events.unshift({at:now(),kind:'TRANSACTION',text:`${record.channel} ${record.network} ${record.type} ${record.status}`});return write(db)}
  function closeBatch(payload){const db=read();const channel=payload.channel||'POS',number=Number(payload.batch||1);const txs=db.transactions.filter(t=>t.channel===channel&&t.batch===number&&!t.closed);txs.forEach(t=>{t.closed=true;const approved=['APPROVED','APROBADA'].includes(t.status);const eligible=approved&&['purchase','refund'].includes(t.type);t.clearingStatus=eligible?'READY':'EXCLUDED'});const batch={id:`${channel}-${number}-${Date.now()}`,channel,number,closedAt:now(),status:'CLOSED',requestMti:'0500',responseMti:'0510',responseCode:'00',transactionIds:txs.map(t=>t.id),count:txs.length,totalCents:txs.reduce((s,t)=>s+t.amountCents,0),byNetwork:txs.reduce((a,t)=>{const k=t.network||'UNKNOWN';a[k]||(a[k]={count:0,totalCents:0});a[k].count++;a[k].totalCents+=t.amountCents;return a},{})};db.batches.unshift(batch);db.events.unshift({at:now(),kind:'BATCH_CLOSE',text:`${channel} lote ${number} cerrado: ${batch.count} transacciones`});write(db);return batch}
  function reconcileATM(payload={}){const db=read();const atmId=payload.atmId||'ATM00001';const candidates=db.transactions.filter(t=>t.channel==='ATM'&&!t.closed);let readyCount=0,excludedCount=0,amexCount=0;
    const amexRecon=[];
    candidates.forEach(t=>{
      t.closed=true;
      const approved=['APPROVED','APROBADA'].includes(t.status);
      const financial=['withdrawal','transfer'].includes(t.type);
      if(approved&&t.clearingStatus==='PENDING'&&financial){
        if(t.network==='AMEX'){
          // AMEX ATM: FAS creates First Presentment 1240. The Acquirer reconciles
          // the network reconciliation file against its dispense detail; it does not
          // originate the ATM First Presentment.
          t.clearingStatus='AMEX_RECONCILED'; amexRecon.push(t); amexCount++;
        }else{
          t.clearingStatus='READY'; readyCount++;
        }
      }else{
        t.clearingStatus='EXCLUDED';excludedCount++;
      }
    });
    let amexArtifact=null;
    if(amexRecon.length) amexArtifact=makeArtifact(db,'AMEX_ATM_RECON',amexRecon);
    const rec={id:`ATM-REC-${Date.now()}`,channel:'ATM',atmId,createdAt:now(),status:'RECONCILED',requestMti:payload.requestMti||'0520',responseMti:payload.responseMti||'0530',responseCode:'00',transactionIds:candidates.map(t=>t.id),readyCount,excludedCount,amexCount,amexArtifactId:amexArtifact?.id||null};
    db.batches.unshift(rec);
    db.events.unshift({at:now(),kind:'ATM_RECONCILIATION',text:`${atmId} reconciliado: ${readyCount} READY Visa/MC, ${amexCount} AMEX reconciliadas, ${excludedCount} EXCLUDED`});
    write(db);return rec
  }

  function generateClearing(){
    const db=read();
    const ready=db.transactions.filter(t=>t.closed&&t.clearingStatus==='READY');
    const visa=ready.filter(t=>t.network==='VISA');
    const mc=ready.filter(t=>t.network==='MASTERCARD');
    // AMEX: only POS First Presentments are originated by the Acquirer here.
    // AMEX ATM First Presentments are created by FAS and therefore are intentionally excluded.
    const amexPos=ready.filter(t=>t.network==='AMEX'&&t.channel==='POS'&&['purchase','refund'].includes(t.type));
    const created=[];
    if(visa.length) created.push(makeArtifact(db,'VISA_CTF',visa));
    if(mc.length) created.push(makeArtifact(db,'MASTERCARD_IPM',mc));
    if(amexPos.length) created.push(makeArtifact(db,'AMEX_POS_1240',amexPos));
    [...visa,...mc,...amexPos].forEach(t=>t.clearingStatus='GENERATED');
    db.events.unshift({at:now(),kind:'CLEARING',text:`Generados ${created.length} archivos de clearing`});
    write(db);return created
  }

  function makeArtifact(db,type,txs){const id=`${type}-${Date.now()}-${Math.random().toString(16).slice(2,7)}`;const artifact={id,type,createdAt:now(),status:'GENERATED',transactionIds:txs.map(t=>t.id),count:txs.length,totalCents:txs.reduce((s,t)=>s+t.amountCents,0),netCents:txs.reduce((s,t)=>s+(t.type==='refund'?-Number(t.amountCents||0):Number(t.amountCents||0)),0)};db.artifacts.unshift(artifact);return artifact}
  function setAtmMessages(messages){const db=read(),next=Array.isArray(messages)?messages.slice(0,120):[];if(JSON.stringify(db.atmMessages||[])===JSON.stringify(next))return db;db.atmMessages=next;return write(db)}
  function setLastAtmReconciliation(value){const db=read();db.lastAtmReconciliation=value||null;return write(db)}
  function addConstructorPractice(practice){const db=read(),record={id:practice.id||`constructor-${Date.now()}-${Math.random().toString(16).slice(2,7)}`,createdAt:practice.createdAt||now(),mode:practice.mode||'constructor',network:practice.network||'auto',mti:String(practice.mti||''),bitmap:String(practice.bitmap||''),annotated:String(practice.annotated||''),raw:String(practice.raw||''),valid:practice.valid!==false,missing:Array.isArray(practice.missing)?practice.missing:[]};db.constructorPractices=Array.isArray(db.constructorPractices)?db.constructorPractices:[];db.constructorPractices.unshift(record);db.constructorPractices=db.constructorPractices.slice(0,50);return write(db)}
  function flush(){clearTimeout(syncTimer);return hydrated?syncInFlight.catch(()=>null).then(()=>{const snapshot=read();return fetch('/api/workspace/payment',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({data:snapshot})}).then(response=>{if(!response.ok)throw new Error(`Workspace D1: ${response.status}`);return response.json()})}):Promise.resolve()}
  function reset(){localStorage.removeItem(KEY);return write(initial())}
  window.OSCSwitchStore={read,write,addTransaction,closeBatch,reconcileATM,generateClearing,setAtmMessages,setLastAtmReconciliation,addConstructorPractice,flush,reset,ready,key:KEY};
})();
