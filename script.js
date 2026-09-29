'use strict';
document.getElementById('year').textContent=new Date().getFullYear();
const menu=document.getElementById('mobile-menu'),menuButton=document.querySelector('.menu-toggle');
menuButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden));menuButton.setAttribute('aria-label',menu.hidden?'Открыть меню':'Закрыть меню');});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');}));
const form=document.getElementById('order-form'),status=document.getElementById('form-status');
document.querySelectorAll('[data-product]').forEach(a=>a.addEventListener('click',()=>{form.elements.products.value=a.dataset.product+' — ';}));
form.elements.phone.addEventListener('input',()=>form.elements.phone.setCustomValidity(''));
form.addEventListener('submit',e=>{e.preventDefault();const phone=form.elements.phone;const digits=phone.value.replace(/\D/g,'');if(digits.length<10||digits.length>15){phone.setCustomValidity('Укажите телефон: от 10 до 15 цифр.');phone.reportValidity();return;}phone.setCustomValidity('');if(!form.reportValidity())return;const text=['ЗАЯВКА НА МЕТАЛЛОПРОКАТ','',`Имя: ${form.elements.name.value.trim()}`,`Телефон: ${phone.value.trim()}`,'',`Позиции:\n${form.elements.products.value.trim()}`,'',`Город и пожелания: ${form.elements.details.value.trim()}`].join('\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Заявка-на-металлопрокат.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='Заявка подготовлена. Файл передан браузеру для сохранения. Поставщику заявка не отправлена.';});
document.getElementById('back-top').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});

// Reveal headings and cards in both sections once, then draw their diagrams.
// Without JS, IntersectionObserver or motion, every element remains visible.
const insightItems=document.querySelectorAll('.insight-section .insight-head, .insight-section .insight-card');
const insightMotion=matchMedia('(prefers-reduced-motion: reduce)');
if(insightItems.length && 'IntersectionObserver' in window && !insightMotion.matches){
  const insightObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.remove('is-pending');
        entry.target.classList.add('is-revealed');
        insightObserver.unobserve(entry.target);
      }
    });
  },{threshold:.18,rootMargin:'0px 0px -5% 0px'});
  insightItems.forEach(item=>{
    item.classList.add('reveal-ready','is-pending');
    insightObserver.observe(item);
  });
  insightMotion.addEventListener('change',event=>{
    if(event.matches){
      insightObserver.disconnect();
      insightItems.forEach(item=>{
        item.classList.remove('is-pending');
        item.classList.add('is-revealed');
      });
    }
  });
}
