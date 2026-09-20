document.addEventListener('DOMContentLoaded',()=>{
  const button=document.querySelector('.menu-button'),nav=document.querySelector('#primary-nav');
  const toggle=open=>{button.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);};
  if(button&&nav){button.addEventListener('click',()=>toggle(button.getAttribute('aria-expanded')!=='true'));nav.addEventListener('click',e=>{if(e.target.closest('a'))toggle(false);});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){toggle(false);button.focus();}});matchMedia('(min-width:1021px)').addEventListener('change',e=>{if(e.matches)toggle(false);});}
  document.querySelectorAll('[data-language]').forEach(a=>{a.addEventListener('click',()=>{if(location.hash)a.href=a.getAttribute('href').split('#')[0]+location.hash;});});
});
