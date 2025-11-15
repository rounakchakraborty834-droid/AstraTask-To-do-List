/* script.js - interactivity and wiring */

/* Helpers */
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

/* Smooth scroll */
function smoothScrollTo(selector, offset=80){
  const el = document.querySelector(selector);
  if(!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* DOM ready */
document.addEventListener('DOMContentLoaded', () => {
  // year
  qs('#year').textContent = new Date().getFullYear();

  // nav click
  qsa('#navList a[data-target]').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      smoothScrollTo(a.getAttribute('data-target'), 80);
      qs('#navList').classList.remove('open');
      qs('#navToggle').setAttribute('aria-expanded','false');
    });
  });

  // nav toggle
  const navToggle = qs('#navToggle');
  navToggle && navToggle.addEventListener('click', ()=>{
    const list = qs('#navList');
    const open = list.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // reveal on scroll
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en=>{
      if(en.isIntersecting) en.target.classList.add('is-visible');
    });
  }, { threshold: 0.12 });
  qsa('.reveal').forEach(el => obs.observe(el));

  // scroll progress
  window.addEventListener('scroll', updateProgress);
  updateProgress();

  // quotes cycle
  setupQuotes();

  // counters
  setupCounters();

  // modal demo
  const modal = qs('#demoModal');
  qs('#openDemo') && qs('#openDemo').addEventListener('click', ()=> openModal());
  qs('#closeModal') && qs('#closeModal').addEventListener('click', ()=> closeModal());
  qs('#modalOk') && qs('#modalOk').addEventListener('click', ()=> closeModal());
  modal && modal.addEventListener('click', (e)=> { if(e.target === modal) closeModal(); });

  // sample actions
  qsa('.demo-btn').forEach(b=>b.addEventListener('click', addSampleTask));
  qs('#exportState') && qs('#exportState').addEventListener('click', exportSampleJSON);
  qs('#generateICS') && qs('#generateICS').addEventListener('click', ()=> downloadSampleICS());
  qsa('.buy-btn').forEach(b=>b.addEventListener('click', handleBuy));

  // contact form
  const form = qs('#contactForm');
  if(form){
    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      qs('#formMsg').textContent = 'Thanks! (Demo) Message sent locally.';
      form.reset();
      setTimeout(()=> qs('#formMsg').textContent = '', 4000);
    });
    qs('#clearForm') && qs('#clearForm').addEventListener('click', ()=> form.reset());
  }

  // gallery images fallback: hide shots without images
  qsa('.shot img').forEach(img=>{
    img.onerror = ()=> { img.parentElement.style.display = 'none'; };
  });

  // draw chart
  drawChart();

});

/* update progress bar */
function updateProgress(){
  const doc = document.documentElement;
  const top = (doc.scrollTop || document.body.scrollTop);
  const height = doc.scrollHeight - doc.clientHeight;
  const pct = height ? Math.max(0, Math.min(100, (top/height) * 100)) : 0;
  qs('#scrollProgress').style.width = pct + '%';

  // highlight nav
  qsa('#navList a').forEach(a=>a.classList.remove('active'));
  const secs = qsa('main .section');
  let curr = secs[0];
  for(let s of secs){
    if(s.getBoundingClientRect().top <= 120) curr = s;
  }
  const link = qs(`#navList a[data-target="#${curr.id}"]`);
  if(link) link.classList.add('active');
}

/* quotes rotation */
function setupQuotes(){
  const quotes = qsa('.quote');
  let idx = 0;
  if(quotes.length===0) return;
  setInterval(()=>{
    quotes[idx].classList.remove('active');
    idx = (idx+1)%quotes.length;
    quotes[idx].classList.add('active');
  }, 4200);
}

/* counters when visible */
function setupCounters(){
  qsa('.count').forEach(el=>{
    let started=false;
    const target = +el.dataset.target || 0;
    const io = new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting && !started){
        started=true;
        let cur=0;
        const step = Math.max(1, Math.floor(target/60));
        const id = setInterval(()=>{
          cur += step;
          if(cur >= target){ el.textContent = target; clearInterval(id); }
          else el.textContent = cur;
        }, 16);
      }
    }, { threshold: 0.3 });
    io.observe(el);
  });
}

/* Modal */
function openModal(){
  const modal = qs('#demoModal');
  if(!modal) return;
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  qs('#demoOut').textContent = 'Demo started: sample tasks added to a demo area.';
}
function closeModal(){
  const modal = qs('#demoModal');
  modal && modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

/* Sample task add - shows example in modal output */
function addSampleTask(){
  openModal();
  const out = qs('#demoOut');
  const now = new Date().toLocaleString();
  out.textContent = `Sample task added at ${now}\n• Title: "Build landing page"\n• Tags: #work #landing\n• Due: today\n\n(This is a demo: the real app will keep tasks persistent.)`;
}

/* export sample JSON (small sample data) */
function exportSampleJSON(){
  const sample = { projects:[{ title:'Demo', tasks:[{title:'Sample task',tags:['demo'],due:'2025-11-15'}] }] };
  const blob = new Blob([JSON.stringify(sample,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'astratask-sample.json'; a.click();
  URL.revokeObjectURL(url);
}

/* create a simple ICS for sample task */
function downloadSampleICS(){
  const title = 'Sample task from AstraTask';
  const dt = new Date(); dt.setDate(dt.getDate()+1);
  const pad = n=>String(n).padStart(2,'0');
  const dtstr = dt.getFullYear()+pad(dt.getMonth()+1)+pad(dt.getDate())+'T090000Z';
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AstraTask//EN',
    'BEGIN:VEVENT',
    `UID:sample-astratask@local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z`,
    `DTSTART:${dtstr}`,
    `DTEND:${dtstr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${title} — exported from AstraTask`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'astratask-event.ics'; a.click();
  URL.revokeObjectURL(url);
}

/* pricing buy action (demo) */
function handleBuy(e){
  const plan = e.currentTarget.dataset.plan || 'unknown';
  openModal();
  qs('#demoOut').textContent = `You clicked purchase for plan: ${plan}\n(For demo: payment flow is not included in this static build.)`;
}

/* Draw a simple nice chart using canvas (no external libs) */
function drawChart(){
  const c = qs('#featuresChart');
  if(!c) return;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  // sample data
  const labels = ['Focus time','Tasks done','Exports','Active users'];
  const data = [60, 120, 18, 1250];
  // background
  ctx.clearRect(0,0,w,h);
  // gradient background
  const g = ctx.createLinearGradient(0,0,w,0);
  g.addColorStop(0,'rgba(34,220,72,0.06)');
  g.addColorStop(1,'rgba(60,255,51,0.02)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);
  // simple bar chart
  const padding = 40;
  const barW = (w - padding*2) / data.length * 0.6;
  const gap = ((w - padding*2) - (barW * data.length)) / (data.length - 1);
  const max = Math.max(...data)*1.2;
  data.forEach((val,i)=>{
    const x = padding + i*(barW+gap);
    const barH = (val/max) * (h - 120);
    const y = h - padding - barH;
    // neon gradient
    const gg = ctx.createLinearGradient(x,y,x,y+barH);
    gg.addColorStop(0, 'rgba(60,255,51,0.95)');
    gg.addColorStop(1, 'rgba(24,140,20,0.65)');
    ctx.fillStyle = gg;
    // rounded rect
    roundRectFill(ctx, x, y, barW, barH, 8);
    // label
    ctx.fillStyle = '#bfecc2';
    ctx.font = '600 14px Inter, system-ui';
    ctx.fillText(labels[i], x, h - padding + 18);
    // value
    ctx.fillStyle = '#eafcec';
    ctx.font = '700 16px Inter, system-ui';
    ctx.fillText(val, x, y - 8);
  });
}
/* utility for rounded rect */
function roundRectFill(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  ctx.fill();
}

/* small accessibility: next/prev section via keys n/p */
document.addEventListener('keydown', e=>{
  if(e.key === 'n'){ e.preventDefault(); jumpSection(1); }
  if(e.key === 'p'){ e.preventDefault(); jumpSection(-1); }
});
function jumpSection(dir){
  const secs = qsa('main .section');
  const top = window.scrollY;
  let idx = secs.findIndex(s => s.offsetTop > top + 60);
  if(idx === -1) idx = secs.length - 1;
  const targ = Math.min(Math.max(0, idx + (dir<0 ? -1 : 0)), secs.length - 1);
  smoothScrollTo('#' + secs[targ].id, 80);
}
/* AUTH LOGIC */
const authModal = document.getElementById("authModal");
const loginBox = document.getElementById("loginFormBox");
const signupBox = document.getElementById("signupFormBox");

document.getElementById("openLogin").onclick = () => openAuth("login");
document.getElementById("openSignup").onclick = () => openAuth("signup");
document.getElementById("closeAuth").onclick = closeAuth;

function openAuth(which) {
  authModal.classList.add("active");
  if (which === "login") {
    loginBox.classList.add("active");
    signupBox.classList.remove("active");
  } else {
    signupBox.classList.add("active");
    loginBox.classList.remove("active");
  }
}

function closeAuth() {
  authModal.classList.remove("active");
}

document.querySelectorAll(".switch-auth span").forEach(btn => {
  btn.onclick = () => openAuth(btn.dataset.open);
});

// close by clicking outside
authModal.addEventListener("click", (e) => {
  if (e.target === authModal) closeAuth();
});
/* AstraTask: Loader -> Welcome -> Reveal 3D hero sequence
   Required element IDs in your HTML:
     #loader       (full-screen loader container)
     #welcome      (welcome overlay container)
     #home         (hero 3D section container)
     #splineIframe (iframe element inside hero; set data-src to embed url)
     #exit3D       (button inside hero to exit/close the 3D hero)
     #exploreBtn   (optional button inside welcome to reveal early)
*/
(function(){
  // configuration (timings in ms)
  const LOADER_MS = 4000;   // how long to show the loader
  const WELCOME_MS = 3000;  // how long to show the welcome overlay

  // grab elements
  const loader = document.getElementById('loader');
  const welcome = document.getElementById('welcome');
  const hero = document.getElementById('home');
  const splineIframe = document.getElementById('splineIframe');
  const exitBtn = document.getElementById('exit3D');
  const exploreBtn = document.getElementById('exploreBtn');

  function log(...args){ console.log('[AstraSequence]', ...args); }

  // defensive checks
  if(!loader) log('WARNING: #loader not found in DOM');
  if(!welcome) log('WARNING: #welcome not found in DOM');
  if(!hero) log('WARNING: #home (hero) not found in DOM');
  if(!splineIframe) log('WARNING: #splineIframe not found in DOM');
  if(!exitBtn) log('INFO: #exit3D button not found — close control will be missing');

  // utility show/hide helpers that don't rely on particular CSS implementation
  // they remove/add a 'hidden' class (assumes .hidden exists in your CSS)
  function show(el){
    if(!el) return;
    el.classList.remove('hidden');
    el.style.visibility = '';
    el.style.pointerEvents = '';
    el.style.opacity = '';
  }
  function hide(el){
    if(!el) return;
    el.classList.add('hidden');
    el.style.pointerEvents = 'none';
  }

  // ensure initial state: loader visible, welcome & hero hidden
  // (if elements missing, nothing breaks)
  try {
    if(loader) show(loader);
    if(welcome) hide(welcome);
    if(hero) hide(hero);
  } catch(e){ log('Initial state setup error', e); }

  // sequence controller
  let loaderTimer = null;
  let welcomeTimer = null;

  function startSequence(){
    log('Sequence started: loader -> welcome -> hero');

    // show loader (again) and set timeout
    if(loader) show(loader);
    clearTimeout(loaderTimer);
    loaderTimer = setTimeout(() => {
      // loader done
      if(loader) hide(loader);
      if(welcome){
        show(welcome);
        // small animation class if present (optional)
        welcome.classList.add && welcome.classList.add('fade-in');
      }

      // allow user to click Explore to reveal early
      if(exploreBtn){
        exploreBtn.removeEventListener('click', exploreClickHandler);
        exploreBtn.addEventListener('click', exploreClickHandler);
      }

      // schedule reveal hero after welcome duration
      clearTimeout(welcomeTimer);
      welcomeTimer = setTimeout(() => {
        revealHero();
      }, WELCOME_MS);

    }, LOADER_MS);
  }

  function exploreClickHandler(e){
    e && e.preventDefault && e.preventDefault();
    log('Explore clicked — revealing hero early');
    revealHero();
  }

  // reveal hero (lazy-load iframe)
  function revealHero(){
    // clear timers so repeated calls don't stack
    clearTimeout(loaderTimer);
    clearTimeout(welcomeTimer);

    // hide loader & welcome
    if(loader) hide(loader);
    if(welcome) hide(welcome);

    // lazy-load iframe src if not already set
    try {
      if(splineIframe){
        const hasSrc = (splineIframe.getAttribute('src') || '').trim().length > 0 ||
                       (splineIframe.src && splineIframe.src.trim().length > 0);
        if(!hasSrc){
          const dataSrc = splineIframe.getAttribute('data-src') || splineIframe.getAttribute('data-src-url');
          const altSrc = splineIframe.getAttribute('data-src') || splineIframe.dataset.src;
          const srcToUse = dataSrc || altSrc || splineIframe.getAttribute('src');
          if(srcToUse){
            log('Lazy-loading iframe with src:', srcToUse);
            splineIframe.src = srcToUse;
            // optional: wait for iframe load to then reveal more UI
            splineIframe.addEventListener('load', function onLoad(){
              log('Spline iframe loaded');
              splineIframe.removeEventListener('load', onLoad);
            });
          } else {
            log('No data-src or src found on #splineIframe — nothing to load.');
          }
        } else {
          log('Iframe already has src, skipping lazy-load.');
        }
      }
    } catch(err){
      log('Error lazy-loading iframe', err);
    }

    // show hero container
    if(hero){
      show(hero);
      hero.classList.add && hero.classList.add('fade-in');
      hero.setAttribute && hero.setAttribute('aria-hidden', 'false');
      // focus for accessibility
      try{ hero.focus && hero.focus(); }catch(e){}
      log('Hero revealed');
    } else {
      log('Hero element missing; cannot reveal.');
    }
  }

  // close hero: hide and optionally remove iframe src to free resources
  function closeHero(){
    if(hero) hide(hero);
    try{
      if(splineIframe){
        // clear src to free GPU/memory (some browsers will continue rendering otherwise)
        splineIframe.src = '';
        log('Iframe src cleared on close');
      }
    } catch(e){ log('Error clearing iframe src', e); }
  }

  // Esc key closes hero if visible
  document.addEventListener('keydown', function(ev){
    if(ev.key === 'Escape'){
      const isHeroVisible = hero && !hero.classList.contains('hidden');
      if(isHeroVisible){
        log('Escape pressed — closing hero');
        closeHero();
      }
    }
  });

  // expose programmatic helpers for debugging or UI reuse
  window.open3DHero = function(){ revealHero(); };
  window.close3DHero = function(){ closeHero(); };
  window.restartHeroSequence = function(){ startSequence(); };

  // start automatically after DOMContentLoaded
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', startSequence, { once: true });
  } else {
    // already loaded
    startSequence();
  }

  // small safety: if something throws, expose functions anyway
  log('AstraTask sequence initialized. Use open3DHero() to reveal manually.');

})();
