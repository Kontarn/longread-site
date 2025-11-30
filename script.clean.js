/* script.clean.js - final clean implementation (replaces messy script.js during development)
   Purpose: single, concise implementation of TOC + per section activation + progress + theme + font + chart + reveal
*/
(function(){
  'use strict';
  const tocListEl = document.getElementById('toc-list');
  const article = document.getElementById('article');
  if(!article || !tocListEl) { console.warn('Longread: missing article/toc'); return; }
  const progressEl = document.getElementById('progress');
  const themeToggle = document.getElementById('theme-toggle');
  // TOC toggle removed: panel displayed via left-side TOC and CSS
  const showAllToggle = document.getElementById('show-all-toggle');
  const fontIncrease = document.getElementById('font-increase');
  const fontDecrease = document.getElementById('font-decrease');
  const growthCanvas = document.getElementById('growth-chart');
  const baseFontSizeVar = '--base-font-size';

  // Sections will be refreshed dynamically after article content is loaded
  let sections = Array.from(article.querySelectorAll('section'));
  let activeSection = null;
  let chart = null;

  function ensureIds(){ sections.forEach((s,i)=>{ if(!s.id) s.id = `section-${i+1}`; }); }

  function refreshSections(){ sections = Array.from(article.querySelectorAll('section')); }

  function buildTOC(){
    tocListEl.innerHTML = '';
    sections.forEach((s)=>{
      const h = s.querySelector('h2');
      const title = h && h.textContent ? h.textContent.trim() : s.id;
      const a = document.createElement('a'); a.href = `#${s.id}`; a.textContent = title;
      a.setAttribute('role','link'); a.setAttribute('tabindex','0'); a.setAttribute('aria-current','false');
      a.addEventListener('click', (e)=>{ e.preventDefault(); activateSectionById(s.id,true); });
      a.addEventListener('keydown', function(e){ const anchors = Array.from(tocListEl.querySelectorAll('a')); const i = anchors.indexOf(this); if(e.key === 'ArrowDown'){ e.preventDefault(); anchors[(i+1)%anchors.length].focus(); } if(e.key === 'ArrowUp'){ e.preventDefault(); anchors[(i-1+anchors.length)%anchors.length].focus(); } if(e.key === 'Home'){ e.preventDefault(); anchors[0] && anchors[0].focus(); } if(e.key === 'End'){ e.preventDefault(); anchors[anchors.length-1] && anchors[anchors.length-1].focus(); } if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); this.click(); } });
      const li = document.createElement('li'); li.appendChild(a); tocListEl.appendChild(li);
    });
  }

  function activateSectionById(id, push=false){
    const t = document.getElementById(id); if(!t) return;
    sections.forEach(s=>s.classList.remove('active')); t.classList.add('active'); activeSection = t;
    tocListEl.querySelectorAll('a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === `#${id}` ? 'true' : 'false'));
    if(push){ history.replaceState(null,'',`#${id}`); window.scrollTo({top:0}); }
    try{ const h = t.querySelector('h2'); if(h){ h.tabIndex = -1; h.focus(); h.scrollIntoView({behavior:'smooth', block:'start'}); }}catch(e){}
    if(chart && t.querySelector('#growth-chart')){ try{ chart.resize(); chart.update(); }catch(e){} }
    // Ensure reveal elements within the active section are visible (add 'in-view' if not already)
    try{ t.querySelectorAll('.reveal').forEach(el => { if(!el.classList.contains('in-view')) el.classList.add('in-view'); }); }catch(e){}
    updateProgress();
  }

  function initActive(){
    const raw = location.hash ? location.hash.substring(1) : null;
    if(!raw){ if(sections.length) activateSectionById(sections[0].id,false); return; }
    const el = document.getElementById(raw);
    if(!el){ // If it's a section id or missing, try to activate as section
      const sec = document.getElementById(raw);
      if(sec && sec.tagName.toLowerCase() === 'section'){ activateSectionById(raw,false); }
      else if(sections.length) activateSectionById(sections[0].id,false);
      return;
    }
    // If element exists: handle if it's a reference list item with external href (open it), otherwise find the containing section and activate it
    if(el.tagName.toLowerCase() === 'li' && el.parentElement && el.parentElement.classList.contains('references')){
      const a = el.querySelector('a[href]'); const externalHref = a ? a.getAttribute('href') : null;
      if(externalHref && /^(https?:)?\/\//i.test(externalHref)){
          try{ console.debug('initActive: navigating to external ref', externalHref); window.location.href = externalHref; }catch(e){}
        return;
      }
    }
    const parentSection = el.tagName.toLowerCase() === 'section' ? el : el.closest('section');
    if(parentSection){ activateSectionById(parentSection.id, false); try{ el.tabIndex = -1; el.focus(); el.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e){} }
    else { activateSectionById(el.id, false); }
  }

  function updateProgress(){ if(!activeSection || !progressEl){ if(progressEl) progressEl.style.width='0%'; return; } const top = activeSection.getBoundingClientRect().top + window.scrollY; const h = activeSection.offsetHeight; const pct = Math.min(100, Math.max(0, Math.round((window.scrollY - top) / Math.max(1, h - window.innerHeight) * 100))); progressEl.style.width = `${pct}%`; }

  function initReveal(){ try{ const obs = new IntersectionObserver(entries => entries.forEach(en => { if(en.isIntersecting) en.target.classList.add('in-view'); }), { threshold: 0.12 }); document.querySelectorAll('.reveal').forEach(n=>obs.observe(n)); }catch(e){} }

  function initChart(){ try{ if(!growthCanvas || typeof Chart === 'undefined') return; chart = new Chart(growthCanvas.getContext('2d'), { type:'line', data:{ labels:['2019','2020','2021','2022','2023','2024','2025'], datasets:[{ label:'Доля цифровой экономики (трлн долл)', data:[10.2,11.1,13,14.6,18.5,23.2,26.7], borderColor:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#0e7490', backgroundColor:'rgba(14,116,144,0.06)', fill:true }]}, options:{ responsive:true } }); }catch(e){} }

  function initThemeAndFont(){ try{ const t = localStorage.getItem('theme'); if(t) document.documentElement.setAttribute('data-theme', t); themeToggle && themeToggle.addEventListener('click', ()=>{ const cur = document.documentElement.getAttribute('data-theme'); const nxt = cur === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', nxt); localStorage.setItem('theme', nxt); }); }catch(e){} try{ const getFont = ()=> parseInt(getComputedStyle(document.documentElement).getPropertyValue(baseFontSizeVar) || 17, 10); const setFont = sz=>{ document.documentElement.style.setProperty(baseFontSizeVar, `${sz}px`); localStorage.setItem('fontSize', sz); }; const saved = parseInt(localStorage.getItem('fontSize'),10); if(saved) setFont(saved); fontIncrease && fontIncrease.addEventListener('click', ()=> setFont(Math.min(22, getFont()+1))); fontDecrease && fontDecrease.addEventListener('click', ()=> setFont(Math.max(14, getFont()-1))); }catch(e){} }

  function initShowAllToggle(){ try{
    const saved = localStorage.getItem('showAllSections');
    const showAll = saved === 'true';
    // If user preference is to show all, remove tabs-enabled
    if(showAll){ document.body.classList.remove('tabs-enabled'); if(showAllToggle) { showAllToggle.setAttribute('aria-pressed','true'); showAllToggle.textContent = 'Скрыть текст'; } }
    if(showAllToggle){
      showAllToggle.addEventListener('click', ()=>{
        const pressed = showAllToggle.getAttribute('aria-pressed') === 'true';
        if(pressed){ document.body.classList.add('tabs-enabled'); showAllToggle.setAttribute('aria-pressed','false'); showAllToggle.textContent = 'Показать весь текст'; localStorage.setItem('showAllSections', 'false'); }
        else { document.body.classList.remove('tabs-enabled'); showAllToggle.setAttribute('aria-pressed','true'); showAllToggle.textContent = 'Скрыть текст'; localStorage.setItem('showAllSections', 'true'); }
      });
    }
  }catch(e){} }

  // initToggles removed: TOC toggle button is not present in the UI and TOC remains visible

  function initReferences(){ try{ const refList = document.querySelectorAll('.references > li'); const refMap = {}; refList.forEach((li,idx)=>{ const rid = `ref-${idx+1}`; if(!li.id) li.id = rid; const a = li.querySelector('a'); const externalHref = a ? a.getAttribute('href') : null; if(externalHref){ refMap[rid] = externalHref; } // add backlink
      // create a backlink that returns to the first inline anchor (if any), otherwise falls back to #article
      const inlineAnchor = document.querySelector(`a.ref[href="#${rid}"]`);
      let backlinkHref = '#article';
      if(inlineAnchor){ if(!inlineAnchor.id) inlineAnchor.id = `ref-link-${idx+1}`; backlinkHref = `#${inlineAnchor.id}`; }
      const backlink = document.createElement('a');
      backlink.href = backlinkHref;
      backlink.className = 'backlink';
      backlink.textContent = ' ↑';
      backlink.setAttribute('aria-label','Вернуться к тексту');
      backlink.setAttribute('title','Вернуться к месту в тексте');
      backlink.tabIndex = 0;
      li.appendChild(backlink);
      // Make the reference list item focusable for programmatic focus on hash navigation
      li.tabIndex = -1;
    });
    // Keep inline reference markers (.ref) as internal anchors (#ref-N) for non-JS fallback.
    // With JS enabled, clicking the inline ref will open the external source referenced in the list.
    document.querySelectorAll('.ref').forEach((r,idx)=>{
      const rawHref = r.getAttribute('href') || `#ref-${idx+1}`;
      if(!r.getAttribute('href')) r.setAttribute('href', rawHref);
      // Ensure the inline ref is accessible
      if(!r.getAttribute('aria-label')) r.setAttribute('aria-label', `Ссылка на источник ${idx+1}`);
      if(!r.getAttribute('title')) r.setAttribute('title', `Перейти к источнику ${idx+1}`);
      // if the reference list item has an external href, update the inline ref href to point to it
      try{
        const rid = rawHref.replace(/^#/, '');
        const li = document.getElementById(rid);
        const linkInLi = li ? li.querySelector('a[href]') : null;
        const externalHref = linkInLi ? linkInLi.getAttribute('href') : null;
        if(externalHref && /^(https?:)?\/\//i.test(externalHref)){
          // set the inline ref href to the external URL so default navigation opens the external site in a new tab
          r.setAttribute('href', externalHref);
          r.setAttribute('target', '_blank');
          r.setAttribute('rel', 'noopener noreferrer');
          // Do not intercept the click here: default navigation with target=_blank will open in a new tab.
          // Avoid using window.open here to prevent popup-blocking issues; browsers open links with target='_blank' reliably on user clicks.
        }
      }catch(e){}
    });
  }catch(e){} }


  function initSkip(){ try{ document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', ev => { const id = ev.currentTarget.hash ? ev.currentTarget.hash.substring(1) : null; if(id){ const t = document.getElementById(id); t && t.focus({ preventScroll:true }); } })); }catch(e){} }

  function initKeyboard(){ try{ /* No TOC toggle to wire up — keyboard focus and smooth-scrolling is enabled */ document.documentElement.style.scrollBehavior = 'smooth'; }catch(e){} }

  function initAll(){
    ensureIds();
    buildTOC();
    initThemeAndFont();
    initShowAllToggle(); /* initToggles removed */
    initReveal();
    initReferences();
    initSkip();
    initKeyboard();
    initChart();
    initActive();
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('hashchange', ()=>{
      const id = location.hash ? location.hash.substring(1) : null;
      if(!id) return;
      const el = document.getElementById(id);
      if(el){
        const parentSection = el.tagName.toLowerCase() === 'section' ? el : el.closest('section');
        // If the hash explicitly points to a reference list item, attempt to open external link
        if(el.tagName.toLowerCase() === 'li' && el.parentElement && el.parentElement.classList.contains('references')){
          const a = el.querySelector('a[href]');
          const externalHref = a ? a.getAttribute('href') : null;
          if(externalHref && /^(https?:)?\/\//i.test(externalHref)){
              try{ console.debug('hashchange: navigating to external ref', externalHref); window.location.href = externalHref; }catch(e){}
            // Do not activate the references section — we directly open the external site
            return;
          }
        }
        if(parentSection){
          activateSectionById(parentSection.id, false);
          try{ el.tabIndex = -1; el.focus(); el.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e){}
        } else if(document.getElementById(id) && document.getElementById(id).tagName === 'SECTION'){
          activateSectionById(id, false);
        }
      } else {
        if(document.getElementById(id) && document.getElementById(id).tagName === 'SECTION') activateSectionById(id, false);
      }
    });
    // Delegated capture listener to intercept clicks on inline refs before the browser navigates
    try{
      // delegation: intercept clicks on inline refs and open external URLs when present (capture-phase)
      document.body.addEventListener('click', function(e){
        const anchor = e.target.closest && e.target.closest('a.ref');
        if(!anchor) return; const href = anchor.getAttribute('href'); if(!href || href.indexOf('#') !== 0) return; const rid = href.replace(/^#/, '');
        const li = document.getElementById(rid); const linkInLi = li ? li.querySelector('a[href]') : null; const externalHref = linkInLi ? linkInLi.getAttribute('href') : null;
        if(externalHref && /^(https?:)?\/\//i.test(externalHref)){
            try{
              e.preventDefault();
              // Use window.open to open in a new tab on user click; fallback to same tab navigation if popup blocked
              const w = window.open(externalHref, '_blank', 'noopener');
              if(!w){ window.location.href = externalHref; }
            }catch(e){ try{ e.preventDefault(); window.location.href = externalHref; }catch(e){} }
        }
      }, true);
    }catch(e){}
  }

  async function maybeLoadExternalArticle(){
    try{
      const wantsExternal = article.dataset.external === 'true';
      const hasSections = article.querySelectorAll('section').length > 0;
      if(!wantsExternal && hasSections) return; // nothing to do
      const resp = await fetch('content/article.md');
      if(!resp.ok) return;
      let txt = await resp.text();
      // Remove potential markdown fences (```markdown ... ```)
      txt = txt.replace(/^```\w*\n/, '').replace(/\n```$/, '');
      // If content contains a top-level <article> or <section> we will inject as-is
      // Trim any surrounding whitespace
      txt = txt.trim();
      // Sanitize: remove leftover markers like '*** End Patch' or similar stray markers that may appear from editor artifacts
      try{ txt = txt.replace(/\*{3,}\s*end\s*patch\s*/ig, ''); }catch(e){}
      // Basic sanity check: if it contains section tags, inject. Also ensure we don't inject empty/sanitized content
      if(!txt || txt.trim().length === 0){ console.warn('maybeLoadExternalArticle: fetched content is empty after sanitization, skipping injection'); return; }
      if(txt.includes('<section')){
        article.innerHTML = txt;
      } else {
        // fallback: if it is plain markdown, strip fences and attempt naive HTML conversion for headers/paragraphs
        // Minimal conversion: replace headers to <h2>, and paragraphs
        txt = txt.replace(/^### (.*)$/gm, '<h3>$1</h3>');
        txt = txt.replace(/^## (.*)$/gm, '<h2>$1</h2>');
        txt = txt.replace(/^# (.*)$/gm, '<h1>$1</h1>');
        txt = txt.replace(/\n\n+/g, '</p><p>');
        article.innerHTML = '<p>' + txt + '</p>';
      }
    }catch(e){ console.warn('Failed to load external article', e); }
  }

  // Main: attempt to load external content, refresh sections, then run the main init
  (async function main(){
    try{
      await maybeLoadExternalArticle();
      refreshSections();
      initAll();
      document.body.classList.add('tabs-enabled');
    }catch(e){
      console.error('Longread clean init failed', e);
    }
  })();
})();
