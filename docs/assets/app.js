/* Homeroom English: all activity state stays in this page. No requests or storage. */
'use strict';
const MorningCore = (() => {
  const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
  const move = (items, index, direction) => {
    const result = [...items], target = index + direction;
    if (index >= 0 && index < result.length && target >= 0 && target < result.length) {
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  };
  const next = (index, change, length) => ((index + change) % length + length) % length;
  const percentages = votes => votes.map(v => votes.reduce((a,b)=>a+b,0) ? Math.round(v / votes.reduce((a,b)=>a+b,0) * 100) : 0);
  const uniqueWord = (words, word) => !words.some(w => w.toLocaleLowerCase() === word.trim().toLocaleLowerCase());
  class Timer {
    constructor(seconds = 1200, now = () => Date.now()) { this.now = now; this.reset(seconds); }
    reset(seconds = this.duration) { this.duration=seconds; this.remaining=seconds*1000; this.deadline=null; }
    start() { if (this.remaining > 0 && this.deadline === null) this.deadline=this.now()+this.remaining; }
    pause() { this.tick(); this.deadline=null; }
    tick() { if(this.deadline!==null) { this.remaining=Math.max(0,this.deadline-this.now()); if(!this.remaining)this.deadline=null; } return Math.ceil(this.remaining/1000); }
    get running() { return this.deadline!==null; }
    phase() { const elapsed=this.duration-this.tick(); return this.duration!==1200 ? 'Short speaking round' : elapsed<180 ? 'Explain & model' : elapsed<960 ? 'Pair / group work' : 'Share a few answers'; }
  }
  return {clamp,move,next,percentages,uniqueWord,Timer};
})();
if (typeof module !== 'undefined' && module.exports) module.exports=MorningCore;
if (typeof document !== 'undefined') (() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const on = (s,event,fn) => { const el=$(s); if(el)el.addEventListener(event,fn); };
  const button = (id,text,kind='secondary',attrs='') => `<button type="${id==='add-entry'?'submit':'button'}" class="button ${kind}" id="${id}" ${attrs}>${text}</button>`;
  const field = (id,label,value='',multi=false) => `<label class="field" for="${id}">${esc(label)}${multi?`<textarea id="${id}" maxlength="2000">${esc(value)}</textarea>`:`<input id="${id}" maxlength="180" value="${esc(value)}">`}</label>`;
  // Menu filters keep the random choice inside the visible collection.
  const cards=$$('.activity-card');
  $$('.filter').forEach(b=>b.addEventListener('click',()=>{
    $$('.filter').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    cards.forEach(card=>card.hidden=b.dataset.filter!=='All activities' && card.dataset.category!==b.dataset.filter);
    $('#result-count').textContent=`${cards.filter(c=>!c.hidden).length} activities · ${b.dataset.filter.toLowerCase()}`;
  }));
  on('#surprise','click',()=>{const visible=cards.filter(c=>!c.hidden); if(visible.length)location.href=visible[Math.floor(Math.random()*visible.length)].getAttribute('href');});

  if ($('#clock')) {
    const timer=new MorningCore.Timer(); let finished=false;
    const status=text=>$('#timer-status').textContent=text;
    const paint=()=>{
      const remaining=timer.tick();
      $('#clock').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
      $('#timer-stage').textContent=remaining?timer.phase():'Finish your sentence.';
      $('#timer-toggle').textContent=timer.running?'Pause timer':remaining?'Start timer':'Start again';
      if(!remaining&&!finished){status('Time is up. Finish your sentence, then share an answer.');finished=true;}
    };
    on('#timer-toggle','click',()=>{if(timer.running){timer.pause();status('Paused. Start again when you’re ready.');}else{if(!timer.tick()){timer.reset();finished=false;}timer.start();status('Timer running.');}paint();});
    on('#timer-reset','click',()=>{timer.reset();finished=false;status('Reset. Press Start timer when you’re ready.');paint();});
    $$('[data-minutes]').forEach(b=>b.addEventListener('click',()=>{timer.reset(Number(b.dataset.minutes)*60);finished=false;$$('[data-minutes]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));status('New length selected. Press Start timer to begin.');paint();}));
    setInterval(paint,250);paint();
  }

  const tour=[
    ['Choose something straightforward','Start with Would You Rather? or Odd One Out. Both take very little explaining. The menu lets you narrow the list by the kind of activity you want.','A good first question: would you rather be able to fly or become invisible? Ask them why.'],
    ['Read the setup','Check whether you need paper or an object, and decide how to group the class. Give one example so they can see what an answer might sound like.','If the task takes longer to explain than to try, do the first round together.'],
    ['Put up the prompt','“Focus view” enlarges the task and hides the surrounding navigation. The useful phrases stay visible. Open the teacher guide below the task for setup and timing.','For a secret card, turn the guesser or drawer away before revealing it. Hide it before they look back.'],
    ['Give them time to talk','Start the 20-minute timer, or use one minute for a short turn. Move to the next prompt when the discussion runs out. Changing a prompt clears its answers.','The timings are a guide. If they are still having a useful conversation, let them finish.'],
    ['Hear a few answers','Let neighbouring groups share with each other, then take a few examples from the room. Finish by asking students to use a phrase they found helpful.','Keep the activities that suit your class. Next time, use a different prompt.']
  ]; let tourIndex=0;
  function paintTour(){const t=tour[tourIndex];$('#tour-progress').textContent=`${tourIndex+1} of 5`;$('#tour-title').textContent=t[0];$('#tour-copy').textContent=t[1];$('#tour-example').textContent=t[2];$('#tour-back').disabled=tourIndex===0;$('#tour-next').textContent=tourIndex===4?'Back to the beginning':'Next →';$('#tour-progress').setAttribute('role','status');}
  on('#tour-next','click',()=>{tourIndex=MorningCore.next(tourIndex,1,tour.length);paintTour();});
  on('#tour-back','click',()=>{tourIndex=Math.max(0,tourIndex-1);paintTour();});

  const dataNode=$('#activity-data'); if(!dataNode)return;
  const data=JSON.parse(dataNode.textContent), play=$('#play');
  document.body.dataset.mode=data.mode;
  document.body.dataset.activity=String(data.id);
  let index=0, state, points=0;
  function fresh(){const r=data.rounds[index];state={reveal:false,hint:false,votes:(r.options||[]).map(()=>0),history:[],items:[...(r.items||[])],checked:[],selected:-1,questions:0,words:[],links:[],sentences:[],notes:'',draft:{},strokes:[],ready:false,workOpen:false,voteOpen:false,turn:0};}
  function message(text){$('#play-status').textContent=text;}
  function update(fn,focus){fn();render();if(focus){const el=$('#'+focus);if(el&&!el.disabled)el.focus();}}
  function reveal(label='Add a challenge') {return button('reveal',state.reveal?'Hide extra detail':label,'secondary',`aria-expanded="${state.reveal}" aria-controls="answer"`)+(state.reveal?`<div class="reveal-box" id="answer">${esc(data.rounds[index].answer)}</div>`:'<div id="answer" hidden></div>');}
  const cue=(n,title,body)=>`<article class="cue"><span class="cue-number">${n}</span><h4>${esc(title)}</h4><p>${esc(body)}</p></article>`;
  const note=(key,label,placeholder='')=>`<label class="field" for="draft-${key}">${esc(label)}<textarea id="draft-${key}" data-draft="${key}" maxlength="500" placeholder="${esc(placeholder)}">${esc(state.draft[key]||'')}</textarea></label>`;
  const workshop=(inner,label='Put a group’s ideas on the board')=>`<details class="workshop" ${state.workOpen?'open':''}><summary>${label}</summary><p class="hint">Talk first. These boxes are optional; paper works too.</p>${inner}</details>`;
  const goal=()=>`<p class="task-goal">${esc(data.board.goal)}</p>`;
  const title=r=>`<h3 class="prompt-title">${esc(r.title)}</h3>`;
  function tally(r){const p=MorningCore.percentages(state.votes);return `<div class="poll-rows">${r.options.map((o,i)=>`<div class="poll-row"><span class="option-letter">${String.fromCharCode(65+i)}</span><div><strong>${esc(o)}</strong><div class="bar-track"><div class="bar-fill" style="width:${p[i]}%"></div></div></div><label class="vote-total"><input id="total-${i}" type="number" inputmode="numeric" min="0" max="999" step="1" value="${state.votes[i]}" aria-label="Votes for ${esc(o)}"><small>${p[i]}%</small></label>${button('vote-'+i,'+1','secondary',`aria-label="Add one vote for ${esc(o)}"`)}</div>`).join('')}</div><p class="hint">${state.votes.reduce((a,b)=>a+b,0)} ${state.votes.reduce((a,b)=>a+b,0)===1?'vote':'votes'} · Enter each total, or tap +1 as hands go up.</p><div class="small-actions">${button('undo-vote','Undo last change','secondary',state.history.length?'':'disabled')}${button('clear-votes','Clear votes')}</div>`;}
  function render(){
    const r=data.rounds[index], mode=data.mode;
    $('#round-count').textContent=`Prompt ${index+1} / ${data.rounds.length}`;
    let html=title(r)+goal();
    if(mode==='vote'){
      if(data.id===15){
        html+=`<div class="discussion-strip"><strong>Before voting</strong><span>Which answer will be most popular? Tell a partner why.</span></div>`+tally(r)+`<div class="cue-grid">${cue('01','Read the room','The most popular answer was…')}${cue('02','Notice something','I was surprised that…')}${cue('03','Ask why','Why did you choose…?')}</div>`;
      }else{
        html+=`<div class="choice-grid">${r.options.map((o,i)=>`<button class="choice side-${i}" id="choose-${i}" aria-pressed="${state.selected===i}"><span class="option-letter">${String.fromCharCode(65+i)}</span><strong>${esc(o)}</strong><small>${state.selected===i?'Selected · explain your choice':'Choose this side'}</small></button>`).join('')}</div>`;
        if(data.id===10)html+=`<div class="debate-track"><div><span>1 · YOUR CASE</span><p>We think… because…</p><small>Give a real example.</small></div><div><span>2 · THEIR POINT</span><p>You said that…</p><small>Show you heard the other side.</small></div><div><span>3 · YOUR REPLY</span><p>That may be true, but…</p><small>Reply to their reason.</small></div></div>`+workshop(note('case','Our reason + an example')+note('reply','A point we need to answer'));
        else html+=`<div class="discussion-strip"><strong>${state.selected>=0?'Make your case':'Think for 20 seconds'}</strong><span>${state.selected>=0?'What is one benefit and one problem with your choice?':'Choose for yourself before you hear your partner’s answer.'}</span></div><div class="cue-grid">${cue('01','Explain','I’d choose… because…')}${cue('02','Ask','What would you do if…?')}${cue('03','Reconsider','I would change my mind if…')}</div>`;
        html+=`<details class="vote-details" ${state.voteOpen?'open':''}><summary>Record a class vote (optional)</summary>${tally(r)}</details>`;
      }
    }else if(mode==='rank'){
      html+=`<div class="rank-board"><div><div class="rank-heading"><strong>MOST USEFUL</strong><span>Move with the arrows</span></div><ol class="rank-list">${state.items.map((item,i)=>`<li><b>${i+1}</b><span class="item-name">${esc(item)}</span><button id="up-${i}" class="arrow-button" aria-label="Move ${esc(item)} up" ${i===0?'disabled':''}>↑</button><button id="down-${i}" class="arrow-button" aria-label="Move ${esc(item)} down" ${i===state.items.length-1?'disabled':''}>↓</button></li>`).join('')}</ol><p class="rank-foot">LEAST USEFUL</p>${button('reset-rank','Reset order')}</div><aside class="talk-card"><span class="eyebrow">Before you agree</span><h4>What earns the top spot?</h4><p>“We put <strong>${esc(state.items[0])}</strong> first because…”</p><hr><h4>Which item caused an argument?</h4><p>Explain what changed someone’s mind.</p></aside></div>`;
    }else if(mode==='checklist'){
      html+=`<div class="question-grid">${r.questions.map(([q,f],i)=>`<article class="question-card ${state.checked.includes(i)?'done':''}"><label><input id="check-${i}" type="checkbox" ${state.checked.includes(i)?'checked':''}><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(q)}</strong></label><p>${esc(f)}</p></article>`).join('')}</div><p class="count-display">${state.checked.length} / ${r.items.length} questions tried</p><p class="hint">Keep names on your own paper. On a shared screen, tick a question after the class has tried it.</p>`;
    }else if(['draw','taboo','guess'].includes(mode)){
      html=goal()+`<div class="secret-layout"><div class="secret-card ${state.reveal?'is-revealed':''}">`;
      if(state.reveal){
        if(mode==='draw')html+=`<div class="scene-image scene-${r.scene}" role="img" aria-label="${esc(r.answer)}"></div><details class="picture-description"><summary>Picture description</summary><p>${esc(r.answer)}</p></details>`;
        else html+=`<span class="eyebrow">${mode==='taboo'?'EXPLAIN THIS WORD':'REMEMBER THIS WORD'}</span><h3>${esc(r.title)}</h3>`+(mode==='taboo'?`<p class="banned-label">WITHOUT SAYING</p><ul class="banned-words">${r.items.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<p>Answer only yes or no. Hide the card before the guessers look back.</p>');
      }else html+=`<div class="secret-icon" aria-hidden="true">?</div><h3>${mode==='draw'?'A picture for the describer':'A word for the clue-giver'}</h3><p>${mode==='draw'?'The drawer':'The guessers'} must face away before you show it.</p>`;
      html+=button('secret',state.reveal?'Hide card':'Everyone ready? Show card','primary',`aria-expanded="${state.reveal}"`)+'</div><aside class="talk-card">';
      if(mode==='draw')html+=`<span class="eyebrow">A → B</span><h4>Describe the position.</h4><p>“On the left…”<br>“Above the…”<br>“Between…”</p><hr><h4>Ask for a detail.</h4><p>“How many?”<br>“Next to which object?”</p><p class="hint">Draw on paper. Reveal the picture again to compare. Then swap.</p>`;
      if(mode==='taboo')html+=`<span class="eyebrow">ONE MINUTE</span><h4>Say it another way.</h4><p>“It’s a kind of…”<br>“You use it to…”<br>“You might see it…”</p><p class="count-display">${points} guessed</p><div class="small-actions">${button('got-it','Correct +1','primary')}${button('pass-card','Pass →')}</div>`;
      if(mode==='guess')html+=`<span class="eyebrow">NARROW IT DOWN</span><h4>Is it a living thing?</h4><p>Can you find it indoors?<br>Is it bigger than a bag?</p><div class="question-dots" aria-label="${state.questions} of 10 questions used">${Array.from({length:10},(_,i)=>`<span class="${i<state.questions?'used':''}">${i+1}</span>`).join('')}</div><p><strong>${state.questions===10?'Make your final guess.':`${10-state.questions} questions left`}</strong></p><div class="small-actions">${button('question','Question asked +1','primary',state.questions>=10?'disabled':'')}${button('undo-question','Undo','secondary',!state.questions?'disabled':'')}</div>`;
      html+='</aside></div>';
      if(mode==='draw')html+=`<details class="workshop" ${state.workOpen?'open':''}><summary>Drawing pad for a class example</summary><div class="canvas-wrap"><canvas id="drawing" width="800" height="450" aria-label="Optional drawing pad. Draw on paper as an alternative.">Draw the scene on paper.</canvas><div id="drawing-tools">${button('undo-stroke','Undo stroke')}${button('clear-drawing','Clear drawing')}</div></div></details>`;
    }else if(mode==='truth'){
      html+=`<div class="truth-heading"><span class="eyebrow">${state.ready?'YOUR STATEMENTS':'EXAMPLE STATEMENTS — EDIT BEFORE PLAYING'}</span>${button('truth-ready',state.ready?'Edit statements':'Ready to guess','primary')}</div>`;
      if(!state.ready)html+=state.items.map((t,i)=>field(`truth-${i}`,`Statement ${i+1}`,t)).join('');
      else html+=`<div class="statement-grid">${state.items.map((t,i)=>`<button id="guess-${i}" class="statement-card" aria-pressed="${state.selected===i}"><span>${i+1}</span><strong>${esc(t)}</strong><small>${state.selected===i?'Your guess':'Is this the invented one?'}</small></button>`).join('')}</div><div class="discussion-strip"><strong>${state.selected<0?'Ask before guessing':'Explain your guess'}</strong><span>${state.selected<0?'“When did that happen?” “Who were you with?”':`You chose statement ${state.selected+1}. The speaker can now tell you which one was made up.`}</span></div>`;
    }else if(mode==='odd'){
      html+=`<div class="choice-grid odd-grid">${r.items.map((t,i)=>`<button id="odd-${i}" class="choice" aria-pressed="${state.selected===i}"><span class="option-letter">${String.fromCharCode(65+i)}</span><strong>${esc(t)}</strong><small>${state.selected===i?'Explain your rule':'Choose and explain'}</small></button>`).join('')}</div><div class="discussion-strip"><strong>${state.selected<0?'Name the group':esc(r.items[state.selected])+' is different because…'}</strong><span>“The other three all…” Now try a rule that makes a different word the odd one out.</span></div>`+reveal('Compare possible reasons');
    }else if(mode==='story'){
      html+=`<div class="picture-row">${r.items.map((t,i)=>{const split=t.indexOf(' ');return `<div class="picture-tile"><small>PICTURE ${i+1}</small><span aria-hidden="true">${esc(t.slice(0,split))}</span><strong>${esc(t.slice(split+1))}</strong></div>`;}).join('')}</div><div class="cue-grid">${cue('01','At first…','Who is there? What do they want?')}${cue('02','But then…','Something goes wrong. What happens?')}${cue('03','In the end…','How do they deal with it?')}</div>`+workshop(note('start','Beginning: who and where?')+note('problem','Problem: what goes wrong?')+note('end','Ending: what changes?'));
    }else if(mode==='mystery'){
      html=`<div class="object-layout"><div class="object-image object-${r.object}" role="img" aria-label="${esc(r.title)}"></div><div><span class="eyebrow">LOOK CLOSELY</span>${title(r)}${goal()}${reveal('Give us a situation')}</div></div><div class="cue-grid">${cue('01','Notice','What can it hold, stretch, support or move?')}${cue('02','Invent','Could we use it to…?')}${cue('03','Test the idea','What might go wrong? How would you fix that?')}</div>`+workshop(note('name','Give it a name')+note('use','It helps someone to…')+note('works','It works by…'));
    }else if(mode==='pitch'){
      const object=r.title.replace('Sell this: ','').replace(/^(a|an) /i,'');
      html=`<div class="advert-brief"><span class="eyebrow">YOUR 30-SECOND ADVERT</span>${title(r)}<p class="customer"><strong>The customer</strong> ${esc(r.answer)}</p></div>${goal()}<div class="cue-grid">${cue('01','Name it','Meet the…')}${cue('02','Sell the benefit','It helps you… and…')}${cue('03','Close the deal','You need this because…')}</div><div class="discussion-strip"><strong>Audience question</strong><span>“Why is your ${esc(object)} better than an ordinary one?”</span></div>`+workshop(note('name','Product name')+note('benefits','Two reasons to buy it')+note('line','Final line'));
    }else if(mode==='expert'){
      html+=`<div class="cue-grid">${r.items.map((t,i)=>`<article class="cue keyword-cue"><span class="cue-number">${i+1}</span><h4>${esc(t)}</h4><label class="field" for="draft-key${i}">One keyword<input id="draft-key${i}" data-draft="key${i}" maxlength="40" value="${esc(state.draft['key'+i]||'')}" placeholder="A reminder, not a script"></label></article>`).join('')}</div><div class="speaking-turn"><span class="turn-badge">${state.turn===0?'A':'B'}</span><div><strong>${state.turn===0?'A speaks · B listens':'B speaks · A listens'}</strong><p>Listen for one detail you can ask about.</p></div>${button('swap-turn','Swap speaker','primary')}</div>`;
    }else if(mode==='improve'){
      html=`<div class="before-card"><span class="eyebrow">THE CURRENT PLAN</span>${title(r)}</div>${goal()}<div class="cue-grid">${cue('01','Who has a problem?','Name the people this affects.')}${cue('02','What would help?','Agree on three realistic changes.')}${cue('03','Why is it better?','Explain the benefit of each change.')}</div>`+workshop(note('fix1','Change 1 + why it helps')+note('fix2','Change 2 + why it helps')+note('fix3','Change 3 + why it helps'),'Build a better version')+reveal('Test your plan with a new condition');
    }else if(mode==='chain'){
      html=`<div class="story-opening"><span class="eyebrow">THE FIRST LINE</span>${title(r)}</div>${goal()}<div class="story-trail"><p class="trail-empty">${state.sentences.length?`${state.sentences.length} ${state.sentences.length===1?'sentence':'sentences'} added · Next person, pick up the story.`:'What happened next? Add a sentence that follows from this one.'}</p><ol class="story-log">${state.sentences.map((t,i)=>`<li><span>${i+1}</span><p>${esc(t)}</p></li>`).join('')}</ol></div><form id="entry-form" class="entry-row">${field('entry','Next sentence')}${button('add-entry','Add to the story','primary')}</form><div class="small-actions">${button('undo-entry','Undo last sentence','secondary',state.sentences.length?'':'disabled')}${reveal('Add a problem')}</div>`;
    }else if(mode==='chat'){
      html=`<div class="conversation-card"><span class="eyebrow">TALK TO YOUR PARTNER</span>${title(r)}</div>${goal()}<div class="speaking-turn"><span class="turn-badge">${state.turn===0?'A':'B'}</span><div><strong>${state.turn===0?'A answers · B asks more':'B answers · A asks more'}</strong><p>One minute each. Use the 1-minute timer below.</p></div>${button('swap-turn','Swap roles','primary')}</div><div class="followup-card"><span class="eyebrow">KEEP IT GOING</span><p>${esc(r.answer)}</p><small>Or ask: “Can you give me an example?”</small></div>`+workshop(note('heard','One thing you learned about your partner'),'Something to share back');
    }else if(mode==='category'){
      html+=`<div class="sprint-score"><strong>${state.words.length}</strong><span>different entries<br><small>One minute. Start the timer below.</small></span></div><form id="entry-form" class="entry-row">${field('entry','Add a word or phrase')}${button('add-entry','Add word','primary')}</form><ul class="word-chips word-list">${state.words.map((t,i)=>`<li><span>${i+1}</span>${esc(t)}</li>`).join('')}</ul>${state.words.length?'':'<p class="empty-state">Your team’s words will appear here. Take turns suggesting one.</p>'}<div class="small-actions">${button('undo-entry','Undo last entry','secondary',state.words.length?'':'disabled')}${reveal('Round two: use the words')}</div>`;
    }else if(mode==='detective'){
      html=`<span class="eyebrow">THE SENTENCE UNDER INVESTIGATION</span><div class="sentence-tokens">${r.title.split(' ').map((t,i)=>`<button id="token-${i}" aria-pressed="${state.selected===i}" aria-label="Investigate ${esc(t)}">${esc(t)}</button>`).join('')}</div>${goal()}<p class="investigation-note">${state.selected<0?'Select a word you think needs changing.':`You’re investigating “${esc(r.title.split(' ')[state.selected])}”. What is the clue?`}</p><div class="correction-grid">${note('correction','Your corrected sentence')}${note('reason','Why did you change it?')}</div><div class="small-actions">${button('hint','Need a clue?','secondary',`aria-expanded="${state.hint}"`)}${reveal('Check a suggested answer')}</div>${state.hint?`<p class="reveal-box">${esc(r.hint)}</p>`:''}`;
    }else if(mode==='connect'){
      html=`<div class="connection-brief"><div><span class="eyebrow">START HERE</span>${title(r)}</div><div class="connection-target"><span class="eyebrow">TRY TO REACH</span><strong>${esc(r.answer.replace('Target: ',''))}</strong></div></div>${goal()}<ol class="connection-log"><li><strong>${esc(r.title)}</strong><small>Starting word</small></li>${state.links.map(l=>`<li><strong>${esc(l.word)}</strong><small>${esc(l.reason)}</small></li>`).join('')}</ol><p class="hint">${state.links.length?'Next link must connect to '+esc(state.links.at(-1).word)+'.':'Example: rain → umbrella, because an umbrella keeps rain off you.'}</p><form id="entry-form" class="connection-form">${field('entry','Next word')}${field('reason','How does it connect to the last word?')}${button('add-entry','Add link','primary')}</form>${button('undo-entry','Undo last link','secondary',state.links.length?'':'disabled')}`;
    }
    play.innerHTML=html;bind(mode,r);
  }
  function changeRound(delta){index=MorningCore.next(index,delta,data.rounds.length);fresh();render();message(`Prompt ${index+1} ready. Answers cleared. The timer hasn’t changed.`);}
  function bind(mode,r){
    on('#reveal','click',()=>update(()=>state.reveal=!state.reveal,'reveal'));
    on('#hint','click',()=>update(()=>state.hint=!state.hint,'hint'));
    on('#secret','click',()=>update(()=>state.reveal=!state.reveal,'secret'));
    on('#swap-turn','click',()=>{update(()=>state.turn=1-state.turn,'swap-turn');message('Roles swapped. Reset the 1-minute timer for the next speaker.');});
    $$('[data-draft]').forEach(el=>el.addEventListener('input',()=>state.draft[el.dataset.draft]=el.value));
    $$('.workshop,.vote-details').forEach(el=>el.addEventListener('toggle',()=>{if(el.isConnected)state[el.classList.contains('vote-details')?'voteOpen':'workOpen']=el.open;}));
    $$('#play input[id^="check-"]').forEach(el=>el.addEventListener('change',()=>{const i=Number(el.id.split('-')[1]);update(()=>{state.checked=el.checked?[...state.checked,i]:state.checked.filter(x=>x!==i);},el.id);}));
    if(mode==='vote'){
      r.options.forEach((o,i)=>{
        on('#choose-'+i,'click',()=>update(()=>state.selected=i,'choose-'+i));
        on('#total-'+i,'change',e=>{const value=Number(e.target.value);if(!Number.isInteger(value)||value<0||value>999){message('Use a whole number from 0 to 999.');e.target.value=state.votes[i];return;}update(()=>{state.history.push({i,before:state.votes[i]});state.votes[i]=value;},'total-'+i);message(`${o}: ${value} ${value===1?'vote':'votes'}.`);});
        on('#vote-'+i,'click',()=>{update(()=>{state.history.push({i,before:state.votes[i]});state.votes[i]++;},'vote-'+i);message(`${o}: ${state.votes[i]} ${state.votes[i]===1?'vote':'votes'}.`);});
      });
      on('#undo-vote','click',()=>{update(()=>{const last=state.history.pop();if(last)state.votes[last.i]=last.before;},'undo-vote');message('Last vote change undone.');});
      on('#clear-votes','click',()=>{update(()=>{state.votes.fill(0);state.history=[];},'clear-votes');message('Vote totals cleared.');});
    }
    if(mode==='rank'){
      state.items.forEach((name,i)=>[-1,1].forEach(d=>{const id=(d<0?'up-':'down-')+i;on('#'+id,'click',()=>{update(()=>state.items=MorningCore.move(state.items,i,d));const target=(d<0?'down-':'up-')+(i+d);$('#'+target)?.focus();message(`${name} is now number ${i+d+1}.`);});}));
      on('#reset-rank','click',()=>update(()=>state.items=[...r.items],'reset-rank'));
    }
    if(mode==='truth'){
      on('#truth-ready','click',()=>{if(!state.ready&&state.items.some(t=>!t.trim())){message('Write all three statements before guessing.');$('#truth-'+state.items.findIndex(t=>!t.trim())).focus();return;}update(()=>state.ready=!state.ready,'truth-ready');});
      state.items.forEach((t,i)=>{on('#truth-'+i,'input',e=>state.items[i]=e.target.value);on('#guess-'+i,'click',()=>{update(()=>state.selected=i,'guess-'+i);message(`Statement ${i+1} selected. Ask the speaker which statement they made up.`);});});
    }
    if(mode==='odd')r.items.forEach((t,i)=>on('#odd-'+i,'click',()=>{update(()=>state.selected=i,'odd-'+i);message(`${t} selected. Explain why it doesn’t belong.`);}));
    if(mode==='detective')r.title.split(' ').forEach((t,i)=>on('#token-'+i,'click',()=>update(()=>state.selected=i,'token-'+i)));
    on('#got-it','click',()=>{points++;changeRound(1);message(`${points} words guessed. The next card is hidden.`);$('#got-it')?.focus();});
    on('#pass-card','click',()=>{changeRound(1);$('#pass-card')?.focus();});
    on('#question','click',()=>{update(()=>state.questions=Math.min(10,state.questions+1),'question');message(state.questions===10?'Ten questions used. Make your final guess.':`${state.questions} questions asked.`);});
    on('#undo-question','click',()=>update(()=>state.questions=Math.max(0,state.questions-1),'question'));
    on('#entry-form','submit',e=>{e.preventDefault();addEntry(mode);});
    on('#undo-entry','click',()=>{update(()=>{if(mode==='chain')state.sentences.pop();else if(mode==='category')state.words.pop();else state.links.pop();},'entry');message('Last entry removed.');});
    if(mode==='draw')initDrawing();
  }
  function addEntry(mode){
    const word=$('#entry').value.trim(),reason=$('#reason')?.value.trim();
    if(!word){message('Add a word or sentence first.');$('#entry').focus();return;}
    if(mode==='connect'&&!reason){message('Explain why your word connects.');$('#reason').focus();return;}
    if(mode==='category'&&!MorningCore.uniqueWord(state.words,word)){message('That entry is already in the list. Try another.');return;}
    update(()=>{if(mode==='chain')state.sentences.push(word);else if(mode==='category')state.words.push(word);else state.links.push({word,reason});},'entry');message('Added. Next person’s turn.');
  }
  function initDrawing(){
    const canvas=$('#drawing'),ctx=canvas.getContext('2d'); if(!ctx)return;
    ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#263d49';
    const stroke=points=>{if(!points.length)return;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);if(points.length===1)ctx.lineTo(points[0].x+.1,points[0].y+.1);else points.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();};
    const repaint=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);state.strokes.forEach(stroke);};repaint();
    let current=null,activePointer=null;
    const point=e=>{const b=canvas.getBoundingClientRect();return{x:MorningCore.clamp((e.clientX-b.left)*800/b.width,0,800),y:MorningCore.clamp((e.clientY-b.top)*450/b.height,0,450)};};
    canvas.addEventListener('pointerdown',e=>{if(activePointer!==null)return;activePointer=e.pointerId;canvas.setPointerCapture(e.pointerId);current=[point(e)];state.strokes.push(current);repaint();});
    canvas.addEventListener('pointermove',e=>{if(current&&e.pointerId===activePointer){current.push(point(e));repaint();}});
    const stop=e=>{if(e.pointerId===activePointer){current=null;activePointer=null;}};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
    on('#undo-stroke','click',()=>{state.strokes.pop();repaint();});on('#clear-drawing','click',()=>{state.strokes=[];repaint();message('Drawing cleared.');});
  }
  on('#next-round','click',()=>changeRound(1));on('#previous-round','click',()=>changeRound(-1));
  on('#present','click',()=>{const active=document.body.classList.toggle('presentation');$('#present').setAttribute('aria-pressed',String(active));$('#present').textContent=active?'Exit focus view':'Focus view';});
  fresh();render();
})();
