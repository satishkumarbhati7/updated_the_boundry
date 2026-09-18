// ===== STATE =====
let cartCount = 0;
let userPoints = 125;
function offsetDate(days){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().split('T')[0];}
let upcomingMatches = [
  { t1:'MI', t2:'CSK', date:offsetDate(0), time:'19:30', venue:'Wankhede Stadium', offer:'3× Points during match!' },
  { t1:'RCB', t2:'KKR', date:offsetDate(2), time:'15:30', venue:'Chinnaswamy Stadium', offer:'Free Nachos if RCB wins!' },
  { t1:'RR', t2:'DC', date:offsetDate(4), time:'19:30', venue:'Sawai Mansingh Stadium', offer:'20% OFF on IPL combos' },
];
const predictionState = {};
const lockedGroups = [];

// ===== PERSISTENCE =====
const LS_USER='tb_user_state', LS_ADMIN='tb_admin_state';
function saveUserState(){
  try{localStorage.setItem(LS_USER, JSON.stringify({cartCount,userPoints,predCount:parseInt(document.getElementById('predCount').textContent)||0,lockedGroups}));}catch(e){}
}
function loadUserState(){
  try{
    const raw=localStorage.getItem(LS_USER); if(!raw)return;
    const s=JSON.parse(raw);
    cartCount=s.cartCount||0; userPoints=s.userPoints!=null?s.userPoints:125;
    document.getElementById('cartCount').textContent=cartCount;
    document.getElementById('userPoints').textContent=userPoints;
    document.getElementById('lb-your-pts').textContent=userPoints+' pts';
    if(s.predCount) document.getElementById('predCount').textContent=s.predCount;
    (s.lockedGroups||[]).forEach(g=>{lockedGroups.push(g); lockPredictionCard(g);});
  }catch(e){}
}
function lockPredictionCard(group){
  document.querySelectorAll('.pred-card').forEach(card=>{
    const btn=card.querySelector('.sub-pred[onclick*="\''+group+'\'"]');
    if(!btn)return;
    card.querySelectorAll('.pred-opt').forEach(o=>{o.style.pointerEvents='none';o.style.opacity='.4';});
    btn.textContent='✓ Locked'; btn.style.background='var(--green)'; btn.disabled=true;
  });
}
function saveAdminState(state){
  try{
    const cur=JSON.parse(localStorage.getItem(LS_ADMIN)||'{}');
    Object.keys(state).forEach(k=>{
      if(typeof state[k]==='object' && !Array.isArray(state[k]) && cur[k]) cur[k]=Object.assign({},cur[k],state[k]);
      else cur[k]=state[k];
    });
    localStorage.setItem(LS_ADMIN, JSON.stringify(cur));
  }catch(e){}
}
function loadAdminState(){
  let s={}; try{s=JSON.parse(localStorage.getItem(LS_ADMIN)||'{}');}catch(e){}
  if(s.today){
    document.getElementById('ticker-match').textContent=s.today.t1s+' vs '+s.today.t2s;
    document.getElementById('ticker-score').textContent=s.today.t1s+' '+s.today.sc+' ('+s.today.ov+' ov)';
    document.getElementById('live-ticker-text').innerHTML=s.today.ticker;
    document.getElementById('gz-match-label').textContent='TODAY: '+s.today.t1s+' vs '+s.today.t2s;
    ['t1name','t1short','t2name','t2short','score1','score1ov','matchVenue','tickerMsg'].forEach(id=>{});
    const f=document.getElementById('t1name'); if(f){
      document.getElementById('t1name').value=s.today.t1n; document.getElementById('t1short').value=s.today.t1s;
      document.getElementById('t2name').value=s.today.t2n; document.getElementById('t2short').value=s.today.t2s;
      document.getElementById('score1').value=s.today.sc; document.getElementById('score1ov').value=s.today.ov;
      document.getElementById('matchVenue').value=s.today.venue; document.getElementById('tickerMsg').value=s.today.ticker;
      document.getElementById('prev-t1short').textContent=s.today.t1s; document.getElementById('prev-t2short').textContent=s.today.t2s;
      document.getElementById('prev-t1name').textContent=s.today.t1n; document.getElementById('prev-t2name').textContent=s.today.t2n;
      document.getElementById('prev-score1').textContent=s.today.sc+' · '+s.today.ov+'ov';
      document.getElementById('prev-venue').textContent='📍 '+s.today.venue;
    }
  }
  if(s.upcomingMatches && s.upcomingMatches.length) upcomingMatches=s.upcomingMatches;
  if(s.hero){
    if(s.hero.eyebrow) document.getElementById('hero-eyebrow-text').textContent=s.hero.eyebrow;
    if(s.hero.main) document.getElementById('hero-main-text').textContent=s.hero.main;
    if(s.hero.sub) document.getElementById('hero-sub-text').textContent=s.hero.sub;
    if(s.hero.para) document.getElementById('hero-para-text').textContent=s.hero.para;
    if(s.hero.bannerSrc){
      const img=document.getElementById('hero-custom-banner');
      img.src=s.hero.bannerSrc; img.classList.add('visible');
    }
  }
  if(s.announcementBar && s.announcementBar.text){
    document.getElementById('ann-bar-text').textContent=s.announcementBar.text;
    document.getElementById('announcement-bar').classList.toggle('visible', s.announcementBar.visible!==false);
    document.getElementById('announcement-bar').style.display = s.announcementBar.visible!==false ? 'block':'none';
  }
  if(s.announcements && s.announcements.length){
    const list=document.getElementById('ann-list'); list.innerHTML='';
    const typeLabel={bar:'BAR',offer:'OFFER',event:'EVENT'}; const typeColor={bar:'var(--red)',offer:'var(--green)',event:'var(--blue)'};
    s.announcements.forEach(a=>{
      const item=document.createElement('div'); item.className='ann-item';
      item.innerHTML=`<div class="ann-text"><span style="background:rgba(100,100,100,.2);color:${typeColor[a.type]||'var(--red)'};padding:2px 8px;border-radius:4px;font-size:.75rem;font-family:'Rajdhani',sans-serif;font-weight:700;margin-right:8px">${typeLabel[a.type]||'BAR'}</span>${a.text}</div><button class="ann-del" onclick="this.closest('.ann-item').remove();removeAnnouncement('${a.text.replace(/'/g,"\\'")}')">✕</button>`;
      list.appendChild(item);
    });
  }
  if(s.offers && s.offers.length){
    const el=document.getElementById('offer-list');
    s.offers.forEach(o=>{
      const div=document.createElement('div');
      div.style.cssText='background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px';
      div.innerHTML=`<div style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--gold);margin-bottom:8px">${o.cond} → <span>${o.disc}</span></div><div style="font-size:.82rem;color:var(--muted)">Code: <strong style="color:var(--gold)">${o.code}</strong> · Min: ${o.min}</div>`;
      el.appendChild(div);
    });
  }
}
function removeAnnouncement(text){
  try{
    const cur=JSON.parse(localStorage.getItem(LS_ADMIN)||'{}');
    cur.announcements=(cur.announcements||[]).filter(a=>a.text!==text);
    localStorage.setItem(LS_ADMIN, JSON.stringify(cur));
  }catch(e){}
}

// ===== NAV =====
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  const map={home:0,menu:1,gamezone:2,offers:3,contact:4};
  if(map[id]!==undefined) document.querySelectorAll('.nav-link')[map[id]].classList.add('active');
  window.scrollTo(0,0);
}
function toggleMenu(){document.getElementById('mobileMenu').classList.toggle('open')}

// ===== DARK / LIGHT MODE =====
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  const btn=document.getElementById('themeToggle');
  if(!btn)return;
  btn.querySelector('i').className = theme==='light' ? 'fas fa-sun' : 'fas fa-moon';
  btn.classList.toggle('active', theme==='light');
  btn.title = theme==='light' ? 'Switch to dark mode' : 'Switch to light mode';
}
function toggleTheme(){
  const next = document.documentElement.getAttribute('data-theme')==='light' ? 'dark' : 'light';
  applyTheme(next);
  try{localStorage.setItem('tb_theme', next);}catch(e){}
  showToast(next==='light' ? '☀️ Light mode on' : '🌙 Dark mode on');
}
function loadTheme(){
  let theme='dark';
  try{theme=localStorage.getItem('tb_theme')||'dark';}catch(e){}
  applyTheme(theme);
}

// ===== MENU =====
function switchMenu(tab,cat){
  document.querySelectorAll('.menu-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.menu-cat').forEach(c=>c.classList.remove('active'));
  tab.classList.add('active');
  document.getElementById('cat-'+cat).classList.add('active');
}

// ===== TOAST =====
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

// ===== CART =====
function addToCart(btn,name){
  cartCount++;
  document.getElementById('cartCount').textContent=cartCount;
  const orig=btn.textContent;
  btn.textContent='✓ Added'; btn.style.background='var(--green)'; btn.style.color='#fff'; btn.style.borderColor='var(--green)';
  setTimeout(()=>{btn.textContent=orig; btn.style.background=''; btn.style.color=''; btn.style.borderColor='';},1600);
  showToast('🛒 '+name+' added to cart!');
  saveUserState();
}

// ===== PREDICTIONS =====
function selectOption(el,group){
  el.closest('.pred-card').querySelectorAll('.pred-opt').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected'); predictionState[group]=el.textContent.trim();
}
function submitPrediction(btn,group,pts){
  const card=btn.closest('.pred-card');
  if(!card.querySelector('.pred-opt.selected')){showToast('⚠️ Select an option first!');return;}
  userPoints+=pts;
  document.getElementById('userPoints').textContent=userPoints;
  document.getElementById('lb-your-pts').textContent=userPoints+' pts';
  document.getElementById('predCount').textContent=parseInt(document.getElementById('predCount').textContent)+1;
  card.querySelectorAll('.pred-opt').forEach(o=>{o.style.pointerEvents='none';o.style.opacity='.4';});
  const sel=card.querySelector('.pred-opt.selected');
  sel.style.opacity='1'; sel.style.background='rgba(22,163,74,.14)'; sel.style.borderColor='var(--green)'; sel.style.color='var(--green)';
  btn.textContent='✓ Locked! +'+pts+' pts'; btn.style.background='var(--green)'; btn.disabled=true;
  if(!lockedGroups.includes(group)) lockedGroups.push(group);
  confetti(); showToast('🎯 Prediction locked! +'+pts+' points earned!');
  saveUserState();
}
function redeemPoints(cost,reward){
  if(userPoints<cost){showToast('❌ Need '+cost+' pts. You have '+userPoints);return;}
  userPoints-=cost;
  document.getElementById('userPoints').textContent=userPoints;
  document.getElementById('lb-your-pts').textContent=userPoints+' pts';
  confetti(); showToast('🎁 '+reward+' coupon unlocked!');
  saveUserState();
}

// ===== COPY =====
function copyCode(code){
  if(navigator.clipboard) navigator.clipboard.writeText(code).then(()=>showToast('📋 Copied: '+code));
  else showToast('📋 Code: '+code);
}

// ===== BOOKING =====
function submitBooking(){
  const n=document.getElementById('bookName').value.trim();
  const p=document.getElementById('bookPhone').value.trim();
  const d=document.getElementById('bookDate').value;
  const t=document.getElementById('bookTime').value;
  const g=document.getElementById('bookGuests').value;
  const notes=document.getElementById('bookNotes').value.trim();
  if(!n||!p){showToast('⚠️ Fill in name and phone.');return;}
  if(!d){showToast('⚠️ Please select a date.');return;}
  confetti(); showToast('🎉 Table booked for '+n+' · '+g+' guests · '+d+' '+t+'!');
  setTimeout(()=>showToast('📱 Confirmation SMS sent to '+p+'!'),3200);
  const waMsg=encodeURIComponent(`Table booking request:\nName: ${n}\nPhone: ${p}\nDate: ${d}\nTime: ${t}\nGuests: ${g}\nNotes: ${notes||'-'}`);
  setTimeout(()=>{ window.open('https://wa.me/917290068096?text='+waMsg, '_blank'); }, 1200);
}

// ===== CONFETTI =====
function confetti(){
  const colors=['#f5c518','#ea580c','#1d4ed8','#dc2626','#16a34a','#f59e0b'];
  for(let i=0;i<28;i++){
    const p=document.createElement('div'); p.className='cpiece';
    p.style.left=Math.random()*100+'vw';
    p.style.background=colors[~~(Math.random()*colors.length)];
    p.style.animationDelay=Math.random()*0.5+'s';
    p.style.width=(Math.random()*8+4)+'px'; p.style.height=(Math.random()*8+4)+'px';
    p.style.borderRadius=Math.random()>.5?'50%':'2px';
    document.body.appendChild(p); setTimeout(()=>p.remove(),3000);
  }
}

// ===== SCROLL REVEAL =====
function revealOnScroll(){document.querySelectorAll('.reveal').forEach(el=>{if(el.getBoundingClientRect().top<window.innerHeight-60)el.classList.add('visible');})}
window.addEventListener('scroll',revealOnScroll); setTimeout(revealOnScroll,400);

// ===== DEFAULT DATE =====
const td=new Date().toISOString().split('T')[0];
const di=document.getElementById('bookDate'); if(di){di.min=td;di.value=td;}

// ===== UPCOMING MATCHES RENDER =====
function renderUpcoming(){
  const el=document.getElementById('upcoming-matches-display');
  if(!el)return;
  const today=new Date().toISOString().split('T')[0];
  el.innerHTML=upcomingMatches.map((m,i)=>`
    <div style="background:var(--card);border:1px solid var(--border);border-radius:13px;padding:16px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;transition:all .25s" onmouseover="this.style.borderColor='rgba(245,197,24,.35)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:160px">
        <span style="font-family:'Black Han Sans',sans-serif;font-size:1.3rem;color:var(--gold)">${m.t1}</span>
        <span style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--muted);font-size:.88rem">vs</span>
        <span style="font-family:'Black Han Sans',sans-serif;font-size:1.3rem;color:var(--amber)">${m.t2}</span>
      </div>
      <div style="font-size:.82rem;color:var(--muted);font-family:'Rajdhani',sans-serif">${m.date===today?'<span style="color:var(--red);font-weight:700">TODAY</span>':m.date} · ${m.time} · ${m.venue}</div>
      ${m.offer?`<div style="background:rgba(245,197,24,.09);border:1px solid rgba(245,197,24,.2);padding:5px 12px;border-radius:7px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.82rem;color:var(--gold)">🎁 ${m.offer}</div>`:''}
      <button class="btn-p" style="padding:9px 18px;font-size:.88rem" onclick="showPage('contact')">Book Table</button>
    </div>
  `).join('');
}

// ===== ADMIN - Hidden backend, accessible only via URL hash =====
// Access via: yoursite.com/index.html#boundaryadmin2026
function openAdmin(){document.getElementById('admin-overlay').classList.add('open');document.body.style.overflow='hidden';}
function closeAdmin(){
  document.getElementById('admin-overlay').classList.remove('open');
  document.body.style.overflow='';
  // Clear hash without reload
  history.replaceState(null, '', window.location.pathname);
}
// Secret URL trigger — visit #boundaryadmin2026 to open panel
function checkAdminHash(){
  if(window.location.hash === '#boundaryadmin2026') openAdmin();
}
window.addEventListener('hashchange', checkAdminHash);
window.addEventListener('load', checkAdminHash);
// Credentials are never stored in plaintext — only a salted SHA-256 hash is compared client-side.
// NOTE: this is still not real security (a static page can't keep secrets from its own visitors);
// anyone with the page source can brute-force the hash offline. For genuine protection this login
// needs to move to a real server-side auth check.
const ADMIN_SALT='tb_boundary_2026_salt';
const ADMIN_HASH='25bd02fd81119732e8ecb91ed957ce2ace4e6b97aee208b6b5eb79572e45d049';
async function sha256Hex(str){
  const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function doLogin(){
  const u=document.getElementById('adminUser').value.trim();
  const p=document.getElementById('adminPass').value.trim();
  if(!u||!p){showToast('⚠️ Enter username and password.');return;}
  let hash;
  try{ hash=await sha256Hex(ADMIN_SALT+':'+u+':'+p); }
  catch(e){ showToast('❌ Secure login requires HTTPS or localhost.'); return; }
  if(hash===ADMIN_HASH){
    document.getElementById('admin-login').style.display='none';
    document.getElementById('admin-panel').classList.add('open');
    document.getElementById('admin-header').style.display='flex';
    renderUMList();
    showToast('✅ Welcome, Sub-Admin!');
  } else {
    showToast('❌ Invalid credentials.');
  }
}

// Admin tabs
function switchAdminTab(tab,id){
  document.querySelectorAll('.atab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.apanel').forEach(p=>p.classList.remove('active'));
  tab.classList.add('active');
  document.getElementById('ap-'+id).classList.add('active');
}

// ----- TODAY'S MATCH -----
function saveTodayMatch(){
  const t1s=document.getElementById('t1short').value;
  const t2s=document.getElementById('t2short').value;
  const t1n=document.getElementById('t1name').value;
  const t2n=document.getElementById('t2name').value;
  const sc=document.getElementById('score1').value;
  const ov=document.getElementById('score1ov').value;
  const venue=document.getElementById('matchVenue').value;
  const ticker=document.getElementById('tickerMsg').value;
  // Update preview
  document.getElementById('prev-t1short').textContent=t1s;
  document.getElementById('prev-t2short').textContent=t2s;
  document.getElementById('prev-t1name').textContent=t1n;
  document.getElementById('prev-t2name').textContent=t2n;
  document.getElementById('prev-score1').textContent=sc+' · '+ov+'ov';
  document.getElementById('prev-venue').textContent='📍 '+venue;
  // Update live site
  document.getElementById('ticker-match').textContent=t1s+' vs '+t2s;
  document.getElementById('ticker-score').textContent=t1s+' '+sc+' ('+ov+' ov)';
  document.getElementById('live-ticker-text').innerHTML=ticker;
  document.getElementById('gz-match-label').textContent='TODAY: '+t1s+' vs '+t2s;
  saveAdminState({today:{t1n,t1s,t2n,t2s,sc,ov,venue,ticker}});
  confetti(); showToast('✅ Live match updated on site!');
}

// ----- UPCOMING MATCHES -----
function saveUpcomingMatch(){
  const t1=document.getElementById('um-t1').value.trim();
  const t2=document.getElementById('um-t2').value.trim();
  const date=document.getElementById('um-date').value;
  const time=document.getElementById('um-time').value;
  const venue=document.getElementById('um-venue').value.trim();
  const offer=document.getElementById('um-offer').value.trim();
  if(!t1||!t2||!date){showToast('⚠️ Fill Team 1, Team 2, and Date.');return;}
  const editIdx=parseInt(document.getElementById('um-edit-index').value);
  if(editIdx>=0){
    upcomingMatches[editIdx]={t1,t2,date,time,venue,offer};
    confetti(); showToast('✅ Match updated!');
  } else {
    upcomingMatches.push({t1,t2,date,time,venue,offer});
    confetti(); showToast('✅ Match added to upcoming list!');
  }
  renderUMList(); renderUpcoming();
  saveAdminState({upcomingMatches});
  cancelEditMatch();
}
function editMatch(i){
  const m=upcomingMatches[i];
  document.getElementById('um-t1').value=m.t1;
  document.getElementById('um-t2').value=m.t2;
  document.getElementById('um-date').value=m.date;
  document.getElementById('um-time').value=m.time;
  document.getElementById('um-venue').value=m.venue;
  document.getElementById('um-offer').value=m.offer;
  document.getElementById('um-edit-index').value=i;
  document.getElementById('um-form-title').textContent='✏️ Edit Upcoming Match';
  document.getElementById('um-submit-btn').innerHTML='<i class="fas fa-save"></i> Save Changes';
  document.getElementById('um-cancel-btn').style.display='inline-flex';
  document.getElementById('ap-upcoming').scrollIntoView({behavior:'smooth',block:'start'});
}
function cancelEditMatch(){
  document.getElementById('um-t1').value='';
  document.getElementById('um-t2').value='';
  document.getElementById('um-date').value='';
  document.getElementById('um-venue').value='';
  document.getElementById('um-offer').value='';
  document.getElementById('um-edit-index').value='-1';
  document.getElementById('um-form-title').textContent='➕ Add Upcoming Match';
  document.getElementById('um-submit-btn').innerHTML='<i class="fas fa-plus"></i> Add Match';
  document.getElementById('um-cancel-btn').style.display='none';
}
function renderUMList(){
  const el=document.getElementById('um-list');
  el.innerHTML=upcomingMatches.map((m,i)=>`
    <div class="um-row">
      <div class="teams">${m.t1} vs ${m.t2}</div>
      <div class="meta">${m.date} · ${m.time}</div>
      <div class="meta" style="flex:1">${m.venue}</div>
      ${m.offer?`<div style="font-size:.78rem;color:var(--gold)">🎁 ${m.offer}</div>`:''}
      <button class="ann-del" style="background:rgba(245,197,24,.1);border-color:rgba(245,197,24,.25);color:var(--gold)" onclick="editMatch(${i})"><i class="fas fa-pen"></i></button>
      <button class="ann-del" onclick="removeMatch(${i})">✕</button>
    </div>
  `).join('');
}
function removeMatch(i){
  upcomingMatches.splice(i,1);
  const editIdx=parseInt(document.getElementById('um-edit-index').value);
  if(editIdx===i) cancelEditMatch();
  renderUMList();renderUpcoming();saveAdminState({upcomingMatches});showToast('🗑️ Match removed.');
}

// ----- BANNER -----
function applyBannerUrl(){
  const url=document.getElementById('banner-url').value.trim();
  if(!url){showToast('⚠️ Enter an image URL.');return;}
  const img=document.getElementById('hero-custom-banner');
  img.src=url; img.classList.add('visible'); img.onerror=()=>{img.classList.remove('visible');showToast('❌ Image URL failed to load.');};
  saveAdminState({hero:{bannerSrc:url}});
  showToast('✅ Banner applied to hero!');
}
function uploadBanner(input){
  const file=input.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const preview=document.getElementById('banner-preview');
    preview.src=e.target.result; preview.style.display='block';
    const hero=document.getElementById('hero-custom-banner');
    hero.src=e.target.result; hero.classList.add('visible');
    try{saveAdminState({hero:{bannerSrc:e.target.result}});}catch(err){showToast('⚠️ Image too large to save permanently, but applied for this session.');}
    showToast('✅ Banner uploaded & applied!');
  };
  reader.readAsDataURL(file);
}
function clearBanner(){
  const img=document.getElementById('hero-custom-banner');
  img.removeAttribute('src'); img.classList.remove('visible');
  document.getElementById('banner-preview').style.display='none';
  document.getElementById('banner-url').value='';
  saveAdminState({hero:{bannerSrc:''}});
  showToast('🔄 Banner cleared. Stadium background restored.');
}

// ----- HERO TEXT -----
function saveHeroText(){
  const eyebrow=document.getElementById('ht-eyebrow').value;
  const main=document.getElementById('ht-main').value;
  const sub=document.getElementById('ht-sub').value;
  const para=document.getElementById('ht-para').value;
  document.getElementById('hero-eyebrow-text').textContent=eyebrow;
  document.getElementById('hero-main-text').textContent=main;
  document.getElementById('hero-sub-text').textContent=sub;
  document.getElementById('hero-para-text').textContent=para;
  saveAdminState({hero:{eyebrow,main,sub,para}});
  confetti(); showToast('✅ Hero text updated on site!');
}

// ----- ANNOUNCEMENTS -----
function addAnnouncement(){
  const text=document.getElementById('ann-text').value.trim();
  const type=document.getElementById('ann-type').value;
  if(!text){showToast('⚠️ Enter announcement text.');return;}
  // Add to list
  const item=document.createElement('div'); item.className='ann-item';
  const typeLabel={bar:'BAR',offer:'OFFER',event:'EVENT'}[type];
  const typeColor={bar:'var(--red)',offer:'var(--green)',event:'var(--blue)'}[type];
  item.innerHTML=`<div class="ann-text"><span style="background:rgba(100,100,100,.2);color:${typeColor};padding:2px 8px;border-radius:4px;font-size:.75rem;font-family:'Rajdhani',sans-serif;font-weight:700;margin-right:8px">${typeLabel}</span>${text}</div><button class="ann-del" onclick="this.closest('.ann-item').remove()">✕</button>`;
  document.getElementById('ann-list').appendChild(item);
  // If bar type, push to top bar
  if(type==='bar'){
    document.getElementById('ann-bar-text').textContent=text;
    document.getElementById('announcement-bar').classList.add('visible');
    document.getElementById('announcement-bar').style.display='block';
    saveAdminState({announcementBar:{visible:true,text}});
  }
  try{
    const cur=JSON.parse(localStorage.getItem(LS_ADMIN)||'{}');
    const list=cur.announcements||[];
    list.push({type,text});
    saveAdminState({announcements:list});
  }catch(e){}
  document.getElementById('ann-text').value='';
  confetti(); showToast('📢 Announcement published!');
}

// ----- OFFERS -----
function addNewOffer(){
  const cond=document.getElementById('no-cond').value.trim();
  const disc=document.getElementById('no-disc').value.trim();
  const code=document.getElementById('no-code').value.trim();
  const min=document.getElementById('no-min').value.trim();
  if(!cond||!disc){showToast('⚠️ Fill Condition and Discount.');return;}
  const el=document.getElementById('offer-list');
  const div=document.createElement('div');
  div.style.cssText='background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px';
  div.innerHTML=`<div style="font-family:\'Rajdhani\',sans-serif;font-weight:700;color:var(--gold);margin-bottom:8px">${cond} → <span>${disc}</span></div><div style="font-size:.82rem;color:var(--muted)">Code: <strong style="color:var(--gold)">${code}</strong> · Min: ${min}</div>`;
  el.appendChild(div);
  try{
    const cur=JSON.parse(localStorage.getItem(LS_ADMIN)||'{}');
    const list=cur.offers||[];
    list.push({cond,disc,code,min});
    saveAdminState({offers:list});
  }catch(e){}
  document.getElementById('no-cond').value='';
  document.getElementById('no-disc').value='';
  document.getElementById('no-code').value='';
  document.getElementById('no-min').value='';
  showToast('✅ Offer added!');
}

// ===== INIT =====
document.getElementById('announcement-bar').classList.add('visible');
document.getElementById('announcement-bar').style.display='block';
loadAdminState();   // restore admin-edited content (hero, today's match, announcements, offers, upcoming matches)
renderUpcoming();    // render upcoming matches AFTER admin state is applied
loadUserState();     // restore points, cart, locked predictions
loadTheme();         // restore dark/light theme preference
