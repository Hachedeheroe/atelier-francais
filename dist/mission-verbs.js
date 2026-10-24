'use strict';
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const normalize = value => String(value ?? '').normalize('NFC').toLocaleLowerCase('fr').replace(/[’‘]/g, "'").replace(/[\u00a0\u202f]/g, ' ').trim().replace(/^[.,!?:;\s]+|[.,!?:;\s]+$/gu, '').replace(/\s+/gu, ' ');
  const unaccented = value => normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const shuffle = list => { const copy = [...list]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
  const unique = (list, key = value => value) => [...new Map(list.map(value => [key(value), value])).values()];
  const sourceId = item => item.sourceId || item.id;
  const places = [
    {id:'cafe', fr:'Le café', es:'El café', icon:'☕', x:92, y:104},
    {id:'parc', fr:'Le parc', es:'El parque', icon:'♣', x:302, y:86},
    {id:'maison', fr:'La maison', es:'La casa', icon:'⌂', x:510, y:110},
    {id:'marche', fr:'Le marché', es:'El mercado', icon:'▥', x:508, y:271},
    {id:'gare', fr:'La gare', es:'La estación', icon:'▣', x:296, y:291},
    {id:'atelier', fr:'L’atelier', es:'El taller', icon:'✎', x:89, y:264}
  ];
  const types = ['listen','choose','build','listen','choose','write'];
  const labels = {listen:'Escucha y encuentra', choose:'Completa la acción', build:'Construye la frase', write:'Tu turno de escribir'};
  const callbacks = {render(){}, play(){}, onResult(){}, onMistake(){}, toast(){}, back(){}, openCard(){}};
  const state = {active:false, round:null};
  let counter = 0;
  const button = (action, text, extra = '', kind = '') => `<button type="button" class="mv-button ${kind}" data-mission-action="${action}" ${extra}>${text}</button>`;
  const arrow = '<span aria-hidden="true">→</span>';
  const library = () => unique((window.ATELIER_MISSION_DATA?.items || []).filter(item => item.id && item.verb && item.phrase && item.audio && item.answerBody && item.photo?.src), item => item.verb);
  const active = () => state.round?.questions[state.round.index];
  function refresh(focus) {
    callbacks.render();
    if (focus && typeof document !== 'undefined') document.getElementById(focus)?.focus({preventScroll:true});
  }
  function top() { if (typeof window.scrollTo === 'function') window.scrollTo(0,0); }
  function photo(item, label, extraClass = '') {
    const p = item.photo || {}, number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    return `<span class="mv-photo ${extraClass}" role="img" aria-label="${esc(label)}" style="background-image:url('${esc(p.src)}');background-size:${number(p.width,100)}% ${number(p.height,100)}%;background-position:${number(p.x,50)}% ${number(p.y,50)}%"></span>`;
  }
  function plane() {
    return '<svg viewBox="0 0 180 150" aria-hidden="true"><path d="M20 88 162 19 120 139 85 99 61 122 60 85Z" fill="#ffcf54" stroke="#192854" stroke-width="5" stroke-linejoin="round"/><path d="m61 85 101-66-77 80m0 0-24 23" fill="none" stroke="#192854" stroke-width="5" stroke-linejoin="round"/><path d="M33 129c-36 5-36-30-11-26" fill="none" stroke="#fff6de" stroke-width="6" stroke-dasharray="7 9" stroke-linecap="round"/></svg>';
  }
  function cityMap(round = null) {
    const total = round?.questions.length || 6, completed = round?.results.length || 0;
    const stopRows = round ? round.questions.map(question => places.find(place => place.id === question.item.location) || places[0]) : places;
    const currentPlace = stopRows[Math.min(round?.index || 0, stopRows.length-1)] || places[0];
    return `<div class="mv-map ${round?'mv-map-compact':''}" aria-label="Recorrido: ${completed} de ${total} paradas completadas"><svg class="mv-city" viewBox="0 0 600 360" aria-hidden="true"><rect width="600" height="360" rx="30" fill="#dceee5"/><path d="M0 209Q120 165 215 199T409 200T600 176V228Q493 255 399 237T213 234T0 246Z" fill="#a6d2ec"/><path d="M92 104Q188 47 302 86T510 110Q564 181 508 271T296 291Q184 330 89 264Q37 196 92 104Z" fill="none" stroke="#fff9e9" stroke-width="40"/><path d="M92 104Q188 47 302 86T510 110Q564 181 508 271T296 291Q184 330 89 264Q37 196 92 104Z" fill="none" stroke="#d6bb87" stroke-width="3" stroke-dasharray="6 9"/>
      <g stroke="#26375d" stroke-width="3" stroke-linejoin="round"><path d="M70 43h45v45H70Z" fill="#f2af92"/><path d="m64 43 28-20 29 20Z" fill="#db745d"/><path d="M82 66h15v22H82Z" fill="#fff7dd"/><path d="M482 38h55v50h-55Z" fill="#f3ce63"/><path d="m475 38 34-23 35 23Z" fill="#d97f6a"/><path d="M497 63h13v25h-13Z" fill="#fff7dd"/><path d="M465 294h77v29h-77Z" fill="#f2ad8b"/><path d="M461 294h85l-12-20h-61Z" fill="#f0cb50"/><path d="M274 308h50v30h-50Z" fill="#c1b3ed"/><path d="M266 308h66l-12-17h-42Z" fill="#405fbd"/><path d="M62 286h54v37H62Z" fill="#c2b4eb"/><path d="M56 286h66l-10-17H66Z" fill="#8b79c5"/></g>
      <g fill="#81ad86"><circle cx="256" cy="39" r="18"/><circle cx="324" cy="34" r="16"/><circle cx="352" cy="47" r="19"/><circle cx="210" cy="134" r="16"/><circle cx="409" cy="147" r="19"/><circle cx="441" cy="50" r="12"/><circle cx="33" cy="161" r="15"/></g><g stroke="#497b61" stroke-width="5"><path d="M256 41v22m68-29v24m28-11v20m-142 67v21m199-16v22M33 161v19"/></g><g transform="translate(${currentPlace.x-19} ${currentPlace.y-30})" class="mv-map-pawn"><circle cx="19" cy="17" r="23" fill="#f3cc4e" stroke="#24375e" stroke-width="3"/><path d="m9 17 23-9-8 23-6-9-9-5Z" fill="#3455d5"/></g></svg>
      <ol class="mv-stops">${stopRows.map((place,index) => { const result = round?.results[index], current = round && !round.done && index === round.index; return `<li class="mv-stop ${result?(result.clean?'is-done':'is-review'):current?'is-active':''}" ${current?'aria-current="step"':''}><span class="mv-stop-number" aria-hidden="true">${result?(result.clean?'✓':'↻'):index+1}</span><span lang="fr">${esc(place.fr)}</span><span class="sr-only">${result?(result.clean?'completada sin ayuda':'completada, para repasar'):current?'parada actual':'pendiente'}</span></li>`; }).join('')}</ol></div>`;
  }
  function hub() {
    const items = library();
    return `<section class="mv-page mv-hub"><div class="mv-hero"><div><div class="eyebrow">UN DÍA · SEIS MISIONES · TUS VERBOS</div><h1 lang="fr">Mission<br><em>Verbes !</em></h1><p class="mv-lead">Recorre una pequeña ciudad francesa. Escucha, encuentra la acción y usa el verbo para seguir tu camino.</p><div class="mv-chips"><span>Fotos realistas</span><span>Audio de tus materiales</span><span>Sin cuenta atrás</span></div></div><div class="mv-hero-art">${plane()}<span class="mv-postmark" lang="fr">À toi de jouer !</span></div></div>
      <div class="mv-boarding"><div><div class="eyebrow">TU PASE DE EXPLORADOR</div><h2>Un día en francés</h2><p>6 paradas, 6 acciones distintas. Consigue sellos y monedas con cada misión.</p><p class="mv-pool-count">${items.length} verbos cotidianos · presente</p></div>${button('begin',`¡Empieza la aventura! ${arrow}`, items.length<6?'disabled':'', 'mv-primary')}</div>${cityMap()}
      <div class="mv-how"><div><span>01</span><h3>Escucha y mira</h3><p>Encuentra la foto que corresponde a la frase.</p></div><div><span>02</span><h3>Juega con las palabras</h3><p>Elige una forma, construye una frase y escribe.</p></div><div><span>03</span><h3>Completa tu pasaporte</h3><p>Vuelve a las acciones que necesiten otra vuelta.</p></div></div>
      <details class="mv-practice-gallery"><summary>Conoce las ${items.length} acciones antes de jugar</summary><div class="mv-gallery">${items.map(item => `<article class="mv-gallery-card">${photo(item,item.translation)}<h3 lang="fr">${esc(item.verb)}</h3><p>${esc(item.translation)}</p>${button('preview','▶ Escuchar',`data-id="${esc(item.id)}" aria-label="Escuchar ${esc(item.verb)}"`,'mv-secondary')}</article>`).join('')}</div></details><p class="mv-source-note">Frases y grabaciones de tu biblioteca. Las fotos representan acciones; los lugares del mapa sirven para organizar el juego.</p><a class="mv-advanced-link" href="#verb-tips">Trucos de conjugación ${arrow}</a><a class="mv-advanced-link" href="#verb-game">¿Más conjugación? Sube al tren de los verbos ${arrow}</a></section>`;
  }
  function makeQuestion(item, type) {
    const family = verb => ['prendre','aller'].includes(verb)?'railway':['écouter','parler','regarder'].includes(verb)?'media':verb;
    const distractors = unique(shuffle(library().filter(other => family(other.verb) !== family(item.verb))), other => family(other.verb));
    const pictureOptions = shuffle([item, ...distractors.slice(0,3)]);
    const formOptions = shuffle([item.answerBody, ...shuffle(unique(item.presentBodies || [], normalize).filter(form => normalize(form) !== normalize(item.answerBody))).slice(0,3)]);
    const tokens = (Array.isArray(item.tokens) && item.tokens.length ? item.tokens : item.phrase.split(/\s+/u)).map((text,index) => ({text,index}));
    return {item, type, pictureOptions, formOptions, tokens, bank:shuffle(tokens)};
  }
  function newRound(seeds = null, review = false) {
    const items = library();
    const roundTypes = shuffle(types);
    const selected = seeds || places.map(place => shuffle(items.filter(item => item.location === place.id))[0]).filter(Boolean).map((item,index) => ({item,type:roundTypes[index]}));
    if (!selected.length) { callbacks.toast('No hay misiones disponibles.'); return; }
    state.active = true;
    state.round = {runId:`verb-missions-${Date.now().toString(36)}-${++counter}-${Math.random().toString(36).slice(2,8)}`, questions:selected.map(seed => makeQuestion(seed.item,seed.type)), index:0, results:[], answer:'', selectedTokens:[], wrong:false, helped:false, tip:false, model:false, answered:false, feedback:'', feedbackKind:'', choice:'', done:false, emitted:false, review};
    refresh('mv-task-title'); top();
    if (active()?.type === 'listen') callbacks.play(active().item.audio);
    else if (active()?.item?.verb) void window.ATELIER_CONJUGATION_AUDIO?.listen?.(active().item.verb);
  }
  function start() { state.active = true; state.round = null; refresh(); }
  function leave() { state.active = false; state.round = null; }
  function currentStreak(round) { let count=0; for(let i=round.results.length-1;i>=0&&round.results[i].clean;i--) count++; return count; }
  function bestStreak(round) { let best=0, count=0; for(const result of round.results){count=result.clean?count+1:0;best=Math.max(best,count);}return best; }
  const coins = round => round.results.length*2 + round.results.filter(result => result.clean).length*10;
  function roundTop(round) {
    return `<div class="mv-round-top">${button('map','← Volver al mapa','','mv-link')}<span class="mv-round-label">${round.review?'Segunda vuelta':'Un día en francés'}</span><span class="mv-coins"><span aria-hidden="true">●</span> ${coins(round)} <span>monedas de ronda</span></span></div><div class="mv-progress"><span>Parada ${round.index+1} de ${round.questions.length}</span><progress value="${round.results.length}" max="${round.questions.length}" aria-label="Paradas completadas">${round.results.length}/${round.questions.length}</progress><span class="mv-streak">${currentStreak(round)} seguidas sin ayuda <span aria-hidden="true">✦</span></span></div>`;
  }
  function questionContent(question, round) {
    const item = question.item, revealed = round.answered || round.model;
    if (question.type === 'listen') return `<p class="mv-task-instruction">Escucha la frase y elige la foto de la acción. Puedes repetir el audio.</p><div class="mv-listen-control">${button('audio','▶ Escuchar la misión','','mv-primary')}</div>${round.model?`<p class="mv-listen-hint"><span lang="fr">${esc(item.phrase)}</span><span>${esc(item.phraseTranslation)}</span></p>`:''}<div class="mv-photo-grid mv-choices">${question.pictureOptions.map((option,index) => {const selected=round.choice===option.id, correct=round.answered&&option.id===item.id;return button('picture',`${photo(option,revealed?option.translation:`Opción ${index+1}`)}<span class="mv-option-label">${revealed?esc(option.verb):`Opción ${index+1}`}</span>`,`data-id="${esc(option.id)}" aria-label="${revealed?esc(option.translation):`Opción ${index+1}`}" ${round.answered?'disabled':''}`,`mv-photo-option mv-choice ${correct?'is-correct':selected&&round.wrong?'is-wrong':''}`);}).join('')}</div>`;
    const scene = `<div class="mv-scene">${photo(item,item.translation)}<span class="mv-scene-caption">${esc(item.phraseTranslation)}</span></div>`;
    if (question.type === 'choose') return `<p class="mv-task-instruction">Completa la frase con la forma que corresponde al sujeto.</p><div class="mv-stage">${scene}<div class="mv-challenge"><span class="mv-verb-tag" lang="fr">${esc(item.verb)}</span><p class="mv-gap" lang="fr">${esc(item.gapPrefix)}<span class="mv-gap-slot" aria-label="Hueco del verbo">${round.answered?esc(item.answerBody):'…'}</span>${esc(item.gapSuffix)}</p><div class="mv-form-options mv-choices">${question.formOptions.map(form => button('form',esc(form),`data-form="${esc(form)}" ${round.answered?'disabled':''}`,`mv-form mv-choice ${round.answered&&normalize(form)===normalize(item.answerBody)?'is-correct':round.choice===form&&round.wrong?'is-wrong':''}`)).join('')}</div>${round.model&&!round.answered?`<p class="mv-hint">Modelo: <strong lang="fr">${esc(item.gapPrefix+item.answerBody)}</strong></p>`:''}</div></div>`;
    if (question.type === 'build') return `<p class="mv-task-instruction">Toca las palabras para construir la frase. Toca una palabra elegida para devolverla.</p><div class="mv-stage">${scene}<div class="mv-challenge"><span class="mv-verb-tag" lang="fr">${esc(item.verb)}</span><div class="mv-build-answer" role="group" aria-label="Tu frase en construcción">${round.selectedTokens.length?round.selectedTokens.map(index => {const token=question.tokens[index];return button('untoken',esc(token.text),`id="mv-chosen-${index}" data-token="${index}" aria-label="Retirar ${esc(token.text)}, palabra ${index+1}" ${round.answered?'disabled':''}`, 'mv-token mv-tile mv-token-selected');}).join(''):'<span class="mv-build-placeholder">Tu frase aparecerá aquí…</span>'}</div><div class="mv-token-bank mv-tiles" role="group" aria-label="Palabras disponibles">${question.bank.map(token => button('token',esc(token.text),`id="mv-token-${token.index}" data-token="${token.index}" aria-label="Añadir ${esc(token.text)}, palabra ${token.index+1}" ${round.selectedTokens.includes(token.index)||round.answered?'disabled':''}`,'mv-token mv-tile')).join('')}</div>${round.model&&!round.answered?`<p class="mv-hint">Modelo: <span lang="fr">${esc(item.phrase)}</span></p>`:''}${button('check','Comprobar frase',`id="mv-check" ${round.answered?'disabled':''}`,'mv-primary')}</div></div>`;
    return `<p class="mv-task-instruction">Escribe solo el verbo que falta. Los acentos también cuentan.</p><div class="mv-stage">${scene}<div class="mv-challenge"><span class="mv-verb-tag" lang="fr">${esc(item.verb)}</span><label class="mv-write-label" for="mv-answer">El verbo que falta</label><div class="mv-gap mv-write-gap" lang="fr"><span>${esc(item.gapPrefix)}</span><input id="mv-answer" data-mission-input="answer" type="text" value="${esc(round.answer)}" aria-label="Verbo que falta en la frase" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" ${round.answered?'disabled':''}><span>${esc(item.gapSuffix)}</span></div><div class="mv-accent-keys" aria-label="Letras francesas">${['é','è','ê','à','ç','î','ô','û','ù',"'"].map(char=>button('accent',esc(char),`data-char="${esc(char)}" aria-label="Añadir ${esc(char)}" ${round.answered?'disabled':''}`,'mv-accent')).join('')}</div>${round.model&&!round.answered?`<p class="mv-hint">Modelo: <strong lang="fr">${esc(item.answerBody)}</strong></p>`:''}${button('check','Comprobar',`id="mv-check" ${round.answered?'disabled':''}`,'mv-primary')}</div></div>`;
  }
  function contextualTip(item) {
    const html = window.ATELIER_VERB_TIPS?.renderHint?.(item.verb, item.tense || 'Indicatif — présent', {subject:item.person, compact:true});
    return `<div class="mv-tip" role="note" aria-label="Truco de conjugación">${html || '<p>Identifica el sujeto y recuerda una forma conocida de este verbo. Después, comprueba si sigue una familia regular. Para ver la frase resuelta, abre «Ver modelo».</p>'}</div>`;
  }
  function task() {
    const round=state.round, question=active(), item=question.item, place=places.find(value=>value.id===item.location)||places[0];
    return `<section class="mv-page mv-round">${roundTop(round)}<div class="mv-task"><div class="mv-task-heading"><div><div class="eyebrow" lang="fr">${esc(place.fr)} · MISSION ${round.index+1}</div><h1 id="mv-task-title" tabindex="-1">${labels[question.type]}</h1></div><span class="mv-type-icon" aria-hidden="true">${{listen:'♫',choose:'✦',build:'▦',write:'✎'}[question.type]}</span></div>${questionContent(question,round)}${round.tip&&question.type!=='listen'?contextualTip(item):''}<div class="mv-feedback ${round.feedbackKind?'is-'+round.feedbackKind:''}" role="status" aria-live="polite">${esc(round.feedback)}</div>${round.answered?`<div class="mv-solution"><div><strong lang="fr">${esc(item.phrase)}</strong><span>${esc(item.phraseTranslation)}</span></div>${button('audio','▶ Escuchar','','mv-secondary')}${button('card','Ver mi ficha','','mv-link')}</div>`:''}<div class="mv-actions mv-footer">${round.answered?button('next',`${round.index+1===round.questions.length?'Ver mi pasaporte':'Siguiente parada'} ${arrow}`,'id="mv-next"','mv-primary'):`${question.type!=='listen'?button('tip','Ver un truco','','mv-secondary'):''}${button('hint','Ver modelo','','mv-secondary')}${button('skip','Ver solución y continuar','','mv-link')}`}</div></div>${cityMap(round)}<p class="mv-source-note">Los errores y las pistas se guardan para la segunda vuelta. Completa el recorrido para registrar el resultado.</p></section>`;
  }
  function emitMissionMistake(question, reason) {
    if (!question?.item) return;
    const item = question.item;
    callbacks.onMistake?.({
      id: sourceId(item),
      kind: 'verb-mission',
      title: `${item.verb} — ${item.phrase}`,
      subtitle: `${item.phraseTranslation || item.translation || ''} · Misión verbos`,
      detail: item.phrase,
      explanation: `Verbo: ${item.verb} (${item.translation || ''}) · Forma: ${item.answerBody || ''}`,
      verb: item.verb,
      audio: item.audio,
      reason
    });
  }
  function complete(clean, skipped=false) {
    const round=state.round, question=active();
    if (!round || !question || round.answered || round.done) return;
    if (skipped) emitMissionMistake(question, 'skip');
    round.answered=true;
    round.results.push({id:sourceId(question.item), clean, missed:round.wrong||skipped, assisted:round.helped, skipped});
    round.feedbackKind=skipped?'notice':'correct';
    round.feedback=skipped?'Mira la solución. Esta acción te espera en la segunda vuelta.':clean?'¡Sello conseguido! +12 monedas. Lo has recordado a la primera.':'¡Ahora sí! +2 monedas. Lo practicaremos una vez más.';
    refresh('mv-next');
    if (question.item?.audio) callbacks.play(question.item.audio);
  }
  function wrong(message) {
    const round=state.round;if(!round||round.answered||round.done)return;
    emitMissionMistake(active(), 'wrong');
    round.wrong=true;round.feedbackKind='wrong';round.feedback=message||'Todavía no. Prueba otra vez: puedes repetir el audio o pedir una pista.';refresh(active()?.type==='write'?'mv-answer':undefined);
  }
  function check() {
    const round=state.round, question=active();if(!round||!question||round.answered||round.done)return;
    const entered=question.type==='build'?round.selectedTokens.map(index=>question.tokens[index].text).join(' '):round.answer;
    if(!normalize(entered)){round.feedbackKind='notice';round.feedback=question.type==='build'?'Elige las palabras para construir la frase.':'Escribe el verbo antes de comprobar.';refresh(question.type==='write'?'mv-answer':undefined);return;}
    const target=question.type==='build'?question.item.phrase:question.item.answerBody;
    if(normalize(entered)===normalize(target))complete(!round.wrong&&!round.helped);
    else wrong(unaccented(entered)===unaccented(target)?'Casi. Revisa los acentos: también forman parte del verbo.':question.type==='build'?'Revisa el orden de las palabras y vuelve a intentarlo.':'Revisa el sujeto y la forma del verbo. Puedes volver a intentarlo.');
  }
  function hint() {
    const round=state.round;if(!round||round.answered||round.done)return;
    emitMissionMistake(active(), 'hint');
    round.helped=true;round.model=true;round.feedbackKind='notice';round.feedback='Modelo abierto. Recupera esta frase después en la segunda vuelta.';refresh(active()?.type==='write'?'mv-answer':undefined);
  }
  function tip() {
    const round=state.round, question=active();
    if(!round||!question||round.answered||round.done||question.type==='listen')return;
    emitMissionMistake(question, 'tip');
    round.helped=true;round.tip=true;round.feedbackKind='notice';
    round.feedback='Truco abierto. Aplica la regla; esta acción volverá en la segunda vuelta.';
    refresh(question.type==='write'?'mv-answer':undefined);
  }
  function finish() {
    const round=state.round;if(!round||round.emitted||round.results.length!==round.questions.length)return;
    round.done=true;round.emitted=true;
    callbacks.onResult({runId:round.runId,type:'verb-missions',ids:round.questions.map(question=>sourceId(question.item)),total:round.questions.length,correct:round.results.filter(result=>result.clean).length,missed:round.results.filter(result=>result.missed).map(result=>result.id),assisted:round.results.filter(result=>result.assisted).map(result=>result.id),dateISO:new Date().toISOString()});
  }
  function next() {
    const round=state.round;if(!round||!round.answered||round.done)return;
    if(round.index+1===round.questions.length){finish();refresh('mv-result-title');top();return;}
    round.index++;Object.assign(round,{answer:'',selectedTokens:[],wrong:false,helped:false,tip:false,model:false,answered:false,feedback:'',feedbackKind:'',choice:''});
    refresh(active().type==='write'?'mv-answer':'mv-task-title');top();
    if(active().type==='listen')callbacks.play(active().item.audio);
    else if(active()?.item?.verb)void window.ATELIER_CONJUGATION_AUDIO?.listen?.(active().item.verb);
  }
  function results() {
    const round=state.round, clean=round.results.filter(result=>result.clean).length, pending=round.results.filter(result=>!result.clean).length, stars=clean===round.questions.length?3:clean>=Math.ceil(round.questions.length/2)?2:1;
    return `<section class="mv-page mv-result"><div class="mv-result-hero"><div class="eyebrow">MISSION ACCOMPLIE</div><div class="mv-stars" role="img" aria-label="${stars} de 3 estrellas">${[1,2,3].map(star=>`<span class="${star<=stars?'is-earned':''}" aria-hidden="true">★</span>`).join('')}</div><h1 id="mv-result-title" tabindex="-1">¡Tu pasaporte está listo!</h1><p>${pending?'Has terminado el recorrido. Otra vuelta convertirá las dudas en recuerdos.':'¡Todas las acciones recordadas sin ayuda! La ciudad ya habla francés contigo.'}</p></div><div class="mv-stats mv-scoreboard"><div class="mv-stat"><strong>${clean}/${round.questions.length}</strong><span>sin ayuda y a la primera</span></div><div class="mv-stat"><strong>${coins(round)}</strong><span>monedas de esta ronda</span></div><div class="mv-stat"><strong>${bestStreak(round)}</strong><span>mejor racha de aciertos</span></div></div><div class="mv-passport"><h2>Tus sellos del día</h2><div class="mv-stamps">${round.questions.map((question,index)=>`<div class="mv-stamp ${round.results[index].clean?'is-clean':'is-review'}"><span aria-hidden="true">${round.results[index].clean?'✓':'↻'}</span><strong lang="fr">${esc(question.item.verb)}</strong><span>${round.results[index].clean?'Recordado':'Para otra vuelta'}</span></div>`).join('')}</div></div><div class="mv-actions">${pending?button('retry',`Segunda vuelta · ${pending} ${pending===1?'acción':'acciones'} ${arrow}`,'','mv-primary'):''}${button('repeat','Otro día con estas acciones','','mv-secondary')}${button('begin','Nuevo recorrido','','mv-secondary')}${button('map','Volver al mapa','','mv-link')}</div><div class="mv-recap"><h2>Las frases de tu recorrido</h2>${round.questions.map(question=>`<article>${photo(question.item,question.item.translation)}<div><strong lang="fr">${esc(question.item.phrase)}</strong><span>${esc(question.item.phraseTranslation)}</span></div>${button('preview','▶',`data-id="${esc(question.item.id)}" aria-label="Escuchar ${esc(question.item.phrase)}"`,'mv-secondary')}</article>`).join('')}</div><a class="mv-advanced-link" href="#verb-game">Sigue con otros sujetos y tiempos en el tren de los verbos ${arrow}</a></section>`;
  }
  function render() { return !state.round?hub():state.round.done?results():task(); }
  function input(event) { if(state.round&&!state.round.done&&!state.round.answered&&event.target?.dataset?.missionInput==='answer')state.round.answer=event.target.value; }
  function keydown(event) { if(event.key==='Enter'&&!event.isComposing&&event.target?.dataset?.missionInput==='answer'){event.preventDefault?.();check();return true;}return false; }
  function handle(action,node={}) {
    const round=state.round, question=active(), data=node.dataset||{};
    if(action==='begin'){newRound();return true;}
    if(action==='map'){state.round=null;refresh();top();return true;}
    if(action==='preview'){const item=library().find(value=>value.id===data.id);if(item)callbacks.play(item.audio);return true;}
    if(action==='audio'){if(question)callbacks.play(question.item.audio);return true;}
    if(action==='card'){if(question&&round.answered)callbacks.openCard(sourceId(question.item));return true;}
    if(action==='next'){next();return true;}
    if(action==='repeat'&&round?.done){newRound(round.questions.map(value=>({item:value.item,type:value.type})));return true;}
    if(action==='retry'&&round?.done){const pending=new Set(round.results.filter(result=>!result.clean).map(result=>result.id));newRound(round.questions.filter(value=>pending.has(sourceId(value.item))).map(value=>({item:value.item,type:value.type})),true);return true;}
    if(!round||round.done||round.answered)return false;
    if(action==='hint'){hint();return true;}
    if(action==='tip'){tip();return true;}
    if(action==='skip'){complete(false,true);return true;}
    if(action==='check'){if(question.type==='build'||question.type==='write')check();return true;}
    if(action==='picture'&&question.type==='listen'){if(!question.pictureOptions.some(item=>item.id===data.id))return true;round.choice=data.id;if(data.id===question.item.id)complete(!round.wrong&&!round.helped);else wrong();return true;}
    if(action==='form'&&question.type==='choose'){if(!question.formOptions.includes(data.form))return true;round.choice=data.form;if(normalize(data.form)===normalize(question.item.answerBody))complete(!round.wrong&&!round.helped);else wrong('Esa forma no corresponde al sujeto. Prueba otra opción.');return true;}
    if((action==='token'||action==='untoken')&&question.type==='build'){const index=Number(data.token);if(!Number.isInteger(index)||!question.tokens[index])return true;if(action==='token'&&!round.selectedTokens.includes(index))round.selectedTokens.push(index);if(action==='untoken')round.selectedTokens=round.selectedTokens.filter(value=>value!==index);round.feedback='';round.feedbackKind='';refresh(`${action==='token'?'mv-chosen':'mv-token'}-${index}`);return true;}
    if(action==='accent'&&question.type==='write'&&['é','è','ê','à','ç','î','ô','û','ù',"'"].includes(data.char)){const field=typeof document!=='undefined'?document.getElementById('mv-answer'):null;const begin=field?.selectionStart??round.answer.length,end=field?.selectionEnd??begin;round.answer=round.answer.slice(0,begin)+data.char+round.answer.slice(end);if(field){field.value=round.answer;field.focus({preventScroll:true});field.setSelectionRange?.(begin+data.char.length,begin+data.char.length);}return true;}
    return false;
  }
  window.ATELIER_VERB_MISSIONS={configure(options){Object.assign(callbacks,options||{});},start,leave,render,handle,input,keydown,isPlaying(){return Boolean(state.round&&!state.round.done);}};
})();
