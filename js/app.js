(function(){
  'use strict';
  const $=(s,root=document)=>root.querySelector(s); const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
  document.documentElement.classList.add('js-ready');
  function safe(fn){try{fn()}catch(e){console.warn('Meridian script warning:',e)}}
  document.addEventListener('DOMContentLoaded',()=>{
    safe(()=>{
      const bar=$('#progress-bar');
      const update=()=>{if(!bar)return; const max=document.documentElement.scrollHeight-innerHeight; bar.style.width=(max>0?(scrollY/max)*100:0)+'%'};
      update(); addEventListener('scroll',update,{passive:true}); addEventListener('resize',update);
    });
    safe(()=>{
      const btn=$('#menuToggle'), menu=$('#navLinks'); if(!btn||!menu)return;
      const close=()=>{menu.classList.remove('active');btn.textContent='☰';btn.setAttribute('aria-expanded','false')};
      btn.setAttribute('aria-expanded','false');
      btn.addEventListener('click',()=>{const open=menu.classList.toggle('active');btn.textContent=open?'✕':'☰';btn.setAttribute('aria-expanded',String(open))});
      $$('.nav-links a').forEach(a=>a.addEventListener('click',close));
      addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    });
    safe(()=>{
      const links=$$('.nav-links a[href^="#"]'); const sections=links.map(a=>$(a.getAttribute('href'))).filter(Boolean);
      const setActive=()=>{let cur=sections[0]; sections.forEach(sec=>{if(sec.getBoundingClientRect().top<innerHeight*.35)cur=sec}); links.forEach(a=>a.classList.toggle('active',cur&&a.getAttribute('href')==='#'+cur.id))};
      setActive(); addEventListener('scroll',setActive,{passive:true});
    });
    safe(()=>{
      const items=$$('.reveal'); if(!items.length)return;
      if(!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('visible'));return}
      const io=new IntersectionObserver((entries)=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px -60px 0px'});
      items.forEach(el=>io.observe(el)); setTimeout(()=>items.slice(0,2).forEach(el=>el.classList.add('visible')),400);
    });

    safe(()=>{
      const cards=$$('.card-hover,.stat-card,.speaker-card,.list-col,.arch-card,.tech-card,.flow-step');
      cards.forEach((el,i)=>{el.style.transitionDelay=(i%8)*45+'ms'});
      const hero=$('#cover .container');
      const move=()=>{if(!hero)return; hero.style.setProperty('--parallax-y', Math.min(scrollY*.08,38)+'px'); hero.style.transform='translateY('+Math.min(scrollY*.08,38)+'px)'};
      move(); addEventListener('scroll',move,{passive:true});
    });
    safe(()=>{
      const target=new Date('2026-11-10T09:00:00+04:00').getTime(); const ids=['days','hours','minutes','seconds'];
      if(!ids.every(id=>$('#'+id)))return;
      const tick=()=>{let diff=target-Date.now(); if(diff<0)diff=0; const d=Math.floor(diff/86400000), h=Math.floor(diff%86400000/3600000), m=Math.floor(diff%3600000/60000), s=Math.floor(diff%60000/1000); const vals=[d,h,m,s]; ids.forEach((id,i)=>$('#'+id).textContent=String(vals[i]).padStart(2,'0'))};
      tick(); setInterval(tick,1000);
    });
});
})();

// Final refinement interactions: counters and agenda tabs
(function(){
  function $$(s,r=document){return Array.from(r.querySelectorAll(s));}
  document.addEventListener('DOMContentLoaded',function(){
    const counters=$$('.counter');
    const animateCounter=(el)=>{
      const target=parseInt(el.dataset.target||'0',10);
      const duration=1100; const start=performance.now();
      const step=(now)=>{const p=Math.min((now-start)/duration,1); const eased=1-Math.pow(1-p,3); el.textContent=Math.round(target*eased); if(p<1)requestAnimationFrame(step)};
      requestAnimationFrame(step);
    };
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){animateCounter(entry.target);io.unobserve(entry.target)}}),{threshold:.35});
      counters.forEach(c=>io.observe(c));
    }else{counters.forEach(animateCounter)}

    const tabs=$$('.agenda-tab');
    tabs.forEach(tab=>tab.addEventListener('click',()=>{
      const key=tab.dataset.agendaTab;
      tabs.forEach(t=>t.classList.toggle('active',t===tab));
      $$('.agenda-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.agendaPanel===key));
    }));
  });
})();

// CTA lead form modal + Google Sheets submission
(function(){
  'use strict';

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwvqitdAXm8_ClWzgL--7cBnBrWAzcHDO5x6bNrjSvWHQ0wODBTQ7ABtzpJhcEZRgZv/exec";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

   const configs = {
    invitation: {
      title: 'Request Invitation',
      intro: 'Submit your details for invitation consideration to Meridian Exchange, an invitation-only strategic summit and workshop programme.',
      intent: 'Request Invitation',
      sponsor: false,
      submit: 'Submit Invitation Request'
    },
    delegate: {
      title: 'Request Delegate Access',
      intro: 'Submit your details and our team will review your profile for delegate access to Meridian Exchange 2026.',
      intent: 'Request Delegate Access',
      sponsor: false,
      submit: 'Submit Delegate Interest'
    },
    partner: {
      title: 'Partner With Us',
      intro: 'Share your organisation details and partnership interest. Our team will contact you to discuss strategic alignment.',
      intent: 'Partner With Us',
      sponsor: true,
      submit: 'Submit Partnership Enquiry'
    },
    sponsorship: {
      title: 'Discuss Sponsorship',
      intro: 'Tell us about your sponsorship objectives and our team will share suitable partnership options.',
      intent: 'Contact Us to Discuss Sponsorship',
      sponsor: true,
      submit: 'Submit Sponsorship Enquiry'
    },
    agenda: {
      title: 'Request Full Agenda',
      intro: 'Share your details to receive the full Meridian Exchange summit agenda, workshop programme and roundtable focus areas.',
      intent: 'Request Full Agenda',
      sponsor: false,
      submit: 'Request Agenda'
    }
  };

  function openModal(type){
    const modal = $('#leadModal');
    if (!modal) return;

    const cfg = configs[type] || configs.invitation;

    $('#leadModalTitle').textContent = cfg.title;
    $('#leadModalIntro').textContent = cfg.intro;
    $('#formIntent').value = cfg.intent;
    $('.lead-submit').textContent = cfg.submit;

    modal.classList.toggle('sponsor-mode', !!cfg.sponsor);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    setTimeout(() => {
      const first = modal.querySelector('input[name="First Name"]');
      if (first) first.focus();
    }, 80);
  }

  function closeModal(){
    const modal = $('#leadModal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function getFormPayload(form){
    const data = new FormData(form);

    return {
      enquiryType: data.get("Enquiry Type") || "",
      firstName: data.get("First Name") || "",
      lastName: data.get("Last Name") || "",
      businessEmail: data.get("Business Email") || "",
      mobileNumber: data.get("Mobile Number") || "",
      jobTitle: data.get("Job Title") || "",
      company: data.get("Company") || "",
      country: data.get("Country") || "",
      organisationType: data.get("Organisation Type") || "",
      sponsorshipInterest: data.get("Sponsorship Interest") || "",
      estimatedBudgetRange: data.get("Estimated Budget Range") || "",
      message: data.get("Message") || "",
      consent: data.get("Consent") ? "Yes" : "No",
      pageUrl: window.location.href
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    $$('.js-open-lead-form').forEach(btn => {
      btn.addEventListener('click', () => openModal(btn.dataset.formType));
    });

    $$('[data-close-lead-modal]').forEach(btn => {
      btn.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    const form = $('#leadForm');

    if (form) {
      form.addEventListener('submit', async e => {
        e.preventDefault();

        if (!form.reportValidity()) return;

        const submitButton = form.querySelector('.lead-submit');
        const originalText = submitButton.textContent;

        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;

        const payload = getFormPayload(form);

        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
          });

          submitButton.textContent = 'Submitted Successfully';

          setTimeout(() => {
            form.reset();
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            closeModal();
            alert('Thank you for your interest in Meridian Exchange. Your request has been received by the Meridian Exchange Secretariat. A member of our team will contact you shortly.');
          }, 700);

        } catch (error) {
          console.error('Lead form submission error:', error);
          submitButton.textContent = originalText;
          submitButton.disabled = false;
          alert('Something went wrong. Please try again.');
        }
      });
    }
  });
})();

// Mobile speaker carousel fallback for iOS/Android browsers
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    const carousel = document.querySelector('.speaker-carousel');
    const track = document.querySelector('.speaker-track');
    if(!carousel || !track) return;

    const mobileQuery = window.matchMedia('(max-width: 768px)');
    let raf = null;
    let x = 0;
    let paused = false;
    let last = 0;
    const speed = 28; // pixels per second

    function halfWidth(){ return Math.max(1, track.scrollWidth / 2); }

    function stop(){
      if(raf){ cancelAnimationFrame(raf); raf = null; }
      track.style.transform = '';
      track.style.webkitTransform = '';
      track.style.animation = '';
      track.style.webkitAnimation = '';
    }

    function tick(now){
      if(!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if(!paused){
        x -= speed * dt;
        const limit = halfWidth();
        if(Math.abs(x) >= limit) x = 0;
        const transform = 'translate3d(' + x + 'px,0,0)';
        track.style.transform = transform;
        track.style.webkitTransform = transform;
      }
      raf = requestAnimationFrame(tick);
    }

    function start(){
      if(!mobileQuery.matches){ stop(); return; }
      track.style.animation = 'none';
      track.style.webkitAnimation = 'none';
      track.style.willChange = 'transform';
      if(!raf){ last = 0; raf = requestAnimationFrame(tick); }
    }

    carousel.addEventListener('touchstart', function(){ paused = true; }, {passive:true});
    carousel.addEventListener('touchend', function(){ paused = false; }, {passive:true});
    carousel.addEventListener('touchcancel', function(){ paused = false; }, {passive:true});
    carousel.addEventListener('pointerenter', function(){ paused = true; });
    carousel.addEventListener('pointerleave', function(){ paused = false; });

    if(mobileQuery.addEventListener){ mobileQuery.addEventListener('change', start); }
    else if(mobileQuery.addListener){ mobileQuery.addListener(start); }
    window.addEventListener('resize', start, {passive:true});
    start();
  });
})();
