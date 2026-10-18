'use strict';
(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalized = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’‘]/g, "'").replace(/œ/g, 'oe').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  const exact = value => String(value ?? '').normalize('NFC').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  const shuffle = list => { const result = [...list]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; };
  const unique = list => [...new Set(list)];
  const format = number => Number(number).toLocaleString('es-ES');
  const tokens = phrase => String(phrase).trim().split(/\s+/u).map((text, index) => ({text, id: `word-${index}`}));
  const levels = ['A0','A1','A2','B1','B2','C1','C2'];
  const modes = {
    listen: {title: 'Escucha y encuentra', subtitle: 'Del oído al significado', description: 'Escucha una expresión y elige qué significa entre cuatro opciones.', instruction: 'Escucha la expresión. Elige su significado en español.', icon: 'listen'},
    build: {title: 'Palabras en su sitio', subtitle: 'Reconstruye lo que oyes', description: 'Ordena las fichas hasta reconstruir la frase exacta del audio.', instruction: 'Escucha y toca las palabras en el orden en que aparecen.', icon: 'build'},
    gap: {title: 'La palabra que falta', subtitle: 'Afina tu escucha', description: 'Descubre el hueco y elige una de las palabras que suenan en esa frase.', instruction: 'Escucha la frase y completa la palabra que falta.', icon: 'gap'},
    memory: {title: 'Parejas con sentido', subtitle: 'Une francés y español', description: 'Encuentra seis parejas y escucha cada expresión al acertar.', instruction: 'Elige dos tarjetas. Cada pareja une una expresión francesa y su significado.', icon: 'memory'}
  };
  const paths = {
    listen: '<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="5" height="9" rx="2"/><rect x="16" y="12" width="5" height="9" rx="2"/>',
    build: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 17h7m-3.5-3.5v7"/>',
    gap: '<path d="M3 7h18M3 12h5m8 0h5M3 17h18"/><rect x="10" y="9" width="4" height="6" rx="1"/>',
    memory: '<rect x="3" y="4" width="8" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/><path d="m5 12 1.5 1.5L9 10m7 2 1.5 1.5L20 10"/>',
    sound: '<path d="m10 4-5 5H2v6h3l5 5ZM14 8a6 6 0 0 1 0 8m4-11a10 10 0 0 1 0 14"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
    light: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.sound}</svg>`;
  const action = (name, label, extra = '', className = 'gm-button') => `<button type="button" class="${className}" data-game-action="${name}" ${extra}>${label}</button>`;
  const state = {filters: {level: '', group: '', category: '', kind: ''}, round: null, catalog: false, clock: false};
  const callbacks = {render() {}, play() {}, toast() {}, onResult() {}, open() {}};
  let timer = null;

  function allRows() {
    const seen = new Set();
    return (Array.isArray(window.ATELIER_EXPRESSIONS) ? window.ATELIER_EXPRESSIONS : []).filter(row => {
      if (!row?.id || !row.fr || !row.es || seen.has(row.id)) return false;
      seen.add(row.id); return true;
    });
  }
  function filteredRows() {
    return allRows().filter(row => (!state.filters.level || row.level === state.filters.level) && (!state.filters.group || row.group === state.filters.group) && (!state.filters.category || row.category === state.filters.category) && (!state.filters.kind || row.kind === state.filters.kind));
  }
  function refresh(focusId) {
    callbacks.render();
    if (focusId && typeof document !== 'undefined') {
      const node = document.getElementById(focusId);
      if (node?.focus) node.focus({preventScroll: true});
    }
  }
  function scrollTop() { if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0,0); }
  function stopTimer() { if (timer !== null) { clearInterval(timer); timer = null; } }
  function elapsed(round) { const seconds = Math.floor(((round.finishedAt || Date.now()) - round.startedAt) / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
  function startTimer() {
    stopTimer();
    if (!state.clock || state.round?.type !== 'memory') return;
    timer = setInterval(() => {
      if (typeof document !== 'undefined') { const node = document.getElementById('gm-timer'); if (node && state.round) node.textContent = elapsed(state.round); }
    }, 1000);
  }
  function play(row, slow = false) { if (row?.audio) callbacks.play(slow && row.audioSlow ? row.audioSlow : row.audio); }

  // Reject equivalent answers before a round is built; the score never depends on an ambiguous option.
  const spanishStops = new Set('a al algo alguien ante como con cuando de del el ella en es esa ese eso esta estar este estoy ha hay la las le les lo los me mi mis muy no nos o para pero por que qué se ser si sí sin soy su sus te tener tiene tu tus un una unas unos y ya yo'.split(' '));
  const conceptFamilies = [
    /\b(hola|buenos dias|buenas tardes|buenas noches|que tal|como estas|como esta usted)\b/,
    /\b(adios|hasta luego|hasta pronto|nos vemos|que te vaya bien|buen viaje)\b/,
    /\b(gracias|agradezco|agradecido|te debo una)\b/,
    /\b(perdon|perdona|perdone|disculpa|disculpe|lo siento|lo lamento)\b/,
    /\b(de acuerdo|estoy de acuerdo|tienes razon|tiene razon|vale|por supuesto|claro que si)\b/,
    /\b(no importa|da igual|no pasa nada|sin importancia|no es grave|ningun problema)\b/,
    /\b(no tengo ni idea|no lo se|no se nada|no lo conozco)\b/,
    /\b(gusto|gustisimo|guste|placer|encantad[oa])\b/,
    /\b(lo mismo|igual|tanto monta|equivalente|equivalencia)\b/,
    /\b(estas bien|esta bien|va bien|vas bien|todo bien|que tal|como estas|como esta usted)\b/,
    /\b(genial|fantastico|fantastica|estupendo|estupenda|buenisimo|buenisima|brutal|increible|maravilloso|maravillosa)\b/,
    /\b(entiendo|comprendo|entendido|comprendido)\b/,
    /\b(cansad[oa]|agotad[oa]|exhaust[oa]|rendid[oa])\b/,
    /\b(energia|plena forma|a tope|lleno de vitalidad|llena de vitalidad)\b/,
    /\b(dificil|complicad[oa]|me cuesta|cuesta mucho)\b/,
    /\b(broma|bromas|bromeando|tomas el pelo|tomando el pelo|cachondeo)\b/,
    /\b(de nada|no hay de que|a ti|a usted)\b/
  ];
  function meaningWords(value) { return new Set(normalized(value).split(' ').filter(word => word.length > 2 && !spanishStops.has(word)).map(word => word.length > 5 ? word.replace(/(?:mente|ando|iendo|ados|idas|ado|ido|es|os|as)$/u, '') : word)); }
  function similarMeaning(a, b) {
    const left = normalized(a.es), right = normalized(b.es);
    if (left === right) return true;
    if (Math.min(left.length, right.length) >= 9 && (` ${left} `.includes(` ${right} `) || ` ${right} `.includes(` ${left} `))) return true;
    const leftAlternatives = String(a.es).split(/[/;]|\bo bien\b/iu).map(normalized).filter(x => x.length > 4);
    const rightAlternatives = String(b.es).split(/[/;]|\bo bien\b/iu).map(normalized).filter(x => x.length > 4);
    if (leftAlternatives.some(x => rightAlternatives.includes(x))) return true;
    if (conceptFamilies.some(pattern => pattern.test(left) && pattern.test(right))) return true;
    const aa = meaningWords(left), bb = meaningWords(right), overlap = [...aa].filter(word => bb.has(word)).length;
    if (overlap > 0) return true;
    return false;
  }
  function uniqueRows(rows, meanings = false) {
    const french = new Set(), audio = new Set(), spanish = new Set();
    return rows.filter(row => {
      const fr = normalized(row.fr), es = normalized(row.es);
      if (french.has(fr) || (row.audio && audio.has(row.audio)) || (meanings && spanish.has(es))) return false;
      french.add(fr); if (row.audio) audio.add(row.audio); spanish.add(es); return true;
    });
  }
  const frenchStops = new Set("alors aussi avec avez avons bien c'est cette comme dans des elle elles encore entre est et eux fait ici ils j'ai je la le les leur lui mais me mes moi mon ne nos notre nous on ont ou par pas plus pour qu'il que qui sa sans se ses si son sont sur ta te tes toi ton tous tout tres tu un une vos votre vous y".split(' '));
  function gapData(row) {
    const words = tokens(row.fr), clean = word => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    const candidates = words.map((word, index) => ({index, token: word.text, answer: clean(word.text)})).filter(candidate => {
      const key = normalized(candidate.answer);
      return /^[\p{L}][\p{L}’'-]*[\p{L}]$/u.test(candidate.answer) && candidate.answer.length >= 3 && !frenchStops.has(key) && words.filter(word => normalized(clean(word.text)) === key).length === 1;
    });
    // Every choice is from the exact recording; repeated or punctuation-only words cannot become a gap.
    const choiceKeys = new Set();
    const choices = words.map(word => clean(word.text)).filter(word => { const key = normalized(word); if (!/^[\p{L}][\p{L}’'-]*[\p{L}]$/u.test(word) || word.length < 2 || choiceKeys.has(key)) return false; choiceKeys.add(key); return true; });
    return {words, candidates, choices};
  }
  function eligible(type, rows = filteredRows()) {
    return uniqueRows(rows.filter(row => {
      if (!row.audio) return false;
      if ((type === 'listen' || type === 'memory') && row.meaningSafe === false) return false;
      if (type === 'build') { const length = tokens(row.fr).length; return length >= 3 && length <= 22; }
      if (type === 'gap') { const data = gapData(row); return data.words.length >= 4 && data.words.length <= 28 && data.candidates.length > 0 && data.choices.length >= 4; }
      return true;
    }), type === 'listen' || type === 'memory');
  }
  function meaningOptions(target, pool) {
    const choices = [target];
    const candidates = shuffle(pool.filter(row => row.id !== target.id)).sort((a,b) => Number(a.category === target.category) - Number(b.category === target.category));
    for (const row of candidates) {
      if (choices.every(chosen => normalized(chosen.fr) !== normalized(row.fr) && chosen.audio !== row.audio && !similarMeaning(chosen, row))) choices.push(row);
      if (choices.length === 4) return shuffle(choices);
    }
    return [];
  }
  function memoryRows(pool, preferredIds) {
    const selected = [];
    const rows = preferredIds ? pool.filter(row => preferredIds.includes(row.id)) : shuffle(pool);
    for (const row of rows) { if (selected.every(other => !similarMeaning(row, other))) selected.push(row); if (selected.length === 6) break; }
    return selected;
  }
  function sourceView(row) {
    const source = typeof row.source === 'string' ? row.source : JSON.stringify(row.source || 'Biblioteca personal de francés');
    const sourceContent = /^https:\/\/[^\s]+$/i.test(source) ? `<a href="${escape(source)}" target="_blank" rel="noopener noreferrer">Abrir la fuente original ↗</a>` : escape(source);
    return `<details class="gm-source"><summary>Ver fuente de esta expresión</summary><p>${sourceContent}</p><p>ID: ${escape(row.id)} · ${escape(row.group || '')}</p>${action('open-source', 'Abrir ficha de origen', `data-id="${escape(row.id)}"`, 'gm-quiet')}${row.originalFrench && exact(row.originalFrench) !== exact(row.fr) ? `<p>Ficha original: <span lang="fr">${escape(row.originalFrench)}</span></p><p>El juego utiliza la frase completa de la grabación.</p>` : ''}</details>`;
  }
  function tags(row) { return `<span class="gm-tags"><span>${escape(row.level || 'Sin nivel')}</span><span>${escape(row.situation || row.group || 'Expresión cotidiana')}</span>${row.kind === 'idiom' ? '<span>Frase hecha</span>' : ''}</span>`; }
  function cardArt(id){
    const art={listen:'<span class="play-orb">♫</span><div class="sound-bars">'+[24,42,68,90,61,39,66,44,26].map(h=>`<i style="height:${h}px"></i>`).join('')+'</div>',build:'<span class="tile">Ça</span><span class="tile tilted">marche</span><span class="tile gold">!</span>',gap:'<img src="illustrations/lune.svg" alt=""><span class="bubble" lang="fr">dans la <b>?</b></span>',memory:'<span class="mini-card" lang="fr">Avec<br>plaisir.</span><span class="mini-card gold">Con<br>gusto.</span>'};
    return `<div class="play-card-art art-${id}" aria-hidden="true">${art[id]}</div>`;
  }
  function hub() {
    const all = allRows(), rows = filteredRows();
    const sortedLevels = unique(all.map(row => row.level).filter(Boolean)).sort((a,b) => (levels.includes(a) ? levels.indexOf(a) : 99) - (levels.includes(b) ? levels.indexOf(b) : 99) || a.localeCompare(b));
    const groups = unique(all.filter(row => !state.filters.level || row.level === state.filters.level).map(row => row.group).filter(Boolean)).sort((a,b) => a.localeCompare(b, 'es'));
    const categories = unique(all.filter(row => !state.filters.level || row.level === state.filters.level).map(row => row.category).filter(Boolean)).sort((a,b) => a.localeCompare(b, 'es'));
    const samples = [...rows.filter(row => row.kind === 'idiom'), ...rows.filter(row => row.kind !== 'idiom')].slice(0, state.catalog ? 24 : 3);
    return `<section class="gm-page"><div class="gm-heading"><div><div class="eyebrow">JUGAR · ESCUCHAR · RECORDAR</div><h1>Les mots prennent <em>vie.</em></h1><p class="gm-lead">Expresiones cotidianas y frases hechas de tus propios materiales. Descubre su sentido, escucha cómo suenan y juega con sus palabras.</p></div><div class="gm-hero-art" aria-hidden="true"><span class="gm-art-card gm-art-french">Ça marche !<small>♪</small></span><span class="gm-art-card gm-art-spanish">¡De acuerdo!<small>↔</small></span><span class="gm-art-caption">un peu de jeu, beaucoup de français</span></div></div><div class="play-crosslink"><span>¿Te apetece jugar con imágenes?</span><a href="#adventure">Explora el mercado y las escenas →</a></div><div class="gm-intro"><strong>${format(all.length)} expresiones en tu biblioteca</strong><span>4 formas de practicar · audios de tu biblioteca · sin límite de tiempo</span></div><div class="gm-filterbar"><label>Nivel<select id="gm-level" data-game-filter="level"><option value="">Todos los niveles</option>${sortedLevels.map(level => `<option value="${escape(level)}" ${state.filters.level === level ? 'selected' : ''}>${escape(level)}</option>`).join('')}</select></label><label>Grupo<select id="gm-group" data-game-filter="group"><option value="">Todos los grupos</option>${groups.map(group => `<option value="${escape(group)}" ${state.filters.group === group ? 'selected' : ''}>${escape(group)}</option>`).join('')}</select></label><label>Tema<select id="gm-category" data-game-filter="category"><option value="">Todos los temas</option>${categories.map(category => `<option value="${escape(category)}" ${state.filters.category === category ? 'selected' : ''}>${escape(category)}</option>`).join('')}</select></label><label>Tipo<select id="gm-kind" data-game-filter="kind"><option value="">Todas las expresiones</option><option value="idiom" ${state.filters.kind === 'idiom' ? 'selected' : ''}>Frases hechas</option><option value="everyday" ${state.filters.kind === 'everyday' ? 'selected' : ''}>Expresiones cotidianas</option></select></label><span class="gm-filter-count">${format(rows.length)} expresiones en la selección</span>${Object.values(state.filters).some(Boolean) ? action('clear-filters', 'Quitar filtros', '', 'gm-quiet') : ''}</div><div class="gm-mode-grid">${Object.entries(modes).map(([id, mode], index) => {
      const count = eligible(id).length, min = id === 'listen' ? 4 : id === 'memory' ? 2 : 1;
      return `<article class="gm-mode-card gm-mode-${id}">${cardArt(id)}<div class="gm-mode-top"><span class="gm-mode-icon">${icon(mode.icon)}</span><span class="gm-mode-number">0${index+1}</span></div><p class="gm-mode-subtitle">${mode.subtitle}</p><h2>${mode.title}</h2><p>${mode.description}</p><div class="gm-mode-bottom"><span>${id === 'memory' ? 'HASTA 6 PAREJAS' : 'HASTA 8 PREGUNTAS'} · ${format(count)} FRASES</span>${action('start', `Jugar ${icon('arrow')}`, `data-mode="${id}" ${count < min ? 'disabled' : ''}`)}</div>${count < min ? '<p class="gm-unavailable">Amplía los filtros para reunir suficientes frases.</p>' : ''}</article>`;
    }).join('')}</div><div class="gm-footnote"><span>${icon('light')}</span><p>Repetir el audio forma parte de la práctica. Si miras una pista, el resultado lo indicará. Al terminar podrás repasar solo lo que necesites.</p><label class="gm-clock-choice"><input type="checkbox" data-game-filter="clock" ${state.clock ? 'checked' : ''}> Mostrar reloj en parejas <small>Sin límite ni penalización</small></label></div><div class="section-head"><div><h2>De tu biblioteca a la vida</h2><p>Las mismas frases que ya tienes, con su audio y su fuente.</p></div>${action('catalog', state.catalog ? 'Ver menos' : 'Explorar frases', '', 'gm-quiet')}</div>${rows.length ? `<div class="gm-sample-grid">${samples.map(row => `<article class="gm-sample">${tags(row)}<h3 lang="fr">${escape(row.fr)}</h3><p>${escape(row.es)}</p>${action('preview', `${icon('sound')} Escuchar`, `data-id="${escape(row.id)}"`, 'gm-quiet')}${sourceView(row)}</article>`).join('')}</div>${state.catalog && rows.length > 24 ? '<p class="gm-small">Se muestran 24 expresiones. Cambia los filtros para explorar otras; los juegos utilizan toda la selección.</p>' : ''}` : '<p class="gm-empty">No hay expresiones con estos filtros.</p>'}</section>`;
  }
  function start(type, reviewIds) {
    if (!modes[type]) return;
    stopTimer();
    const pool = eligible(type), targets = reviewIds ? pool.filter(row => reviewIds.includes(row.id)) : shuffle(pool);
    let questions;
    if (type === 'listen') questions = targets.map(row => ({row, options: meaningOptions(row, pool)})).filter(question => question.options.length === 4).slice(0,8);
    else if (type === 'memory') questions = memoryRows(pool, reviewIds).map(row => ({row}));
    else questions = targets.slice(0,8).map(row => {
      if (type === 'build') return {row, words: tokens(row.fr), bank: shuffle(tokens(row.fr))};
      const data = gapData(row), gap = shuffle(data.candidates)[0];
      const alternatives = shuffle(data.choices.filter(word => normalized(word) !== normalized(gap.answer))).slice(0,3);
      return {row, words: data.words, gap, options: shuffle([gap.answer, ...alternatives])};
    });
    if (!questions.length || (type === 'memory' && questions.length < 2 && !reviewIds)) { callbacks.toast('Esta selección no reúne suficientes frases distintas. Amplía los filtros.'); return; }
    state.round = {runId:'expression-'+Date.now()+'-'+Math.random().toString(36).slice(2),type, questions, index:0, answered:false, selected:null, picked:[], hint:false, source:false, feedback:'', feedbackKind:'', results:[], emitted:false, done:false, startedAt:Date.now(), finishedAt:null, review:Boolean(reviewIds), memory:{cards:[], flipped:[], matched:[], wrong:[], assisted:[], lastMatch:null, attempts:0, mismatch:false}};
    if (type === 'memory') state.round.memory.cards = shuffle(questions.flatMap(({row}) => [{key:`${row.id}-fr`, id:row.id, side:'fr', text:row.fr}, {key:`${row.id}-es`, id:row.id, side:'es', text:row.es}]));
    refresh('gm-question'); scrollTop(); startTimer();
    if (type !== 'memory') play(questions[0].row);
  }
  function current() { return state.round?.questions[state.round.index]; }
  function rememberAnswer(ok) {
    const round = state.round;
    if (!round || round.answered || round.done) return;
    round.results.push({id:current().row.id, ok:Boolean(ok), assisted:round.hint});
    round.answered = true;
    round.feedbackKind = ok ? 'correct' : 'wrong';
    round.feedback = ok ? (round.hint ? 'Correcto con ayuda. Esta frase irá al repaso.' : '¡Bien! Lo has reconocido sin ayuda.') : 'Esta vez no. Escucha el modelo y guarda la frase para el repaso.';
  }
  function finish() {
    const round = state.round;
    if (!round || round.done) return;
    stopTimer(); round.done = true; round.finishedAt = Date.now();
    if (round.type === 'memory') round.results = round.questions.map(({row}) => ({id:row.id, ok:!round.memory.wrong.includes(row.id), assisted:round.memory.assisted.includes(row.id)}));
    if (!round.emitted) {
      round.emitted = true;
      callbacks.onResult({runId:round.runId,type:round.type, ids:round.results.map(result => result.id), correct:round.results.filter(result => result.ok && !result.assisted).length, total:round.results.length, missed:unique(round.results.filter(result => !result.ok).map(result => result.id)), assisted:unique(round.results.filter(result => result.assisted).map(result => result.id))});
    }
    refresh('gm-results-title'); scrollTop();
  }
  function audioControls(row) { return `<div class="gm-audio-controls">${action('play', `${icon('sound')} ${state.round?.type === 'memory' ? 'Escuchar la pareja' : 'Escuchar de nuevo'}`, '', 'gm-button gm-secondary')}${row.audioSlow ? action('slow', 'Audio lento', '', 'gm-quiet') : ''}</div>`; }
  function roundHeader(round) {
    const count = round.type === 'memory' ? round.memory.matched.length : round.index + (round.answered ? 1 : 0), total = round.questions.length;
    return `<div class="gm-round-nav">${action('hub', `${icon('back')} Volver a los juegos`, '', 'gm-quiet')}<span>${round.review ? 'REPASO PERSONAL' : 'UNA RONDA, A TU RITMO'}</span></div><div class="gm-round-heading"><div><p class="gm-mode-subtitle">${modes[round.type].subtitle}</p><h1>${modes[round.type].title}</h1></div><div class="gm-counter"><strong>${count}<span> / ${total}</span></strong><small>${round.type === 'memory' ? 'parejas encontradas' : 'preguntas respondidas'}</small></div></div><div class="gm-progress" role="progressbar" aria-label="Progreso de la ronda" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${count}"><span style="width:${total ? count / total * 100 : 0}%"></span></div>`;
  }
  function feedbackView(question) {
    const round = state.round;
    if (!round.answered) return '';
    return `<div id="gm-feedback" class="gm-feedback gm-${round.feedbackKind}" role="status" tabindex="-1"><strong>${escape(round.feedback)}</strong><p lang="fr">${escape(question.row.fr)}</p><p>${escape(question.row.es)}</p>${sourceView(question.row)}</div>`;
  }
  function questionView() {
    const round = state.round, question = current(), row = question.row;
    let body;
    if (round.type === 'listen') body = `<div class="gm-listen-callout"><span class="gm-listen-circle">${icon('listen')}</span><h2 id="gm-question" tabindex="-1">¿Qué significa lo que oyes?</h2><p>Elige la opción que mejor corresponde al audio.</p>${audioControls(row)}${round.hint && !round.answered ? `<p class="gm-hint" lang="fr">${escape(row.fr)}</p>` : ''}</div><div class="gm-choice-grid">${question.options.map((option, index) => action('answer-meaning', `<span class="gm-choice-number" aria-hidden="true">${index+1}</span><span>${escape(option.es)}</span>${round.answered && option.id === row.id ? '<span class="gm-answer-symbol" aria-label="Respuesta correcta">✓</span>' : ''}`, `data-id="${escape(option.id)}" ${round.answered ? 'disabled' : ''}`, `gm-choice ${round.answered && option.id === row.id ? 'is-correct' : round.answered && round.selected === option.id ? 'is-wrong' : ''}`)).join('')}</div>`;
    else if (round.type === 'build') {
      const available = question.bank.filter(word => !round.picked.includes(word.id));
      body = `<div class="gm-question-card"><h2 id="gm-question" tabindex="-1">Ponle palabras a lo que escuchas</h2><p>Coloca todas las fichas. La puntuación forma parte de la frase.</p>${audioControls(row)}${round.hint && !round.answered ? `<div class="gm-hint"><span lang="fr">${escape(row.fr)}</span><small>${escape(row.es)}</small></div>` : ''}<div class="gm-answer-zone" aria-label="Tu frase, palabras elegidas">${round.picked.length ? round.picked.map((id, index) => { const word = question.words.find(word => word.id === id); return action('unpick', `<span lang="fr">${escape(word.text)}</span><span class="sr-only">. Quitar palabra ${index+1}</span>`, `data-index="${index}" ${round.answered ? 'disabled' : ''}`, 'gm-token gm-token-picked'); }).join('') : '<p>Tu frase aparecerá aquí…</p>'}</div><p class="gm-token-count">${round.picked.length} de ${question.words.length} palabras colocadas</p><div class="gm-token-bank" aria-label="Palabras disponibles">${available.map(word => action('pick', `<span lang="fr">${escape(word.text)}</span>`, `data-token="${word.id}" id="gm-${word.id}" ${round.answered ? 'disabled' : ''}`, 'gm-token')).join('') || '<span class="gm-small">Todas las palabras están colocadas.</span>'}</div><div class="gm-build-actions">${action('undo', '↶ Deshacer', `id="gm-undo" ${!round.picked.length || round.answered ? 'disabled' : ''}`, 'gm-quiet')}${action('reset-words', 'Reiniciar frase', `${!round.picked.length || round.answered ? 'disabled' : ''}`, 'gm-quiet')}${action('check-build', 'Comprobar mi frase', `id="gm-check" ${round.picked.length !== question.words.length || round.answered ? 'disabled' : ''}`)}</div></div>`;
    } else {
      const gapText = question.words.map((word,index) => index === question.gap.index ? `${escape(word.text.slice(0, word.text.indexOf(question.gap.answer)))}<span class="gm-blank" aria-label="Palabra que falta">&nbsp;?&nbsp;</span>${escape(word.text.slice(word.text.indexOf(question.gap.answer) + question.gap.answer.length))}` : escape(word.text)).join(' ');
      body = `<div class="gm-question-card gm-gap-card"><h2 id="gm-question" tabindex="-1">Una palabra cambia la frase</h2><p>Las cuatro opciones aparecen en el audio. Encuentra la que encaja en el hueco.</p>${audioControls(row)}<p class="gm-gap-sentence" lang="fr">${gapText}</p>${round.hint && !round.answered ? `<p class="gm-hint">Pista: empieza por <strong lang="fr">${escape(question.gap.answer.slice(0,1))}…</strong>. ${escape(row.es)}</p>` : ''}<div class="gm-word-choices">${question.options.map(word => action('answer-gap', `<span lang="fr">${escape(word)}</span>${round.answered && word === question.gap.answer ? '<span aria-label="Respuesta correcta"> ✓</span>' : ''}`, `data-word="${escape(word)}" ${round.answered ? 'disabled' : ''}`, `gm-choice ${round.answered && word === question.gap.answer ? 'is-correct' : round.answered && round.selected === word ? 'is-wrong' : ''}`)).join('')}</div></div>`;
    }
    return `<section class="gm-page gm-round">${roundHeader(round)}<p class="gm-round-instruction">${escape(modes[round.type].instruction)}</p>${tags(row)}${body}${feedbackView(question)}<div class="gm-round-actions">${round.answered ? action('next', `${round.index + 1 === round.questions.length ? 'Ver resultado' : 'Siguiente frase'} ${icon('arrow')}`, 'id="gm-next"') : `${action('hint', `${icon('light')} ${round.hint ? 'Pista mostrada' : 'Ver una pista'}`, `${round.hint ? 'disabled' : ''}`, 'gm-quiet')}${action('skip', 'No la sé · Ver solución', '', 'gm-quiet')}`}</div><p class="gm-honest-note">${round.hint ? 'Has visto una pista. La frase se guardará para repasar, aunque aciertes.' : 'Puedes repetir el audio cuantas veces quieras; no cuenta como ayuda.'}</p></section>`;
  }
  function memoryView() {
    const round = state.round, memory = round.memory, allMatched = memory.matched.length === round.questions.length;
    const lastRow = round.questions.find(question => question.row.id === memory.lastMatch)?.row;
    return `<section class="gm-page gm-round">${roundHeader(round)}<div class="gm-memory-intro"><div><h2 id="gm-question" tabindex="-1">Dos lenguas. El mismo sentido.</h2><p>${escape(modes.memory.instruction)}</p></div>${state.clock ? `<span class="gm-timer" aria-label="Tiempo transcurrido"><span aria-hidden="true">◷</span> <span id="gm-timer">${elapsed(round)}</span></span>` : '<span class="gm-no-rush">Sin prisa.</span>'}</div><div class="gm-memory-grid">${memory.cards.map((card, index) => { const matched = memory.matched.includes(card.id), flipped = memory.flipped.includes(card.key), visible = matched || flipped || round.hint; return action('flip', visible ? `<span class="gm-memory-language">${card.side === 'fr' ? 'FRANÇAIS' : 'ESPAÑOL'}</span><span class="gm-memory-text" lang="${card.side}">${escape(card.text)}</span>${matched ? '<span class="gm-memory-mark" aria-hidden="true">✓</span>' : ''}` : `<span class="gm-memory-back" aria-hidden="true">${card.side === 'fr' ? 'fr' : 'es'}</span><span class="gm-memory-back-label">${card.side === 'fr' ? 'FRANCÉS' : 'ESPAÑOL'}</span>`, `data-key="${escape(card.key)}" id="gm-card-${index}" aria-label="${visible ? escape(`${card.side === 'fr' ? 'Francés' : 'Español'}: ${card.text}${matched ? ', pareja encontrada' : ''}`) : `Tarjeta ${index + 1}, ${card.side === 'fr' ? 'francés' : 'español'}, boca abajo`}" aria-pressed="${flipped ? 'true' : 'false'}" ${matched || flipped || memory.mismatch || allMatched ? 'disabled' : ''}`, `gm-memory-card ${visible ? 'is-visible' : ''} ${matched ? 'is-matched' : ''} ${flipped && memory.mismatch ? 'is-mismatch' : ''}`); }).join('')}</div><div id="gm-memory-feedback" class="gm-memory-feedback ${memory.mismatch ? 'gm-wrong' : lastRow ? 'gm-correct' : ''}" role="status" tabindex="-1">${memory.mismatch ? '<strong>Estas tarjetas no forman pareja.</strong><p>Quédate con las dos frases y vuelve a intentarlo.</p>' : lastRow ? `<strong>¡Pareja encontrada!</strong><p><span lang="fr">${escape(lastRow.fr)}</span> · ${escape(lastRow.es)}</p>` : 'Abre una tarjeta en francés y busca su significado en español.'}</div>${lastRow && !memory.mismatch ? `<div class="gm-memory-audio">${audioControls(lastRow)}${sourceView(lastRow)}</div>` : ''}<div class="gm-round-actions">${allMatched ? action('finish-memory', `Ver resultado ${icon('arrow')}`) : memory.mismatch ? action('clear-flips', 'Continuar buscando', 'id="gm-continue"') : action('hint-memory', `${icon('light')} ${round.hint ? 'Ocultar parejas de ayuda' : 'Ver todas las parejas de ayuda'}`, '', 'gm-quiet')}</div>${round.hint ? `<div class="gm-memory-help"><h3>Las parejas de esta ronda</h3>${round.questions.map(({row}) => `<p><span lang="fr">${escape(row.fr)}</span><span>${escape(row.es)}</span></p>`).join('')}<p class="gm-small">Estas parejas se guardarán como práctica con ayuda.</p></div>` : ''}<p class="gm-honest-note">${memory.attempts} intentos de pareja. Las tarjetas que participen en un error irán al repaso. El reloj no afecta al resultado.</p></section>`;
  }
  function resultsView() {
    const round = state.round, clean = round.results.filter(result => result.ok && !result.assisted), assisted = round.results.filter(result => result.assisted), review = round.results.filter(result => !result.ok || result.assisted);
    return `<section class="gm-page gm-round">${roundHeader(round)}<div class="gm-results"><div class="play-stars" aria-label="${clean.length/round.results.length>=.8?3:clean.length/round.results.length>=.5?2:clean.length?1:0} de 3 estrellas de la ronda">${[1,2,3].map(n=>`<span class="${n<=(clean.length/round.results.length>=.8?3:clean.length/round.results.length>=.5?2:clean.length?1:0)?'earned':''}">★</span>`).join('')}</div><p class="gm-mode-subtitle">+${10+clean.length*5} PUNTOS DE JUEGO · RONDA TERMINADA</p><h2 id="gm-results-title" tabindex="-1">Tu oído se está entrenando.</h2><p class="gm-results-score">${clean.length}<span> / ${round.results.length}</span></p><p>Aciertos al primer intento y sin pistas${round.type === 'memory' ? '<br><small>En parejas: encontradas sin errores previos ni ayuda.</small>' : ''}</p><div class="gm-result-stats"><span><strong>${assisted.length}</strong> con ayuda</span><span><strong>${review.length}</strong> para repasar</span>${state.clock && round.type === 'memory' ? `<span><strong>${elapsed(round)}</strong> a tu ritmo</span>` : ''}</div><p class="gm-small">Estrellas de recuerdo: 1 por algún acierto sin ayuda, 2 desde el 50 % y 3 desde el 80 %.</p><p class="gm-result-encouragement">${review.length ? 'Vuelve a escuchar las frases que te hicieron dudar. Reconocerlas la próxima vez también es progreso.' : 'Has completado la ronda sin errores ni pistas. Prueba otro juego para escuchar estas expresiones de otra manera.'}</p><div class="gm-result-actions">${review.length ? action('review', `Repasar ${review.length} ${review.length === 1 ? 'frase' : 'frases'} ${icon('arrow')}`) : ''}${action('again', 'Otra ronda', '', 'gm-button gm-secondary')}${action('hub', 'Elegir otro juego', '', 'gm-quiet')}</div></div>${review.length ? `<div class="section-head"><div><h2>Las frases que volverás a encontrar</h2><p>Tu repaso conserva la frase y el audio exactos de la biblioteca.</p></div></div><div class="gm-review-list">${review.map(result => { const row = round.questions.find(question => question.row.id === result.id).row; return `<article>${tags(row)}<h3 lang="fr">${escape(row.fr)}</h3><p>${escape(row.es)}</p><div class="gm-review-bottom">${action('preview', `${icon('sound')} Escuchar`, `data-id="${escape(row.id)}"`, 'gm-quiet')}<span>${result.assisted ? 'Con ayuda' : 'Error en el primer intento'}</span></div>${sourceView(row)}</article>`; }).join('')}</div>` : ''}</section>`;
  }
  function render() { if (!state.round) return hub(); if (state.round.done) return resultsView(); return state.round.type === 'memory' ? memoryView() : questionView(); }
  function handle(name, element) {
    const round = state.round, data = element?.dataset || {};
    if (name === 'start') return start(data.mode);
    if (name === 'hub') { stopTimer(); state.round = null; refresh(); scrollTop(); return; }
    if (name === 'clear-filters') { state.filters = {level:'',group:'',category:'',kind:''}; refresh('gm-level'); return; }
    if (name === 'catalog') { state.catalog = !state.catalog; refresh(); return; }
    if (name === 'open-source') { callbacks.open(data.id); return; }
    if (name === 'preview') { play(allRows().find(row => row.id === data.id)); return; }
    if (!round) return;
    if (name === 'again') return start(round.type);
    if (name === 'review' && round.done) return start(round.type, round.results.filter(result => !result.ok || result.assisted).map(result => result.id));
    if (round.done) return;
    if (name === 'play' || name === 'slow') {
      const row = round.type === 'memory' ? round.questions.find(question => question.row.id === round.memory.lastMatch)?.row : current().row;
      play(row, name === 'slow'); return;
    }
    if (name === 'next' && round.answered) {
      if (round.index + 1 === round.questions.length) return finish();
      round.index++; round.answered=false; round.selected=null; round.picked=[]; round.hint=false; round.feedback=''; round.feedbackKind=''; refresh('gm-question'); scrollTop(); play(current().row); return;
    }
    if (round.type === 'memory') {
      const memory = round.memory;
      if (name === 'finish-memory' && memory.matched.length === round.questions.length) return finish();
      if (name === 'hint-memory') { round.hint = !round.hint; if (round.hint) memory.assisted = unique([...memory.assisted, ...round.questions.filter(question => !memory.matched.includes(question.row.id)).map(question => question.row.id)]); refresh('gm-question'); return; }
      if (name === 'clear-flips' && memory.mismatch) { memory.flipped=[]; memory.mismatch=false; memory.lastMatch=null; refresh('gm-question'); return; }
      if (name !== 'flip' || memory.mismatch || memory.flipped.length >= 2) return;
      const card = memory.cards.find(card => card.key === data.key);
      if (!card || memory.matched.includes(card.id) || memory.flipped.includes(card.key)) return;
      memory.flipped.push(card.key);
      if (memory.flipped.length === 2) {
        const [one,two] = memory.flipped.map(key => memory.cards.find(card => card.key === key));
        memory.attempts++;
        if (one.id === two.id && one.side !== two.side) { memory.matched.push(one.id); memory.lastMatch=one.id; memory.flipped=[]; const nextCard=memory.cards.findIndex(other => !memory.matched.includes(other.id)); refresh(nextCard >= 0 ? `gm-card-${nextCard}` : 'gm-memory-feedback'); play(round.questions.find(question => question.row.id === one.id).row); }
        else { memory.wrong=unique([...memory.wrong,one.id,two.id]); memory.mismatch=true; memory.lastMatch=null; refresh('gm-memory-feedback'); }
      } else refresh(`gm-card-${memory.cards.findIndex(other => !memory.flipped.includes(other.key) && !memory.matched.includes(other.id) && other.side !== card.side)}`);
      return;
    }
    if (round.answered) return;
    const question = current();
    if (name === 'hint') { round.hint=true; refresh('gm-question'); return; }
    if (name === 'skip') { rememberAnswer(false); refresh('gm-feedback'); play(question.row); return; }
    if (name === 'answer-meaning' && round.type === 'listen' && question.options.some(option => option.id === data.id)) { round.selected=data.id; rememberAnswer(data.id === question.row.id); refresh('gm-feedback'); return; }
    if (name === 'answer-gap' && round.type === 'gap' && question.options.includes(data.word)) { round.selected=data.word; rememberAnswer(data.word === question.gap.answer); refresh('gm-feedback'); return; }
    if (round.type !== 'build') return;
    if (name === 'pick' && question.words.some(word => word.id === data.token) && !round.picked.includes(data.token)) { round.picked.push(data.token); const next = question.bank.find(word => !round.picked.includes(word.id)); refresh(next ? `gm-${next.id}` : 'gm-check'); return; }
    if (name === 'unpick' && Number.isInteger(Number(data.index)) && Number(data.index) >= 0 && Number(data.index) < round.picked.length) { const [id]=round.picked.splice(Number(data.index),1); refresh(`gm-${id}`); return; }
    if (name === 'undo' && round.picked.length) { const id=round.picked.pop(); refresh(`gm-${id}`); return; }
    if (name === 'reset-words') { round.picked=[]; refresh(`gm-${question.bank[0].id}`); return; }
    if (name === 'check-build' && round.picked.length === question.words.length) { const answer=round.picked.map(id => question.words.find(word => word.id === id).text).join(' '); rememberAnswer(exact(answer) === exact(question.row.fr)); refresh('gm-feedback'); }
  }
  function change(event) {
    const target=event?.target, filter=target?.dataset?.gameFilter;
    if (!filter || state.round) return;
    if (filter === 'clock') state.clock=Boolean(target.checked);
    else if (Object.prototype.hasOwnProperty.call(state.filters, filter)) { state.filters[filter]=String(target.value || ''); if (filter === 'level') for (const key of ['group','category']) if (state.filters[key] && !allRows().some(row => (!state.filters.level || row.level === state.filters.level) && row[key] === state.filters[key])) state.filters[key]=''; }
    refresh(filter === 'clock' ? null : `gm-${filter}`);
  }
  window.ATELIER_GAMES = {configure(options = {}) { for (const key of Object.keys(callbacks)) if (typeof options[key] === 'function') callbacks[key]=options[key]; }, render, handle, change, input() {}, leave() { stopTimer(); state.round=null; }};
})();
