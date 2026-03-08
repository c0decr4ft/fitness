// ═══════════════════════════════════════════════════
//  CONTROLS — Touch, buttons, boot, event handlers
// ═══════════════════════════════════════════════════
function boot(){
  var setup=document.getElementById('btn-setup');
  if(setup)setup.onclick=saveProfile;
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
