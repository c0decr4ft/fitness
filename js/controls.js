// ═══════════════════════════════════════════════════
//  CONTROLS — Touch, buttons, boot, event handlers
// ═══════════════════════════════════════════════════
function boot(){
  var lb=document.getElementById('btn-login'),sb=document.getElementById('btn-signup');
  if(lb)lb.onclick=doLogin;
  if(sb)sb.onclick=doSignup;
  var setup=document.getElementById('btn-setup');
  if(setup)setup.onclick=saveProfile;
  var tl=document.getElementById('auth-tab-login'),ts=document.getElementById('auth-tab-signup');
  if(tl)tl.onclick=function(){authTab('login');};
  if(ts)ts.onclick=function(){authTab('signup');};
  var tb=document.getElementById('transfer-toggle-btn');
  if(tb)tb.onclick=toggleTransferPanel;
  var skipLink=document.getElementById('skip-auth-link');
  if(skipLink){skipLink.onclick=function(e){e.preventDefault();skipAuth();return false;};}
  var ib=document.getElementById('restore-code-btn')||document.querySelector('#transfer-panel button');
  if(ib)ib.onclick=importBackup;
  renderAccountsList();
  setTimeout(function(){if(currentUser)syncAccountToCloud(currentUser);},3000);
  var loginPass=document.getElementById('login-pass');
  var loginUser=document.getElementById('login-user');
  var signupPass2=document.getElementById('signup-pass2');
  if(loginPass)loginPass.addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
  if(loginUser)loginUser.addEventListener('keydown',function(e){if(e.key==='Enter'){if(loginPass)loginPass.focus();}});
  if(signupPass2)signupPass2.addEventListener('keydown',function(e){if(e.key==='Enter')doSignup();});
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
      document.getElementById('auth-screen').classList.add('hidden');
      document.body.classList.remove('auth-visible');
      var un=document.getElementById('profile-username');
      if(un)un.textContent=saved;
      checkProfile();
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
  document.getElementById('setup-screen').classList.add('hidden');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

// Robust auth/setup button handling — works for click, touch, and embedded browsers
function handleAuthPointer(e){
  var as=document.getElementById('auth-screen'),ss=document.getElementById('setup-screen');
  if(!as||!ss)return;
  var inAuth=as.contains(e.target),inSetup=ss.contains(e.target);
  if(!inAuth&&!inSetup)return;
  var t=e.target.closest('a#skip-auth-link,a#btn-login,a#btn-signup,a#auth-tab-login,a#auth-tab-signup,a#transfer-toggle-btn,#restore-code-btn,button#btn-setup,button#btn-login,button#btn-signup,button#auth-tab-login,button#auth-tab-signup,button#transfer-toggle-btn,button');
  if(!t)return;
  e.preventDefault();
  e.stopPropagation();
  if(t.id==='skip-auth-link'){skipAuth();return;}
  if(t.id==='btn-login'){doLogin();return;}
  if(t.id==='btn-signup'){doSignup();return;}
  if(t.id==='btn-setup'){saveProfile();return;}
  if(t.id==='auth-tab-login'){authTab('login');return;}
  if(t.id==='auth-tab-signup'){authTab('signup');return;}
  if(t.id==='transfer-toggle-btn'){toggleTransferPanel();return;}
  if(t&&(t.id==='restore-code-btn'||t.closest('#transfer-panel'))){importBackup();return;}
}
function attachAuthHandlers(){
  var asEl=document.getElementById('auth-screen'),ssEl=document.getElementById('setup-screen');
  if(asEl){asEl.addEventListener('pointerdown',handleAuthPointer,{capture:true,passive:false});asEl.addEventListener('click',handleAuthPointer,{capture:true,passive:false});}
  if(ssEl){ssEl.addEventListener('pointerdown',handleAuthPointer,{capture:true,passive:false});ssEl.addEventListener('click',handleAuthPointer,{capture:true,passive:false});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachAuthHandlers);else attachAuthHandlers();

document.addEventListener('click',function(e){
  var as=document.getElementById('auth-screen'),ss=document.getElementById('setup-screen');
  if((!as||!as.contains(e.target))&&(!ss||!ss.contains(e.target)))return;
  var t=e.target.closest('a,button');
  if(!t)return;
  if(t.id==='skip-auth-link'){e.preventDefault();e.stopPropagation();skipAuth();return;}
  if(t.id==='btn-login'){e.preventDefault();e.stopPropagation();doLogin();return;}
  if(t.id==='btn-signup'){e.preventDefault();e.stopPropagation();doSignup();return;}
  if(t.id==='btn-setup'){e.preventDefault();e.stopPropagation();saveProfile();return;}
  if(t.id==='auth-tab-login'){e.preventDefault();e.stopPropagation();authTab('login');return;}
  if(t.id==='auth-tab-signup'){e.preventDefault();e.stopPropagation();authTab('signup');return;}
  if(t.id==='transfer-toggle-btn'){e.preventDefault();e.stopPropagation();toggleTransferPanel();return;}
  if(t.id==='restore-code-btn'||t.closest('#transfer-panel')){e.preventDefault();e.stopPropagation();importBackup();return;}
},true);
document.addEventListener('touchend',function(e){
  var as=document.getElementById('auth-screen'),ss=document.getElementById('setup-screen');
  if((!as||!as.contains(e.target))&&(!ss||!ss.contains(e.target)))return;
  var t=e.target.closest('a[id="skip-auth-link"],a#btn-login,a#btn-signup,a#auth-tab-login,a#auth-tab-signup,a#transfer-toggle-btn,#restore-code-btn,button#btn-setup,button#btn-login,button#btn-signup,button#auth-tab-login,button#auth-tab-signup,button#transfer-toggle-btn');
  if(!t)return;
  e.preventDefault();
  if(t.id==='skip-auth-link')skipAuth();
  else if(t.id==='btn-login')doLogin();
  else if(t.id==='btn-signup')doSignup();
  else if(t.id==='btn-setup')saveProfile();
  else if(t.id==='auth-tab-login')authTab('login');
  else if(t.id==='auth-tab-signup')authTab('signup');
  else if(t.id==='transfer-toggle-btn')toggleTransferPanel();
  else if(t.id==='restore-code-btn'||t.closest('#transfer-panel'))importBackup();
},{passive:false,capture:true});
