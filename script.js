const savedProjects=[];const drawer=document.querySelector('#drawer'),content=document.querySelector('#drawer-content'),toast=document.querySelector('#toast');
function openDrawer(type){
drawer.classList.add('open');
if(type==='contact')content.innerHTML='<h2>Start a project</h2><p>Tell us what you need and we will shape the right website direction around your business.</p><input placeholder="Your name"><input placeholder="Business / company"><input placeholder="Email address" type="email"><textarea placeholder="What do you need the website to do?"></textarea><button class="btn dark" style="width:100%;margin-top:10px">Send project enquiry ↗</button>';
if(type==='search')content.innerHTML='<h2>Explore webdev</h2><input id="searchInput" placeholder="Search services or capabilities…" autofocus><p style="color:#777">Try “web design”, “e-commerce”, “SaaS”, “development” or “strategy”.</p>';
if(type==='account')content.innerHTML='<h2>Client portal</h2><p>Private client workspace coming soon. Project communication and delivery can be organized here as the studio grows.</p><button class="btn dark" style="width:100%;margin-top:10px">Back to website ↗</button>';
if(type==='menu')content.innerHTML='<h2>Menu</h2><p><a href="#work">Work</a></p><p><a href="#services">Services</a></p><p><a href="#process">Process</a></p><p><a href="#about">About</a></p><p><a href="#contact">Start a project</a></p>';
}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openDrawer(b.dataset.open)));
document.querySelector('.close').onclick=()=>drawer.classList.remove('open');
drawer.onclick=e=>{if(e.target===drawer)drawer.classList.remove('open')};
document.querySelectorAll('.add').forEach(b=>b.onclick=()=>{savedProjects.push(b.dataset.project);toast.textContent=b.dataset.project+' saved to your project list.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)});
document.querySelectorAll('.wish').forEach(b=>b.onclick=()=>{b.textContent=b.textContent==='♡'?'♥':'♡';b.style.transform='scale(1.18)';setTimeout(()=>b.style.transform='',180)});
const quotes=['“The final experience should feel like the business itself — clear, credible and unmistakably yours.”','“Good web design removes friction between what a business offers and what a visitor needs to understand.”','“A strong website is not decoration. It is a working part of the business.”'];let qi=0;const q=document.querySelector('#quote');document.querySelector('.next').onclick=()=>{qi=(qi+1)%quotes.length;q.innerHTML=quotes[qi]+'<cite>— webdev principle</cite>'};document.querySelector('.prev').onclick=()=>{qi=(qi-1+quotes.length)%quotes.length;q.innerHTML=quotes[qi]+'<cite>— webdev principle</cite>'};
document.querySelector('#newsletter').onsubmit=e=>{e.preventDefault();document.querySelector('#newsmsg').textContent='Thanks. Your project enquiry is ready for the next step.';e.target.reset()};
