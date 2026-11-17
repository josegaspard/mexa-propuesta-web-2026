/* Caso de estudio MEXA: entrada al hacer scroll, deslizadores antes/después y clips. Sin dependencias. */
(function(){
  window.__caso=1;
  var h=document.documentElement, quieto=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // deslizadores
  document.querySelectorAll('.comparar').forEach(function(c){
    var r=c.querySelector('input');
    function pinta(){ c.style.setProperty('--p',r.value+'%'); r.setAttribute('aria-valuetext','Web actual '+r.value+' %, web nueva '+(100-r.value)+' %'); }
    r.addEventListener('input',pinta); pinta();
  });
  // clips: se reproducen solo mientras están en pantalla
  var videos=[].slice.call(document.querySelectorAll('video[data-auto]'));
  if('IntersectionObserver' in window && !quieto){
    var ov=new IntersectionObserver(function(es){ es.forEach(function(e){
      var v=e.target;
      if(e.isIntersecting){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); } else v.pause();
    }); },{threshold:.5});
    videos.forEach(function(v){ ov.observe(v); });
  }
  // entrada: comprobación directa en cada scroll (no depende de IntersectionObserver)
  var el=[].slice.call(document.querySelectorAll('[data-ver]')), pend=false;
  if(quieto){ el.forEach(function(e){ e.classList.add('is-visto'); }); return; }
  function mira(){
    pend=false; var lim=window.innerHeight*.94;
    el=el.filter(function(e){ if(e.getBoundingClientRect().top<lim){ e.classList.add('is-visto'); return false; } return true; });
    if(!el.length){ window.removeEventListener('scroll',pide); window.removeEventListener('resize',pide); }
  }
  function pide(){ if(!pend){ pend=true; requestAnimationFrame(mira); } }
  window.addEventListener('scroll',pide,{passive:true}); window.addEventListener('resize',pide); mira();
})();
