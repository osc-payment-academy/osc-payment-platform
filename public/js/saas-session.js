(function(){
  window.OSCSession={
    async me(){const r=await fetch('/api/auth/me');if(!r.ok){location.href='/login.html';return null}return r.json()},
    async logout(){await fetch('/api/auth/logout',{method:'POST'});location.href='/login.html'}
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const b=document.getElementById('logout');if(b)b.addEventListener('click',()=>OSCSession.logout());
    if(location.pathname.endsWith('/saas-admin.html')){
      const nav=document.querySelector('.tabs');if(nav){for(const [href,label] of [['products.html','Productos'],['students.html','Alumnos']]){const a=document.createElement('a');a.className='btn';a.href=href;a.textContent=label;nav.insertBefore(a,nav.lastElementChild)}}
    }
  });
})();
