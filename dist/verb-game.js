'use strict';
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const canonical = value => String(value ?? '').normalize('NFC').toLocaleLowerCase('fr').replace(/[’‘]/g, "'").replace(/[\u00a0\u202f]/g, ' ').trim().replace(/^[.,!?:;\s]+|[.,!?:;\s]+$/gu, '').replace(/\s+/g, ' ');
  const unaccented = value => canonical(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const shuffle = list => { const result = [...list]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; };
  const distinct = list => [...new Set(list)];
  const tenseNames = ['Indicatif — présent','Indicatif — imparfait','Indicatif — futur simple','Indicatif — passé composé'];
  const tenseCopy = {
    'Indicatif — présent': {fr:'Présent', es:'Lo que pasa ahora', cue:'aujourd’hui', tint:'present'},
    'Indicatif — imparfait': {fr:'Imparfait', es:'Hábitos y escenas del pasado', cue:'autrefois', tint:'past'},
    'Indicatif — futur simple': {fr:'Futur simple', es:'Lo que pasará después', cue:'demain', tint:'future'},
    'Indicatif — passé composé': {fr:'Passé composé', es:'Una acción terminada', cue:'hier', tint:'complete'}
  };
  const common = new Set(['être','avoir','aller','faire','dire','pouvoir','vouloir','savoir','voir','venir','prendre','mettre','parler','aimer','manger','finir','partir','sortir','lire','écrire','comprendre','devoir','s\'amuser','se souvenir']);
  const subjects = ['je','tu','il','elle','on','nous','vous','ils','elles'];
  const callbacks = {render() {}, play() {}, toast() {}, onResult() {}, back() {}};
  const state = {verb:'common', tense:tenseNames[0], round:null, loading:false, loadError:false, active:false, generation:0};
  let loadingPromise = null;
  let runCounter = 0;
  const button = (action, text, extra = '', klass = 'vg-button') => `<button type="button" class="${klass}" data-verb-game-action="${action}" ${extra}>${text}</button>`;
  const arrow = '<span aria-hidden="true">→</span>';

  function library() { return Array.isArray(window.ATELIER_VERBS) ? window.ATELIER_VERBS : []; }
  function refresh(focus) {
    callbacks.render();
    if (focus && typeof document !== 'undefined') document.getElementById(focus)?.focus({preventScroll:true});
  }
  function top() { if (typeof window.scrollTo === 'function') window.scrollTo(0,0); }
  function splitSubject(form) {
    const full = canonical(form);
    const match = full.match(/^(j'|je |tu |il |elle |on |nous |vous |ils |elles )(.+)$/u);
    if (!match) return null;
    return {subject:match[1] === "j'" ? 'je' : match[1].trim(), body:match[2], full:String(form).trim()};
  }
  // Each question names one subject. We retain every compatible form from the source
  // table, including agreement variants and reflexive pronouns; no forms are invented.
  function questionsFor(verb, tense) {
    if (!verb?.verbe || !tenseNames.includes(tense)) return [];
    const forms = verb.formes?.[tense];
    if (!Array.isArray(forms)) return [];
    const grouped = new Map();
    for (const slot of forms) for (const form of Array.isArray(slot) ? slot : []) {
      if (typeof form !== 'string' || !form.trim() || /[()[\]{}\/]/u.test(form)) continue;
      const parsed = splitSubject(form);
      if (!parsed || !subjects.includes(parsed.subject)) continue;
      if (!grouped.has(parsed.subject)) grouped.set(parsed.subject, []);
      grouped.get(parsed.subject).push(parsed);
    }
    return [...grouped.entries()].map(([subject, variants]) => ({
      id:`verb|${verb.verbe}|${tense}|${subject}`, verb:verb.verbe, es:verb.es || '', level:verb.nivel || verb.niveau || '', tense, subject,
      full:distinct(variants.map(item => item.full)), bodies:distinct(variants.map(item => item.body)), source:verb.source || [],
      accepted:distinct(variants.flatMap(item => [canonical(item.full), canonical(item.body)]))
    }));
  }
  function pool() {
    const tenses = state.tense === 'mixed' ? tenseNames : [state.tense];
    const verbs = library().filter(verb => state.verb === 'all' || (state.verb === 'common' ? common.has(verb.verbe) : verb.verbe === state.verb));
    return verbs.flatMap(verb => tenses.flatMap(tense => questionsFor(verb, tense)));
  }
  async function ensureLibrary() {
    if (library().length) return true;
    if (loadingPromise) return loadingPromise;
    state.loading = true; state.loadError = false;
    loadingPromise = new Promise(resolve => {
      if (typeof document === 'undefined') { state.loading = false; state.loadError = true; resolve(false); return; }
      const script = document.createElement('script'); script.src = 'data/verbs.js'; script.async = true;
      script.onload = () => { state.loading = false; state.loadError = !library().length; loadingPromise = null; if(state.active)refresh(); resolve(!state.loadError); };
      script.onerror = () => { state.loading = false; state.loadError = true; loadingPromise = null; script.remove(); if(state.active)refresh(); resolve(false); };
      document.head.appendChild(script);
    });
    return loadingPromise;
  }
  function newRound(questions, review = false) {
    if (!questions.length) { callbacks.toast('No hay formas disponibles con esta selección. Prueba otro verbo.'); return; }
    state.round = {runId:`verb-train-${Date.now().toString(36)}-${++runCounter}-${Math.random().toString(36).slice(2,8)}`, questions, index:0, answer:'', results:[], wrong:false, helped:false, tip:false, model:false, answered:false, feedback:'', feedbackKind:'', done:false, emitted:false, review};
    refresh('vg-answer'); top();
  }
  async function start(verbeOptional) {
    state.active = true; state.generation++; state.round = null;
    if (verbeOptional) {
      const name = typeof verbeOptional === 'string' ? verbeOptional : verbeOptional.verbe;
      if (name) state.verb = name;
    }
    const generation=state.generation;
    if (!(await ensureLibrary()) || !state.active || state.generation!==generation) return;
    if (state.verb !== 'common' && state.verb !== 'all' && !library().some(verb => verb.verbe === state.verb)) state.verb = 'common';
    refresh();
  }
  async function begin() {
    const generation=state.generation;
    if (!(await ensureLibrary()) || !state.active || state.generation!==generation) return;
    newRound(shuffle(pool()).slice(0,8));
  }
  function activeQuestion() { return state.round?.questions[state.round.index]; }
  function check() {
    const round = state.round, question = activeQuestion();
    if (!round || round.done || round.answered || !question) return;
    const entered = canonical(round.answer);
    if (!entered) { round.feedback = 'Escribe una forma antes de comprobar.'; round.feedbackKind = 'notice'; refresh('vg-answer'); return; }
    if (question.accepted.includes(entered)) {
      round.answered = true;
      const clean = !round.wrong && !round.helped;
      round.results.push({id:question.id, clean, missed:round.wrong, assisted:round.helped, skipped:false});
      round.feedbackKind = 'correct';
      round.feedback = clean ? '¡En marcha! Lo has recordado a la primera.' : '¡Ahora sí! Volverá a aparecer en tu repaso.';
      refresh('vg-next');
    } else {
      round.wrong = true; round.feedbackKind = 'wrong';
      round.feedback = question.accepted.some(value => unaccented(value) === unaccented(entered)) ? 'Casi. Revisa los acentos: también forman parte de la conjugación.' : 'Todavía no. Revisa el sujeto y el tiempo; puedes volver a intentarlo.';
      refresh('vg-answer');
    }
  }
  function hint() {
    const round = state.round;
    if (!round || round.done || round.answered) return;
    round.helped = true; round.model = true; round.feedbackKind = 'notice'; round.feedback = 'Modelo abierto. Escríbelo y después recupéralo en el repaso.';
    refresh('vg-answer');
  }
  function tip() {
    const round = state.round;
    if (!round || round.done || round.answered) return;
    round.helped = true; round.tip = true; round.feedbackKind = 'notice';
    round.feedback = 'Truco abierto. Aplícalo y recupera esta forma sin ayuda en el repaso.';
    refresh('vg-answer');
  }
  function contextualTip(question) {
    const html = window.ATELIER_VERB_TIPS?.renderHint?.(question.verb, question.tense, {subject:question.subject, compact:true});
    return `<div class="vg-tip" role="note" aria-label="Truco de conjugación">${html || '<p>Fíjate en el sujeto y el tiempo. Recuerda una forma conocida de este verbo y busca su familia. Si necesitas la forma completa, abre «Ver modelo».</p>'}</div>`;
  }
  function skip() {
    const round = state.round;
    if (!round || round.done || round.answered) return;
    round.answered = true; round.feedbackKind = 'notice'; round.feedback = 'Guardamos esta forma para repasarla. Mira el modelo y continúa.';
    round.results.push({id:activeQuestion().id, clean:false, missed:true, assisted:round.helped, skipped:true});
    refresh('vg-next');
  }
  function finish() {
    const round = state.round;
    if (!round || round.emitted) return;
    round.done = true; round.emitted = true;
    callbacks.onResult({runId:round.runId, type:'verb-train', ids:round.questions.map(question => question.id), correct:round.results.filter(result => result.clean).length, total:round.questions.length, missed:round.results.filter(result => result.missed || result.skipped).map(result => result.id), assisted:round.results.filter(result => result.assisted).map(result => result.id)});
  }
  function next() {
    const round = state.round;
    if (!round || !round.answered || round.done) return;
    if (round.index + 1 === round.questions.length) { finish(); refresh('vg-result-title'); top(); return; }
    round.index++; round.answer=''; round.wrong=false; round.helped=false; round.tip=false; round.model=false; round.answered=false; round.feedback=''; round.feedbackKind=''; refresh('vg-answer');
  }
  function retry() {
    const round = state.round;
    if (!round?.done) return;
    const pending = new Set(round.results.filter(result => !result.clean).map(result => result.id));
    newRound(shuffle(round.questions.filter(question => pending.has(question.id))), true);
  }
  function engineSVG() {
    return '<svg class="vg-engine" viewBox="0 0 180 120" role="img" aria-label="Locomotora verde"><path d="M6 102h168" stroke="#bd9a68" stroke-width="5" stroke-linecap="round"/><path d="M16 85h143l14 12H9Z" fill="#bc604b"/><rect x="24" y="52" width="87" height="35" rx="15" fill="#315d4d"/><path d="M91 31h54v56H91Z" fill="#234e40"/><path d="M86 31h66" stroke="#163b31" stroke-width="10" stroke-linecap="round"/><rect x="105" y="40" width="27" height="25" rx="4" fill="#e4c88b"/><path d="M47 52V30h18v22" fill="#bd6041"/><path d="M42 30h28" stroke="#94543b" stroke-width="6" stroke-linecap="round"/><circle cx="44" cy="89" r="15" fill="#1b392f"/><circle cx="44" cy="89" r="7" fill="#b9c5ad"/><circle cx="85" cy="89" r="15" fill="#1b392f"/><circle cx="85" cy="89" r="7" fill="#b9c5ad"/><circle cx="127" cy="89" r="15" fill="#1b392f"/><circle cx="127" cy="89" r="7" fill="#b9c5ad"/><path d="M44 89h83" stroke="#d5ba7f" stroke-width="4"/><circle class="vg-smoke" cx="52" cy="15" r="9" fill="#d6ddc9"/><circle class="vg-smoke vg-smoke-2" cx="76" cy="9" r="6" fill="#e1e6d8"/></svg>';
  }
  function introArt() {
    return `<div class="vg-landscape" aria-hidden="true"><span class="vg-sun"></span><span class="vg-cloud vg-cloud-one"></span><span class="vg-cloud vg-cloud-two"></span><div class="vg-hill vg-hill-back"></div><div class="vg-hill"></div><span class="vg-sign"><span>PROCHAINE GARE</span><strong>je peux !</strong></span><div class="vg-landscape-train">${engineSVG()}<div class="vg-illustrated-car"><span>je</span><span>tu</span></div><div class="vg-illustrated-car vg-car-rust"><span>nous</span></div></div><div class="vg-landscape-track"></div></div>`;
  }
  function settings() {
    const rows = library();
    return `<div class="vg-settings"><label for="vg-verb">Tu recorrido<select id="vg-verb" data-verb-game-filter="verb"><option value="common" ${state.verb==='common'?'selected':''}>Verbos frecuentes · mezcla</option><option value="all" ${state.verb==='all'?'selected':''}>Toda mi biblioteca · mezcla</option>${rows.map(verb => `<option value="${esc(verb.verbe)}" ${state.verb===verb.verbe?'selected':''}>${esc(verb.verbe)} · ${esc(verb.es)}</option>`).join('')}</select></label><label for="vg-tense">El tiempo<select id="vg-tense" data-verb-game-filter="tense">${tenseNames.map(tense => `<option value="${esc(tense)}" ${state.tense===tense?'selected':''}>${esc(tenseCopy[tense].fr)}</option>`).join('')}<option value="mixed" ${state.tense==='mixed'?'selected':''}>Los cuatro tiempos · mezcla</option></select></label></div>`;
  }
  function setup() {
    if (!library().length && !state.loading && !state.loadError) void ensureLibrary();
    return `<section class="vg-page"><div class="vg-intro"><div><div class="eyebrow">RECUPERA · CONJUGA · AVANZA</div><h1>El tren de<br>los <em>verbos.</em></h1><p class="vg-lead">Cada sujeto es una estación. Escribe su conjugación y lleva el tren hasta el final del recorrido.</p><div class="vg-chips"><span>Hasta 8 estaciones</span><span>Sin cuenta atrás</span><span>Con repaso</span></div></div>${introArt()}</div><div class="vg-boarding"><div><div class="eyebrow">TU BILLETE DE HOY</div><h2>Elige el viaje</h2><p>Prueba con un solo verbo o mezcla tus verbos frecuentes.</p><a class="vg-text-button" href="#verb-tips">Trucos de conjugación →</a></div>${state.loading?'<p role="status">Preparando las tablas de tu biblioteca…</p>':state.loadError?`<p>No se han podido abrir las tablas.</p>${button('load','Volver a intentar')}`:`${settings()}<div class="vg-boarding-bottom">${button('start',`¡Al tren! ${arrow}`)}<span>${pool().length.toLocaleString('es-ES')} formas para practicar</span></div>`}</div><div class="vg-how"><div><span class="vg-how-number">1</span><h3>Mira el billete</h3><p>Fíjate en el verbo, el sujeto y el tiempo.</p></div><div><span class="vg-how-number">2</span><h3>Escribe de memoria</h3><p>Los acentos cuentan. Tienes un pequeño teclado para ayudarte.</p></div><div><span class="vg-how-number">3</span><h3>Vuelve a lo pendiente</h3><p>Las pistas y los errores se guardan para una segunda vuelta.</p></div></div><p class="vg-source-note">Formas de tus tablas de conjugación. Este juego practica la escritura; las grabaciones de frases están en tus otras actividades.</p></section>`;
  }
  function journey(round) {
    return `<div class="vg-journey" aria-label="${round.results.length} de ${round.questions.length} estaciones completadas"><div class="vg-train-head">${engineSVG()}</div><ol class="vg-carriages">${round.questions.map((question,index) => { const result=round.results[index]; return `<li class="vg-carriage ${result?(result.clean?'vg-complete':'vg-review'):index===round.index?'vg-current':''}" ${!round.done&&index===round.index?'aria-current="step"':''}><span class="vg-carriage-window" aria-hidden="true">${result?(result.clean?'✓':'↻'):index+1}</span><span lang="fr">${esc(question.subject)}</span><span class="sr-only">${result?(result.clean?'recordado sin ayuda':'para repasar'):index===round.index?'estación actual':'pendiente'}</span></li>`; }).join('')}</ol></div>`;
  }
  function source(question) {
    const sources=Array.isArray(question.source)?question.source:[question.source];
    return `<details class="vg-source"><summary>Ver origen de esta forma</summary><p>Tabla ${esc(question.verb)} · ${esc(question.tense)} · sujeto ${esc(question.subject)}.</p>${sources.filter(url=>typeof url==='string'&&/^https:\/\/[^\s]+$/u.test(url)).map(url=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Fuente de la tabla ↗</a>`).join(' ')}</details>`;
  }
  function questionPage() {
    const round=state.round, question=activeQuestion(), tense=tenseCopy[question.tense], showModel=round.model||round.answered;
    return `<section class="vg-page vg-playing"><div class="vg-game-top">${button('hub','← Cambiar recorrido','','vg-text-button')}<span>${round.review?'SEGUNDA VUELTA':'TREN DE LOS VERBOS'} · ESTACIÓN ${round.index+1}/${round.questions.length}</span></div>${journey(round)}<div class="vg-stage"><div class="vg-station-name"><span>PROCHAINE GARE</span><strong lang="fr">${esc(tense.cue)}</strong><small>${esc(tense.es)}</small></div><div class="vg-ticket"><div class="vg-ticket-top"><span>BILLET DE CONJUGAISON</span><span>${esc(question.level)} · ${round.index+1<10?'0':''}${round.index+1}</span></div><div class="vg-ticket-verb"><div><h1 lang="fr">${esc(question.verb)}</h1><p>${esc(question.es)}</p></div><span class="vg-tense vg-${tense.tint}" lang="fr">${esc(tense.fr)}</span></div><div class="vg-ticket-perforation"></div><div class="vg-answer-row"><div class="vg-subject"><small>SUJETO</small><strong lang="fr">${question.subject==='je'&&question.full.some(form=>canonical(form).startsWith("j'"))?'j’':esc(question.subject)}</strong></div><div class="vg-answer-field"><label for="vg-answer">Escribe la conjugación</label><input id="vg-answer" data-verb-game-input="answer" lang="fr" type="text" value="${esc(round.answer)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Tu respuesta…" ${round.answered?'disabled':''} aria-describedby="vg-answer-help vg-feedback"></div></div><p id="vg-answer-help" class="vg-answer-help">Puedes escribir solo la forma o incluir el sujeto.${question.bodies.length>1?' Se aceptan las variantes de acuerdo recogidas en tu tabla.':''}${question.subject==='vous'&&question.bodies.length>1?' «Vous» puede ser singular o plural.':''}</p><div class="vg-accents" aria-label="Letras con acento">${['à','â','ç','é','è','ê','ë','î','ï','ô','ù','û','ü','œ','’'].map(char=>button('accent',esc(char),`data-char="${esc(char)}" ${round.answered?'disabled':''}`,'vg-accent')).join('')}</div><div class="vg-feedback ${round.feedbackKind?'vg-feedback-'+round.feedbackKind:''}" id="vg-feedback" role="status">${esc(round.feedback||'Recupera la forma sin mirar. Tómate tu tiempo.')}</div>${round.tip?contextualTip(question):''}${showModel?`<div class="vg-model"><span>${round.answered?'FORMA DE TU TABLA':'MODELO · CON AYUDA'}</span><p lang="fr">${question.full.map(esc).join('<span class="vg-model-or"> / </span>')}</p></div>`:''}<div class="vg-controls">${round.answered?button('next',`${round.index+1===round.questions.length?'Llegar a destino':'Siguiente estación'} ${arrow}`,'id="vg-next"'):button('check',`Comprobar ${arrow}`)}${!round.answered?`${button('tip','Ver un truco','','vg-text-button')}${button('hint','Ver modelo','','vg-text-button')}${button('skip','Dejar para el repaso','','vg-text-button')}`:''}</div></div></div>${source(question)}<p class="vg-source-note">Cada estación cuenta como recordada cuando aciertas a la primera y sin abrir trucos ni modelos. Repetir nunca te quita vidas.</p></section>`;
  }
  function results() {
    const round=state.round, clean=round.results.filter(result=>result.clean).length, total=round.questions.length, pending=round.results.filter(result=>!result.clean), stars=clean===0?0:clean/total>=.8?3:clean/total>=.5?2:1;
    return `<section class="vg-page vg-results"><div class="vg-result-hero">${engineSVG()}<div class="eyebrow">HAS LLEGADO A DESTINO</div><h1 id="vg-result-title" tabindex="-1">¡Buen viaje!</h1><div class="vg-stars" aria-label="${stars} de 3 estrellas de esta ronda">${[1,2,3].map(star=>`<span class="${star<=stars?'vg-earned':''}" aria-hidden="true">★</span>`).join('')}</div><p class="vg-result-score"><strong>${clean}<small>/${total}</small></strong><span>formas recordadas<br>a la primera y sin ayuda</span></p><p>${pending.length?`Te esperan ${pending.length} ${pending.length===1?'forma':'formas'} para una segunda vuelta.`:'¡Todas las estaciones superadas sin ayuda! Prueba otro tiempo o mezcla los verbos.'}</p><p class="vg-star-guide">Estrellas de esta ronda: ★ Alguna sin ayuda · ★★ Al menos 50 % · ★★★ Al menos 80 %</p></div>${journey(round)}<div class="vg-result-actions">${pending.length?button('retry',`Repasar ${pending.length} ${pending.length===1?'forma':'formas'} ${arrow}`):button('start',`Otro viaje ${arrow}`)}${button('hub','Elegir otro recorrido','','vg-button vg-secondary')}</div>${pending.length?`<div class="vg-review-list"><h2>En tu próxima vuelta</h2>${round.questions.filter(question=>pending.some(result=>result.id===question.id)).map(question=>`<div><span><strong lang="fr">${esc(question.verb)}</strong> · ${esc(tenseCopy[question.tense].fr)}</span><span lang="fr">${esc(question.subject)}</span><small>${round.results.find(result=>result.id===question.id)?.assisted?'Con pista':'Para afianzar'}</small></div>`).join('')}</div>`:''}</section>`;
  }
  function render() { return !state.round?setup():state.round.done?results():questionPage(); }
  async function handle(action, element) {
    if (action==='load') { state.loadError=false; await ensureLibrary(); refresh(); }
    else if (action==='start') await begin();
    else if (action==='hub') { state.round=null; refresh(); top(); }
    else if (action==='check') check();
    else if (action==='hint') hint();
    else if (action==='tip') tip();
    else if (action==='skip') skip();
    else if (action==='next') next();
    else if (action==='retry') retry();
    else if (action==='back') callbacks.back();
    else if (action==='accent') {
      const round=state.round, char=element?.dataset?.char;
      if (!round||round.done||round.answered||!['à','â','ç','é','è','ê','ë','î','ï','ô','ù','û','ü','œ','’'].includes(char)) return;
      const field=typeof document!=='undefined'?document.getElementById('vg-answer'):null;
      const startPos=field?.selectionStart??round.answer.length, endPos=field?.selectionEnd??startPos;
      round.answer=round.answer.slice(0,startPos)+char+round.answer.slice(endPos); refresh('vg-answer');
      if (typeof document!=='undefined') document.getElementById('vg-answer')?.setSelectionRange(startPos+char.length,startPos+char.length);
    }
  }
  function input(event) { if (event.target?.dataset?.verbGameInput==='answer'&&state.round&&!state.round.done&&!state.round.answered) state.round.answer=String(event.target.value).slice(0,160); }
  function change(event) {
    const key=event.target?.dataset?.verbGameFilter, value=event.target?.value;
    if (key==='verb'&&(value==='common'||value==='all'||library().some(verb=>verb.verbe===value))) { state.verb=value; refresh(); }
    if (key==='tense'&&(value==='mixed'||tenseNames.includes(value))) { state.tense=value; refresh(); }
  }
  function leave() { state.active=false; state.generation++; state.round=null; }
  if (typeof document!=='undefined') document.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing&&event.target?.id==='vg-answer'){event.preventDefault();check();}});
  window.ATELIER_VERB_GAME={configure(options){Object.assign(callbacks,options||{});},render,handle,change,input,leave,start};
  // Test hooks are available only in a Node harness; browsers receive the public API above.
  if(typeof module!=='undefined'&&module.exports) module.exports={questionsFor,splitSubject,canonical,unaccented,state,check,next,hint,skip,retry,pool,finish,newRound};
})();
