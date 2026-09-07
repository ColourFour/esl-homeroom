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
    ['Put up the prompt','“Put it on the board” hides the teacher instructions and enlarges the task. The useful phrases stay visible. Use “Back to teacher notes” to return.','For a secret card, turn the guesser or drawer away before revealing it. Hide it before they look back.'],
    ['Give them time to talk','Start the 20-minute timer, or use one minute for a short turn. Move to the next prompt when the discussion runs out. Changing a prompt clears its answers.','The timings are a guide. If they are still having a useful conversation, let them finish.'],
    ['Hear a few answers','Let neighbouring groups share with each other, then take a few examples from the room. Finish by asking students to use a phrase they found helpful.','Keep the activities that suit your class. Next time, use a different prompt.']
  ]; let tourIndex=0;
  function paintTour(){const t=tour[tourIndex];$('#tour-progress').textContent=`${tourIndex+1} of 5`;$('#tour-title').textContent=t[0];$('#tour-copy').textContent=t[1];$('#tour-example').textContent=t[2];$('#tour-back').disabled=tourIndex===0;$('#tour-next').textContent=tourIndex===4?'Back to the beginning':'Next →';$('#tour-progress').setAttribute('role','status');}
  on('#tour-next','click',()=>{tourIndex=MorningCore.next(tourIndex,1,tour.length);paintTour();});
  on('#tour-back','click',()=>{tourIndex=Math.max(0,tourIndex-1);paintTour();});

  const dataNode=$('#activity-data'); if(!dataNode)return;
  const data=JSON.parse(dataNode.textContent), play=$('#play');
  let index=0, state, points=0;
  function fresh(){const r=data.rounds[index];state={reveal:false,votes:(r.options||[]).map(()=>0),history:[],items:[...(r.items||[])],checked:[],selected:-1,questions:0,words:[],links:[],sentences:[],notes:'',strokes:[]};}
  function message(text){$('#play-status').textContent=text;}
  function update(fn,focus){fn();render();if(focus){const el=$('#'+focus);if(el&&!el.disabled)el.focus();}}
  function reveal(label='Show an extra condition') {return button('reveal',state.reveal?'Hide':label,'secondary',`aria-expanded="${state.reveal}" aria-controls="answer"`)+(state.reveal?`<div class="reveal-box" id="answer">${esc(data.rounds[index].answer)}</div>`:'<div id="answer" hidden></div>');}
  function render(){
    const r=data.rounds[index], mode=data.mode;
    $('#round-count').textContent=`Prompt ${index+1} / ${data.rounds.length}`;
    let html=`<h3 class="prompt-title">${esc(r.title)}</h3>`;
    if(mode==='vote'){
      html+='<p class="hint">Choose an answer and explain why. To record a show of hands, tap the answer once for each vote.</p><div class="choice-grid">'+r.options.map((o,i)=>`<button class="choice" id="vote-${i}" aria-label="Add one vote for ${esc(o)}"><strong>${esc(o)}</strong><span class="choice-count">${state.votes[i]}</span><small>+ Add a vote</small></button>`).join('')+'</div><div class="small-actions">'+button('undo-vote','Undo last vote','secondary',state.history.length?'':'disabled')+button('results',state.reveal?'Hide results':'Show results','secondary',`aria-expanded="${state.reveal}"`)+button('clear-votes','Clear votes')+'</div>';
      if(state.reveal){const p=MorningCore.percentages(state.votes);html+='<div class="reveal-box">'+r.options.map((o,i)=>`<div class="bar-row"><div class="bar-caption"><span>${esc(o)}</span><strong>${state.votes[i]} votes · ${p[i]}%</strong></div><div class="bar-track"><div class="bar-fill" style="width:${p[i]}%"></div></div></div>`).join('')+`<p>${state.votes.reduce((a,b)=>a+b,0)} votes in total. Which reason was most convincing?</p></div>`;}
    } else if(mode==='rank'){
      html+='<p class="hint">Put the items in order and agree on one list. Use the arrows to move them. Be ready to explain your first and last choices.</p><ol class="rank-list">'+state.items.map((item,i)=>`<li><b>${i+1}</b><span class="item-name">${esc(item)}</span><button id="up-${i}" class="arrow-button" aria-label="Move ${esc(item)} up" ${i===0?'disabled':''}>↑</button><button id="down-${i}" class="arrow-button" aria-label="Move ${esc(item)} down" ${i===state.items.length-1?'disabled':''}>↓</button></li>`).join('')+'</ol>'+button('reset-rank','Reset order');
    } else if(mode==='checklist'){
      html+='<p class="hint">Ask a classmate, listen to the answer, then ask one more question. Tick the prompts you have tried and note names on paper.</p>'+state.items.map((t,i)=>`<label class="check-row"><input id="check-${i}" type="checkbox" ${state.checked.includes(i)?'checked':''}>${esc(t)}</label>`).join('')+`<p class="count-display">${state.checked.length} / ${state.items.length} prompts tried</p>`;
    } else if(['draw','taboo','guess'].includes(mode)){
      html='<p class="hint"><strong>Before showing the card:</strong> ask the guesser or drawer to face away. Hide it before they turn back.</p><div class="secret-card"><div class="secret-icon" aria-hidden="true">'+(state.reveal?'':'?')+'</div>';
      if(state.reveal)html+=`<h3>${esc(r.title)}</h3>`+(mode==='taboo'?`<p>Do not say:</p><ul>${r.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:mode==='draw'?`<p>${esc(r.answer)}</p>`:'<p>Remember the word. Answer only yes or no.</p>');
      else html+='<h3>The card is hidden</h3><p>Only the person giving clues should see it.</p>';
      html+=button('secret',state.reveal?'Hide card':'Show card','lime',`aria-expanded="${state.reveal}"`)+'</div>';
      if(mode==='taboo')html+=`<p class="hint">Explain the word without using any of the words on the card. Keep guessers facing away while it is visible. Use one minute for each turn.</p><div class="small-actions">${button('got-it','Correct guess +1','primary')}${button('pass-card','Pass →')}</div><p class="count-display">${points} words guessed</p>`;
      if(mode==='guess')html+=`<p class="hint">You have ten yes/no questions, then a final guess. Turn away again if the group needs to check the word.</p><p class="count-display">${state.questions} / 10 questions</p><div class="small-actions">${button('question','Question asked +1','primary',state.questions>=10?'disabled':'')}${button('undo-question','Undo','secondary',!state.questions?'disabled':'')}</div>`;
      if(mode==='draw')html+='<p class="hint">Describe the objects and where they go. Your partner draws on paper and can ask questions. Use the pad below for a class example.</p><div class="canvas-wrap"><canvas id="drawing" width="800" height="450" aria-label="Optional drawing pad. You can also draw on paper.">Draw the scene on paper.</canvas><div id="drawing-tools">'+button('undo-stroke','Undo stroke')+button('clear-drawing','Clear drawing')+'</div></div>';
    } else if(mode==='truth'){
      html+='<p class="hint">Replace these examples with two true statements and one made-up statement. Ask the speaker a question before choosing your guess.</p>';
      html+=state.items.map((t,i)=>field(`truth-${i}`,`Statement ${i+1}`,t)).join('');
      html+='<div class="small-actions">'+state.items.map((t,i)=>button(`guess-${i}`,`Guess ${i+1}`,'secondary',`aria-pressed="${state.selected===i}"`)).join('')+'</div>';
      if(state.selected>=0)html+=`<div class="reveal-box">Your guess: statement ${state.selected+1}. Explain why, then ask the speaker which one they made up.</div>`;
    } else if(mode==='odd'){
      html+='<p class="hint">Which word doesn’t belong? Choose one and explain your reason. Can you find a different answer too?</p><div class="choice-grid">'+r.items.map((t,i)=>`<button id="odd-${i}" class="choice" aria-pressed="${state.selected===i}"><strong>${esc(t)}</strong><small>${state.selected===i?'Your choice. Why?':'Choose and explain'}</small></button>`).join('')+'</div>'+reveal('Show possible reasons');
    } else if(mode==='story'){
      html+='<p class="hint">Make a one-minute story using all three pictures. Everyone needs a line.</p><div class="picture-row">'+r.items.map(t=>{const split=t.indexOf(' ');return `<div class="picture-tile"><span aria-hidden="true">${esc(t.slice(0,split))}</span>${esc(t.slice(split+1))}</div>`;}).join('')+'</div>'+field('notes','Notes: beginning, problem, ending (optional)',state.notes,true);
    } else if(mode==='mystery'||mode==='pitch'){
      html+='<p class="hint">'+(mode==='mystery'?'Find a new use for this object. Give it a name and explain how it works.':'Give it a name and two reasons to buy it. Make a 30-second advert with a line for everyone.')+'</p>'+reveal(mode==='mystery'?'Give us a situation':'Give us a customer')+field('notes',mode==='pitch'?'Our product name and two selling points':'Our invention and what it does',state.notes,true);
    } else if(mode==='expert'){
      html+='<p class="hint">Write three words to help you remember your ideas. Talk for 30 seconds to a minute, then let your partner ask a question.</p>'+r.items.map((t,i)=>`<label class="check-row"><input id="check-${i}" type="checkbox" ${state.checked.includes(i)?'checked':''}>${esc(t)}</label>`).join('')+field('notes','My three keywords',state.notes);
    } else if(mode==='improve'){
      html+='<p class="hint">What would you change? Agree on three improvements and explain why they would help.</p>'+field('notes','Our three improvements',state.notes,true)+reveal('Add a challenge');
    } else if(mode==='chain'){
      html+='<p class="hint">Add one sentence each. It needs to follow from the last person’s idea. Tell the story aloud, or write a shared version here.</p><ol class="story-log">'+state.sentences.map(t=>`<li>${esc(t)}</li>`).join('')+'</ol><form id="entry-form">'+field('entry','Our next sentence')+button('add-entry','Add to the story','primary')+'</form><div class="small-actions">'+button('undo-entry','Undo last sentence','secondary',state.sentences.length?'':'disabled')+'</div>'+reveal('Add a problem');
    } else if(mode==='chat'){
      html+='<p class="hint">One person answers, the other asks another question. Swap after a minute.</p>'+reveal('Show another question')+field('notes','One interesting idea we heard (optional)',state.notes,true);
    } else if(mode==='category'){
      html+='<p class="hint">You have one minute to list words in this category. Write on paper or add words here. Afterwards, explain a few of your choices.</p><form id="entry-form">'+field('entry','Add a word or phrase')+button('add-entry','Add word','primary')+`</form><p class="count-display">${state.words.length} different entries</p><ul class="word-chips word-list">`+state.words.map(t=>`<li>${esc(t)}</li>`).join('')+'</ul><div class="small-actions">'+button('undo-entry','Undo last entry','secondary',state.words.length?'':'disabled')+'</div>'+reveal('What next?');
    } else if(mode==='detective'){
      html+='<p class="hint">What needs changing? Write a better version of the sentence and explain what you changed.</p>'+field('notes','Our corrected sentence and reason',state.notes,true)+reveal('Check a suggested answer');
    } else if(mode==='connect'){
      html+='<p class="hint">Add a word connected to the last one and explain why. Help each other if someone gets stuck.</p><ol class="connection-log"><li><strong>'+esc(r.title)+'</strong> — your starting word</li>'+state.links.map(l=>`<li><strong>${esc(l.word)}</strong> — ${esc(l.reason)}</li>`).join('')+'</ol><form id="entry-form">'+field('entry','Next word')+field('reason','Why does it connect?')+button('add-entry','Add a connection','primary')+'</form><div class="small-actions">'+button('undo-entry','Undo last link','secondary',state.links.length?'':'disabled')+'</div>'+reveal('Give us a word to reach');
    }
    play.innerHTML=html;
    bind(mode,r);
  }
  function changeRound(delta){index=MorningCore.next(index,delta,data.rounds.length);fresh();render();message(`Prompt ${index+1} ready. Answers cleared. The timer hasn’t changed.`);}
  function bind(mode,r){
    on('#reveal','click',()=>update(()=>state.reveal=!state.reveal,'reveal'));
    on('#secret','click',()=>update(()=>state.reveal=!state.reveal,'secret'));
    on('#notes','input',e=>state.notes=e.target.value);
    $$('#play input[id^="check-"]').forEach(el=>el.addEventListener('change',()=>{const i=Number(el.id.split('-')[1]);update(()=>{state.checked=el.checked?[...state.checked,i]:state.checked.filter(x=>x!==i);},el.id);}));
    if(mode==='vote'){
      r.options.forEach((o,i)=>on('#vote-'+i,'click',()=>{update(()=>{state.votes[i]++;state.history.push(i);},'vote-'+i);message(`${o}: ${state.votes[i]} votes.`);}));
      on('#undo-vote','click',()=>{update(()=>{const i=state.history.pop();if(i!==undefined)state.votes[i]--;},'undo-vote');message('Last vote removed.');});
      on('#clear-votes','click',()=>{update(()=>{state.votes.fill(0);state.history=[];},'clear-votes');message('Vote totals cleared.');});
      on('#results','click',()=>update(()=>state.reveal=!state.reveal,'results'));
    }
    if(mode==='rank'){
      state.items.forEach((name,i)=>[-1,1].forEach(d=>{const id=(d<0?'up-':'down-')+i;on('#'+id,'click',()=>{update(()=>state.items=MorningCore.move(state.items,i,d));const target=(d<0?'down-':'up-')+(i+d);$('#'+target)?.focus();message(`${name} is now number ${i+d+1}.`);});}));
      on('#reset-rank','click',()=>update(()=>state.items=[...r.items],'reset-rank'));
    }
    if(mode==='truth')state.items.forEach((t,i)=>{on('#truth-'+i,'input',e=>state.items[i]=e.target.value);on('#guess-'+i,'click',()=>{update(()=>state.selected=i,'guess-'+i);message(`Statement ${i+1} selected. Ask the speaker which statement they made up.`);});});
    if(mode==='odd')r.items.forEach((t,i)=>on('#odd-'+i,'click',()=>{update(()=>state.selected=i,'odd-'+i);message(`${t} selected. Explain why it doesn’t belong.`);}));
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
  on('#present','click',()=>{const active=document.body.classList.toggle('presentation');$('#present').setAttribute('aria-pressed',String(active));$('#present').textContent=active?'Back to teacher notes':'Put it on the board';});
  fresh();render();
})();
