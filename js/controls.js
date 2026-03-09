// ═══════════════════════════════════════════════════
//  CONTROLS — Touch, buttons, boot, event handlers
// ═══════════════════════════════════════════════════

// Global delegated click handler — works when inline onclick is blocked (e.g. Cursor Simple Browser)
function handleDelegatedClick(e){
  var el=e.target.closest('[data-action]');
  if(el){
    var action=el.getAttribute('data-action');
    var page=el.getAttribute('data-page');
    if(action==='saveProfile'&&typeof saveProfile==='function'){e.preventDefault();e.stopPropagation();saveProfile();return;}
    if(action==='showPage'&&page&&typeof showPage==='function'){e.preventDefault();showPage(page,el);return;}
    if(action==='toggleMoreMenu'&&typeof toggleMoreMenu==='function'){e.preventDefault();e.stopPropagation();toggleMoreMenu(el);return;}
    if(action==='moreNav'&&page&&typeof moreNav==='function'){e.preventDefault();e.stopPropagation();moreNav(page,el);return;}
    if(action==='closeMoreMenu'&&typeof closeMoreMenu==='function'){e.preventDefault();e.stopPropagation();closeMoreMenu();return;}
    if(action==='showSyncStatus'&&typeof showSyncStatus==='function'){e.preventDefault();e.stopPropagation();showSyncStatus();return;}
    if(action==='toggleMusicPanel'&&typeof toggleMusicPanel==='function'){e.preventDefault();e.stopPropagation();toggleMusicPanel();return;}
  }
  // Fallback: invoke onclick for buttons/links when inline handlers are blocked
  var clickable=e.target.closest('button, a, [role=button], [onclick]');
  if(clickable&&clickable.onclick&&typeof clickable.onclick==='function'){
    e.preventDefault();e.stopPropagation();clickable.onclick.call(clickable,e);return;
  }
}
document.addEventListener('click',handleDelegatedClick,true);
document.addEventListener('pointerdown',handleDelegatedClick,true);

function boot(){
  // Direct nav handlers — ensures side/bottom nav works when delegated handler doesn't
  var _lastNav=0;
  function bindNav(btn){
    if(!btn)return;
    var page=btn.getAttribute('data-page');
    if(!page)return;
    function go(){if(typeof showPage!=='function')return;var now=Date.now();if(now-_lastNav<200)return;_lastNav=now;showPage(page,btn);}
    btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();go();});
    btn.addEventListener('touchend',function(e){e.preventDefault();go();},{passive:false});
  }
  document.querySelectorAll('[data-action="showPage"][data-page]').forEach(bindNav);

  // Direct more-menu handlers
  document.querySelectorAll('[data-action="toggleMoreMenu"]').forEach(function(btn){
    if(!btn)return;
    function go(){if(typeof toggleMoreMenu==='function')toggleMoreMenu(btn);}
    btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();go();},true);
    btn.addEventListener('touchend',function(e){e.preventDefault();go();},{passive:false,capture:true});
  });
  document.querySelectorAll('[data-action="moreNav"][data-page]').forEach(function(btn){
    if(!btn)return;
    var page=btn.getAttribute('data-page');
    if(!page)return;
    function go(){if(typeof moreNav==='function')moreNav(page,btn);}
    btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();go();},true);
    btn.addEventListener('touchend',function(e){e.preventDefault();go();},{passive:false,capture:true});
  });
  var backdrop=document.getElementById('more-backdrop');
  if(backdrop){
    function close(){if(typeof closeMoreMenu==='function')closeMoreMenu();}
    backdrop.addEventListener('click',function(e){e.preventDefault();close();},true);
    backdrop.addEventListener('touchend',function(e){e.preventDefault();close();},{passive:false,capture:true});
  }

  // Setup button
  var setupBtn=document.getElementById('btn-setup');
  if(setupBtn){
    function save(){if(typeof saveProfile==='function')saveProfile();}
    setupBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();save();},true);
    setupBtn.addEventListener('touchend',function(e){e.preventDefault();save();},{passive:false,capture:true});
  }

  var mSheet=document.getElementById('more-sheet');
  if(mSheet){
    var mTouchY=0;
    mSheet.addEventListener('touchstart',function(e){mTouchY=e.touches[0].clientY;},{passive:true});
    mSheet.addEventListener('touchmove',function(e){
      var dy=e.touches[0].clientY-mTouchY;
      if(dy>50)closeMoreMenu();
    },{passive:true});
  }
  document.querySelectorAll('.overlay').forEach(function(ov){
    if(ov)ov.addEventListener('touchmove',function(e){
      if(e.target===ov)e.preventDefault();
    },{passive:false});
  });
  var saved=localStorage.getItem('forge_current_user');
  try{applyTranslations();}catch(e){console.warn('applyTranslations:',e);}
  if(saved){
    var accs=getAccounts();
    if(accs[saved]){
      currentUser=saved;
      S=accs[saved].data||{};
      var un=document.getElementById('profile-username');
      if(un)un.textContent=saved;
      checkProfile();
      if(!S.profile)document.getElementById('setup-screen').classList.remove('hidden');
      applyExFilters();
      buildLog();
      buildQuickStart();
      updateTimerUI();
      applySettings();
      applyTranslations();
      if(accs[saved].hash){
        startLiveSync(saved,accs[saved].hash);
        setTimeout(function(){syncAccountToCloud(saved);},2000);
      }
      return;
    }
  }
  // No saved user — auto-login as local (no auth required)
  var u='local';
  var accs=getAccounts();
  if(!accs[u]){accs[u]={hash:'',data:{},created:Date.now()};saveAccounts(accs);}
  currentUser=u;
  localStorage.setItem('forge_current_user',u);
  S=accs[u].data||{};
  var un=document.getElementById('profile-username');
  if(un)un.textContent='Local';
  checkProfile();
  if(!S.profile)document.getElementById('setup-screen').classList.remove('hidden');
  applyExFilters();
  buildLog();
  buildQuickStart();
  updateTimerUI();
  applySettings();
  applyTranslations();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
