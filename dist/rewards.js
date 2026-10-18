(function () {
  'use strict';
  const MAX_EVENTS = 2000, LEVEL_XP = 150;
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const localDay = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const dayNumber = day => { const [y,m,d] = day.split('-').map(Number); return Math.floor(Date.UTC(y,m-1,d)/86400000); };
  const ids = value => Array.isArray(value) ? [...new Set(value.filter(x => typeof x === 'string' && x.length > 0 && x.length <= 200))].slice(0,1000) : [];
  function cleanEvent(value, fallbackId) {
    if (!value || typeof value !== 'object') return null;
    const runId = value.runId || fallbackId;
    if (typeof runId !== 'string' || !/^[\w:.-]{1,200}$/.test(runId) || ['__proto__','constructor','prototype'].includes(runId)) return null;
    if (typeof value.type !== 'string' || !/^[\w-]{1,64}$/.test(value.type)) return null;
    if (typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value.date)) return null;
    const date = new Date(value.date), stamp = date.getTime();
    if (!Number.isFinite(stamp) || stamp > Date.now() || stamp < Date.UTC(2020,0,1)) return null;
    // Reject dates such as February 30 that Date would silently roll into March.
    const parts = value.date.slice(0,10).split('-').map(Number), calendar = new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
    if (calendar.getUTCFullYear() !== parts[0] || calendar.getUTCMonth()+1 !== parts[1] || calendar.getUTCDate() !== parts[2]) return null;
    const itemIds = ids(value.ids);
    if (!itemIds.length || !Number.isSafeInteger(value.total) || value.total < 1 || !Number.isSafeInteger(value.correct) || value.correct < 0) return null;
    const total = Math.min(value.total, itemIds.length), valid = new Set(itemIds);
    const missed = ids(value.missed).filter(x => valid.has(x)), assisted = ids(value.assisted).filter(x => valid.has(x));
    const correct = Math.min(value.correct, total, Math.max(0,total-new Set([...missed,...assisted]).size));
    return {runId,type:value.type,date:date.toISOString(),day:localDay(date),ids:itemIds,total,correct,missed,assisted};
  }
  function normalize(input) {
    const values = input && input.events && typeof input.events === 'object' && !Array.isArray(input.events) ? Object.entries(input.events) : [];
    const events = Object.create(null);
    for (const [key,value] of values) {
      const event = cleanEvent(value,key);
      if (event && !events[event.runId]) events[event.runId] = event;
    }
    const ordered = Object.values(events).sort((a,b) => a.date.localeCompare(b.date) || a.runId.localeCompare(b.runId)).slice(0,MAX_EVENTS);
    return {version:1,events:Object.fromEntries(ordered.map(x => [x.runId,x]))};
  }
  function facts(input) {
    const journey = normalize(input), events = Object.values(journey.events), days = Object.create(null), kinds = new Set();
    let clean = 0, perfect = false;
    for (const event of events) {
      kinds.add(event.type); clean += event.correct;
      perfect ||= event.total >= 6 && event.correct === event.total;
      const day = days[event.day] ||= {rounds:0,clean:0,kinds:new Set()};
      day.rounds++; day.clean += event.correct; day.kinds.add(event.type);
    }
    const completed = Object.values(days).filter(d => d.rounds >= 1 && d.clean >= 8 && d.kinds.size >= 2).length;
    const xp = events.length*10 + clean*5 + completed*20;
    const calendar = Object.keys(days).sort(), today = localDay(new Date()), now = dayNumber(today);
    let bestStreak = 0, chain = 0, previous = null;
    for (const day of calendar) { const n = dayNumber(day); chain = previous === n-1 ? chain+1 : 1; bestStreak = Math.max(bestStreak,chain); previous = n; }
    let streak = 0, cursor = days[today] ? now : now-1;
    const activeDays = new Set(calendar.map(dayNumber));
    while (activeDays.has(cursor--)) streak++;
    const daily = days[today] || {rounds:0,clean:0,kinds:new Set()};
    const missions = [
      {id:'round',label:'Una pequeña victoria',detail:'Termina una ronda',value:Math.min(1,daily.rounds),goal:1,icon:'flag'},
      {id:'clean',label:'Recuerda por ti mismo',detail:'8 aciertos a la primera y sin ayuda',value:Math.min(8,daily.clean),goal:8,icon:'star'},
      {id:'variety',label:'Cambia de juego',detail:'Prueba 2 tipos de juego',value:Math.min(2,daily.kinds.size),goal:2,icon:'compass'}
    ];
    const badges = [
      {id:'first',label:'Premier pas',detail:'Termina tu primera ronda',earned:events.length>=1,icon:'flag'},
      {id:'variety',label:'Esprit curieux',detail:'Juega a 3 tipos diferentes',earned:kinds.size>=3,icon:'compass'},
      {id:'perfect',label:'Sans hésiter',detail:'Una ronda perfecta de 6 o más',earned:perfect,icon:'star'},
      {id:'twenty',label:'Bien en tête',detail:'Suma 20 aciertos sin ayuda',earned:clean>=20,icon:'leaf'},
      {id:'streak',label:'Le rendez-vous',detail:'Practica 3 días seguidos',earned:bestStreak>=3,icon:'sun'},
      {id:'daily',label:'Belle journée',detail:'Completa las 3 misiones de un día',earned:completed>=1,icon:'medal'},
      {id:'rounds',label:'Voyageur',detail:'Termina 25 rondas',earned:events.length>=25,icon:'mountain'}
    ];
    return {journey,xp,level:1+Math.floor(xp/LEVEL_XP),within:xp%LEVEL_XP,clean,rounds:events.length,streak,bestStreak,missions,badges,dailyDone:missions.every(x=>x.value===x.goal)};
  }
  function record(input,result) {
    const before = facts(input), event = cleanEvent({...result,date:result?.date || new Date().toISOString()});
    if (!event || before.journey.events[event.runId] || before.rounds >= MAX_EVENTS) return {journey:before.journey,xpEarned:0,newBadges:[]};
    const journey = normalize({events:{...before.journey.events,[event.runId]:event}}), after = facts(journey);
    return {journey,xpEarned:Math.max(0,after.xp-before.xp),newBadges:after.badges.filter(b=>b.earned&&!before.badges.find(a=>a.id===b.id)?.earned).map(({id,label})=>({id,label}))};
  }
  function merge(a,b) {
    const left = normalize(a), right = normalize(b), events = {...left.events};
    for (const event of Object.values(right.events)) {
      const existing = events[event.runId];
      // Conflicting exports cannot inflate a round: use the lower claim, with a deterministic tie break.
      if (!existing || event.correct < existing.correct || (event.correct === existing.correct && JSON.stringify(event) < JSON.stringify(existing))) events[event.runId] = event;
    }
    return normalize({events});
  }
  function icon(name) {
    const paths = {
      flag:'<path d="M8 27V5m0 1c6-5 11 5 18 0v12c-7 5-12-5-18 0"/>',
      star:'<path d="m16 3 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z"/>',
      compass:'<circle cx="16" cy="16" r="13"/><path d="m22 10-4 8-8 4 4-8Z"/>',
      leaf:'<path d="M27 5C7 2 1 17 9 25c8 8 22 0 18-20ZM8 27 24 9m-9 11-1-7m7 1 4 1"/>',
      sun:'<circle cx="16" cy="16" r="7"/><path d="M16 1v4m0 22v4M1 16h4m22 0h4M5 5l3 3m16 16 3 3M5 27l3-3M24 8l3-3"/>',
      medal:'<path d="m8 4 8 10 8-10M7 3h6l3 5 3-5h6"/><circle cx="16" cy="22" r="9"/><path d="m16 16 2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1Z"/>',
      mountain:'<path d="m2 28 10-20 6 11 4-7 8 16H2Zm6-12 4 3 4-3m4 1 3 3 2-2"/>'
    };
    return `<svg viewBox="0 0 32 32" aria-hidden="true">${paths[name]||paths.star}</svg>`;
  }
  function scene(kind) {
    const ground = '<ellipse cx="48" cy="77" rx="38" ry="9" fill="#cad8b6"/>';
    const scenes = {
      images:'<path d="M17 69 29 35l12 34M13 51h30" stroke="#587956" stroke-width="3" fill="#92ad76"/><rect x="41" y="27" width="39" height="45" rx="5" fill="#fffaf0" stroke="#6a8761" stroke-width="2"/><circle cx="66" cy="40" r="6" fill="#d7ad62"/><path d="m45 65 11-15 9 9 11-7v15H45" fill="#87a87e"/><path d="M29 73V54" stroke="#657a4f" stroke-width="4"/>',
      expressions:'<path d="M20 72V40h58v32" fill="#e7d6b0" stroke="#9b7952" stroke-width="2"/><path d="m16 39 7-19h51l9 19" fill="#be714e"/><path d="M23 20 20 39m19-19-2 19m17-19 1 19m17-19 3 19" stroke="#f8e9c9" stroke-width="7"/><rect x="32" y="50" width="16" height="22" fill="#456a58"/><rect x="56" y="50" width="13" height="12" fill="#9ab3a0"/><path d="M59 16c-5-8 11-13 14-6 2 6-5 9-8 6l-4 3Z" fill="#faf7e9" stroke="#658365"/>',
      verbs:'<path d="M23 75V31h48v44" fill="#ece2ca" stroke="#807c5e" stroke-width="2"/><path d="m17 32 30-21 30 21" fill="#819b73"/><path d="M42 75V56h12v19M31 41h10v9H31m22-9h10v9H53" fill="#527360"/><circle cx="48" cy="28" r="7" fill="#faf5e9"/><path d="M48 23v6l4 2" fill="none" stroke="#867249" stroke-width="2"/><path d="M13 70h10m48 0h12" stroke="#9c8158" stroke-width="3"/>',
      cafe:'<path d="M24 72V39h48v33" fill="#e7cdb2" stroke="#9b7952" stroke-width="2"/><path d="M20 40h56l-6-14H26Z" fill="#476b56"/><path d="M32 72V50h16v22M55 50h10v11H55" fill="#f9edce"/><path d="M20 69h-9m4-7v14m61-7h9m-4-7v14" stroke="#7b825d" stroke-width="3"/><path d="M40 21c-6-8 3-8 0-14m12 14c-6-8 3-8 0-14" stroke="#8a9a7b" stroke-width="2" fill="none"/>',
      library:'<path d="M18 72V32h60v40" fill="#e6ddc4" stroke="#8e886c" stroke-width="2"/><path d="m12 32 36-22 36 22" fill="#899c78"/><path d="M27 37v35m14-35v35m14-35v35m14-35v35" stroke="#f8f3e3" stroke-width="7"/><path d="M14 74h68M10 79h76" stroke="#9da486" stroke-width="3"/><path d="M44 20h8" stroke="#f8f3e3" stroke-width="3"/>'
    };
    return `<svg class="rw-scene" viewBox="0 0 96 88" aria-hidden="true">${ground}${scenes[kind]}</svg>`;
  }
  function routeMap() {
    const stops = [
      ['#adventure/market','01','El mercado de las palabras','Escucha y llena tu cesta','expressions'],
      ['#adventure/picture-memory','02','El jardín de la memoria','Une imágenes y palabras','images'],
      ['#adventure/situations','03','El café de las situaciones','Encuentra la frase adecuada','cafe'],
      ['#games','04','La plaza de las expresiones','Frases que cobran sentido','library'],
      ['#verb-game','05','El taller de los verbos','Construye cada conjugación','verbs']
    ];
    return `<section class="rw-map-section" aria-label="Tu viaje en francés"><div class="rw-section-heading"><div><span class="rw-kicker">UN LUGAR PARA CADA RETO</span><h2>Tu viaje en francés</h2></div><p>Elige tu próxima parada.<br>Todo está abierto desde el principio.</p></div><div class="rw-map"><svg class="rw-landscape" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><path fill="#e5ead6" d="M0 190Q90 110 200 175T400 170 600 170 800 170 1000 125V300H0Z"/><path fill="#dbe3ca" d="M0 240Q180 170 340 245T640 230 1000 210V300H0Z"/><path d="M85 140C180 140 160 242 285 228S390 108 490 140 585 245 690 228 810 110 910 140" fill="none" stroke="#fff9e9" stroke-width="22"/><path d="M85 140C180 140 160 242 285 228S390 108 490 140 585 245 690 228 810 110 910 140" fill="none" stroke="#c8b68f" stroke-width="2" stroke-dasharray="3 8"/><g fill="#a9bd91"><path d="m32 220 15-32 15 32Zm330-82 14-31 14 31Zm430 109 14-31 14 31Z"/><circle cx="560" cy="265" r="9"/><circle cx="575" cy="270" r="7"/><circle cx="943" cy="242" r="9"/></g></svg>${stops.map((s,i)=>`<a class="rw-stop rw-stop-${i}" href="${s[0]}">${scene(s[4])}<span class="rw-stop-number">${s[1]}</span><strong>${s[2]}</strong><span>${s[3]}</span></a>`).join('')}</div></section>`;
  }
  function chip(input) { const f=facts(input);return `<a class="rw-chip" href="#progress" aria-label="Nivel de juego ${f.level}, ${f.xp} puntos de experiencia">${icon('star')}<strong>Nv. ${f.level}</strong><span>${f.xp} XP</span></a>`; }
  function render(input,options={}) {
    const f=facts(input), progress=Math.round(f.within/LEVEL_XP*100), compact=!!options.compact;
    return `<section class="rw-journey ${compact?'rw-compact':''}" aria-label="Tu aventura y recompensas"><div class="rw-passport"><div class="rw-level-seal" aria-hidden="true">${icon('compass')}<strong>${f.level}</strong></div><div class="rw-passport-copy"><span class="rw-kicker">TU PASAPORTE DE JUEGO</span><h2>${f.rounds?'Cada ronda cuenta.':'Tu aventura empieza aquí.'}</h2><div class="rw-xp-label"><strong>Nivel de juego ${f.level}</strong><span>${f.xp} XP en total</span></div><div class="rw-xp-track" role="progressbar" aria-label="Puntos para el siguiente nivel de juego" aria-valuenow="${f.within}" aria-valuemin="0" aria-valuemax="${LEVEL_XP}"><span style="width:${progress}%"></span></div><p>${LEVEL_XP-f.within} XP para el nivel ${f.level+1} · Son puntos de práctica, no un nivel de francés.</p></div><div class="rw-streak">${icon('sun')}<strong>${f.streak}</strong><span>${f.streak===1?'día de racha':'días de racha'}</span><small>${f.streak?'Un ratito, una ronda.':'Hoy puede ser el primero.'}</small></div></div><div class="rw-missions"><div class="rw-mission-heading"><h3>Tus tres misiones de hoy</h3><span>${f.dailyDone?'✓ Bonus de hoy conseguido: +20 XP':'Completa las tres: +20 XP'}</span></div><div class="rw-mission-list">${f.missions.map(m=>`<div class="rw-mission ${m.value===m.goal?'is-complete':''}"><span class="rw-mission-icon">${m.value===m.goal?'<span aria-hidden="true">✓</span>':icon(m.icon)}</span><div><strong>${m.label}</strong><span>${m.detail}</span></div><b aria-label="${m.value} de ${m.goal}">${m.value}/${m.goal}</b></div>`).join('')}</div></div>${compact?'':routeMap()+`<section class="rw-badges" aria-label="Colección de insignias"><div class="rw-section-heading"><div><span class="rw-kicker">RECUERDOS DE TU CAMINO</span><h2>Pequeñas victorias</h2></div><p>${f.badges.filter(b=>b.earned).length} de ${f.badges.length} insignias conseguidas</p></div><div class="rw-badge-row">${f.badges.map(b=>`<div class="rw-badge ${b.earned?'is-earned':''}"><div class="rw-badge-medallion">${icon(b.icon)}<span aria-hidden="true">${b.earned?'✓':'·'}</span></div><strong lang="fr">${b.label}</strong><p>${b.detail}</p><small>${b.earned?'Conseguida':'Por descubrir'}</small></div>`).join('')}</div><p class="rw-scoring">Las tres misiones de cada día suman un bonus único de 20 XP. Así sumas: 10 XP al terminar una ronda y 5 XP por cada acierto a la primera sin ayuda. Repetir el audio está permitido. Los puntos miden práctica; las insignias celebran tus hábitos.</p>${f.rounds>=MAX_EVENTS?'<p class="rw-scoring">El pasaporte conserva un máximo de 2.000 rondas. Puedes seguir practicando y exportar tu progreso.</p>':''}</section>`}</section>`;
  }
  window.ATELIER_REWARDS = Object.freeze({normalize,record,merge,render,chip});
})();
