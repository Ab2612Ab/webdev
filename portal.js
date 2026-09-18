const sb = window.supabaseClient;

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));
}
function money(value){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value||0));
}
function bindImageFallbacks(root=document){
  root.querySelectorAll('img').forEach(img=>{
    if(img.dataset.fallbackBound) return;
    img.dataset.fallbackBound='1';
    img.addEventListener('error',()=>{
      if(img.dataset.imageFailed) return;
      img.dataset.imageFailed='1';
      img.src='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1000"><rect width="1400" height="1000" fill="#e8e5df"/><text x="700" y="500" text-anchor="middle" dominant-baseline="middle" fill="#777" font-family="Arial,sans-serif" font-size="34">webdev preview</text></svg>');
    },{once:false});
  });
}
function catalogImage(site){
  return site?.image || 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1400&q=88';
}
async function getSites(){
  const {data,error}=await sb.from('website_listings').select('*').eq('published',true).order('id');
  if(error){ console.error(error); return []; }
  return data || [];
}
async function renderCatalog(){
  const el=document.querySelector('#catalog-grid');
  if(!el) return;
  el.innerHTML='<div class="empty-state">Loading marketplace…</div>';
  const sites=await getSites();
  if(!sites.length){el.innerHTML='<div class="empty-state">No websites are published yet.</div>';return;}
  el.innerHTML=sites.map((s,i)=>`
    <article class="site-card">
      <div class="site-card-media">
        <img src="${escapeHtml(catalogImage(s))}" alt="${escapeHtml(s.name)} website preview" loading="lazy">
        <span class="site-card-badge">${escapeHtml(s.category)}</span>
      </div>
      <div class="site-card-body">
        <div class="site-card-index">WEBDEV / ${String(i+1).padStart(2,'0')}</div>
        <h2>${escapeHtml(s.name)}</h2>
        <p>${escapeHtml(s.description || 'Ready-to-customize website.')}</p>
        <div class="site-features">${(s.features||[]).slice(0,4).map(f=>`<span>${escapeHtml(f)}</span>`).join('')}</div>
        <div class="site-card-meta"><strong class="site-price">${money(s.price)}</strong><span>Ready to customize</span></div>
        <div class="site-actions">
          <a href="website.html?website=${encodeURIComponent(s.id)}">View details ↗</a>
          <a class="secondary" href="client.html?website=${encodeURIComponent(s.id)}">Buy / customize</a>
        </div>
      </div>
    </article>`).join('');
}

async function renderWebsiteDetail(){
  const el=document.querySelector('#detail');
  if(!el) return;
  const id=new URLSearchParams(location.search).get('website');
  if(!id){el.innerHTML='<div class="empty-state">No website was selected. <a href="websites.html">Return to catalog ↗</a></div>';return;}
  const {data:s,error}=await sb.from('website_listings').select('*').eq('id',id).eq('published',true).maybeSingle();
  if(error||!s){el.innerHTML='<div class="empty-state">This website is unavailable. <a href="websites.html">Return to catalog ↗</a></div>';return;}
  const features=(s.features||[]).map(f=>'<span>'+escapeHtml(f)+'</span>').join('');
  el.innerHTML='<div class="detail-media"><img src="'+escapeHtml(catalogImage(s))+'" alt="'+escapeHtml(s.name)+' website preview"></div><div class="detail-copy"><p class="eyebrow">'+escapeHtml(s.category)+' / WEBDEV MARKET</p><h1>'+escapeHtml(s.name)+'</h1><p class="detail-description">'+escapeHtml(s.description||'A polished, ready-to-customize website concept.')+'</p><div class="detail-price">'+money(s.price)+'</div><div class="site-features">'+features+'</div><div class="detail-actions"><a class="btn dark" href="client.html?website='+encodeURIComponent(s.id)+'">Buy / customize ↗</a>'+(s.demo?'<a class="btn light" target="_blank" rel="noopener" href="'+escapeHtml(s.demo)+'">Open preview ↗</a>':'<a class="btn light" href="contact.html">Request a preview ↗</a>')+'</div><div class="detail-notes"><div><b>Responsive</b><span>Phone, tablet and desktop ready.</span></div><div><b>Customizable</b><span>Branding, content, pages and integrations can be adapted.</span></div><div><b>Secure workspace</b><span>Submit project requirements and requests through the client area.</span></div></div><a class="text-link" href="websites.html">← Back to all websites</a></div>';
}
async function currentUser(){
  const {data}=await sb.auth.getUser();
  return data.user || null;
}
async function currentProfile(){
  const user=await currentUser();
  if(!user) return null;
  const {data}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();
  return data || null;
}
async function requireOwner(){
  const profile=await currentProfile();
  if(!profile || profile.role!=='owner'){ location.href='login.html'; return null; }
  return profile;
}
async function initLogin(){
  const form=document.querySelector('#loginForm');
  if(!form) return;
  const msg=document.querySelector('#loginMsg');
  const emailEl=document.querySelector('#email');
  const passwordEl=document.querySelector('#password');

  form.onsubmit=async e=>{
    e.preventDefault();
    msg.textContent='Signing in…';
    const {error}=await sb.auth.signInWithPassword({email:emailEl.value.trim(),password:passwordEl.value});
    if(error){msg.textContent=error.message;return;}
    const {data:claim}=await sb.rpc('claim_first_owner');
    if(claim===true) msg.textContent='Owner access activated.';
    const profile=await currentProfile();
    if(profile?.role==='owner') location.href='admin.html';
    else { await sb.auth.signOut(); msg.textContent='This account is a client account. Use the client area instead.'; }
  };

  const signup=document.querySelector('#ownerSignup');
  if(signup) signup.onclick=async()=>{
    const email=emailEl.value.trim(), password=passwordEl.value;
    if(!email || password.length<6){msg.textContent='Enter an email and a password of at least 6 characters.';return;}
    msg.textContent='Creating owner account…';
    const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/login.html'}});
    if(error){msg.textContent=error.message;return;}
    if(data.session){
      await sb.rpc('claim_first_owner');
      location.href='admin.html';
    } else {
      msg.textContent='Account created. Check your email to confirm, then sign in here.';
    }
  };

  const {data}=await sb.auth.getSession();
  if(data.session){
    const profile=await currentProfile();
    if(profile?.role==='owner') location.href='admin.html';
  }
}
async function initAdmin(){
  const profile=await requireOwner();
  if(!profile) return;

  const list=document.querySelector('#adminList');
  const form=document.querySelector('#siteForm');
  const requestList=document.querySelector('#requestList');
  const contactList=document.querySelector('#contactList');
  const purchaseList=document.querySelector('#purchaseList');
  let editing=null;

  async function draw(){
    const {data:sites,error}=await sb.from('website_listings').select('*').order('id');
    if(error){list.innerHTML=`<div class="empty-state">${escapeHtml(error.message)}</div>`;return;}
    document.querySelector('#siteCount').textContent=sites.length;
    document.querySelector('#inventoryValue').textContent=money(sites.reduce((a,s)=>a+Number(s.price||0),0));
    list.innerHTML='<div class="admin-row head"><span>Website</span><span>Category</span><span>Price</span><span>Actions</span></div>'+
      sites.map(s=>`<div class="admin-row">
        <div class="admin-site"><img src="${escapeHtml(catalogImage(s))}" alt=""><div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.id)}</small></div></div>
        <span>${escapeHtml(s.category)}</span><span>${money(s.price)}</span>
        <span class="admin-actions"><button data-edit="${escapeHtml(s.id)}">Edit</button> <button class="danger" data-delete="${escapeHtml(s.id)}">Delete</button></span>
      </div>`).join('');
    list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));
    list.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{
      if(!confirm('Delete this listing?')) return;
      const {error}=await sb.from('website_listings').delete().eq('id',b.dataset.delete);
      if(error) alert(error.message); else draw();
    });
    bindImageFallbacks(list);
    await drawRequests();
    await drawContacts();
    await drawPurchases();
  }

  async function drawRequests(){
    if(!requestList) return;
    const {data,error}=await sb.from('project_requests').select('id,message,status,created_at,client_id,project_id').order('created_at',{ascending:false}).limit(30);
    if(error){requestList.innerHTML=`<div class="empty-state">${escapeHtml(error.message)}</div>`;return;}
    requestList.innerHTML=data?.length ? data.map(r=>`<div class="admin-row">
      <div><strong>${escapeHtml(r.message)}</strong><small>${new Date(r.created_at).toLocaleString()}</small></div>
      <span>${escapeHtml(r.status)}</span><span>${escapeHtml(String(r.client_id).slice(0,8))}</span>
      <span class="admin-actions"><button data-resolve="${escapeHtml(r.id)}">Resolve</button></span>
    </div>`).join('') : '<div class="empty-state">No project requests yet.</div>';
    requestList.querySelectorAll('[data-resolve]').forEach(b=>b.onclick=async()=>{
      const {error}=await sb.from('project_requests').update({status:'resolved'}).eq('id',b.dataset.resolve);
      if(error) alert(error.message); else drawRequests();
    });
  }

  async function drawPurchases(){
    if(!purchaseList) return;
    const {data,error}=await sb.from('purchase_requests').select('id,website_id,contact_name,contact_email,message,status,created_at').order('created_at',{ascending:false}).limit(30);
    if(error){purchaseList.innerHTML='<div class="empty-state">'+escapeHtml(error.message)+'</div>';return;}
    purchaseList.innerHTML=data?.length ? data.map(r=>'<div class="admin-row"><div><strong>'+escapeHtml(r.contact_name||r.contact_email||'Purchase request')+'</strong><small>'+escapeHtml(r.contact_email||'')+' · '+escapeHtml(r.website_id||'')+'<br>'+escapeHtml(r.message||'')+'</small></div><span>'+escapeHtml(r.status)+'</span><span>'+new Date(r.created_at).toLocaleString()+'</span><span class="admin-actions"><button data-purchase-close="'+escapeHtml(r.id)+'">Close</button></span></div>').join('') : '<div class="empty-state">No purchase requests yet.</div>';
    purchaseList.querySelectorAll('[data-purchase-close]').forEach(b=>b.onclick=async()=>{
      const {error}=await sb.from('purchase_requests').update({status:'closed'}).eq('id',b.dataset.purchaseClose);
      if(error) alert(error.message); else drawPurchases();
    });
  }

  async function drawContacts(){
    if(!contactList) return;
    const {data,error}=await sb.from('contact_requests').select('id,name,company,email,message,status,created_at').order('created_at',{ascending:false}).limit(30);
    if(error){contactList.innerHTML=`<div class="empty-state">${escapeHtml(error.message)}</div>`;return;}
    contactList.innerHTML=data?.length ? data.map(r=>`<div class="admin-row">
      <div><strong>${escapeHtml(r.name || r.email || 'Website enquiry')}</strong><small>${escapeHtml(r.company || '')} · ${escapeHtml(r.email || '')}<br>${escapeHtml(r.message || '')}</small></div>
      <span>${escapeHtml(r.status)}</span><span>${new Date(r.created_at).toLocaleString()}</span>
      <span class="admin-actions"><button data-contact-resolve="${escapeHtml(r.id)}">Close</button></span>
    </div>`).join('') : '<div class="empty-state">No website enquiries yet.</div>';
    contactList.querySelectorAll('[data-contact-resolve]').forEach(b=>b.onclick=async()=>{
      const {error}=await sb.from('contact_requests').update({status:'closed'}).eq('id',b.dataset.contactResolve);
      if(error) alert(error.message); else drawContacts();
    });
  }

  function edit(id){
    sb.from('website_listings').select('*').eq('id',id).single().then(({data:s,error})=>{
      if(error || !s) return;
      editing=id; form.style.display='block';
      document.querySelector('#formTitle').textContent='Edit website';
      document.querySelector('#siteName').value=s.name||'';
      document.querySelector('#siteCategory').value=s.category||'';
      document.querySelector('#sitePrice').value=s.price||0;
      document.querySelector('#siteImage').value=s.image||'';
      document.querySelector('#siteDescription').value=s.description||'';
      document.querySelector('#siteDemo').value=s.demo||'';
      document.querySelector('#siteFeatures').value=(s.features||[]).join(', ');
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }

  document.querySelector('#newSite').onclick=()=>{
    editing=null; form.reset(); form.style.display='block';
    document.querySelector('#formTitle').textContent='Add a website';
  };
  document.querySelector('#cancelForm').onclick=()=>form.style.display='none';

  form.onsubmit=async e=>{
    e.preventDefault();
    const item={
      id:editing||'site-'+Date.now(),
      name:document.querySelector('#siteName').value.trim(),
      category:document.querySelector('#siteCategory').value.trim(),
      price:Number(document.querySelector('#sitePrice').value),
      image:document.querySelector('#siteImage').value.trim(),
      description:document.querySelector('#siteDescription').value.trim(),
      demo:document.querySelector('#siteDemo').value.trim()||null,
      features:document.querySelector('#siteFeatures').value.split(',').map(x=>x.trim()).filter(Boolean),
      published:true
    };
    const {error}=await sb.from('website_listings').upsert(item);
    if(error){alert(error.message);return;}
    form.style.display='none'; draw();
  };
  bindImageFallbacks(document);
  document.querySelector('#logout').onclick=async e=>{e.preventDefault();await sb.auth.signOut();location.href='login.html';};
  draw();
}

if(document.querySelector('#loginForm')) initLogin();
