'use strict';
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const canonical = value => String(value ?? '').normalize('NFC').toLocaleLowerCase('fr').replace(/[’‘]/g, "'").replace(/[\u00a0\u202f]/g, ' ').trim().replace(/^[.,!?:;\s]+|[.,!?:;\s]+$/gu, '').replace(/\s+/g, ' ');
  const unaccented = value => canonical(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const shuffle = list => { const result = [...list]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; };
  const distinct = list => [...new Set(list)];
  const tenseNames = ['Indicatif — présent','Indicatif — imparfait','Indicatif — futur simple','Indicatif — passé composé','Indicatif — plus-que-parfait','Indicatif — futur antérieur','Conditionnel — présent','Conditionnel — passé (1re forme)','Subjonctif — présent','Subjonctif — passé','Impératif — présent','Indicatif — passé simple'];
  const tenseCopy = {
    'Indicatif — présent': {fr:'Présent', es:'Lo que pasa ahora', cue:'aujourd’hui', tint:'present', group:'indicatif', use:'Habla de una situación actual, una costumbre o un hecho general.'},
    'Indicatif — imparfait': {fr:'Imparfait', es:'Hábitos y escenas del pasado', cue:'autrefois', tint:'past', group:'indicatif', use:'Describe el fondo de una historia, un estado o una costumbre del pasado.'},
    'Indicatif — futur simple': {fr:'Futur simple', es:'Lo que pasará después', cue:'demain', tint:'future', group:'indicatif', use:'Presenta un hecho futuro, una previsión o una promesa.'},
    'Indicatif — passé composé': {fr:'Passé composé', es:'Una acción terminada', cue:'hier', tint:'complete', group:'indicatif', use:'Cuenta un acontecimiento pasado como un hecho completo. Contrástalo con el fondo que describe el imparfait.'},
    'Indicatif — plus-que-parfait': {fr:'Plus-que-parfait', es:'Antes de otro hecho pasado', cue:'avant cela', tint:'past', group:'indicatif', use:'Sitúa una acción antes de otra referencia pasada: lo que ya había sucedido.'},
    'Indicatif — futur antérieur': {fr:'Futur antérieur', es:'Ya estará hecho', cue:'d’ici là', tint:'future', group:'indicatif', use:'Sitúa una acción terminada antes de una referencia futura. Aquí practicamos ese uso temporal.'},
    'Conditionnel — présent': {fr:'Conditionnel présent', es:'Deseos y situaciones hipotéticas', cue:'si c’était possible…', tint:'conditional', group:'conditionnel', use:'Expresa una petición cortés, un deseo o el resultado de una hipótesis: si + imparfait → conditionnel présent.'},
    'Conditionnel — passé (1re forme)': {fr:'Conditionnel passé', es:'Lo que habría ocurrido', cue:'avec une autre chance…', tint:'conditional', group:'conditionnel', use:'Imagina un resultado pasado que no ocurrió o expresa un arrepentimiento: si + plus-que-parfait → conditionnel passé.'},
    'Subjonctif — présent': {fr:'Subjonctif présent', es:'Necesidad, deseo o duda', cue:'il faut que…', tint:'subjunctive', group:'subjonctif', use:'Se usa en subordinadas tras expresiones como il faut que, vouloir que o bien que. Que por sí solo no exige subjuntivo.'},
    'Subjonctif — passé': {fr:'Subjonctif passé', es:'Una acción anterior en subjuntivo', cue:'avant ce moment…', tint:'subjunctive', group:'subjonctif', use:'Tras una expresión que exige subjuntivo, sitúa la acción como ya realizada respecto al momento de referencia.'},
    'Impératif — présent': {fr:'Impératif présent', es:'Consejos, invitaciones e instrucciones', cue:'à toi de jouer !', tint:'imperative', group:'imperatif', use:'Da una instrucción, un consejo o una invitación. Solo tiene tu, nous y vous; el pronombre sujeto no se escribe.'},
    'Indicatif — passé simple': {fr:'Passé simple · relato escrito', es:'Un acontecimiento en un relato', cue:'dans un récit…', tint:'past', group:'lecture', use:'Aparece sobre todo en narraciones escritas. Es una ruta opcional de lectura; no entra en la mezcla de tiempos cotidianos.'}
  };
  const tenseGroups = [
    {id:'indicatif', label:'Indicatif · situar los hechos'},
    {id:'conditionnel', label:'Conditionnel · imaginar y pedir'},
    {id:'subjonctif', label:'Subjonctif · necesidad, deseo y duda'},
    {id:'imperatif', label:'Impératif · dar instrucciones'},
    {id:'lecture', label:'Lectura · recorrido opcional'}
  ];
  const tenseMixes = {
    mixed:{label:'Los 11 tiempos cotidianos · mezcla', tenses:tenseNames.filter(tense=>tenseCopy[tense].group!=='lecture')},
    'mixed:essentials':{label:'Los 4 tiempos de inicio · mezcla', tenses:tenseNames.slice(0,4)},
    'mixed:indicatif':{label:'Indicatif · 6 tiempos mezclados', tenses:tenseNames.filter(tense=>tenseCopy[tense].group==='indicatif')},
    'mixed:conditionnel':{label:'Conditionnel · presente y pasado', tenses:tenseNames.filter(tense=>tenseCopy[tense].group==='conditionnel')},
    'mixed:subjonctif':{label:'Subjonctif · presente y pasado', tenses:tenseNames.filter(tense=>tenseCopy[tense].group==='subjonctif')}
  };
  const common = new Set(['être','avoir','aller','faire','dire','pouvoir','vouloir','savoir','voir','venir','prendre','mettre','parler','aimer','manger','finir','partir','sortir','lire','écrire','comprendre','devoir','s\'amuser','se souvenir']);
  const subjects = ['je','tu','il','elle','on','nous','vous','ils','elles'];
  const callbacks = {render() {}, play() {}, toast() {}, onResult() {}, onMistake() {}, onRecover() {}, getMistakes() { return []; }, back() {}};
  const state = {verb:'common', tense:tenseNames[0], round:null, loading:false, loadError:false, active:false, generation:0, autoSpeak:true};
  let loadingPromise = null;
  let runCounter = 0;
  const button = (action, text, extra = '', klass = 'vg-button') => `<button type="button" class="${klass}" data-verb-game-action="${action}" ${extra}>${text}</button>`;
  const arrow = '<span aria-hidden="true">→</span>';

  function library() { return Array.isArray(window.ATELIER_VERBS) ? window.ATELIER_VERBS : []; }
  function verbGroupsApi() { return window.ATELIER_VERB_GROUPS || null; }
  function classifyVerbFallback(verb) {
    const api = verbGroupsApi();
    if (api?.classify) return api.classify(verb);
    const inf = canonical(verb?.verbe || verb || '').replace(/^(se |s')/u, '');
    if (['être','avoir','aller','faire'].includes(inf) || inf.endsWith('oir')) return {id:'oir-piliers', code:'-oir + pilares', badge:'Pilares e irregulares · -oir', short:'-oir y grandes pilares'};
    if (inf.endsWith('er')) return {id:'er-regular', code:'-er', badge:'1.er grupo · -er', short:'-er (parler)'};
    if (inf.endsWith('ir')) {
      const nous = canonical(verb?.formes?.['Indicatif — présent']?.[3]?.[0] || '');
      if (nous.endsWith('issons')) return {id:'ir-issant', code:'-ir · -issant', badge:'2.º grupo · -ir (-issant)', short:'-ir con -issant'};
      if (/(venir|tenir)$/u.test(inf)) return {id:'ir-venir', code:'-venir / -tenir', badge:'3.er grupo · -venir/-tenir', short:'-venir / -tenir'};
      if (/(vrir|frir|cueillir)$/u.test(inf)) return {id:'ir-ouvrir', code:'-ir → -e', badge:'3.er grupo · -ir como -er', short:'-ir tipo ouvrir'};
      return {id:'ir-partir', code:'-ir · partir', badge:'3.er grupo · -ir sin -issant', short:'-ir tipo partir/dormir'};
    }
    if (inf.endsWith('dre')) {
      if (inf.endsWith('prendre')) return {id:'dre-prendre', code:'-prendre', badge:'3.er grupo · -prendre', short:'Familia -prendre'};
      if (/(aindre|eindre|oindre)$/u.test(inf)) return {id:'dre-indre', code:'-indre → -gn-', badge:'3.er grupo · -indre (-gn-)', short:'-aindre / -eindre / -oindre'};
      return {id:'dre-vendre', code:'-dre', badge:'3.er grupo · -dre (vendre)', short:'-dre regulares (vendre)'};
    }
    return {id:'re-autres', code:'-re', badge:'3.er grupo · otros -re', short:'Otros -re'};
  }
  function matchesVerbGroup(verb, groupId) {
    const api = verbGroupsApi();
    if (api?.matches) return api.matches(verb, groupId);
    if (groupId === 'pronominal') return Boolean(verb?.pronominal || /^(se |s')/u.test(canonical(verb?.verbe || '')));
    return classifyVerbFallback(verb).id === groupId;
  }
  function refresh(focus) {
    callbacks.render();
    if (focus && typeof document !== 'undefined') document.getElementById(focus)?.focus({preventScroll:true});
  }
  function top() { if (typeof window.scrollTo === 'function') window.scrollTo(0,0); }
  function splitSubject(form) {
    const full = canonical(form);
    const connector = full.match(/^(que |qu')/u)?.[0] || '';
    const subjectForm = full.slice(connector.length);
    const match = subjectForm.match(/^(j'|je |tu |il |elle |on |nous |vous |ils |elles )(.+)$/u);
    if (!match) return null;
    return {subject:match[1] === "j'" ? 'je' : match[1].trim(), body:match[2], full:String(form).trim(), subjectForm, prefix:connector+match[1]};
  }
  // Each question names one subject. We retain every compatible form from the source
  // table, including agreement variants and reflexive pronouns; no forms are invented.
  function questionsFor(verb, tense) {
    if (!verb?.verbe || !tenseNames.includes(tense)) return [];
    const forms = verb.formes?.[tense];
    if (!Array.isArray(forms)) return [];
    const imperative = tense === 'Impératif — présent';
    if (imperative && forms.length !== 3) return [];
    const grouped = new Map();
    for (const [index, slot] of forms.entries()) for (const form of Array.isArray(slot) ? slot : []) {
      if (typeof form !== 'string' || !form.trim() || /[()[\]{}\/]/u.test(form)) continue;
      const parsed = imperative ? {subject:['tu','nous','vous'][index], body:canonical(form), full:form.trim(), subjectForm:canonical(form), prefix:['tu','nous','vous'][index]} : splitSubject(form);
      if (!parsed || !subjects.includes(parsed.subject)) continue;
      if (!grouped.has(parsed.subject)) grouped.set(parsed.subject, []);
      grouped.get(parsed.subject).push(parsed);
    }
    return [...grouped.entries()].map(([subject, variants]) => ({
      id:`verb|${verb.verbe}|${tense}|${subject}`, verb:verb.verbe, es:verb.es || '', level:verb.nivel || verb.niveau || '', tense, subject,
      full:distinct(variants.map(item => item.full)), bodies:distinct(variants.map(item => item.body)), source:verb.source || [],
      imperative, prompt:variants[0].prefix.trim(),
      accepted:distinct(variants.flatMap(item => [canonical(item.full), canonical(item.subjectForm), canonical(item.body)]))
    }));
  }
  function selectedTenses() { return tenseMixes[state.tense]?.tenses || (tenseNames.includes(state.tense)?[state.tense]:[]); }
  function pool() {
    const tenses = selectedTenses();
    const allVerbs = library();
    if (state.verb === 'mistakes') {
      const saved = callbacks.getMistakes?.() || [];
      const exactIds = new Set(saved.filter(m => typeof m?.id === 'string' && m.id.startsWith('verb|')).map(m => m.id));
      const mistakeVerbs = new Set(saved.map(m => m?.verb || (typeof m?.id === 'string' && m.id.startsWith('verb|') ? m.id.split('|')[1] : '')).filter(Boolean));
      const allQuestions = allVerbs.filter(v => mistakeVerbs.has(v.verbe)).flatMap(v => tenseNames.flatMap(t => questionsFor(v, t)));
      const exactMatches = allQuestions.filter(q => exactIds.has(q.id));
      if (exactMatches.length) return exactMatches;
      return allVerbs.filter(v => mistakeVerbs.has(v.verbe)).flatMap(v => tenses.flatMap(t => questionsFor(v, t)));
    }
    const isGroup = typeof state.verb === 'string' && state.verb.startsWith('group:');
    const groupId = isGroup ? state.verb.slice(6) : '';
    const verbs = allVerbs.filter(verb => state.verb === 'all' || (state.verb === 'common' ? common.has(verb.verbe) : isGroup ? matchesVerbGroup(verb, groupId) : verb.verbe === state.verb));
    return verbs.flatMap(verb => tenses.flatMap(tense => questionsFor(verb, tense)));
  }
  // Interleave the selected tenses so a large present-tense pool cannot crowd out
  // the other times. Within each tense, questions still come from the source.
  function journeyQuestions(questions) {
    const groups = shuffle(distinct(questions.map(question=>question.tense))).map(tense=>shuffle(questions.filter(question=>question.tense===tense)));
    const picked=[];
    while(picked.length<8 && groups.some(group=>group.length)) for(const group of groups) {
      if(group.length && picked.length<8)picked.push(group.pop());
    }
    return picked;
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
  function activeQuestion() { return state.round?.questions[state.round.index]; }
  function announceStation(force = false) {
    if (!force && !state.autoSpeak) return;
    const question = activeQuestion();
    if (!question) return;
    const audio = window.ATELIER_CONJUGATION_AUDIO;
    if (audio?.speakStation) void audio.speakStation(question, tenseCopy[question.tense]);
    else if (audio?.listen) void audio.listen(question.verb);
  }
  function speakRevealedAnswer() {
    if (!state.autoSpeak) return;
    const question = activeQuestion();
    if (!question?.full?.length) return;
    void window.ATELIER_CONJUGATION_AUDIO?.listen?.(question.full[0]);
  }
  function emitStationMistake(question, reason = 'wrong', userAnswer = '') {
    if (!question) return;
    const grp = classifyVerbFallback(library().find(v => v.verbe === question.verb) || question.verb);
    const tenseInfo = tenseCopy[question.tense] || {fr:question.tense, es:'', use:''};
    callbacks.onMistake?.({
      id: question.id,
      kind: 'verb',
      verb: question.verb,
      tense: question.tense,
      subject: question.subject,
      group: grp?.id || '',
      groupId: grp?.id || '',
      groupBadge: grp?.badge || '',
      groupLabel: grp?.short || grp?.badge || '',
      title: `${question.verb} → ${(question.prompt || question.subject).replace(/'/g, '’')} (${tenseInfo.fr})`,
      subtitle: `${question.es || ''} · ${tenseInfo.es || question.tense}${grp?.badge ? ' · ' + grp.badge : ''}`,
      detail: question.full.join(' / '),
      explanation: grp?.memoryTrick ? `${grp.presentFormula || ''}. ${grp.memoryTrick}` : tenseInfo.use,
      userAnswer: String(userAnswer || '').trim(),
      speakText: question.full[0] || question.verb,
      reason
    });
  }
  function newRound(questions, review = false) {
    if (!questions.length) { callbacks.toast('No hay formas disponibles con esta selección. Prueba otro verbo.'); return; }
    state.round = {runId:`verb-train-${Date.now().toString(36)}-${++runCounter}-${Math.random().toString(36).slice(2,8)}`, questions, index:0, answer:'', results:[], wrong:false, helped:false, tip:false, model:false, answered:false, feedback:'', feedbackKind:'', done:false, emitted:false, review};
    refresh('vg-answer'); top(); announceStation();
  }
  function isValidVerbSelection(val) {
    if (!val) return false;
    if (val === 'common' || val === 'all' || val === 'mistakes') return true;
    if (typeof val === 'string' && val.startsWith('group:')) return true;
    return library().some(verb => verb.verbe === val);
  }
  async function start(verbeOptional) {
    state.active = true; state.generation++; state.round = null;
    if (verbeOptional) {
      const name = typeof verbeOptional === 'string' ? verbeOptional : verbeOptional.verbe;
      if (name) state.verb = name;
      if (typeof verbeOptional === 'object' && tenseNames.includes(verbeOptional.tense)) state.tense = verbeOptional.tense;
    }
    const generation=state.generation;
    if (!(await ensureLibrary()) || !state.active || state.generation!==generation) return;
    if (!isValidVerbSelection(state.verb)) state.verb = 'common';
    refresh();
  }
  async function begin() {
    const generation=state.generation;
    if (!(await ensureLibrary()) || !state.active || state.generation!==generation) return;
    newRound(journeyQuestions(pool()));
  }
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
      if (clean) callbacks.onRecover?.(question.id);
      refresh('vg-next'); speakRevealedAnswer();
    } else {
      round.wrong = true; round.feedbackKind = 'wrong';
      round.feedback = question.accepted.some(value => unaccented(value) === unaccented(entered)) ? 'Casi. Revisa los acentos: también forman parte de la conjugación.' : 'Todavía no. Revisa el sujeto y el tiempo; puedes volver a intentarlo.';
      emitStationMistake(question, 'wrong', round.answer);
      refresh('vg-answer');
    }
  }
  function hint() {
    const round = state.round, question = activeQuestion();
    if (!round || round.done || round.answered) return;
    round.helped = true; round.model = true; round.feedbackKind = 'notice'; round.feedback = 'Modelo abierto. Escríbelo y después recupéralo en el repaso.';
    emitStationMistake(question, 'helped', round.answer);
    refresh('vg-answer'); speakRevealedAnswer();
  }
  function tip() {
    const round = state.round, question = activeQuestion();
    if (!round || round.done || round.answered) return;
    round.helped = true; round.tip = true; round.feedbackKind = 'notice';
    round.feedback = 'Truco abierto. Aplícalo y recupera esta forma sin ayuda en el repaso.';
    emitStationMistake(question, 'helped', round.answer);
    refresh('vg-answer');
  }
  function contextualTip(question) {
    const html = window.ATELIER_VERB_TIPS?.renderHint?.(question.verb, question.tense, {subject:question.subject, compact:true});
    return `<div class="vg-tip" role="note" aria-label="Truco de conjugación">${html || '<p>Fíjate en el sujeto y el tiempo. Recuerda una forma conocida de este verbo y busca su familia. Si necesitas la forma completa, abre «Ver modelo».</p>'}</div>`;
  }
  function skip() {
    const round = state.round, question = activeQuestion();
    if (!round || round.done || round.answered) return;
    round.answered = true; round.feedbackKind = 'notice'; round.feedback = 'Guardamos esta forma para repasarla. Mira el modelo y continúa.';
    round.results.push({id:question.id, clean:false, missed:true, assisted:round.helped, skipped:true});
    emitStationMistake(question, 'skipped', round.answer);
    refresh('vg-next'); speakRevealedAnswer();
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
    round.index++; round.answer=''; round.wrong=false; round.helped=false; round.tip=false; round.model=false; round.answered=false; round.feedback=''; round.feedbackKind=''; refresh('vg-answer'); announceStation();
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
    const groups = verbGroupsApi()?.groups || [];
    const mistakeCount = (callbacks.getMistakes?.() || []).filter(m => m?.kind === 'verb' || String(m?.id || '').startsWith('verb|')).length;
    const option=(id,label)=>`<option value="${esc(id)}" ${state.tense===id?'selected':''}>${esc(label)}</option>`;
    const description=tenseCopy[state.tense]?.use || (state.tense==='mixed:subjonctif'?'Alterna una acción presente o futura con una acción anterior. En cada estación verás qué subjuntivo recuperar.':'Alterna los tiempos del recorrido. Cada billete indica el tiempo exacto; la mezcla no incluye tiempos literarios.');
    const activeGroupId = typeof state.verb === 'string' && state.verb.startsWith('group:') ? state.verb.slice(6) : '';
    const activeGroup = groups.find(g => g.id === activeGroupId);
    return `<div class="vg-settings"><label for="vg-verb">Tu recorrido (por grupo, errores o verbo)<select id="vg-verb" data-verb-game-filter="verb"><option value="common" ${state.verb==='common'?'selected':''}>Verbos frecuentes · mezcla</option><option value="all" ${state.verb==='all'?'selected':''}>Toda mi biblioteca · mezcla (566 verbos)</option>${mistakeCount?`<option value="mistakes" ${state.verb==='mistakes'?'selected':''}>🎯 Mis errores de verbos guardados (${mistakeCount})</option>`:''}${groups.length?`<optgroup label="Practicar por grupo o familia verbal">${groups.map(g => {const cnt = rows.filter(v => matchesVerbGroup(v, g.id)).length; return `<option value="group:${esc(g.id)}" ${state.verb===`group:${g.id}`?'selected':''}>${esc(g.short)} (${cnt} verbos)</option>`;}).join('')}</optgroup>`:''}<optgroup label="Un verbo en concreto">${rows.map(verb => `<option value="${esc(verb.verbe)}" ${state.verb===verb.verbe?'selected':''}>${esc(verb.verbe)} · ${esc(verb.es)}</option>`).join('')}</optgroup></select></label><label for="vg-tense">El tiempo<select id="vg-tense" data-verb-game-filter="tense" aria-describedby="vg-route-use">${tenseGroups.map(group=>`<optgroup label="${esc(group.label)}">${tenseNames.filter(tense=>tenseCopy[tense].group===group.id).map(tense=>option(tense,tenseCopy[tense].fr)).join('')}</optgroup>`).join('')}<optgroup label="Mezclas · cambiar de tiempo">${Object.entries(tenseMixes).map(([id,item])=>option(id,item.label)).join('')}</optgroup></select></label></div>
    ${groups.length?`<div class="vg-group-picker" role="group" aria-label="Seleccionar grupo verbal para practicar"><span class="vg-group-picker-label">Filtra al instante por grupo o familia verbal:</span><div class="vg-group-pills">${button('select-group','Frecuentes',`data-group="common" aria-pressed="${state.verb==='common'}"`,'vg-group-pill'+(state.verb==='common'?' is-active':''))}${mistakeCount?button('select-group',`🎯 Mis errores (${mistakeCount})`,`data-group="mistakes" aria-pressed="${state.verb==='mistakes'}"`,'vg-group-pill'+(state.verb==='mistakes'?' is-active':'')):''}${groups.map(g => button('select-group',`${esc(g.code)} · ${esc(g.short.split('(')[0].trim())}`,`data-group="${esc(g.id)}" aria-pressed="${state.verb===`group:${g.id}`}"`,'vg-group-pill'+(state.verb===`group:${g.id}`?' is-active':''))).join('')}</div></div>`:''}
    ${activeGroup?`<aside class="vg-group-trick-card" aria-live="polite"><div class="eyebrow">GRUPO SELECCIONADO · ${esc(activeGroup.badge.toUpperCase())}</div><h3>${esc(activeGroup.title)}</h3><p><strong>Fórmula:</strong> ${esc(activeGroup.presentFormula)} · <strong>${esc(activeGroup.participe)}</strong></p><p><strong>Cómo clasificarlos:</strong> ${esc(activeGroup.howToClassify)}</p><p><strong>💡 Truco para memorizar:</strong> ${esc(activeGroup.memoryTrick)}</p><p class="vg-group-samples"><strong>Ejemplos del grupo:</strong> ${activeGroup.sampleVerbs.map(v=>`<span lang="fr">${esc(v)}</span>`).join(' · ')}</p></aside>`:''}
    <p id="vg-route-use" class="vg-route-use"><strong>Cuándo usarlo</strong> ${esc(description)}</p>`;
  }
  function setup() {
    if (!library().length && !state.loading && !state.loadError) void ensureLibrary();
    return `<section class="vg-page"><div class="vg-intro"><div><div class="eyebrow">RECUPERA · CONJUGA · AVANZA</div><h1>El tren de<br>los <em>verbos.</em></h1><p class="vg-lead">Cada sujeto es una estación con lectura en voz alta. Elige un grupo verbal (-er, -ir con -issant, -ir como partir, -dre, -prendre, -indre, -re, -oir) o tus propios errores guardados.</p><div class="vg-chips"><span>12 familias verbales</span><span>🔊 Voz en cada estación</span><span>Cuaderno de errores</span></div></div>${introArt()}</div><div class="vg-boarding"><div><div class="eyebrow">TU BILLETE DE HOY</div><h2>Elige el grupo o el viaje</h2><p>Practica por grupos morfológicos con sus trucos, combina tiempos o repasa las formas que alguna vez has fallado.</p><a class="vg-text-button" href="#verb-tips">Guía de grupos y trucos de conjugación →</a></div>${state.loading?'<p role="status">Preparando las tablas de tu biblioteca…</p>':state.loadError?`<p>No se han podido abrir las tablas.</p>${button('load','Volver a intentar')}`:`${settings()}<div class="vg-boarding-bottom">${button('start',`¡Al tren! ${arrow}`,pool().length?'':'disabled aria-disabled="true"')}<span>${pool().length?`${pool().length.toLocaleString('es-ES')} estaciones disponibles`:'Este recorrido no tiene formas para este tiempo. Elige otro recorrido.'}</span></div>`}</div><div class="vg-how"><div><span class="vg-how-number">1</span><h3>Escucha y clasifica</h3><p>Cada estación pronuncia el verbo y muestra a qué grupo pertenece (-er, -ir -issant, -dre, etc.).</p></div><div><span class="vg-how-number">2</span><h3>Escribe de memoria</h3><p>Usa el truco de su grupo verbal. Los acentos cuentan.</p></div><div><span class="vg-how-number">3</span><h3>Nada se olvida</h3><p>Todo fallo o pista queda guardado en tu cuaderno privado de errores para repasarlo cuando quieras.</p></div></div><p class="vg-source-note">Formas exactas de tus tablas de conjugación. El passé simple tiene un recorrido opcional para relatos escritos. Las mezclas cotidianas lo dejan fuera.</p></section>`;
  }
  function journey(round) {
    return `<div class="vg-journey" aria-label="${round.results.length} de ${round.questions.length} estaciones completadas"><div class="vg-train-head">${engineSVG()}</div><ol class="vg-carriages">${round.questions.map((question,index) => { const result=round.results[index]; return `<li class="vg-carriage ${result?(result.clean?'vg-complete':'vg-review'):index===round.index?'vg-current':''}" ${!round.done&&index===round.index?'aria-current="step"':''}><span class="vg-carriage-window" aria-hidden="true">${result?(result.clean?'✓':'↻'):index+1}</span><span lang="fr">${esc(question.subject)}</span><span class="sr-only">${result?(result.clean?'recordado sin ayuda':'para repasar'):index===round.index?'estación actual':'pendiente'}</span></li>`; }).join('')}</ol></div>`;
  }
  function source(question) {
    const sources=Array.isArray(question.source)?question.source:[question.source];
    return `<details class="vg-source"><summary>Ver origen de esta forma</summary><p>Tabla ${esc(question.verb)} · ${esc(question.tense)} · sujeto ${esc(question.subject)}.</p>${sources.filter(url=>typeof url==='string'&&/^https:\/\/[^\s]+$/u.test(url)).map(url=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Fuente de la tabla ↗</a>`).join(' ')}</details>`;
  }
  function revealedModel(question, answered) {
    const audio=window.ATELIER_CONJUGATION_AUDIO;
    const preparing=audio && window.ATELIER_CONJUGATION_AUDIO_DATA?.meta?.generationInProgress;
    return `<div class="vg-model"><span>${answered?'FORMA DE TU TABLA':'MODELO · CON AYUDA'}</span>${question.full.map(form=>`<p lang="fr">${esc(form)}${audio?.controls?.(form,{compact:true})||''}</p>`).join('')}${preparing?'<small class="vg-model-audio-note">Algunas formas tienen el audio en preparación.</small>':''}</div>`;
  }
  function questionPage() {
    const round=state.round, question=activeQuestion(), tense=tenseCopy[question.tense], showModel=round.model||round.answered;
    const grp = classifyVerbFallback(library().find(v => v.verbe === question.verb) || question.verb);
    return `<section class="vg-page vg-playing"><div class="vg-game-top">${button('hub','← Cambiar recorrido','','vg-text-button')}<div class="vg-station-audio-tools">${button('speak-station','🔊 Escuchar estación','title="Leer en voz alta el verbo y el sujeto de esta estación"','vg-text-button')}${button('toggle-voice',state.autoSpeak?'🔊 Voz en cada estación: Sí':'🔇 Voz en cada estación: No',`aria-pressed="${state.autoSpeak}"`,'vg-text-button')}</div><span>${round.review?'SEGUNDA VUELTA':'TREN DE LOS VERBOS'} · ESTACIÓN ${round.index+1}/${round.questions.length}</span></div>${journey(round)}<div class="vg-stage"><div class="vg-station-name"><span>PROCHAINE GARE</span><strong lang="fr">${esc(tense.cue)}</strong><small>${esc(tense.es)}</small></div><div class="vg-ticket"><div class="vg-ticket-top"><span>BILLET DE CONJUGAISON · ${esc(grp.badge.toUpperCase())}</span><span>${esc(question.level)} · ${round.index+1<10?'0':''}${round.index+1}</span></div><div class="vg-ticket-verb"><div><h1 lang="fr">${esc(question.verb)} ${button('speak-station','🔊',`aria-label="Escuchar ${esc(question.verb)}" title="Escuchar estación"`,'vg-inline-audio')}</h1><p>${esc(question.es)} · <span class="vg-group-tag">${esc(grp.short || grp.badge)}</span></p></div><span class="vg-tense vg-${tense.tint}" lang="fr">${esc(tense.fr)}</span></div><p class="vg-use-note"><strong>En contexto</strong> ${esc(tense.use)}</p><div class="vg-ticket-perforation"></div><div class="vg-answer-row"><div class="vg-subject"><small>${question.imperative?'PERSONA':'SUJETO'}</small><strong lang="fr">${esc((question.prompt||question.subject).replace(/'/g,'’'))}</strong></div><div class="vg-answer-field"><label for="vg-answer">Escribe la conjugación</label><input id="vg-answer" data-verb-game-input="answer" lang="fr" type="text" value="${esc(round.answer)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Tu respuesta…" ${round.answered?'disabled':''} aria-describedby="vg-answer-help vg-feedback"></div></div><p id="vg-answer-help" class="vg-answer-help">${question.imperative?'Escribe la forma sin pronombre sujeto; conserva el pronombre unido con guion si lo lleva.':question.tense.startsWith('Subjonctif')?'Puedes escribir solo la forma, incluir el sujeto o añadir también que / qu’.':'Puedes escribir solo la forma o incluir el sujeto.'}${question.bodies.length>1?' Se aceptan las variantes de acuerdo recogidas en tu tabla.':''}${question.subject==='vous'&&question.bodies.length>1?' «Vous» puede ser singular o plural.':''}</p><div class="vg-accents" aria-label="Letras con acento">${['à','â','ç','é','è','ê','ë','î','ï','ô','ù','û','ü','œ','’'].map(char=>button('accent',esc(char),`data-char="${esc(char)}" ${round.answered?'disabled':''}`,'vg-accent')).join('')}</div><div class="vg-feedback ${round.feedbackKind?'vg-feedback-'+round.feedbackKind:''}" id="vg-feedback" role="status">${esc(round.feedback||'Recupera la forma sin mirar. Tómate tu tiempo.')}</div>${round.tip?contextualTip(question):''}${showModel?revealedModel(question,round.answered):''}<div class="vg-controls">${round.answered?button('next',`${round.index+1===round.questions.length?'Llegar a destino':'Siguiente estación'} ${arrow}`,'id="vg-next"'):button('check',`Comprobar ${arrow}`)}${!round.answered?`${button('tip','Ver truco del grupo','','vg-text-button')}${button('hint','Ver modelo','','vg-text-button')}${button('skip','Dejar para el repaso','','vg-text-button')}`:''}</div></div></div>${source(question)}<p class="vg-source-note">Cada estación cuenta como recordada cuando aciertas a la primera y sin abrir trucos ni modelos. Los fallos se guardan automáticamente en tu cuaderno privado de errores.</p></section>`;
  }
  function results() {
    const round=state.round, clean=round.results.filter(result=>result.clean).length, total=round.questions.length, pending=round.results.filter(result=>!result.clean), stars=clean===0?0:clean/total>=.8?3:clean/total>=.5?2:1;
    return `<section class="vg-page vg-results"><div class="vg-result-hero">${engineSVG()}<div class="eyebrow">HAS LLEGADO A DESTINO</div><h1 id="vg-result-title" tabindex="-1">¡Buen viaje!</h1><div class="vg-stars" aria-label="${stars} de 3 estrellas de esta ronda">${[1,2,3].map(star=>`<span class="${star<=stars?'vg-earned':''}" aria-hidden="true">★</span>`).join('')}</div><p class="vg-result-score"><strong>${clean}<small>/${total}</small></strong><span>formas recordadas<br>a la primera y sin ayuda</span></p><p>${pending.length?`Te esperan ${pending.length} ${pending.length===1?'forma':'formas'} para una segunda vuelta (y han quedado registradas en tu cuaderno de errores).`:'¡Todas las estaciones superadas sin ayuda! Prueba otro grupo o mezcla los tiempos.'}</p><p class="vg-star-guide">Estrellas de esta ronda: ★ Alguna sin ayuda · ★★ Al menos 50 % · ★★★ Al menos 80 %</p></div>${journey(round)}<div class="vg-result-actions">${pending.length?button('retry',`Repasar ${pending.length} ${pending.length===1?'forma':'formas'} ${arrow}`):button('start',`Otro viaje ${arrow}`)}${button('hub','Elegir otro grupo o recorrido','','vg-button vg-secondary')}<a class="vg-button vg-secondary" href="#mistakes">🔒 Ver mi cuaderno de errores</a></div>${pending.length?`<div class="vg-review-list"><h2>En tu próxima vuelta</h2>${round.questions.filter(question=>pending.some(result=>result.id===question.id)).map(question=>`<div><span><strong lang="fr">${esc(question.verb)}</strong> · ${esc(tenseCopy[question.tense].fr)}</span><span lang="fr">${esc(question.subject)}</span><small>${round.results.find(result=>result.id===question.id)?.assisted?'Con pista':'Para afianzar'}</small></div>`).join('')}</div>`:''}</section>`;
  }
  function render() { return !state.round?setup():state.round.done?results():questionPage(); }
  async function handle(action, element) {
    if (action==='load') { state.loadError=false; await ensureLibrary(); refresh(); }
    else if (action==='start') await begin();
    else if (action==='hub') { state.round=null; refresh(); top(); }
    else if (action==='select-group') {
      const g = element?.dataset?.group;
      if (g) { state.verb = (g==='common'||g==='all'||g==='mistakes') ? g : `group:${g}`; refresh(); }
    }
    else if (action==='speak-station') announceStation(true);
    else if (action==='toggle-voice') { state.autoSpeak=!state.autoSpeak; refresh(); if(state.autoSpeak) announceStation(true); }
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
    if (key==='verb'&&isValidVerbSelection(value)) { state.verb=value; refresh(); }
    if (key==='tense'&&(Object.hasOwn(tenseMixes,value)||tenseNames.includes(value))) { state.tense=value; refresh(); }
  }
  function leave() { state.active=false; state.generation++; state.round=null; }
  if (typeof document!=='undefined') document.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing&&event.target?.id==='vg-answer'){event.preventDefault();check();}});
  window.ATELIER_VERB_GAME={configure(options){Object.assign(callbacks,options||{});},render,handle,change,input,leave,start,tenseOptions:Object.freeze(tenseNames.map(id=>Object.freeze({id,label:tenseCopy[id].fr,group:tenseCopy[id].group,use:tenseCopy[id].use,cue:tenseCopy[id].cue,optional:tenseCopy[id].group==='lecture'})))};
  // Test hooks are available only in a Node harness; browsers receive the public API above.
  if(typeof module!=='undefined'&&module.exports) module.exports={questionsFor,splitSubject,canonical,unaccented,state,check,next,hint,skip,retry,pool,finish,newRound,tenseNames,tenseCopy,tenseMixes,selectedTenses,journeyQuestions};
})();
