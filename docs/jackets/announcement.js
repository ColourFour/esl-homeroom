/* Read-only public announcement. No voting service, order submission or storage. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const designs = Object.freeze([
    {number:1,name:'Black 太行 jacket',note:'A black jacket with Chinese lettering and wolf artwork.',images:['design-1-0.jpg'],views:['Design artwork']},
    {number:2,name:'Navy wolf hoodie',note:'A navy pullover with a small front emblem and a large wolf on the back.',images:['design-2-0.jpg','design-2-1.jpg'],views:['Front','Back']},
    {number:3,name:'Blue-and-white varsity jacket',note:'A varsity jacket with a TH wolf emblem and the slogan 你不太行.',images:['design-3-1.jpg','design-3-0.jpg'],views:['Color concept','Design drawing']}
  ]);
  const validText = value => typeof value === 'string' && value.trim().length > 0;
  const validList = value => Array.isArray(value) && value.length > 0 && value.every(validText);
  const pickDesign = id => designs.find(d => d.number === id);
  const canReveal = c => c.phase === 'announced' && c.winnerConfirmed === true && !!pickDesign(c.winnerDesign);
  const canShowPurchase = c => c.purchasingApproved === true && validText(c.price) && validList(c.sizes) && validText(c.orderDeadline) && validList(c.purchasingInstructions);
  const text = (id, value) => { $(id).textContent = value; };
  const show = (id, yes) => { $(id).hidden = !yes; };
  const putImage = (img, path, alt) => { img.alt = alt; img.src = path; };
  let activeDesign, activeView = 0;
  // Production always resolves the existing original artwork, relative to docs/jackets/.
  const asset = name => 'artwork/' + name;
  const original = name => asset(name);
  function renderView(i) {
    if (!activeDesign || !activeDesign.images[i]) return;
    activeView = i;
    const name = activeDesign.images[i];
    const alt = activeDesign.name + ' · ' + activeDesign.views[i];
    putImage($('design-image'), asset(name), alt);
    $('stage-tabs').querySelectorAll('button').forEach((b,j) => b.setAttribute('aria-pressed',String(i===j)));
  }
  function renderArt(d) {
    activeDesign = d;
    $('stage-tabs').replaceChildren();
    $('artwork').className = 'design-spread' + (d ? ' design-' + d.number : '');
    show('hero-image', !!d); show('hero-placeholder', !d); show('art-button', !!d); show('art-placeholder', !d);
    if (!d) {
      show('stage-tabs',false); $('hero-image').removeAttribute('src'); $('design-image').removeAttribute('src');
      text('jersey-number','TH'); text('design-title','Our jacket.');text('design-note','The confirmed design will appear here.');return;
    }
    const label = String(d.number).padStart(2,'0');
    text('jersey-number',label); text('design-title',d.name);text('design-note',d.note);
    putImage($('hero-image'),asset(d.images[0]),d.name + ' · ' + d.views[0]);
    d.views.forEach((v,i) => {const b = document.createElement('button');b.type='button';b.textContent=v;b.addEventListener('click',()=>renderView(i));$('stage-tabs').append(b);});
    show('stage-tabs',d.views.length>1);renderView(0);
  }
  function renderPurchase(c, layoutOnly=false) {
    const ready = canShowPurchase(c);
    show('order-panel',ready || layoutOnly); show('pending-panel',!ready && !layoutOnly);
    text('order-status',ready?'Use the approved purchasing instructions below.':layoutOnly?'Layout preview only. No commercial details have been approved.':'Purchasing details will be shared once approved.');
    text('price',ready?c.price:layoutOnly?'[Approved price + currency]':'');
    text('sizes',ready?c.sizes.join(' · '):layoutOnly?'[Approved sizes]':'');
    text('order-deadline',ready?c.orderDeadline:layoutOnly?'[Approved date and time]':'');
    $('instructions').replaceChildren();
    const steps=ready?c.purchasingInstructions:layoutOnly?['[Approved purchasing instructions will appear here.]']:[];
    for (const step of steps) {const li=document.createElement('li');li.textContent=step;$('instructions').append(li);}
  }
  function render(c={}) {
    const reveal = canReveal(c);
    show('closed',!reveal);show('revealed',reveal);
    if(!reveal){renderArt(null);renderPurchase({});return;}
    const d=pickDesign(c.winnerDesign);
    text('winner-eyebrow','TAIHANG HOUSE / THE WINNING DESIGN');
    text('winner-name',d.name);text('winner-description','You voted. This is our house design for 2026.');
    text('design-label','WINNING DESIGN / 0'+d.number);renderArt(d);renderPurchase(c);
  }
  $('art-button').addEventListener('click',()=>{
    if(!activeDesign)return;
    const name=activeDesign.images[activeView],alt=activeDesign.name+' · '+activeDesign.views[activeView];
    text('art-title',alt);putImage($('large-art'),asset(name),alt);$('open-art').href=original(name);$('art-dialog').showModal();
  });
  $('close-art').addEventListener('click',()=>$('art-dialog').close());
  $('art-dialog').addEventListener('click',e=>{if(e.target===$('art-dialog'))$('art-dialog').close();});
  render(window.TAIHANG_ANNOUNCEMENT || {});
  // PREVIEW_HOOK
})();
