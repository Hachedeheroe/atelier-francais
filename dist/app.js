'use strict';
(() => {
const D=window.ATELIER_LIBRARY;
if(!D){document.querySelector('#app').innerHTML='<main class="empty-state"><h1>No se pudo abrir la biblioteca</h1><p>Conserva la carpeta completa de la web, incluida la carpeta data.</p></main>';return;}
const ICONS={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',book:'<path d="M12 5v16M3 3c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 3-2-3-5-4-9-3Z"/>',headphones:'<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3m-4 0h8"/>',sound:'<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',chart:'<path d="M4 3v18h18M8 16v-5m5 5V6m5 10V9"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',back:'<path d="M20 12H4m6-6-6 6 6 6"/>',heart:'<path d="M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-5 4 1 11 8 16 7-5 13-12 8-16Z"/>',close:'<path d="m5 5 14 14M5 19 19 5"/>',check:'<path d="m4 12 5 5L20 6"/>',repeat:'<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',pen:'<path d="m14 4 6 6M3 21l5-1L21 7a2 2 0 0 0-4-4L4 16Z"/>',verb:'<path d="m3 6 5 14L14 6M17 6h4m-2-2v4m-3 10 2 2 4-5"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',stop:'<rect x="5" y="5" width="14" height="14" rx="1"/>',play:'<path d="m8 4 12 8-12 8Z"/>',eye:'<path d="M2 12c5-10 15-10 20 0-5 10-15 10-20 0Z"/><circle cx="12" cy="12" r="3"/>'};
const icon=(name)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||ICONS.book}</svg>`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=v=>{const el=document.createElement('div');el.innerHTML=String(v||'').replace(/\[sound:[^\]]+\]/g,'');el.querySelectorAll('script,style,iframe').forEach(x=>x.remove());return el.textContent||'';};
const norm=v=>String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[’‘]/g,"'");
const normalizedAnswer=v=>norm(v).replace(/[^a-z0-9']/g,' ').replace(/\s*'\s*/g,"'").replace(/\s+/g,' ').trim();
const strictAnswer=v=>String(v).toLowerCase().normalize('NFC').replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}']/gu,' ').replace(/\s*'\s*/g,"'").replace(/\s+/g,' ').trim();
const locutionReviewedRows=rows=>{const excluded=new Set(window.ATELIER_LOCUTION_REVIEW?.excludedForms||[]),key=window.ATELIER_CONJUGATION_AUDIO?.canonical||((value)=>String(value).replace(/…$/u,'').trim().toLowerCase());return rows.map(row=>row.split(' / ').filter(form=>!excluded.has(key(form))).join(' / ')).filter(Boolean);};
const wordKey=v=>norm(v).replace(/^(une?|le|la|les|des|du)\s+/,'').replace(/^l'/,'').trim();
const fmt=n=>Number(n).toLocaleString('es-ES');
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const unique=a=>[...new Set(a)];
const FALLBACK_THEMES=[
{id:'table',fr:'À table',es:'Alimentos y cocina',color:'#f4eee2',words:['pomme','banane','orange','fraise','carotte','tomate','pain','fromage','lait','oeuf'],art:['pomme','pain']},
{id:'maison',fr:'À la maison',es:'La casa y sus objetos',color:'#e9eee6',words:['table','chaise','lit','porte','fenetre','livre','cle','sac'],art:['chaise','livre']},
{id:'animaux',fr:'Les animaux',es:'Animales cotidianos',color:'#eee9df',words:['chat','chien','oiseau','poisson','cheval','vache','lapin'],art:['chat','oiseau']},
{id:'ville',fr:'En route',es:'Viajes y transportes',color:'#e8edf0',words:['voiture','velo','train','avion','bateau','bus'],art:['velo','voiture']},
{id:'nature',fr:'Dehors',es:'Naturaleza y tiempo',color:'#e9eddf',words:['soleil','lune','arbre','fleur','montagne','mer','pluie','neige'],art:['arbre','soleil']},
{id:'vetements',fr:'Dans mon armoire',es:'Ropa y accesorios',color:'#f1e8e3',words:['robe','pantalon','chemise','chaussure','chapeau','manteau'],art:['chemise','chapeau']},
{id:'corps',fr:'Le corps',es:'El cuerpo y los sentidos',color:'#f3eae1',words:['tete','main','oeil','nez','bouche','oreille','pied'],art:['main','oeil']},
{id:'objets',fr:'Tous les jours',es:'Objetos de cada día',color:'#e9ebe9',words:['telephone','ordinateur','montre','parapluie','stylo','crayon'],art:['telephone','parapluie']}
];
const VISUALS=window.ATELIER_VISUALS;
const THEMES=(VISUALS?.themes?.length?VISUALS.themes:FALLBACK_THEMES).map(t=>({...t,items:t.items||t.words.map(slug=>{const v=D.vocabulary.find(v=>wordKey(v.word)===slug);return v?{...v,slug,theme:t.id,image:`illustrations/${slug}.svg`}:null;}).filter(Boolean)}));
const CATALOG_THEMES=(VISUALS?.catalogThemes||[]).map(t=>({...t,items:t.items||[]}));
const ALL_THEMES=[...THEMES,...CATALOG_THEMES.filter(ct=>!THEMES.some(t=>t.id===ct.id))];
const THEME_GROUPS=VISUALS?.themeGroups||[
  {id:'alimentacion',label:'Alimentación y cocina',fr:'À table · Alimentation et cuisine',icon:'🍽️',color:'#f4eee2',desc:'Frutas, verduras, platos, bebidas, ingredientes y mesa.'},
  {id:'hogar',label:'Casa y vida doméstica',fr:'À la maison · Logement et foyer',icon:'🏠',color:'#e9eee6',desc:'Muebles, habitaciones, electrodomésticos, limpieza y jardín.'},
  {id:'naturaleza',label:'Naturaleza, animales y clima',fr:'Dehors · Nature, animaux et météo',icon:'🌿',color:'#e9eddf',desc:'Animales, plantas, paisajes, campo, mar y tiempo atmosférico.'},
  {id:'cuerpo',label:'Cuerpo, salud y emociones',fr:'Le corps · Santé, sens et émotions',icon:'🫀',color:'#f3eae1',desc:'Partes del cuerpo, higiene, medicina, sensaciones y sentimientos.'},
  {id:'ropa',label:'Ropa, calzado y materiales',fr:'Dans l’armoire · Vêtements et matières',icon:'👕',color:'#f1e8e3',desc:'Prendas de vestir, calzado, accesorios, tejidos, formas y colores.'},
  {id:'ciudad',label:'Ciudad, viajes y transportes',fr:'En route · Ville, lieux et transports',icon:'🚆',color:'#e8edf0',desc:'Transportes, calles, tiendas, viajes, orientación y lugares públicos.'},
  {id:'objetos',label:'Objetos, herramientas y tecnología',fr:'Au quotidien · Objets et numérique',icon:'🧰',color:'#e9ebe9',desc:'Objetos cotidianos, herramientas, papelería, informática y aparatos.'},
  {id:'sociedad',label:'Personas, familia y ocio',fr:'Les gens · Famille, culture et loisirs',icon:'👥',color:'#eee9df',desc:'Familia, relaciones, deporte, arte, música, cine y tiempo libre.'},
  {id:'trabajo',label:'Estudios, trabajo y sociedad',fr:'Vie active · Études, travail et argent',icon:'💼',color:'#eaeef2',desc:'Escuela, profesiones, economía, compras, medios, ley y ciudadanía.'},
  {id:'expresion',label:'Acciones, tiempo y conectores',fr:'Agir et structurer · Temps et logique',icon:'⚡',color:'#eef0e8',desc:'Verbos frecuentes, movimiento, tiempo, cantidades, opinión y conectores.'}
];
const byId=new Map([...D.vocabulary,...D.grammar,...D.conversation].map(x=>[x.id,x]));
const illustrated=new Map(VISUALS?.items?.length?VISUALS.items.map(v=>[v.id,v.slug]):THEMES.flatMap(t=>t.items.map((v,i)=>[v.id,v.slug||t.words[i]])));
const picture=(slug,alt='',cls='')=>typeof VISUALS?.image==='function'?VISUALS.image(slug,alt,cls):`<img src="illustrations/${esc(slug)}.svg" alt="${esc(alt)}" class="${esc(cls)}" loading="lazy">`;
const LEVELS=['A0','A1','A2','B1','B2','C1','C2'];
const STORE='atelier-francais-v1';
const defaults=()=>({studied:[],favorites:[],mistakes:[],successes:[],rounds:0,attempts:0,correct:0,activity:{},games:[],errorVault:{}});
let saved;try{saved=JSON.parse(localStorage.getItem(STORE)||'null');}catch{}
const progress={...defaults(),...(saved||{})};
for(const k of ['studied','favorites','mistakes','successes']) if(!Array.isArray(progress[k]))progress[k]=[];
if(!progress.activity||typeof progress.activity!=='object')progress.activity={};
if(!Array.isArray(progress.games))progress.games=[];
if(!progress.errorVault||typeof progress.errorVault!=='object'||Array.isArray(progress.errorVault))progress.errorVault={};
progress.journey=window.ATELIER_REWARDS?.normalize(progress.journey)||{events:[]};
let route={section:'home',theme:'table',mode:'explore'}, filters={query:'',level:'',category:'',page:1,favorites:false,pictures:false};
let selected=null,showLabels=true,hoverAudio=true,playbackRate=1,quiz=null,modalItem=null,modalRevealed=false,modalPreviousFocus=null;
let themeGroupFilter='',themeSearchQuery='',themeScope='objects';
let verbQuery='',verbLevel='',verbTense='',verbGroup='',showVerbGroupGuide=false,selectedVerb='être',verbs=null;
let mistakeStatusFilter='all',mistakeKindFilter='all',mistakeSearchQuery='',mistakeFlashcardIndex=0,mistakeFlashcardRevealed=false,mistakeFlashcardOpen=true,mistakeTryText='';
let recorder=null,recordStream=null,recordChunks=[],recordUrl='',recording=false,recordSession=0,recordTimer=null;
let feedback='',feedbackType='',wrongId='',correctId='',shownTranscript=false,modalKind='';
const app=document.getElementById('app'),player=document.getElementById('player');
function persist(){try{localStorage.setItem(STORE,JSON.stringify(progress));}catch{}}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function markStudied(id){if(!progress.studied.includes(id))progress.studied.push(id);progress.activity[today()]=(progress.activity[today()]||0)+1;persist();}
function buildVaultEntryFromId(id){
  const strId=String(id||'').trim();if(!strId)return null;
  if(byId.has(strId)){
    const x=byId.get(strId);
    const kind=x.word?'vocabulary':x.pregunta?'grammar':'conversation';
    const title=x.word||x.tema||x.frase_fr||strId;
    const subtitle=x.word?`${x.translation||''} · Vocabulario${x.category?' · '+x.category:''}`:x.pregunta?`${x.tipo||'Gramática'}${x.nivel?' · Nivel '+x.nivel:''}`:`${x.traduccion_es||''} · Conversación${x.nivel?' ('+x.nivel+')':''}`;
    const detail=x.word?(x.phrase||x.word):x.pregunta?(x.respuesta||''):(x.frase_fr||'');
    const explanation=x.word?`${x.translation||''}${x.phraseTranslation?' — '+x.phraseTranslation:''}`:x.pregunta?`${x.pregunta||''}${x.teoria?' · '+x.teoria:''}${x.error?' · Evita: '+x.error:''}`:`${x.traduccion_es||''}${x.situacion?' · '+x.situacion:''}`;
    return {id:strId,kind,title,subtitle,detail,explanation,audio:audioOf(x),verb:x.verbe||'',level:x.nivel||''};
  }
  if(strId.startsWith('verb|')||strId.startsWith('verb:')){
    const [,verbe='',tense='',subjOrIdx='']=strId.split(/[|:]/);
    const grp=window.ATELIER_VERB_GROUPS?.classify?.(verbe);
    const vObj=(verbs||window.ATELIER_VERBS||[]).find(v=>v.verbe===verbe);
    const rawForms=vObj?.formes?.[tense]||vObj?.temps?.[tense]||[];
    const flatForms=Array.isArray(rawForms)?rawForms.flatMap(x=>Array.isArray(x)?x:[x]).filter(Boolean):[];
    const matchedForm=flatForms.find(f=>String(f).toLowerCase().startsWith(subjOrIdx.toLowerCase()+' ')||String(f).toLowerCase().startsWith("j'")&&subjOrIdx==='je')||flatForms[Number(subjOrIdx)||0]||'';
    return {id:strId,kind:'verb',verb:verbe,tense,groupId:grp?.id||'',groupLabel:grp?.short||grp?.badge||'',title:`${verbe} → ${subjOrIdx} (${tense})`,subtitle:`${vObj?.es||''} · ${grp?grp.short:'Verbo'}`,detail:matchedForm||verbe,explanation:grp?`${grp.short}: ${grp.memoryTrick}`:''};
  }
  const expr=(window.ATELIER_EXPRESSIONS||[]).find(r=>r.id===strId);
  if(expr){
    return {id:strId,kind:'expression',title:expr.fr,subtitle:`${expr.es} · Expresiones (${expr.level||'General'})`,detail:expr.fr,explanation:`${expr.es}${expr.situation?' · '+expr.situation:''}`,audio:expr.audio||'',level:expr.level||''};
  }
  return {id:strId,kind:'other',title:strId,subtitle:'Práctica general',detail:'',explanation:''};
}
function recordMistakeEntry(raw){
  if(!raw)return;
  const id=String(typeof raw==='string'?raw:raw.id||'').trim();
  if(!id)return;
  const base=buildVaultEntryFromId(id)||{id,kind:'other',title:id,subtitle:'',detail:'',explanation:''};
  const entry=typeof raw==='object'?{...base,...Object.fromEntries(Object.entries(raw).filter(([,v])=>v!==undefined&&v!==''))}:base;
  const existing=progress.errorVault[id];
  const now=new Date().toISOString();
  const reason=entry.reason||'wrong';
  const isHelp=reason==='hint'||reason==='tip';
  progress.errorVault[id]={
    ...(existing||{}),
    id,
    kind:entry.kind||existing?.kind||base.kind||'other',
    title:entry.title||existing?.title||base.title||id,
    subtitle:entry.subtitle||existing?.subtitle||base.subtitle||'',
    detail:entry.detail||existing?.detail||base.detail||'',
    explanation:entry.explanation||existing?.explanation||base.explanation||'',
    verb:entry.verb||existing?.verb||base.verb||'',
    tense:entry.tense||existing?.tense||base.tense||'',
    personIndex:entry.personIndex??existing?.personIndex??base.personIndex??null,
    groupId:entry.groupId||existing?.groupId||base.groupId||'',
    groupLabel:entry.groupLabel||existing?.groupLabel||base.groupLabel||'',
    audio:entry.audio||existing?.audio||base.audio||'',
    level:entry.level||existing?.level||base.level||'',
    userAnswer:entry.userAnswer!==undefined&&entry.userAnswer!==''?entry.userAnswer:(existing?.userAnswer||''),
    firstSeenAt:existing?.firstSeenAt||now,
    lastFailedAt:now,
    lastReason:reason,
    failCount:(existing?.failCount||0)+(isHelp?0:1),
    helpedCount:(existing?.helpedCount||0)+(isHelp?1:0),
    recoveredCount:existing?.recoveredCount||0,
    needsReview:true
  };
  if(byId.has(id)&&!progress.mistakes.includes(id))progress.mistakes.push(id);
  persist();
}
function recordRecovery(id){
  const strId=String(id||'').trim();if(!strId)return;
  const existing=progress.errorVault[strId];
  if(existing){
    existing.recoveredCount=(existing.recoveredCount||0)+1;
    existing.lastRecoveredAt=new Date().toISOString();
    existing.needsReview=false;
    persist();
  }
}
for(const oldMistakeId of progress.mistakes){if(oldMistakeId&&!progress.errorVault[oldMistakeId])recordMistakeEntry({id:oldMistakeId,reason:'wrong'});}
for(const game of progress.games){
  for(const mId of (game?.missed||[])){if(mId&&!progress.errorVault[mId])recordMistakeEntry({id:mId,reason:'wrong'});}
  for(const aId of (game?.assisted||[])){if(aId&&!progress.errorVault[aId])recordMistakeEntry({id:aId,reason:'hint'});}
}
function getVaultEntries(){
  return Object.values(progress.errorVault||{}).filter(x=>x&&x.id).sort((a,b)=>String(b.lastFailedAt||b.firstSeenAt||'').localeCompare(String(a.lastFailedAt||a.firstSeenAt||'')));
}
function score(id,ok){progress.attempts++;if(ok){progress.correct++;if(!progress.successes.includes(id))progress.successes.push(id);progress.mistakes=progress.mistakes.filter(x=>x!==id);recordRecovery(id);}else{if(!progress.mistakes.includes(id))progress.mistakes.push(id);recordMistakeEntry({id,reason:'wrong'});}markStudied(id);}
let toastTimer;function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);document.getElementById('live').textContent=message;}
function titleOf(x){return x.word||x.frase_fr||x.tema||x.verbe||'';}
function audioOf(x){return x.audio||x.audio_normal||'';}
function phraseOf(x){return x.phrase||x.frase_fr||x.ejemplo_fr||'';}
function vocabularyReviewNote(x){const n=window.ATELIER_VOCABULARY_REVIEW?.entries?.[x.id];return n?`<aside class="vocabulary-review-note"><strong>Ejemplo revisado</strong><p lang="fr">${esc(n.model)}</p><small>${esc(n.modelES)} ${esc(n.noteES)} <a href="${esc(n.sourceURL)}" target="_blank" rel="noopener noreferrer">Consultar el uso ↗</a></small></aside>`:'';}

function audioTextOf(x){return window.ATELIER_AUDIO_TEXTS?.[audioOf(x)]?.text||phraseOf(x);}
function transOf(x){return x.translation||x.traduccion_es||x.ejemplo_es||'';}
function answerTranslation(x){return x.phraseTranslation||x.traduccion_es||x.ejemplo_es||x.translation||'';}
function sectionRows(section=route.section){if(section==='vocabulary')return D.vocabulary;if(section==='grammar')return D.grammar;if(section==='conversation')return D.conversation;return D.vocabulary;}
function stopAudio(exceptVideo){document.querySelectorAll('video').forEach(video=>{if(video!==exceptVideo)video.pause();});window.ATELIER_CONJUGATION_AUDIO?.stop(exceptVideo);if(player!==exceptVideo)player.pause();document.querySelectorAll('.playing').forEach(e=>e.classList.remove('playing'));}
async function play(src,button,{silent=false}={}){if(!src){if(!silent)toast('Esta ficha no tiene audio asociado.');return;}stopAudio();player.src=src;player.playbackRate=playbackRate;player.preservesPitch=true;try{await player.play();if(button?.isConnected)button.classList.add('playing');}catch(e){if(!silent&&e.name!=='AbortError')toast('No se pudo reproducir. Prueba el botón de audio otra vez.');}}
player.addEventListener('ended',()=>document.querySelectorAll('.playing').forEach(e=>e.classList.remove('playing')));
player.addEventListener('error',()=>{if(player.getAttribute('src'))toast('No se ha podido abrir este audio. Comprueba que conservas la carpeta audio.');});
function footer(){return '<footer class="app-footer"><span>Atelier français · Hecho con tu biblioteca de aprendizaje</span><span>Ver, escuchar, recordar. A tu ritmo.</span></footer>';}
const nav=[['home','home','Mi atelier',''],['verbs','verb','Verbos y pronunciación','566'],['verb-tips','pen','Formación y patrones','12 grupos'],['verb-lessons','play','Lecciones animadas','6'],['exam-review','pen','Repaso DELF · DALF','A1–C2'],['vocabulary','book','Vocabulario','3.000'],['grammar','pen','Gramática','A0–C2'],['conversation','headphones','Conversación','519'],['themes','grid','Vocabulario visual',String(THEMES.length)],['verb-missions','verb','Práctica en contexto','18'],['adventure','play','Práctica visual','5'],['games','headphones','Expresiones','4'],['mistakes','lock','Cuaderno de errores',''],['progress','chart','Mi progreso','']];
function shell(content){const section=route.section==='theme'?'themes':route.section==='practice'?(quiz?.collection||'vocabulary'):route.section;const label=section==='verb-missions'?'Misión verbos':section==='verb-game'?'Tren de los verbos':nav.find(x=>x[0]===section)?.[2]||'Práctica';const vaultAll=getVaultEntries().length,vaultPending=getVaultEntries().filter(x=>x.needsReview!==false).length;return `<div class="shell" data-section="${section}"><button class="mobile-scrim" data-action="menu" aria-label="Cerrar menú"></button><aside class="sidebar" aria-label="Navegación principal" ${window.matchMedia('(max-width:780px)').matches?'inert':''}><a href="#home" class="brand"><span class="brand-mark">af</span><span class="brand-name">Atelier français<small>VOIR · ÉCOUTER · APPRENDRE</small></span></a><p class="nav-heading">TU ESPACIO DE FRANCÉS</p><nav>${nav.map(([id,ic,label,count])=>{const badgeCount=id==='mistakes'?(vaultAll?`${vaultPending}/${vaultAll}`:'Privado'):count;return `<a href="#${id}" class="nav-link ${section===id?'active':''}" ${section===id?'aria-current="page"':''}>${icon(ic)}<span>${label}</span>${badgeCount?`<span class="nav-count">${badgeCount}</span>`:''}</a>`;}).join('')}</nav><div class="sidebar-bottom"><div class="sidebar-note"><strong>Un poco, cada día.</strong>Una imagen, una frase y un momento para practicar.</div><button class="sidebar-source" data-action="about">Sobre tus materiales</button></div></aside><div class="workspace"><header class="topbar"><button class="mobile-menu icon" data-action="menu" aria-label="Abrir menú" aria-expanded="false">${icon('menu')}</button><div class="breadcrumb"><span>Mi biblioteca</span><span>/</span><strong>${esc(label)}</strong></div><div class="top-tools">${['adventure','verb-missions','verb-game','games','progress','mistakes'].includes(section)?window.ATELIER_REWARDS?.chip(progress.journey)||'':'<span class="study-label">Estudio personal</span>'}<a href="#mistakes" class="private-badge icon" title="Abrir tu cuaderno privado de errores">${icon('lock')} ${vaultAll?`MIS ERRORES (${vaultPending} pend. · ${vaultAll} total)`:'CUADERNO PRIVADO'}</a><span class="avatar" aria-hidden="true">H</span></div></header><main class="main" id="main" tabindex="-1">${content}${window.ATELIER_CONJUGATION_AUDIO?.dock()||''}${footer()}</main></div></div>`;}
function gamesInvite(){return `<section class="games-invite"><div><div class="eyebrow">NUEVO · EXPRESIONES EN ACCIÓN</div><h2 lang="fr">Les mots sont faits pour jouer.</h2><p>${fmt(window.ATELIER_EXPRESSIONS?.length||477)} expresiones de tu biblioteca. Escucha, reconstruye, completa y encuentra las parejas.</p><button class="btn" data-action="navigate" data-section="games">Entrar en los juegos ${icon('arrow')}</button></div><div class="games-invite-art" aria-hidden="true"><span class="phrase-ticket" lang="fr">Ça marche !</span><span class="phrase-ticket" lang="es">Con mucho gusto</span><span class="phrase-ticket" lang="fr">Avec plaisir.</span><span class="game-dot">4 juegos · muchas formas de recordar</span></div></section>`;}
function themeCard(t){const sample=(t.items||[]).slice(0,4).map(v=>v?.word).filter(Boolean).join(' · ');return `<button class="theme-card" data-action="theme" data-theme="${esc(t.id)}" style="--wash:${esc(t.color||'#e9eee6')}"><span class="theme-art">${(t.art||[]).slice(0,2).map(a=>picture(a)).join('')}</span><span class="theme-meta">${t.groupLabel?`<span class="theme-group-badge">${esc((t.groupIcon?t.groupIcon+' ':'')+t.groupLabel)}</span>`:''}<span class="fr" lang="fr">${esc(t.fr)}</span><span class="es">${esc(t.es)}</span>${sample?`<span class="theme-sample-words" lang="fr">${esc(sample)}</span>`:''}<span class="theme-foot"><span>🔊 ${t.items.length} IMÁGENES · CURSOR + VOZ</span><span class="arrow">↗</span></span></span></button>`;}
function missionInvite(){return `<section class="mv-invite"><div><p class="eyebrow">NUEVO · VERBOS EN ACCIÓN</p><h2>Una ciudad. Seis misiones.</h2><p>Escucha, elige, construye y consigue tu pasaporte de verbos. <a href="#verb-tips">Descubre los trucos de conjugación →</a></p></div><a class="mv-button mv-primary" href="#verb-missions">Jugar con verbos →</a></section>`;}
function home(){return `<section class="ed-hero"><div><div class="eyebrow">ATELIER FRANÇAIS · ESTUDIO Y PRÁCTICA</div><h1 lang="fr">Le français,<br><em>avec méthode.</em></h1><p>Comprende cómo se forma una frase. Escucha cada conjugación, repítela y comprueba lo aprendido con tus materiales.</p><div class="ed-actions"><a class="btn" href="#verbs">Estudiar verbos →</a><a class="btn secondary" href="#verb-lessons">Ver las lecciones animadas</a></div></div><aside class="ed-feature"><div class="eyebrow">EMPIEZA POR UNA FORMA</div><span class="ed-word" lang="fr">je parl<em>e</em></span>${window.ATELIER_CONJUGATION_AUDIO?.controls('je parle')||''}<p>▷ Escucha · 0,8× para ir más despacio · ↻ para escuchar, repetir y comparar.</p><a class="quiet-link" href="#verb-tips">Explorar raíces y terminaciones →</a></aside></section><div class="ed-path"><a href="#verb-tips"><small>01 · COMPRENDER</small><h2>Las piezas del verbo</h2><p>Ocho patrones y las seis personas. Descubre la raíz, los finales y las excepciones.</p></a><a href="#verb-lessons"><small>02 · ESCUCHAR Y REPETIR</small><h2>La escritura y la voz</h2><p>Animaciones con sonido para relacionar las formas escritas con lo que se pronuncia.</p></a><a href="#exam-review"><small>03 · RECUPERAR Y CORREGIR</small><h2>Un repaso con sentido</h2><p>Gramática y vocabulario en contexto. Intenta primero y abre después la solución interactiva.</p></a></div><div class="ed-library-title"><h2>Tu biblioteca de francés</h2><a href="#progress">Consultar mi progreso →</a></div><div class="ed-library-links">${[['verbs','Verbos','566 tablas y pronunciación'],['vocabulary','Vocabulario','3.000 palabras en contexto'],['grammar','Gramática','1.482 fichas para practicar'],['conversation','Conversación','519 situaciones y frases']].map(([id,title,desc])=>`<a href="#${id}"><strong>${title}</strong><small>${desc}</small></a>`).join('')}</div><div class="section-head"><div><h2>Vocabulario que puedes ver</h2><p>Imágenes clasificadas por temáticas · Pasa el cursor para ver el texto y escuchar el audio.</p></div><a class="quiet-link" href="#themes">Ver todas las temáticas (${THEMES.length} láminas) →</a></div><div class="theme-grid">${THEMES.slice(0,4).map(themeCard).join('')}</div>`;}

function activeThemePool(){return themeScope==='catalog'&&CATALOG_THEMES.length?CATALOG_THEMES:themeScope==='all'&&CATALOG_THEMES.length?ALL_THEMES:THEMES;}
function themesPage(){
  const pool=activeThemePool();
  const q=norm(themeSearchQuery);
  const filtered=pool.filter(t=>{
    if(themeGroupFilter&&t.group!==themeGroupFilter)return false;
    if(!q)return true;
    return norm(`${t.fr} ${t.es} ${t.groupLabel||''} ${(t.items||[]).map(v=>`${v.word} ${v.translation}`).join(' ')}`).includes(q);
  });
  const totalWords=filtered.reduce((n,t)=>n+(t.items?.length||0),0);
  const groupedSections=THEME_GROUPS.map(grp=>{
    const items=filtered.filter(t=>(t.group||'expresion')===grp.id);
    if(!items.length)return '';
    const countImgs=items.reduce((n,t)=>n+(t.items?.length||0),0);
    return `<section class="theme-group-section" id="group-${esc(grp.id)}"><header class="theme-group-header"><div><span class="eyebrow">${esc(grp.icon)} TEMÁTICA · ${items.length} ${items.length===1?'LÁMINA':'LÁMINAS'} · ${fmt(countImgs)} IMÁGENES</span><h2>${esc(grp.label)} <small lang="fr">${esc(grp.fr)}</small></h2><p>${esc(grp.desc)}</p></div></header><div class="theme-grid">${items.map(themeCard).join('')}</div></section>`;
  }).filter(Boolean).join('');
  return `<div class="page-heading"><div><div class="eyebrow">APRENDER MIRANDO · CLASIFICACIÓN TEMÁTICA</div><h1>Láminas visuales por temáticas</h1><p>Explora tus imágenes organizadas en <strong>10 grandes bloques temáticos</strong> para agilizar el estudio. Dentro de cada lámina, <strong>pon el cursor sobre cualquier imagen</strong> para ver al instante la palabra escrita, su fonética, su traducción y escuchar el audio en francés.</p></div></div>
  <div class="theme-explorer-bar">
    <div class="theme-scope-tabs" role="tablist" aria-label="Colección de láminas">
      <button type="button" class="theme-scope-btn ${themeScope==='objects'?'is-active':''}" data-action="theme-scope" data-scope="objects">🎯 Láminas de objetos (${THEMES.length} láminas)</button>
      ${CATALOG_THEMES.length?`<button type="button" class="theme-scope-btn ${themeScope==='catalog'?'is-active':''}" data-action="theme-scope" data-scope="catalog">📚 Las ${CATALOG_THEMES.length} categorías completas (${fmt(illustrated.size)} imágenes)</button><button type="button" class="theme-scope-btn ${themeScope==='all'?'is-active':''}" data-action="theme-scope" data-scope="all">✨ Ver todo junto (${ALL_THEMES.length})</button>`:''}
    </div>
    <label class="search-box theme-search-box">${icon('search')}<input id="theme-search" type="search" value="${esc(themeSearchQuery)}" placeholder="Buscar temática o palabra en francés/español (ej. pomme, casa, ropa)…" aria-label="Buscar lámina o palabra"></label>
  </div>
  <div class="theme-Macro-pills" role="navigation" aria-label="Filtrar por bloque temático">
    <button type="button" class="theme-pill ${!themeGroupFilter?'is-active':''}" data-action="theme-group" data-group="">Todas las temáticas <span>${pool.length}</span></button>
    ${THEME_GROUPS.map(grp=>{const count=pool.filter(t=>(t.group||'expresion')===grp.id).length;if(!count)return '';return `<button type="button" class="theme-pill ${themeGroupFilter===grp.id?'is-active':''}" data-action="theme-group" data-group="${esc(grp.id)}">${esc(grp.icon)} ${esc(grp.label)} <span>${count}</span></button>`;}).join('')}
  </div>
  <div class="filter-count">${filtered.length} ${filtered.length===1?'lámina temática':'láminas temáticas'} · ${fmt(totalWords)} imágenes con texto y voz al pasar el cursor</div>
  ${groupedSections||`<div class="no-results">No hay láminas con ese filtro. <button class="btn secondary small" data-action="theme-group" data-group="">Ver todas las temáticas</button></div>`}
  <div class="welcome-note" style="margin-top:25px">Las ${fmt(illustrated.size)} palabras con imagen están conectadas con tu biblioteca. Encuentra también las ${fmt(D.vocabulary.length)} entradas en <a href="#vocabulary">Palabras y frases</a>.</div>`;
}
function modebar(){return `<div class="modebar"><div class="tabs" role="tablist" aria-label="Forma de practicar">${[['explore','eye','Explorar'],['listen','headphones','Escuchar'],['speak','mic','Decir']].map(([id,ic,t])=>`<button class="tab ${route.mode===id?'active':''}" role="tab" aria-selected="${route.mode===id}" data-action="mode" data-mode="${id}">${icon(ic)} ${t}</button>`).join('')}</div><div class="view-options">${route.mode==='explore'?`<label class="toggle-label"><input type="checkbox" id="hover-audio" ${hoverAudio?'checked':''}> 🔊 Sonar al pasar el cursor</label><label class="toggle-label"><input type="checkbox" id="labels" ${showLabels?'checked':''}> Mostrar siempre texto</label>`:'<span>Audio de frases completas</span>'}<label class="sr-only" for="speed">Velocidad del audio</label><select id="speed"><option value="1" ${playbackRate===1?'selected':''}>Audio · Normal</option><option value="0.8" ${playbackRate===.8?'selected':''}>Audio · 0,8×</option></select></div></div>`;}
function detailPanel(v){if(!v)return `<aside class="detail-panel placeholder"><span class="empty-icon icon">${icon('sound')}</span><h3>Pasa el cursor o toca una imagen</h3><p>Al situar el cursor sobre cualquier imagen verás su palabra escrita, su fonética y su traducción, y escucharás automáticamente el audio en francés.</p><p style="margin-top:15px">Después, prueba el modo «Escuchar» para reconocerla solo por el oído.</p></aside>`;return `<aside class="detail-panel">${illustrated.has(v.id)?`<div class="detail-picture">${picture(illustrated.get(v.id),v.word)}</div>`:''}<div class="eyebrow">TU PALABRA EN FOCO</div><h2 class="word" lang="fr">${esc(v.word)}</h2><div class="ipa">${esc(v.ipa)}</div><p class="translation">${esc(v.translation)}</p><div class="detail-separator"></div><p class="phrase" lang="fr">${esc(v.phrase)}</p><p class="phrase-es">${esc(v.phraseTranslation)}</p>${vocabularyReviewNote(v)}<div class="detail-audio-stack"><button class="audio-btn" data-action="play" data-id="${v.id}">${icon('sound')} Escuchar frase completa</button>${window.ATELIER_CONJUGATION_AUDIO?`<button class="btn secondary small" data-action="speak-word" data-word="${esc(v.word)}">🔊 Escuchar solo la palabra</button>`:''}</div><div class="detail-actions"><button class="btn text" data-action="open" data-id="${v.id}">Ver ficha completa</button><button class="btn text" data-action="favorite" data-id="${v.id}">${progress.favorites.includes(v.id)?'Guardada ✓':'Guardar'}</button></div><p class="source-note">Audio original de tu biblioteca. Al pasar el cursor suena automáticamente.</p></aside>`;}
function currentTheme(){return ALL_THEMES.find(t=>t.id===route.theme)||THEMES[0];}
function objectGrid(t,mode){const target=quiz?.ids[quiz.index];return `<div class="board ${mode==='listen'?'quiz-board':mode==='speak'?'speaking-board':''}"><div class="board-caption icon">${icon(mode==='explore'?'sound':mode==='listen'?'headphones':'mic')} ${mode==='explore'?'Pasa el cursor sobre cualquier imagen (o tócala) para leer la palabra, ver su traducción y escuchar el audio en francés.':mode==='listen'?'Escucha la frase y elige la imagen correspondiente.':'Nombra la imagen destacada y crea una frase.'}</div><div class="object-grid ${showLabels&&mode==='explore'||mode==='listen'&&quiz?.answered?'labels-on':''}">${t.items.filter(v=>mode!=='speak'||v.id===target).map((v,i)=>`<button class="object ${selected===v.id&&mode==='explore'?'selected':''} ${wrongId===v.id?'wrong':''} ${correctId===v.id?'correct':''} ${mode==='speak'&&v.id===target?'target':''}" data-action="object" data-id="${v.id}" aria-label="${mode==='listen'&&!quiz?.answered?`Opción ${i+1}`:esc(`${v.word} — ${v.translation}`)}" ${mode==='speak'&&v.id!==target?'disabled':''}><span class="object-photo-wrap">${picture(v.slug||illustrated.get(v.id),'')}${mode==='explore'?'<span class="object-sound-pill" aria-hidden="true">🔊</span>':''}</span>${mode!=='listen'||quiz?.answered?`<span class="object-label" lang="fr">${esc(v.word)}</span>`:''}${mode==='explore'?`<span class="object-hover-card"><span class="object-hover-top"><strong lang="fr">${esc(v.word)}</strong>${v.ipa?`<small>${esc(v.ipa)}</small>`:''}</span><span class="object-hover-es">${esc(v.translation)}</span><span class="object-hover-fr" lang="fr">${esc(v.phrase)}</span></span>`:''}${wrongId===v.id?'<span class="object-feedback" aria-hidden="true">×</span>':correctId===v.id?'<span class="object-feedback" aria-hidden="true">✓</span>':''}</button>`).join('')}</div></div>`;}
function quizProgress(){return `<div class="progress-line"><span>${quiz.index+(quiz.answered?1:0)} / ${quiz.ids.length}</span><span class="progress-track"><span style="width:${100*(quiz.index+(quiz.answered?1:0))/quiz.ids.length}%"></span></span></div>`;}
function topicPage(){const t=currentTheme();let body;if(quiz?.done&&route.mode!=='explore')body=resultsView();else if(route.mode==='explore')body=`<div class="topic-layout">${objectGrid(t,'explore')}${detailPanel(t.items.find(x=>x.id===selected)||t.items[0])}</div>`;else if(!quiz?.active)body=`<div class="empty-state"><span class="listen-orb icon">${icon(route.mode==='listen'?'headphones':'mic')}</span><h2>${route.mode==='listen'?'Primero escucha. Después encuentra.':'Haz tuya una palabra.'}</h2><p>${route.mode==='listen'?`Escucharás ${t.items.length} frases de tus materiales. Elige la imagen de la palabra principal; si lo necesitas, repite el audio.`:'Mira el objeto destacado, di su nombre y úsalo en una frase. Después escucha el modelo y compara tu voz.'}</p><button class="btn" data-action="start-topic">Empezar ${icon('arrow')}</button>${route.mode==='speak'?'<p class="source-note">Puedes grabarte en este dispositivo. La comparación es tuya; no se puntúa tu pronunciación.</p>':''}</div>`;else{const v=byId.get(quiz.ids[quiz.index]);body=`<div class="quiz-controls"><div><h3>${route.mode==='listen'?'Escucha y encuentra':'Mira, recuerda y di'}</h3>${quizProgress()}</div><div class="quiz-actions">${quiz.answered?`<button class="btn" data-action="next-question">${quiz.index+1===quiz.ids.length?'Ver resultado':'Siguiente'} ${icon('arrow')}</button>`:''}${route.mode==='listen'?`<button class="btn secondary" data-action="replay">${icon('repeat')} Repetir</button><button class="btn secondary small" data-action="transcript">${shownTranscript?'Ocultar frase':'Ver frase'}</button>`:`<button class="btn secondary" data-action="reveal-model">${icon('sound')} Escuchar el modelo</button>`}<button class="btn text" data-action="skip">Saltar</button></div></div>${shownTranscript||route.mode==='speak'&&quiz.revealed?`<p class="answer-phrase" lang="fr">${esc(v.phrase)}</p>`:''}<p class="quiz-caption ${feedbackType}" role="status">${esc(feedback|| (route.mode==='listen'?'Elige la imagen que corresponde a la frase.':'Di primero tu propia frase. Después puedes escuchar el modelo.'))}</p><div class="topic-layout">${objectGrid(t,route.mode)}${route.mode==='speak'?`<aside class="detail-panel"><div class="eyebrow">PRÁCTICA ORAL</div>${quiz.revealed?`<h2 class="word" lang="fr">${esc(v.word)}</h2><p class="translation">${esc(v.translation)}</p><div class="detail-separator"></div><p class="phrase" lang="fr">${esc(v.phrase)}</p><p class="phrase-es">${esc(v.phraseTranslation)}</p>`:'<h3 class="serif">¿Cómo lo dirías?</h3><p class="phrase-es">Nombra el objeto resaltado. Añade una frase que podrías usar hoy.</p>'}${recorderHtml()}<button class="btn" style="margin-top:18px;width:100%" data-action="speak-next">${quiz.index+1===quiz.ids.length?'Terminar':'Siguiente imagen'} ${icon('arrow')}</button><p class="source-note">Práctica de producción y comparación, sin puntuación automática de pronunciación.</p></aside>`:detailPanel(quiz.answered?v:null)}</div>`;}
return `<div class="page-heading"><div><div class="eyebrow"><a class="quiet-link" href="#themes">LÁMINAS VISUALES</a>${t.groupLabel?` / <a class="quiet-link" href="#themes" data-action="theme-group-jump" data-group="${esc(t.group||'')}">${esc((t.groupIcon?t.groupIcon+' ':'')+t.groupLabel.toUpperCase())}</a>`:''} / ${esc(t.es.toUpperCase())}</div><h1 lang="fr">${esc(t.fr)}</h1><p>${esc(t.es)} · ${t.items.length} imágenes · pasa el cursor para leer y escuchar</p></div><div class="topic-switch"><button class="icon-btn" data-action="theme-prev" aria-label="Lámina anterior">${icon('back')}</button><button class="icon-btn" data-action="theme-next" aria-label="Lámina siguiente">${icon('arrow')}</button></div></div>${modebar()}${body}`;}
function recorderHtml(){return `<div class="recorder"><button class="btn ${recording?'recording':'secondary'}" data-action="record">${icon(recording?'stop':'mic')} ${recording?'Detener grabación':'Grabar mi voz'}</button><p>Tu grabación permanece en este dispositivo. Máximo 60 segundos.</p>${recordUrl?`<audio controls src="${recordUrl}" aria-label="Escuchar mi grabación"></audio>`:''}</div>`;}
function filteredRows(){const q=norm(filters.query);return sectionRows().filter(x=>{if(filters.favorites&&!progress.favorites.includes(x.id))return false;if(route.section==='vocabulary'&&filters.pictures&&!illustrated.has(x.id))return false;if(filters.level&&x.nivel!==filters.level)return false;const cat=x.category||x.tema||x.grupo||x.tipo||'';if(filters.category&&cat!==filters.category)return false;if(q&&!norm([titleOf(x),transOf(x),x.phrase,x.phraseTranslation,x.pregunta,x.respuesta,x.tema,x.situacion,x.intencion,x.ipa].join(' ')).includes(q))return false;return true;});}
function entryCard(x){const isV=route.section==='vocabulary',isG=route.section==='grammar';return `<article class="entry-card" data-kind="${isG?'grammar':isV?'vocabulary':'conversation'}" data-level="${esc(x.nivel||'')}"><div class="entry-meta"><span class="entry-symbol icon" aria-hidden="true">${icon(isG?'pen':isV?'book':'headphones')}</span>${x.nivel?`<span class="level">${esc(x.nivel)}</span>`:''}<span>${esc(isV?x.category:isG?x.tipo:x.grupo||'Conversación')}</span></div>${isV&&illustrated.has(x.id)?`<div class="entry-picture" data-hover-id="${esc(x.id)}" tabindex="0" aria-label="${esc(`${x.word} — ${x.translation}. Pasa el cursor para escuchar`)}">${picture(illustrated.get(x.id),x.word)}<div class="entry-picture-hover"><div class="entry-picture-hover-head"><strong lang="fr">🔊 ${esc(x.word)}</strong>${x.ipa?`<small>${esc(x.ipa)}</small>`:''}</div><span>${esc(x.translation)}</span><em lang="fr">${esc(x.phrase)}</em></div></div>${VISUALS?.byId?.get(x.id)?.kind==='contextual'?'<small class="catalog-context">Escena de contexto · relaciónala con la frase</small>':''}`:''}<h3 ${isG?'':'lang="fr"'}>${esc(isV?x.word:isG?x.tema:x.frase_fr)}</h3>${isV?`<p class="entry-translation">${esc(x.translation)}</p><p class="entry-phrase" lang="fr">${esc(x.phrase)}</p>${vocabularyReviewNote(x)}`:isG?`<p class="entry-question">${esc(x.pregunta)}</p>`:`<p class="entry-translation">${esc(x.traduccion_es)}</p><p class="entry-question">${esc(x.situacion)}</p>`}<div class="entry-bottom"><button class="icon-btn" data-action="play" data-id="${x.id}" aria-label="Escuchar ${esc(phraseOf(x))}">${icon('sound')}</button><button class="icon-btn favorite ${progress.favorites.includes(x.id)?'saved':''}" data-action="favorite" data-id="${x.id}" aria-label="${progress.favorites.includes(x.id)?'Quitar de':'Añadir a'} guardados" aria-pressed="${progress.favorites.includes(x.id)}">${icon('heart')}</button><button class="btn text" data-action="open" data-id="${x.id}">${isG?'Practicar':'Abrir ficha'} →</button></div></article>`;}
function catalogBanner(section){
 const banners={
  grammar:{tag:'GRAMÁTICA Y PRÁCTICA VERBAL',title:'La grammaire,<br><em>ça se pratique.</em>',description:'Entiende las reglas, recupera lo que sabes y construye tus propias frases.',art:'grammar-pop',alt:'Cuaderno, lápiz y fichas de palabras francesas',facts:['1.482 fichas','A0 → C2','Respuestas para descubrir']},
  vocabulary:{tag:'PALABRAS Y FRASES',title:'Des mots<br><em>qui restent.</em>',description:'Mira objetos, acciones y escenas de contexto. Escucha las frases de tus materiales y haz tuya cada palabra.'+(illustrated.size<D.vocabulary.length?' Desmarca «Con imagen» para consultar las 3.000 entradas.':''),facts:[`${fmt(D.vocabulary.length)} palabras`,`${fmt(illustrated.size)} con imagen`,`${unique(D.vocabulary.map(x=>x.category)).length} categorías`]},
  conversation:{tag:'CONVERSACIÓN Y PRONUNCIACIÓN',title:'Parlons<br><em>pour de vrai.</em>',description:'Del primer saludo a las conversaciones de cada día. Escucha, responde y encuentra tu voz.',art:'voices-pop',alt:'Auriculares y bocadillos con saludos en francés',facts:['519 prácticas','Frases cotidianas','Tu voz, a tu ritmo']}
 };
 const b=banners[section];
 const art=section==='vocabulary'?`<figure class="color-banner-art ed-banner-photo">${picture('livre','un livre')}<figcaption lang="fr">un livre</figcaption></figure>`:section==='grammar'?'<div class="color-banner-art ed-banner-word" aria-hidden="true"><small>LE SUJET CHANGE LA FORME</small><span>je parle</span><span>nous parlons</span><i>Observe · retrouve · corrige.</i></div>':'<div class="color-banner-art ed-banner-word" aria-hidden="true"><small>UNE CONVERSATION COMMENCE</small><span>Bonjour.</span><span>Comment allez-vous ?</span><i>Écoute · réponds · recommence.</i></div>';
 return `<section class="color-banner color-${section}"><div class="color-banner-copy"><div class="eyebrow">${b.tag}</div><h1 lang="fr">${b.title}</h1><p>${b.description}</p><div class="color-facts">${b.facts.map(t=>`<span>${t}</span>`).join('')}</div></div>${art}</section>`;
}
function levelRibbon(all){return `<div class="level-ribbon" aria-label="Elige tu nivel de práctica"><span>Tu punto de partida</span><div class="level-ribbon-options">${[['','Todos'],...LEVELS.filter(l=>all.some(x=>x.nivel===l)).map(l=>[l,l])].map(([value,label])=>`<button class="level-chip ${filters.level===value?'is-active':''}" data-action="quick-level" data-level="${value}" aria-pressed="${filters.level===value}">${label}</button>`).join('')}</div></div>`;}
function catalogPage(){const isV=route.section==='vocabulary',isG=route.section==='grammar';const all=sectionRows();const cats=unique(all.map(x=>x.category||x.tema||x.grupo||x.tipo||'')).filter(Boolean).sort((a,b)=>a.localeCompare(b,'fr'));const rows=filteredRows(),pages=Math.max(1,Math.ceil(rows.length/18));filters.page=Math.min(filters.page,pages);const current=rows.slice((filters.page-1)*18,filters.page*18);return `${catalogBanner(isV?'vocabulary':isG?'grammar':'conversation')}${!isV?levelRibbon(all):''}<div class="toolbar"><label class="search-box">${icon('search')}<input id="search" type="search" value="${esc(filters.query)}" placeholder="${isV?'Buscar en francés o español…':'Buscar una situación, tema o frase…'}" aria-label="Buscar en la biblioteca"></label>${!isV?`<select id="level" aria-label="Filtrar por nivel"><option value="">Todos los niveles</option>${LEVELS.filter(l=>all.some(x=>x.nivel===l)).map(l=>`<option ${filters.level===l?'selected':''}>${l}</option>`).join('')}</select>`:''}<select id="category" aria-label="Filtrar por tema"><option value="">Todos los temas</option>${cats.map(c=>`<option value="${esc(c)}" ${filters.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select>${isV?`<label class="toggle-label picture-filter"><input type="checkbox" id="pictures-only" ${filters.pictures?'checked':''}> Con imagen</label>`:''}<button class="icon-btn favorite ${filters.favorites?'saved':''}" data-action="filter-favorites" aria-label="Mostrar solo guardados" aria-pressed="${filters.favorites}">${icon('heart')}</button>${!isG?`<button class="btn" data-action="start-collection" ${rows.length<4?'disabled':''}>${icon('headphones')} Practicar escucha</button>`:''}</div><div class="filter-count">${fmt(rows.length)} ${rows.length===1?'ficha':'fichas'}${isV?' · orden original de frecuencia':''}${filters.favorites?' · solo guardadas':''}${isV&&filters.pictures?' · con imagen':''}</div>${rows.length?`<div class="library-grid">${current.map(entryCard).join('')}</div><div class="pagination"><button class="icon-btn" data-action="page-prev" ${filters.page===1?'disabled':''} aria-label="Página anterior">${icon('back')}</button><span>Página ${filters.page} de ${pages}</span><button class="icon-btn" data-action="page-next" ${filters.page===pages?'disabled':''} aria-label="Página siguiente">${icon('arrow')}</button></div>`:'<div class="no-results">No hay fichas con estos filtros. Prueba otra palabra o elige todos los temas.</div>'}`;}
function makeQuiz(ids,type,collection,theme){return {ids:shuffle(unique(ids)),index:0,type,collection,theme,firstHits:0,missed:[],active:true,done:false,answered:false,hadError:false,revealed:false,options:[],answerText:''};}
function resetFeedback(){feedback='';feedbackType='';wrongId='';correctId='';shownTranscript=false;}
function prepareQuestion(){resetFeedback();if(!quiz)return;quiz.answered=false;quiz.hadError=false;quiz.revealed=false;quiz.answerText='';if(quiz.type==='choice'){const target=byId.get(quiz.ids[quiz.index]);const distractors=shuffle(sectionRows(quiz.collection).filter(x=>x.id!==target.id&&audioOf(x)!==audioOf(target)&&normalizedAnswer(audioTextOf(x))!==normalizedAnswer(audioTextOf(target))&&answerTranslation(x)!==answerTranslation(target)));const seen=new Set([answerTranslation(target)]);const options=[target.id];for(const r of distractors){if(!seen.has(answerTranslation(r))){options.push(r.id);seen.add(answerTranslation(r));}if(options.length===4)break;}quiz.options=shuffle(options);}}
function finishQuiz(){if(quiz.done)return;quiz.done=true;progress.rounds++;if(quiz.type!=='speak')awardRound({runId:'practice-'+Date.now()+'-'+Math.random().toString(36).slice(2),type:'practice-'+quiz.type,ids:quiz.ids,correct:quiz.firstHits,total:quiz.ids.length,missed:quiz.missed,assisted:[]});persist();stopAudio();stopRecording();render();}
function advanceQuiz(){stopRecording();if(++quiz.index>=quiz.ids.length){finishQuiz();return;}prepareQuestion();render();if(quiz.type!=='speak')play(audioOf(byId.get(quiz.ids[quiz.index])));}
function noteAnswer(ok){const id=quiz.ids[quiz.index];if(ok){quiz.answered=true;if(!quiz.hadError&&!quiz.revealed){quiz.firstHits++;score(id,true);}else {if(!quiz.missed.includes(id))quiz.missed.push(id);if(!quiz.hadError)score(id,false);}}else{if(!quiz.hadError)score(id,false);quiz.hadError=true;if(!quiz.missed.includes(id))quiz.missed.push(id);}}
function startTopic(){const t=currentTheme();quiz=makeQuiz(t.items.map(x=>x.id),route.mode==='speak'?'speak':'images','vocabulary',t.id);prepareQuestion();selected=null;render();if(route.mode==='listen')play(audioOf(byId.get(quiz.ids[0])));}
function resultsView(){const speaking=quiz.type==='speak';return `<div class="results"><div class="eyebrow">PRÁCTICA TERMINADA</div><h2>${speaking?'Tus palabras, en voz alta.':'Cada escucha cuenta.'}</h2><div class="score">${speaking?quiz.ids.length:`${quiz.firstHits}<span style="font-size:32px;color:#a3ad96"> / ${quiz.ids.length}</span>`}</div><p>${speaking?'imágenes practicadas. Escuchar y comparar es parte del aprendizaje.':'respuestas correctas a la primera y sin mostrar la frase.'}</p>${quiz.missed.length?`<p style="margin-top:15px">${quiz.missed.length} ${quiz.missed.length===1?'ficha para seguir practicando':'fichas para seguir practicando'}.</p><ul>${quiz.missed.slice(0,8).map(id=>`<li>${esc(titleOf(byId.get(id)))}</li>`).join('')}</ul>`:''}<button class="btn" data-action="retry">${icon('repeat')} ${quiz.missed.length?'Repetir las pendientes':'Otra ronda'}</button><button class="btn secondary" data-action="practice-back">Volver a ${route.section==='theme'?'la lámina':'la biblioteca'}</button></div>`;}
function practicePage(){if(!quiz)return '<div class="empty-state"><p>Elige primero las fichas que quieres practicar.</p><a class="btn" href="#vocabulary">Ir a la biblioteca</a></div>';if(quiz.done)return resultsView();const v=byId.get(quiz.ids[quiz.index]);return `<div class="page-heading"><div><div class="eyebrow">PRÁCTICA CON TUS AUDIOS</div><h1>${quiz.type==='dictation'?'Escribe lo que escuchas':'Escucha y comprende'}</h1><p>${quiz.type==='dictation'?'Presta atención a los sonidos, los acentos y los apóstrofos.':'Escucha una frase y elige su significado. La escritura francesa permanece oculta.'}</p></div><button class="btn secondary small" data-action="practice-back">Salir</button></div>${quizProgress()}<section class="listen-hero"><button class="listen-orb icon" style="border:0;cursor:pointer" data-action="replay" aria-label="Repetir audio">${icon('sound')}</button><div class="quiz-actions" style="justify-content:center;margin-top:14px"><button class="btn" data-action="replay">${icon('repeat')} Escuchar otra vez</button><label class="sr-only" for="speed">Velocidad del audio</label><select id="speed"><option value="1" ${playbackRate===1?'selected':''}>Normal</option><option value="0.8" ${playbackRate===.8?'selected':''}>0,8×</option></select><button class="btn secondary" data-action="transcript">${shownTranscript?'Ocultar frase':'Ver frase'}</button></div>${shownTranscript||quiz.answered?`<p class="answer-phrase" lang="fr">${esc(audioTextOf(v))}</p>`:''}</section>${quiz.type==='choice'?`<div class="choice-grid">${quiz.options.map((id,i)=>`<button class="choice ${wrongId===id?'wrong':''} ${correctId===id?'correct':''}" data-action="answer-choice" data-id="${id}" ${quiz.answered?'disabled':''}><span class="choice-number">${i+1}</span><span>${esc(answerTranslation(byId.get(id)))}</span></button>`).join('')}</div>`:`<div class="dictation"><label class="sr-only" for="dictation">Tu transcripción en francés</label><textarea id="dictation" lang="fr" placeholder="Écris la phrase ici…" autocomplete="off" autocapitalize="off" spellcheck="false" ${quiz.answered?'disabled':''}>${esc(quiz.answerText)}</textarea><div class="accent-keys" aria-label="Insertar caracteres franceses">${['à','â','ç','é','è','ê','ë','î','ï','ô','ù','û','œ',"'"].map(c=>`<button data-action="accent" data-char="${esc(c)}" aria-label="Insertar ${esc(c)}">${c}</button>`).join('')}</div><p class="dictation-tip">Se toleran mayúsculas y puntuación; se revisan los acentos. Ctrl + Enter para comprobar.</p></div>`}<p class="quiz-caption ${feedbackType}" style="text-align:center" role="status">${esc(feedback)}</p><div class="quiz-footer">${quiz.answered?`<button class="btn" data-action="next-question">${quiz.index+1===quiz.ids.length?'Ver resultado':'Siguiente frase'} ${icon('arrow')}</button>`:quiz.type==='dictation'?'<button class="btn" data-action="check-dictation">Comprobar</button>':''}<button class="btn secondary" data-action="skip">Saltar esta frase</button></div>`;}
function progressPage(){const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;days.push({label:d.toLocaleDateString('es-ES',{weekday:'short'}),n:progress.activity[k]||0});}const max=Math.max(1,...days.map(d=>d.n));const vaultAll=getVaultEntries(),vaultPending=vaultAll.filter(x=>x.needsReview!==false);return `<div class="page-heading"><div><div class="eyebrow">PASO A PASO</div><h1>Tu francés está creciendo.</h1><p>Este progreso se guarda en este navegador. Puedes exportarlo y llevarlo a otro dispositivo.</p></div><div class="quiz-actions"><button class="btn secondary small" data-action="export">${icon('download')} Exportar progreso</button><button class="btn secondary small" data-action="import">Importar</button><input type="file" id="progress-file" accept="application/json,.json" hidden></div></div>${window.ATELIER_REWARDS?.render(progress.journey)||''}<div class="progress-grid">${[[progress.studied.length,'Fichas exploradas'],[progress.rounds,'Prácticas completadas'],[progress.successes.length,'Fichas recordadas'],[vaultAll.length,'Historial en cuaderno de errores']].map(([n,t])=>`<div class="progress-card"><strong>${fmt(n)}</strong><p>${t}</p></div>`).join('')}</div><div class="progress-panel"><h2>🔒 Tu cuaderno privado de errores</h2><p>${vaultAll.length?`Se han registrado <strong>${vaultAll.length} elementos</strong> que alguna vez te han hecho dudar (${vaultPending.length} pendientes de dominar y ${vaultAll.length-vaultPending.length} ya recuperados). Nada se borra de tu historial para que puedas repasarlo cuando quieras.`:'Cada vez que falles o pidas una pista en verbos, vocabulario, imágenes, gramática, subjuntivo, expresiones o DELF/DALF, se guardará automáticamente en tu cuaderno privado.'}</p><div class="quiz-actions" style="margin-top:12px"><a class="btn" href="#mistakes">${icon('lock')} Abrir mi cuaderno de errores (${vaultAll.length})</a>${vaultAll.some(x=>x.kind==='verb'||x.verb)?`<button class="btn secondary" data-action="practice-verb-mistakes">🚂 Practicar verbos fallados</button>`:''}${progress.mistakes.some(id=>byId.has(id)&&!byId.get(id).pregunta)?'<button class="btn secondary" data-action="practice-mistakes">'+icon('headphones')+' Repasar audios pendientes</button>':''}</div></div><div class="progress-panel"><h2>Un poco, cada día</h2><p>Interacciones con tus fichas durante los últimos siete días.</p><div class="week-bars">${days.map(d=>`<div class="week-day"><div class="bar"><span style="height:${Math.max(3,100*d.n/max)}%" title="${d.n} interacciones"></span></div><label>${d.label}</label></div>`).join('')}</div></div><div class="progress-panel"><h2>Tus rondas de juego</h2><p>${progress.games.length?`${progress.games.length} rondas guardadas · ${progress.games.reduce((n,g)=>n+(g.correct||0),0)} aciertos a la primera de ${progress.games.reduce((n,g)=>n+(g.total||0),0)} oportunidades. Las ayudas y los errores quedan pendientes de repaso.`:'Escucha, reconstruye frases, completa huecos y une parejas con tus expresiones.'}</p><button class="btn" data-action="navigate" data-section="games">Ir a los juegos ${icon('arrow')}</button></div><div class="progress-panel"><h2>Lo que mide este espacio</h2><p>Las respuestas de escucha y dictado se comprueban con tu material. La gramática permite autoevaluarte después de revelar la explicación. La práctica oral sirve para grabar y comparar; no genera una nota automática de pronunciación.</p></div>`;}

function mistakeKindCategory(entry){
  const k=entry?.kind||'other';
  if(k==='verb'||k==='verb-mission')return 'verb';
  if(k==='vocabulary')return 'vocabulary';
  if(k==='grammar'||k==='subjunctive')return 'grammar';
  if(k==='conversation'||k==='expression')return 'conversation';
  if(k==='exam-review')return 'exam-review';
  return 'other';
}
function mistakeKindBadge(entry){
  const k=entry?.kind||'other';
  if(k==='verb')return `🚂 Verbo${entry.groupLabel?' · '+entry.groupLabel:''}`;
  if(k==='verb-mission')return '🗺️ Misión verbos';
  if(k==='vocabulary')return '📘 Vocabulario / Imagen';
  if(k==='grammar')return '✍️ Gramática';
  if(k==='subjunctive')return '✨ Subjuntivo';
  if(k==='conversation')return '💬 Conversación';
  if(k==='expression')return '🎭 Expresión';
  if(k==='exam-review')return `🎓 DELF/DALF ${entry.level||''}`.trim();
  return '📌 Práctica';
}
function filteredVaultEntries(){
  const all=getVaultEntries();
  const q=norm(mistakeSearchQuery);
  return all.filter(entry=>{
    if(mistakeStatusFilter==='pending'&&entry.needsReview===false)return false;
    if(mistakeStatusFilter==='recovered'&&entry.needsReview!==false)return false;
    if(mistakeKindFilter!=='all'&&mistakeKindCategory(entry)!==mistakeKindFilter)return false;
    if(q&&!norm(`${entry.title||''} ${entry.subtitle||''} ${entry.detail||''} ${entry.explanation||''} ${entry.verb||''} ${entry.groupLabel||''} ${entry.userAnswer||''}`).includes(q))return false;
    return true;
  });
}
function formatShortDate(iso){
  if(!iso)return '';
  try{return new Date(iso).toLocaleDateString('es-ES',{day:'2-digit',month:'short'});}catch{return '';}
}
function mistakesPage(){
  if(!verbs&&Array.isArray(window.ATELIER_VERBS))verbs=window.ATELIER_VERBS;
  if(!verbs)loadVerbs();
  const all=getVaultEntries();
  const pending=all.filter(x=>x.needsReview!==false);
  const recovered=all.filter(x=>x.needsReview===false);
  const verbMistakes=all.filter(x=>mistakeKindCategory(x)==='verb'||x.verb);
  const audioMistakes=all.filter(x=>byId.has(x.id)&&!byId.get(x.id).pregunta);
  const list=filteredVaultEntries();
  if(mistakeFlashcardIndex>=list.length)mistakeFlashcardIndex=0;
  const activeCard=list[mistakeFlashcardIndex]||null;
  const kindCounts={
    all:all.length,
    verb:all.filter(x=>mistakeKindCategory(x)==='verb').length,
    vocabulary:all.filter(x=>mistakeKindCategory(x)==='vocabulary').length,
    grammar:all.filter(x=>mistakeKindCategory(x)==='grammar').length,
    conversation:all.filter(x=>mistakeKindCategory(x)==='conversation').length,
    'exam-review':all.filter(x=>mistakeKindCategory(x)==='exam-review').length
  };
  return `<div class="page-heading mistakes-heading">
    <div>
      <div class="eyebrow">🔒 ESPACIO PRIVADO · MEMORIA PERMANENTE DE ERRORES</div>
      <h1>Cuaderno privado de errores</h1>
      <p>Todo lo que alguna vez has fallado, saltado o consultado con pista (sea en <strong>verbos, tren de conjugación, vocabulario visual, gramática, conversación, subjuntivo, expresiones o DELF/DALF</strong>) queda guardado aquí automáticamente. <strong>Nada se borra cuando aciertas</strong>: pasa a «Recuperado», pero sigue siempre en tu historial privado para que puedas repasarlo cuando quieras.</p>
    </div>
    <div class="quiz-actions">
      <button class="btn secondary small" data-action="export">${icon('download')} Exportar mi historial</button>
    </div>
  </div>
  <section class="mistakes-summary-banner">
    <div class="mistakes-stat-cards">
      <div class="mistake-stat-card"><strong>${fmt(all.length)}</strong><span>Total histórico guardado</span></div>
      <div class="mistake-stat-card is-pending"><strong>${fmt(pending.length)}</strong><span>Pendientes de dominar</span></div>
      <div class="mistake-stat-card is-recovered"><strong>${fmt(recovered.length)}</strong><span>Recuperados / dominados</span></div>
      <div class="mistake-stat-card"><strong>${fmt(verbMistakes.length)}</strong><span>Verbos y conjugaciones</span></div>
    </div>
    <div class="mistakes-quick-actions">
      <button type="button" class="btn" data-action="practice-verb-mistakes" ${verbMistakes.length?'':'disabled'}>🚂 Practicar verbos fallados en el Tren (${verbMistakes.length})</button>
      <button type="button" class="btn secondary" data-action="practice-mistakes" ${audioMistakes.length?'':'disabled'}>${icon('headphones')} Dictado/escucha de fichas falladas (${audioMistakes.length})</button>
      <button type="button" class="btn secondary" data-action="mistake-flashcard-toggle">${mistakeFlashcardOpen?'Ocultar entrenador rápido':'🃏 Abrir entrenador rápido aquí'}</button>
    </div>
  </section>
  ${mistakeFlashcardOpen&&activeCard?`<section class="mistake-trainer" aria-label="Entrenador rápido de errores">
    <header class="mistake-trainer-head">
      <div>
        <span class="eyebrow">🃏 ENTRENADOR RÁPIDO MULTIMATERIA · TARJETA ${mistakeFlashcardIndex+1} DE ${list.length}</span>
        <h3>Pon a prueba tu memoria antes de mirar la solución</h3>
      </div>
      <div class="mistake-trainer-nav">
        <button type="button" class="btn secondary small" data-action="mistake-flashcard-prev" ${list.length<=1?'disabled':''}>← Anterior</button>
        <button type="button" class="btn secondary small" data-action="mistake-flashcard-next" ${list.length<=1?'disabled':''}>Siguiente →</button>
      </div>
    </header>
    <div class="mistake-trainer-body">
      <div class="mistake-badges">
        <span class="mistake-status-pill ${activeCard.needsReview!==false?'is-pending':'is-recovered'}">${activeCard.needsReview!==false?'● Pendiente de dominar':'✓ Recuperado (en historial)'}</span>
        <span class="mistake-kind-pill">${esc(mistakeKindBadge(activeCard))}</span>
        <span class="mistake-counts-pill">Fallos: ${activeCard.failCount||0} · Pistas: ${activeCard.helpedCount||0} · Recuperado: ${activeCard.recoveredCount||0}</span>
      </div>
      <h2 lang="fr" class="mistake-trainer-title">${esc(activeCard.title)}</h2>
      <p class="mistake-trainer-sub">${esc(activeCard.subtitle||'')}</p>
      ${activeCard.userAnswer?`<p class="mistake-user-attempt">Tu intento registrado cuando fallaste: <strong lang="fr">«${esc(activeCard.userAnswer)}»</strong></p>`:''}
      <div class="mistake-try-row">
        <input id="mistake-try-input" type="text" lang="fr" value="${esc(mistakeTryText)}" placeholder="Escribe aquí tu intento en francés antes de revelar…" autocomplete="off" spellcheck="false">
        <button type="button" class="btn" data-action="mistake-flashcard-reveal">${mistakeFlashcardRevealed?'Ocultar solución':'Comprobar / Ver solución'}</button>
        <button type="button" class="btn secondary" data-action="mistake-listen" data-id="${esc(activeCard.id)}">🔊 Escuchar</button>
      </div>
      ${mistakeFlashcardRevealed?`<div class="mistake-trainer-solution">
        <div class="eyebrow">MODELO CORRECTO Y EXPLICACIÓN</div>
        <p class="mistake-solution-fr" lang="fr">${esc(activeCard.detail||activeCard.title)}</p>
        ${activeCard.explanation?`<p class="mistake-solution-exp">${esc(activeCard.explanation)}</p>`:''}
        <div class="mistake-trainer-grade">
          <button type="button" class="btn" data-action="mistake-grade-card" data-id="${esc(activeCard.id)}" data-ok="yes">✓ Ya lo domino (pasar a recuperado y siguiente)</button>
          <button type="button" class="btn secondary" data-action="mistake-grade-card" data-id="${esc(activeCard.id)}" data-ok="no">↻ Seguir repasando (mantener pendiente)</button>
        </div>
      </div>`:''}
    </div>
  </section>`:''}
  <div class="mistakes-filter-bar">
    <div class="mistakes-status-tabs" role="tablist" aria-label="Filtrar por estado">
      <button type="button" class="theme-scope-btn ${mistakeStatusFilter==='all'?'is-active':''}" data-action="mistake-filter-status" data-status="all">📚 Todo mi historial (${all.length})</button>
      <button type="button" class="theme-scope-btn ${mistakeStatusFilter==='pending'?'is-active':''}" data-action="mistake-filter-status" data-status="pending">🎯 Pendientes de dominar (${pending.length})</button>
      <button type="button" class="theme-scope-btn ${mistakeStatusFilter==='recovered'?'is-active':''}" data-action="mistake-filter-status" data-status="recovered">✓ Ya recuperados (${recovered.length})</button>
    </div>
    <label class="search-box mistakes-search-box">${icon('search')}<input id="mistake-search" type="search" value="${esc(mistakeSearchQuery)}" placeholder="Buscar en tus errores (verbo, palabra, grupo, tiempo, significado)…" aria-label="Buscar en cuaderno de errores"></label>
  </div>
  <div class="theme-Macro-pills" role="navigation" aria-label="Filtrar errores por categoría">
    ${[
      ['all','Todas las áreas',kindCounts.all],
      ['verb','🚂 Verbos y conjugación',kindCounts.verb],
      ['vocabulary','📘 Vocabulario e imágenes',kindCounts.vocabulary],
      ['grammar','✍️ Gramática y subjuntivo',kindCounts.grammar],
      ['conversation','💬 Conversación y expresiones',kindCounts.conversation],
      ['exam-review','🎓 DELF / DALF',kindCounts['exam-review']]
    ].map(([k,label,cnt])=>`<button type="button" class="theme-pill ${mistakeKindFilter===k?'is-active':''}" data-action="mistake-filter-kind" data-kind="${k}">${label} <span>${cnt}</span></button>`).join('')}
  </div>
  <div class="filter-count">${list.length} ${list.length===1?'registro en tu cuaderno':'registros en tu cuaderno'}</div>
  ${list.length?`<div class="mistakes-grid">${list.map(entry=>`<article class="mistake-card ${entry.needsReview!==false?'is-pending':'is-recovered'}">
    <div class="mistake-card-top">
      <div class="mistake-badges">
        <span class="mistake-status-pill ${entry.needsReview!==false?'is-pending':'is-recovered'}">${entry.needsReview!==false?'● Pendiente':'✓ Recuperado'}</span>
        <span class="mistake-kind-pill">${esc(mistakeKindBadge(entry))}</span>
      </div>
      <small class="mistake-date">${formatShortDate(entry.lastFailedAt||entry.firstSeenAt)}</small>
    </div>
    <h3 lang="fr">${esc(entry.title)}</h3>
    ${entry.subtitle?`<p class="mistake-subtitle">${esc(entry.subtitle)}</p>`:''}
    ${entry.userAnswer?`<p class="mistake-user-attempt">Escribiste: <strong lang="fr">«${esc(entry.userAnswer)}»</strong></p>`:''}
    ${entry.detail?`<div class="mistake-model-box"><small>SOLUCIÓN / MODELO</small><strong lang="fr">${esc(entry.detail)}</strong></div>`:''}
    ${entry.explanation?`<p class="mistake-explanation">${esc(entry.explanation)}</p>`:''}
    <div class="mistake-stats-row">
      <span>Fallado: <strong>${entry.failCount||0}</strong></span>
      <span>Con pista: <strong>${entry.helpedCount||0}</strong></span>
      <span>Recuperado: <strong>${entry.recoveredCount||0}</strong></span>
    </div>
    <div class="mistake-card-actions">
      <button type="button" class="btn secondary small" data-action="mistake-listen" data-id="${esc(entry.id)}">🔊 Escuchar</button>
      ${entry.verb?`<button type="button" class="btn secondary small" data-action="verb-game" data-verb="${esc(entry.verb)}">🚂 Practicar «${esc(entry.verb)}»</button><button type="button" class="btn text small" data-action="jump-verb" data-verb="${esc(entry.verb)}">Ver tabla</button>`:''}
      ${byId.has(entry.id)?`<button type="button" class="btn text small" data-action="open" data-id="${esc(entry.id)}">Abrir ficha →</button>`:''}
      <button type="button" class="btn text small" data-action="mistake-toggle-status" data-id="${esc(entry.id)}">${entry.needsReview!==false?'✓ Marcar dominado':'↻ Volver a pendiente'}</button>
    </div>
  </article>`).join('')}</div>`:`<div class="empty-state"><h2>${all.length?'No hay errores con ese filtro':'Tu cuaderno privado está listo'}</h2><p>${all.length?'Prueba a cambiar entre «Todo mi historial», «Pendientes» o «Todas las áreas».':'En cuanto practiques en el Tren de los verbos, Vocabulario, Imágenes, Gramática, Conversación o Expresiones, cualquier fallo o pista que uses se guardará aquí automáticamente.'}</p><div class="quiz-actions" style="justify-content:center;margin-top:14px">${all.length?`<button class="btn secondary" data-action="mistake-reset-filters">Ver todo mi historial (${all.length})</button>`:`<a class="btn" href="#verb-game">Ir al Tren de los verbos →</a><a class="btn secondary" href="#themes">Explorar vocabulario visual →</a>`}</div></div>`}`;
}

function verbsPage(){
  if(!verbs&&Array.isArray(window.ATELIER_VERBS))verbs=window.ATELIER_VERBS;
  if(!verbs){loadVerbs();return '<div class="empty-state"><h2>Abriendo tus tablas verbales…</h2><p>566 verbos, con sus tiempos y variantes.</p></div>';}
  const q=norm(verbQuery);
  const verbGroupsApi=window.ATELIER_VERB_GROUPS;
  const allGroups=verbGroupsApi?.groups||[];
  const activeGrp=allGroups.find(g=>g.id===verbGroup)||null;
  const list=verbs.filter(v=>(!verbLevel||v.nivel===verbLevel)&&(!verbGroup||verbGroupsApi?.matches?.(v,verbGroup))&&(!q||norm(`${v.verbe} ${v.es}`).includes(q)));
  const v=list.find(x=>x.verbe===selectedVerb)||list[0];
  const groupCounts=new Map(allGroups.map(g=>[g.id,verbs.filter(x=>(!verbLevel||x.nivel===verbLevel)&&verbGroupsApi?.matches?.(x,g.id)).length]));
  const groupBarHtml=allGroups.length?`<section class="verb-group-explorer" aria-label="Clasificación de verbos por grupos morfológicos">
    <div class="verb-group-bar-head">
      <div>
        <span class="eyebrow">CLASIFICACIÓN MORFOLÓGICA · 12 GRUPOS Y FAMILIAS</span>
        <h2>Filtra, aprende el truco y practica por grupos (-er, -ir con -issant, -ir como partir, -dre, -prendre, -indre…)</h2>
      </div>
      <div class="verb-group-bar-actions">
        ${activeGrp?`<button type="button" class="btn small" data-action="verb-game" data-verb="group:${esc(activeGrp.id)}">🚂 Practicar este grupo (${groupCounts.get(activeGrp.id)||0}) →</button>`:`<button type="button" class="btn small" data-action="verb-game" data-verb="">🚂 Ir al Tren de los verbos →</button>`}
        <button type="button" class="btn secondary small" data-action="toggle-verb-group-guide">${showVerbGroupGuide?'Ocultar guía de los 12 grupos':'📘 Ver trucos de los 12 grupos'}</button>
      </div>
    </div>
    <div class="vg-group-pills" role="group" aria-label="Seleccionar grupo de verbos">
      <button type="button" class="vg-group-pill ${!verbGroup?'is-active':''}" data-action="verb-group" data-group="">Todos los grupos <span>${verbs.filter(x=>!verbLevel||x.nivel===verbLevel).length}</span></button>
      ${allGroups.map(g=>`<button type="button" class="vg-group-pill ${verbGroup===g.id?'is-active':''}" data-action="verb-group" data-group="${esc(g.id)}"><span class="vg-pill-badge">${esc(g.badge)}</span><span>${esc(g.short)}</span><strong>${groupCounts.get(g.id)||0}</strong></button>`).join('')}
    </div>
    ${activeGrp?`<aside class="vg-group-trick-card">
      <div class="vg-group-trick-top">
        <div>
          <span class="eyebrow">${esc(activeGrp.code)} · ${esc(activeGrp.ending)}</span>
          <h3>${esc(activeGrp.title)}</h3>
        </div>
        <button type="button" class="btn small" data-action="verb-game" data-verb="group:${esc(activeGrp.id)}">🚂 Practicar solo este grupo →</button>
      </div>
      <div class="vg-group-trick-grid">
        <div><strong>Cómo reconocerlo y clasificarlo</strong><p>${esc(activeGrp.howToClassify)}</p></div>
        <div><strong>Fórmula de presente y participio</strong><p lang="fr">${esc(activeGrp.presentFormula)}</p><p><small>Participio pasado: <strong lang="fr">${esc(activeGrp.participe)}</strong></small></p></div>
        <div><strong>Truco de memorización</strong><p>${esc(activeGrp.memoryTrick)}</p></div>
      </div>
    </aside>`:''}
    ${showVerbGroupGuide?`<div class="verb-all-groups-guide">${allGroups.map(g=>`<article class="verb-guide-mini-card">
      <div class="verb-guide-mini-head"><span class="vg-pill-badge">${esc(g.badge)}</span><strong>${esc(g.title)}</strong></div>
      <p><strong>Clasificación:</strong> ${esc(g.howToClassify)}</p>
      <p><strong>Fórmula:</strong> <span lang="fr">${esc(g.presentFormula)}</span> · Participio: <strong lang="fr">${esc(g.participe)}</strong></p>
      <p><strong>Truco:</strong> ${esc(g.memoryTrick)}</p>
      <p class="verb-guide-samples" lang="fr">Ejemplos: ${esc((g.sampleVerbs||[]).join(', '))}</p>
      <div class="verb-guide-mini-actions">
        <button type="button" class="btn secondary small" data-action="verb-group" data-group="${esc(g.id)}">Filtrar estos verbos (${groupCounts.get(g.id)||0})</button>
        <button type="button" class="btn small" data-action="verb-game" data-verb="group:${esc(g.id)}">🚂 Practicar grupo →</button>
      </div>
    </article>`).join('')}</div>`:''}
  </section>`:'';
  if(!v)return `<div class="page-heading"><div><h1>Verbos</h1><p>No hay verbos con estos filtros.</p></div></div>${groupBarHtml}<div class="toolbar"><label class="search-box">${icon('search')}<input id="verb-search" type="search" value="${esc(verbQuery)}" aria-label="Buscar verbo"></label><button class="btn secondary" data-action="reset-verbs">Ver todos los verbos</button></div>`;
  const vGrp=verbGroupsApi?.classify?.(v);
  const times=Object.entries(v.temps||{}).filter(([k])=>!verbTense||k.startsWith(verbTense));
  return `<div class="page-heading"><div><div class="eyebrow">CONSULTAR, CLASIFICAR Y PRACTICAR</div><h1>Un verbo, muchas posibilidades.</h1><p>Tus 566 tablas verbales clasificadas por <strong>grupos y familias morfológicas</strong>. Elige un grupo para ver su regla y practicarlo en el tren, o escucha y repite cada conjugación.</p></div><div class="quiz-actions"><button class="btn" data-action="verb-game" data-verb="${verbGroup?'group:'+esc(verbGroup):esc(v.verbe)}">🚂 Practicar en el Tren →</button><a class="btn secondary" href="#verb-missions">Misiones en contexto ↗</a></div></div>
  ${groupBarHtml}
  <div class="toolbar"><label class="search-box">${icon('search')}<input type="search" id="verb-search" aria-label="Buscar verbo" value="${esc(verbQuery)}" placeholder="Buscar un verbo o su significado…"></label><select id="verb-group" aria-label="Filtrar por grupo verbal"><option value="">Todos los grupos (12 familias)</option>${allGroups.map(g=>`<option value="${esc(g.id)}" ${verbGroup===g.id?'selected':''}>${esc(g.short)} (${groupCounts.get(g.id)||0})</option>`).join('')}</select><select id="verb-level" aria-label="Filtrar verbos por nivel"><option value="">Todos los niveles</option>${LEVELS.filter(l=>verbs.some(v=>v.nivel===l)).map(l=>`<option ${verbLevel===l?'selected':''}>${l}</option>`).join('')}</select><select id="verb-tense" aria-label="Filtrar por modo"><option value="">Todos los modos</option>${['Indicatif','Conditionnel','Subjonctif','Impératif','Infinitif','Participe','Gérondif'].map(t=>`<option ${verbTense===t?'selected':''}>${t}</option>`).join('')}</select>${verbQuery||verbLevel||verbTense||verbGroup?'<button class="btn secondary small" data-action="reset-verbs">Limpiar filtros</button>':''}</div>
  <div class="ca-usage"><b>Escucha y repite.</b> ▷ reproduce una forma; 0,8× la ralentiza; ↻ deja un espacio para repetirla y vuelve a sonar. ${window.ATELIER_CONJUGATION_AUDIO_DATA?.meta?.generationInProgress?'Ya están incluidos 25 verbos frecuentes en cinco tiempos. Se está preparando el audio del resto de las tablas.':'Todas las formas de tus tablas tienen audio incluido.'} La grabación para comparar tu voz se queda en este dispositivo.</div>
  <div class="filter-count">${list.length} ${list.length===1?'verbo':'verbos'}${activeGrp?` · ${esc(activeGrp.title)}`:''}</div>
  <div class="verb-layout"><div class="verb-list" aria-label="Lista de verbos">${list.map(x=>{const xg=verbGroupsApi?.classify?.(x);return `<button class="verb-option ${x.verbe===v.verbe?'active':''}" data-action="select-verb" data-verb="${esc(x.verbe)}"><div class="verb-option-top"><span lang="fr">${esc(x.verbe)}</span>${xg?`<em class="verb-option-badge">${esc(xg.badge)}</em>`:''}</div><small>${esc(x.es)}</small></button>`;}).join('')||'<p class="no-results">No hay resultados</p>'}</div><section class="verb-detail"><div class="verb-detail-header"><div><h2 lang="fr">${esc(v.verbe)}</h2><p class="verb-subtitle">${esc(v.es)} · Nivel ${esc(v.nivel)} · Auxiliar: ${esc(v.auxiliaire_principal||v.auxiliaire)}${vGrp?` · <strong>${esc(vGrp.short)}</strong>`:''}</p></div><div class="verb-detail-buttons"><button class="btn small" data-action="verb-game" data-verb="${esc(v.verbe)}">🚂 Practicar «${esc(v.verbe)}» →</button>${vGrp?`<button class="btn secondary small" data-action="verb-game" data-verb="group:${esc(vGrp.id)}">Practicar grupo (${esc(vGrp.badge)}) →</button>`:''}${D.grammar.some(x=>x.verbe===v.verbe)?`<button class="btn secondary small" data-action="practice-verb" data-verb="${esc(v.verbe)}">Ficha gramatical ${icon('arrow')}</button>`:''}</div></div>${window.ATELIER_VERB_TIPS?.renderCompact(v)||''}<div class="tense-grid" style="margin-top:20px">${times.map(([t,forms])=>`<div class="tense-card"><h3>${esc(t)}</h3>${forms.map(f=>`<div lang="fr">${window.ATELIER_CONJUGATION_AUDIO?.variants(f)||esc(f)}</div>`).join('')}</div>`).join('')}</div><details style="margin-top:23px"><summary>Notas y fuentes del verbo</summary><p class="sources" style="white-space:pre-line;font-size:11px;margin-top:12px">${esc(v.note)}</p><p class="sources" style="font-size:10px;overflow-wrap:anywhere;margin-top:10px">${esc(v.source)}</p></details></section></div>${D.verbLocutions?.length?`<details class="progress-panel"><summary>Las ${D.verbLocutions.length} locuciones de tu material</summary><p class="ca-usage">En los esquemas con «+ infinitif», el audio pronuncia la parte fija de la construcción. El signo + indica dónde añadir tu infinitivo; no se lee como una palabra de la frase.</p><p class="source-note">En avoir besoin de, avoir envie de, avoir faim y avoir peur de, el participio de estas construcciones permanece eu: elle a eu faim. <a href="https://vitrinelinguistique.oqlf.gouv.qc.ca/21546/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-avoir/accord-du-participe-passe-employe-avec-lauxiliaire-avoir" target="_blank" rel="noopener noreferrer">Consultar la regla de concordancia ↗</a></p>${D.verbLocutions.map(x=>`<details style="margin-top:15px"><summary><strong lang="fr">${esc(x.verbe)}</strong> · ${esc(x.es)}</summary><div class="tense-grid" style="margin-top:15px">${Object.entries(x.temps||{}).map(([t,forms])=>`<div class="tense-card"><h3>${esc(locutionReviewedRows(forms).length<forms.length?t.replace(/\(.*\)/,'(invariable dans cette locution)'):t)}</h3>${locutionReviewedRows(forms).map(f=>`<div lang="fr">${window.ATELIER_CONJUGATION_AUDIO?.variants(f)||esc(f)}</div>`).join('')}</div>`).join('')}</div><p class="sources">${esc(x.note||'')}</p></details>`).join('')}</details>`:''}`;
}
let verbsLoading=false;function loadVerbs(){if(verbsLoading)return;verbsLoading=true;const s=document.createElement('script');s.src='data/verbs.js';s.onload=()=>{verbs=window.ATELIER_VERBS;verbsLoading=false;if(route.section==='verbs'||route.section==='mistakes')render();};s.onerror=()=>{verbsLoading=false;toast('No se han podido abrir las tablas. Comprueba la carpeta data.');};document.head.appendChild(s);}
function render(){let content;if(route.section==='home')content=home();else if(route.section==='themes')content=themesPage();else if(route.section==='theme')content=topicPage();else if(['vocabulary','grammar','conversation'].includes(route.section))content=catalogPage();else if(route.section==='verbs')content=verbsPage();else if(route.section==='verb-tips')content=window.ATELIER_VERB_TIPS?.render()||'';else if(route.section==='verb-lessons')content=window.ATELIER_VERB_LESSON_UI?.render()||'';else if(route.section==='exam-review')content=window.ATELIER_EXAM_REVIEW?.render()||'';else if(route.section==='adventure')content=(window.ATELIER_ADVENTURE?.render()||'')+(window.ATELIER_ADVENTURE?.isPlaying()?"":window.ATELIER_REWARDS?.render(progress.journey,{compact:true})||'');else if(route.section==='verb-missions')content=window.ATELIER_VERB_MISSIONS?.render()||'';else if(route.section==='verb-game')content=window.ATELIER_VERB_GAME?.render()||'';else if(route.section==='games')content=window.ATELIER_GAMES?.render()||'<div class="empty-state"><h2>Abriendo los juegos…</h2></div>';else if(route.section==='mistakes')content=mistakesPage();else if(route.section==='progress')content=progressPage();else if(route.section==='practice')content=practicePage();else content=home();app.innerHTML=shell(content);document.title=`${route.section==='verb-missions'?'Misión verbos':route.section==='verb-game'?'Tren de los verbos':route.section==='theme'?currentTheme().fr:nav.find(x=>x[0]===route.section)?.[2]||'Práctica'} · Atelier français`;}
function closeModal(){const el=document.getElementById('modal-root');if(el)el.remove();document.body.style.overflow='';modalItem=null;modalKind='';stopRecording();modalPreviousFocus?.focus?.();}
function showModal(content,label='Ficha'){if(!document.getElementById('modal-root'))modalPreviousFocus=document.activeElement;let root=document.getElementById('modal-root');if(!root){root=document.createElement('div');root.id='modal-root';document.body.appendChild(root);}root.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(label)}"><button class="icon-btn modal-close" data-action="close-modal" aria-label="Cerrar">${icon('close')}</button>${content}</section></div>`;document.body.style.overflow='hidden';root.querySelector('.modal-close').focus();}
function textSection(label,text,cls='body-text'){return text?`<p class="section-label">${label}</p><p class="${cls}">${esc(text)}</p>`:'';}
function sourceLinks(text){return esc(text||'').replace(/https?:\/\/[^\s<>]+/g,url=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);}
function showItem(id,revealed=false){const x=byId.get(id);if(!x)return;modalItem=id;modalKind='item';modalRevealed=revealed;markStudied(id);const vocab=!!x.word,grammar=!!x.pregunta;let content=`<div class="eyebrow">${esc(x.nivel||x.category||x.grupo||'TU BIBLIOTECA')}</div>${illustrated.has(id)?`${picture(illustrated.get(id),vocab?x.word:'','modal-photo')}`:''}<h2 ${grammar?'':'lang="fr"'}>${esc(vocab?x.word:grammar?x.tema:x.frase_fr)}</h2>${vocab?`<p class="ipa">${esc(x.ipa)}</p><p class="translation">${esc(x.translation)}</p>`:!grammar?`<p class="body-es">${esc(x.traduccion_es)}</p><p class="ipa">${esc(x.ipa)}</p>`:''}`;
if(grammar){content+=`<p class="body-text" style="margin-top:20px">${esc(x.pregunta)}</p>${!revealed?`<p class="section-label">RECUPERA ANTES DE MIRAR</p><textarea id="grammar-answer" class="text-answer" rows="3" placeholder="Escribe tu intento de respuesta…" aria-label="Tu respuesta" aria-describedby="grammar-feedback"></textarea><p id="grammar-feedback" role="status"></p><button class="btn" style="margin-top:18px" data-action="reveal-answer" data-id="${id}">Mostrar respuesta y explicación ${icon('eye')}</button>`:`<div class="answer-box"><p class="body-fr">${esc(x.respuesta)}</p></div>${textSection('POR QUÉ',x.teoria)}${textSection('EJEMPLO',x.ejemplo_fr,'body-fr')}<p class="body-es">${esc(x.ejemplo_es)}</p><div class="audio-row"><button class="btn secondary" data-action="play" data-id="${id}">${icon('sound')} Escuchar ejemplo</button>${x.audio_forma?`<button class="btn secondary" data-action="play-src" data-src="${esc(x.audio_forma)}">${icon('sound')} Escuchar forma</button>`:''}</div>${textSection('EVITA ESTE ERROR',x.error)}${textSection('AHORA TÚ',x.produccion)}${textSection('ANTES DE ESTA FICHA',x.prerrequisitos)}<div class="self-grade"><button class="btn" data-action="self-grade" data-id="${id}" data-ok="yes">Lo he recordado ${icon('check')}</button><button class="btn secondary" data-action="self-grade" data-id="${id}" data-ok="no">Necesita otra vuelta ${icon('repeat')}</button></div><details><summary>Fuente del material</summary><p class="sources">${sourceLinks(x.fuente)}</p></details>`}`;}
else{content+=`${vocab?textSection('UNA FRASE PARA USARLA',x.phrase,'body-fr')+`<p class="body-es">${esc(x.phraseTranslation)}</p>`+vocabularyReviewNote(x):''}<div class="audio-row"><button class="btn" data-action="play" data-id="${id}">${icon('sound')} Escuchar frase</button>${x.audio_lento?`<button class="btn secondary" data-action="play-src" data-src="${esc(x.audio_lento)}">${icon('sound')} Audio lento</button>`:''}<button class="btn secondary" data-action="dictate" data-id="${id}">${icon('pen')} Hacer dictado</button><button class="icon-btn favorite ${progress.favorites.includes(id)?'saved':''}" data-action="favorite" data-id="${id}" aria-label="Guardar ficha">${icon('heart')}</button></div>${vocab?`${x.gender?`<div class="gender-pair"><button class="btn secondary" data-action="gender-answer" data-id="${id}" data-gender="m">Masculino</button><button class="btn secondary" data-action="gender-answer" data-id="${id}" data-gender="f">Femenino</button></div><p class="gender-feedback" id="gender-feedback" role="status"></p>`:''}${x.feminine?textSection('FORMA FEMENINA CONSERVADA',plain(x.feminine),'body-fr'):''}${x.other?textSection('OTRAS FORMAS',plain(x.other)):''}<details><summary>Uso y notas del material</summary>${textSection('USO',plain(x.usage))}${x.conjugation?textSection('CONJUGACIÓN',plain(x.conjugation)):''}<p class="sources">Referencia original ${esc(x.id)} · rango ${x.rank}. Se conserva la categoría de origen; el vocabulario no tenía nivel MCER individual.</p></details>`:`${textSection('SITUACIÓN',x.situacion)}${textSection('REGISTRO',x.registro)}${textSection('PRONUNCIACIÓN',x.pronunciacion)}${textSection('VARIANTES',x.variantes,'body-fr')}${x.audio_variantes?.length?`<div class="audio-row">${x.audio_variantes.map((a,i)=>`<button class="btn secondary small" data-action="play-src" data-src="${esc(typeof a==='string'?a:a.archivo)}" title="${esc(typeof a==='string'?'':a.texto)}">${icon('sound')} Variante ${i+1}</button>`).join('')}</div>`:''}${textSection('DIÁLOGO',x.dialogo_fr,'body-fr')}${x.audio_dialogo?`<button class="btn secondary" style="margin-top:12px" data-action="play-src" data-src="${esc(x.audio_dialogo)}">${icon('sound')} Escuchar diálogo</button>`:''}${x.dialogo_es?`<details><summary>Ver traducción del diálogo</summary><p class="body-es">${esc(x.dialogo_es)}</p></details>`:''}${textSection('AHORA TÚ',x.practica)}<details><summary>Léxico, gramática y fuente</summary>${textSection('LÉXICO',x.lexico)}${textSection('GRAMÁTICA',x.gramatica)}<p class="sources">${sourceLinks(x.fuente)}</p></details>`}<details><summary>Grabar y comparar mi voz</summary>${recorderHtml()}</details>`;}
showModal(content,grammar?x.tema:titleOf(x));}
function about(){const counts=D.meta?.counts||{},visuals=window.ATELIER_VISUALS,imageCount=Array.isArray(visuals?.items)?new Set(visuals.items.filter(item=>byId.has(item.id)).map(item=>item.id)).size:illustrated.size,themeCount=Array.isArray(visuals?.themes)?visuals.themes.length:THEMES.length,originalAudioLabel=Number.isSafeInteger(counts.audio)?`${fmt(counts.audio)} audios originales`:'audios originales conservados';modalKind='about';showModal(`<div class="eyebrow">MATERIAL QUE YA ERA TUYO</div><h2>Tu biblioteca, otra forma de aprender.</h2><p class="body-text">Esta web reutiliza las entradas, frases, explicaciones, identificadores y audios de tu carpeta Frances_Anki_A0_C2. La organización visual y las imágenes realistas se han creado para esta experiencia.</p><div class="answer-box"><p class="body-text">${fmt(D.vocabulary.length)} entradas de vocabulario · ${fmt(D.grammar.length)} fichas de gramática y práctica verbal · ${fmt(D.conversation.length)} entradas de conversación y pronunciación · ${fmt(verbs?.length||counts.verbTables||0)} tablas verbales · ${fmt(D.verbLocutions?.length||0)} locuciones · ${originalAudioLabel}.</p></div><p class="section-label">LAS IMÁGENES</p><p class="body-text">${fmt(imageCount)} entradas de vocabulario tienen una imagen de aspecto fotográfico creada con IA. Puedes practicar la escucha en ${fmt(themeCount)} temas visuales. Las escenas contextuales acompañan el uso de las frases; no son una definición visual única de todos los conceptos. Se conservan las frases y los audios originales de tus materiales.</p><p class="section-label">LOS AUDIOS</p><p class="body-text">Se conservan los ${originalAudioLabel} de tus materiales. Además, las conjugaciones cuentan con modelos para escuchar, ralentizar y repetir. La voz incluida es sintética: Microsoft Edge Read Aloud, francesa DeniseNeural; no son grabaciones de hablantes humanos. En vocabulario, el audio suele decir la frase completa. La cifra de audios originales no cuenta los modelos de conjugación.</p><p class="section-label">LOS NIVELES</p><p class="body-text">Se conservan los niveles pedagógicos de las fichas originales. El vocabulario mantiene su rango de frecuencia y sus categorías; no se le ha asignado un nivel MCER nuevo.</p><p class="section-label">TU PRÁCTICA</p><p class="body-text">El progreso se guarda en este navegador y se puede exportar e importar. Las grabaciones de tu voz se crean localmente y no se envían a un servidor. La práctica oral no puntúa fonemas ni sustituye una revisión de pronunciación.</p><p class="section-label">REFERENCIAS Y LICENCIAS</p><p class="body-text">Las fuentes de cada ficha se conservan en sus detalles. Las tablas verbales conservan sus fuentes de Verbiste / verbecc y sus avisos de licencia en la carpeta de datos.</p><p class="sources">${(D.meta.sources||[]).map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a>`).join(' · ')} · <a href="data/verbiste-license/GPL-2.0.txt" target="_blank">GPL-2.0</a></p><p class="sources">Inspiración de interacción: <a href="https://www.languageguide.org/french/vocabulary/" target="_blank" rel="noopener noreferrer">LanguageGuide</a>. No se han copiado sus imágenes ni sus audios.</p>`,'Sobre tus materiales');}
async function record(){if(recording){stopRecording(false);return;}if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){toast('Este navegador no permite grabar aquí. Puedes practicar en voz alta y comparar con el modelo.');return;}const session=++recordSession;try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});if(session!==recordSession){stream.getTracks().forEach(t=>t.stop());return;}recordStream=stream;recordChunks=[];if(recordUrl){URL.revokeObjectURL(recordUrl);recordUrl='';}recorder=new MediaRecorder(recordStream);recorder.addEventListener('dataavailable',e=>{if(e.data.size)recordChunks.push(e.data);});recorder.addEventListener('stop',()=>{const blob=new Blob(recordChunks,{type:recorder.mimeType||'audio/webm'});if(session===recordSession){recordUrl=URL.createObjectURL(blob);recording=false;refreshRecorder();}stream.getTracks().forEach(t=>t.stop());});recorder.start();recording=true;stopAudio();refreshRecorder();recordTimer=setTimeout(()=>stopRecording(false),60000);}catch(e){toast(e.name==='NotAllowedError'?'No se ha activado el micrófono. Puedes seguir practicando con el modelo.':'No se ha podido abrir el micrófono.');}}
function refreshRecorder(){document.querySelectorAll('.recorder').forEach(el=>{const wrap=document.createElement('div');wrap.innerHTML=recorderHtml();el.replaceWith(wrap.firstElementChild);});}
function stopRecording(discard=true){clearTimeout(recordTimer);if(discard){recordSession++;if(recordUrl){URL.revokeObjectURL(recordUrl);recordUrl='';}}if(recorder?.state==='recording')recorder.stop();recordStream?.getTracks().forEach(t=>t.stop());recording=false;}
function readRoute(){window.ATELIER_VERB_LESSON_UI?.leave();window.ATELIER_EXAM_REVIEW?.leave();window.ATELIER_CONJUGATION_AUDIO?.leave();window.ATELIER_VERB_TIPS?.leave();window.ATELIER_GAMES?.leave();window.ATELIER_ADVENTURE?.leave();window.ATELIER_VERB_GAME?.leave();window.ATELIER_VERB_MISSIONS?.leave();const hash=location.hash.slice(1);const [section,theme]=hash.split('/');if(section==='theme'&&ALL_THEMES.some(t=>t.id===theme))route={section:'theme',theme,mode:'explore'};else if(section==='verb-game'||nav.some(x=>x[0]===section))route={section};else route={section:'home'};quiz=null;selected=null;filters={query:'',level:'',category:'',page:1,favorites:false,pictures:route.section==='vocabulary'};resetFeedback();stopAudio();stopRecording();closeModal();if(route.section==='verb-lessons')window.ATELIER_VERB_LESSON_UI?.start();if(route.section==='exam-review')window.ATELIER_EXAM_REVIEW?.start();if(route.section==='verb-tips')window.ATELIER_VERB_TIPS?.start();if(route.section==='verb-missions')window.ATELIER_VERB_MISSIONS?.start();if(route.section==='verb-game'){window.ATELIER_VERB_GAME?.start(pendingVerb);pendingVerb='';}if(route.section==='adventure'&&['market','picture-memory','situations'].includes(theme))window.ATELIER_ADVENTURE?.start(theme);render();window.scrollTo(0,0);}
let pendingVerb='';
function go(section){if(location.hash===`#${section}`){readRoute();}else location.hash=section;}
function startCollection(ids,collection,type='choice'){closeModal();stopRecording();quiz=makeQuiz(ids,type,collection);prepareQuestion();route={section:'practice'};render();window.scrollTo(0,0);play(audioOf(byId.get(quiz.ids[0])));}
function checkDictation(){const input=document.getElementById('dictation');if(!input)return;quiz.answerText=input.value;const v=byId.get(quiz.ids[quiz.index]);if(!input.value.trim()){toast('Escribe primero lo que has escuchado.');return;}const ok=strictAnswer(input.value)===strictAnswer(audioTextOf(v));if(ok){noteAnswer(true);feedback='Bien. Has reconstruido la frase.';feedbackType='good';}else{noteAnswer(false);recordMistakeEntry({id:v.id,userAnswer:input.value.trim(),reason:'wrong'});feedback=normalizedAnswer(input.value)===normalizedAnswer(audioTextOf(v))?'Las palabras coinciden. Revisa los acentos y vuelve a intentarlo.':'Aún hay alguna diferencia. Escucha de nuevo o muestra la frase como ayuda.';feedbackType='bad';}render();if(!ok){const next=document.getElementById('dictation');next.focus();next.setSelectionRange(next.value.length,next.value.length);}}
function exportProgress(){const blob=new Blob([JSON.stringify({format:STORE,exported:new Date().toISOString(),progress},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`atelier-progreso-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importProgress(file){try{
  if(file.size>5000000)throw Error();const data=JSON.parse(await file.text());if(data.format!==STORE||!data.progress)throw Error();const p=data.progress,next=JSON.parse(JSON.stringify(progress));
  for(const k of ['studied','favorites','mistakes','successes']){if(!Array.isArray(p[k])||p[k].some(x=>typeof x!=='string'))throw Error();next[k]=unique([...next[k],...p[k]]).filter(id=>byId.has(id));}
  for(const k of ['rounds','attempts','correct']){if(!Number.isSafeInteger(p[k])||p[k]<0)throw Error();next[k]=Math.max(next[k],p[k]);}
  if(p.activity&&typeof p.activity==='object'){for(const [k,v]of Object.entries(p.activity))if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&Number.isSafeInteger(v)&&v>=0)next.activity[k]=Math.max(next.activity[k]||0,v);}
  if(Array.isArray(p.games)){const history=[...next.games,...p.games].filter(x=>x&&typeof x.type==='string'&&typeof x.date==='string'&&Number.isSafeInteger(x.correct)&&Number.isSafeInteger(x.total)&&x.total>=0&&x.correct>=0&&x.correct<=x.total);const seen=new Set();next.games=history.filter(x=>{const key=x.date+'|'+x.type;if(seen.has(key))return false;seen.add(key);return true;}).slice(-200);}
  if(p.errorVault&&typeof p.errorVault==='object'&&!Array.isArray(p.errorVault)){
    for(const [k,v] of Object.entries(p.errorVault)){
      if(v&&typeof v==='object'){
        const cur=next.errorVault[k];
        next.errorVault[k]=cur?{...cur,...v,failCount:Math.max(cur.failCount||0,v.failCount||0),helpedCount:Math.max(cur.helpedCount||0,v.helpedCount||0),recoveredCount:Math.max(cur.recoveredCount||0,v.recoveredCount||0)}:v;
      }
    }
  }
  next.journey=window.ATELIER_REWARDS?.merge(next.journey,p.journey)||next.journey;
  Object.assign(progress,next);persist();render();toast('Progreso importado y combinado con este navegador.');
}catch{toast('Ese archivo no es una exportación válida de Atelier français.');}}

document.addEventListener('click',async e=>{const lesson=e.target.closest('[data-verb-lesson-action]');if(lesson){e.preventDefault();if(!lesson.disabled)await window.ATELIER_VERB_LESSON_UI?.handle(lesson.dataset.verbLessonAction,lesson);return;}const review=e.target.closest('[data-exam-review-action]');if(review){e.preventDefault();if(!review.disabled)await window.ATELIER_EXAM_REVIEW?.handle(review.dataset.examReviewAction,review);return;}const audio=e.target.closest('[data-conjugation-audio-action]');if(audio){if(!audio.disabled)await window.ATELIER_CONJUGATION_AUDIO?.handle(audio.dataset.conjugationAudioAction,audio);return;}const tip=e.target.closest('[data-verb-tips-action]');if(tip){e.preventDefault();if(!tip.disabled)try{await window.ATELIER_VERB_TIPS?.handle(tip.dataset.verbTipsAction,tip);}catch(error){toast('No se ha podido abrir esta ayuda. Inténtalo de nuevo.');console.error(error);}return;}const mission=e.target.closest('[data-mission-action]');if(mission){if(!mission.disabled)try{await window.ATELIER_VERB_MISSIONS?.handle(mission.dataset.missionAction,mission);}catch(error){toast('No se pudo completar la misión. Inténtalo de nuevo.');console.error(error);}return;}const ab=e.target.closest('[data-adventure-action]'),vb=e.target.closest('[data-verb-game-action]');if(ab||vb){const node=ab||vb;if(node.disabled)return;try{await (ab?window.ATELIER_ADVENTURE:window.ATELIER_VERB_GAME)?.handle(ab?node.dataset.adventureAction:node.dataset.verbGameAction,node);}catch(error){toast('No se pudo completar esta acción. Inténtalo de nuevo.');console.error(error);}return;}const gb=e.target.closest('[data-game-action]');if(gb&&!gb.disabled){try{await window.ATELIER_GAMES?.handle(gb.dataset.gameAction,gb);}catch(error){toast('No se ha podido completar el juego. Vuelve a intentarlo.');console.error(error);}return;}const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const a=b.dataset.action,id=b.dataset.id;try{switch(a){
case 'skip-main':e.preventDefault();document.getElementById('main').focus();break;
case 'menu':{const open=document.querySelector('.shell').classList.toggle('menu-open');document.querySelector('.sidebar').inert=!open;document.querySelector('.mobile-menu').setAttribute('aria-expanded',String(open));break;}
case 'navigate':go(b.dataset.section);break;
case 'verb-game':pendingVerb=b.dataset.verb||'';go('verb-game');break;
case 'jump-verb':selectedVerb=b.dataset.verb||'être';verbQuery='';verbLevel='';verbGroup='';go('verbs');break;
case 'verb-group':verbGroup=b.dataset.group||'';render();break;
case 'toggle-verb-group-guide':showVerbGroupGuide=!showVerbGroupGuide;render();break;
case 'theme':go(`theme/${b.dataset.theme}`);break;
case 'theme-group':themeGroupFilter=b.dataset.group||'';render();break;
case 'theme-group-jump':e.preventDefault();themeGroupFilter=b.dataset.group||'';go('themes');break;
case 'theme-scope':themeScope=b.dataset.scope||'objects';render();break;
case 'theme-prev':case 'theme-next':{const pool=activeThemePool().some(t=>t.id===route.theme)?activeThemePool():ALL_THEMES;const i=Math.max(0,pool.findIndex(t=>t.id===route.theme));go(`theme/${pool[(i+(a==='theme-next'?1:pool.length-1))%pool.length].id}`);break;}
case 'mode':stopAudio();stopRecording();route.mode=b.dataset.mode;quiz=null;selected=null;resetFeedback();render();break;
case 'object':if(route.mode==='explore'){selected=id;markStudied(id);render();play(audioOf(byId.get(id)));}else if(route.mode==='listen'&&quiz?.active&&!quiz.done&&!quiz.answered){if(id===quiz.ids[quiz.index]){noteAnswer(true);correctId=id;wrongId='';feedback=quiz.hadError||quiz.revealed?'Bien, la has encontrado. Una vuelta más ayuda a fijarla.':'¡Bien! Has reconocido la frase.';feedbackType='good';}else{noteAnswer(false);wrongId=id;feedback='Prueba otra imagen. Puedes repetir el audio.';feedbackType='bad';}render();}else if(route.mode==='speak'&&quiz){quiz.revealed=true;render();play(audioOf(byId.get(id)));}break;
case 'play':play(audioOf(byId.get(id)),b);break;
case 'play-src':play(b.dataset.src,b);break;
case 'speak-word':if(b.dataset.word)window.ATELIER_CONJUGATION_AUDIO?.listen?.(b.dataset.word);break;
case 'favorite':{const index=progress.favorites.indexOf(id);if(index<0)progress.favorites.push(id);else progress.favorites.splice(index,1);persist();if(modalItem===id)showItem(id,modalRevealed);else render();toast(index<0?'Ficha guardada.':'Ficha retirada de guardados.');break;}
case 'open':showItem(id);break;
case 'close-modal':closeModal();break;
case 'reveal-answer':{const answer=document.getElementById('grammar-answer');if(modalItem!==id||!answer)break;if(!answer.value.trim()){const notice=document.getElementById('grammar-feedback');if(notice)notice.textContent='Escribe primero un intento de respuesta. No tiene que ser correcto para consultar la explicación.';answer.focus();break;}showItem(id,true);break;}
case 'self-grade':score(id,b.dataset.ok==='yes');closeModal();render();toast(b.dataset.ok==='yes'?'Respuesta marcada como recordada.':'Ficha añadida a tu cuaderno de errores.');break;
case 'gender-answer':{const x=byId.get(id),ok=x.gender===b.dataset.gender;if(!ok)recordMistakeEntry({id,userAnswer:b.dataset.gender==='m'?'Masculino':'Femenino',explanation:`Género de ${x.word}: es ${x.gender==='m'?'masculino':'femenino'} (${x.translation}).`,reason:'wrong'});const f=document.getElementById('gender-feedback');f.textContent=ok?'Correcto: '+(x.gender==='m'?'masculino.':'femenino.'):'Revisa el artículo. Es '+(x.gender==='m'?'masculino.':'femenino.');f.style.color=ok?'#477737':'#ac5142';document.getElementById('live').textContent=f.textContent;break;}
case 'about':about();break;
case 'start-topic':startTopic();break;
case 'replay':if(quiz?.active&&!quiz.done)play(audioOf(byId.get(quiz.ids[quiz.index])),b);break;
case 'transcript':shownTranscript=!shownTranscript;if(shownTranscript)quiz.revealed=true;render();break;
case 'reveal-model':quiz.revealed=true;render();play(audioOf(byId.get(quiz.ids[quiz.index])));break;
case 'speak-next':markStudied(quiz.ids[quiz.index]);advanceQuiz();break;
case 'next-question':advanceQuiz();break;
case 'skip':if(!quiz.answered){noteAnswer(false);}advanceQuiz();break;
case 'retry':{const old=quiz;quiz=makeQuiz(old.missed.length?old.missed:old.ids,old.type,old.collection,old.theme);prepareQuestion();render();if(quiz.type!=='speak')play(audioOf(byId.get(quiz.ids[0])));break;}
case 'practice-back':if(route.section==='theme'){route.mode='explore';quiz=null;resetFeedback();render();}else go(quiz?.collection||'vocabulary');break;
case 'start-collection':startCollection(shuffle(filteredRows()).slice(0,10).map(x=>x.id),route.section);break;
case 'answer-choice':if(quiz&&!quiz.answered){const ok=id===quiz.ids[quiz.index];noteAnswer(ok);if(ok){correctId=id;wrongId='';feedback=quiz.hadError||quiz.revealed?'Bien, ya tienes su significado.':'Correcto. Has comprendido la frase.';feedbackType='good';}else{wrongId=id;feedback='Ese significado no corresponde. Escucha de nuevo y prueba otra opción.';feedbackType='bad';}render();}break;
case 'dictate':{const x=byId.get(id);startCollection([id],x.word?'vocabulary':'conversation','dictation');break;}
case 'check-dictation':checkDictation();break;
case 'accent':{const t=document.getElementById('dictation');if(t&&!t.disabled){const pos=t.selectionStart;t.setRangeText(b.dataset.char,t.selectionStart,t.selectionEnd,'end');quiz.answerText=t.value;t.focus();}break;}
case 'quick-level':filters.level=b.dataset.level||'';filters.category='';filters.page=1;render();break;
case 'filter-favorites':filters.favorites=!filters.favorites;filters.page=1;render();break;
case 'page-prev':filters.page=Math.max(1,filters.page-1);render();document.getElementById('main').scrollIntoView();break;
case 'page-next':filters.page++;render();document.getElementById('main').scrollIntoView();break;
case 'record':await record();break;
case 'export':exportProgress();break;
case 'import':document.getElementById('progress-file').click();break;
case 'reset-verbs':verbQuery='';verbLevel='';verbTense='';verbGroup='';render();break;
case 'select-verb':selectedVerb=b.dataset.verb;render();if(selectedVerb)void window.ATELIER_CONJUGATION_AUDIO?.listen?.(selectedVerb);break;
case 'practice-verb':{const x=D.grammar.find(x=>x.verbe===b.dataset.verb);if(x)showItem(x.id);break;}
case 'practice-verb-mistakes':pendingVerb='mistakes';go('verb-game');break;
case 'practice-mistakes':{
  const vaultAudioIds=getVaultEntries().filter(x=>x.needsReview!==false&&byId.has(x.id)&&!byId.get(x.id).pregunta).map(x=>x.id);
  const allVaultAudioIds=getVaultEntries().filter(x=>byId.has(x.id)&&!byId.get(x.id).pregunta).map(x=>x.id);
  const ids=unique([...vaultAudioIds,...progress.mistakes.filter(id=>byId.has(id)&&!byId.get(id).pregunta),...allVaultAudioIds]);
  if(ids.length)startCollection(ids.slice(0,12),byId.get(ids[0]).word?'vocabulary':'conversation','dictation');
  break;
}
case 'mistake-filter-status':mistakeStatusFilter=b.dataset.status||'all';mistakeFlashcardIndex=0;mistakeFlashcardRevealed=false;mistakeTryText='';render();break;
case 'mistake-filter-kind':mistakeKindFilter=b.dataset.kind||'all';mistakeFlashcardIndex=0;mistakeFlashcardRevealed=false;mistakeTryText='';render();break;
case 'mistake-reset-filters':mistakeStatusFilter='all';mistakeKindFilter='all';mistakeSearchQuery='';mistakeFlashcardIndex=0;render();break;
case 'mistake-flashcard-toggle':mistakeFlashcardOpen=!mistakeFlashcardOpen;render();break;
case 'mistake-flashcard-prev':{const list=filteredVaultEntries();if(list.length){mistakeFlashcardIndex=(mistakeFlashcardIndex+list.length-1)%list.length;mistakeFlashcardRevealed=false;mistakeTryText='';render();}break;}
case 'mistake-flashcard-next':{const list=filteredVaultEntries();if(list.length){mistakeFlashcardIndex=(mistakeFlashcardIndex+1)%list.length;mistakeFlashcardRevealed=false;mistakeTryText='';render();}break;}
case 'mistake-flashcard-reveal':mistakeFlashcardRevealed=!mistakeFlashcardRevealed;render();break;
case 'mistake-grade-card':{
  const entry=progress.errorVault[id];
  if(entry){
    if(b.dataset.ok==='yes'){recordRecovery(id);toast('Marcado como recuperado (permanece en tu historial).');}
    else{entry.needsReview=true;entry.lastFailedAt=new Date().toISOString();persist();toast('Se mantiene como pendiente de repaso.');}
  }
  const list=filteredVaultEntries();
  if(list.length)mistakeFlashcardIndex=mistakeFlashcardIndex%list.length;
  mistakeFlashcardRevealed=false;mistakeTryText='';render();
  break;
}
case 'mistake-toggle-status':{
  const entry=progress.errorVault[id];
  if(entry){
    if(entry.needsReview!==false){recordRecovery(id);toast('Marcado como dominado ✓ (se conserva en tu historial).');}
    else{entry.needsReview=true;persist();toast('Devuelto a pendientes de repaso ↻');}
    render();
  }
  break;
}
case 'mistake-listen':{
  const entry=progress.errorVault[id]||buildVaultEntryFromId(id);
  if(!entry)break;
  if(entry.audio)await play(entry.audio,b);
  else if(byId.has(entry.id)&&audioOf(byId.get(entry.id)))await play(audioOf(byId.get(entry.id)),b);
  else{
    const textToSpeak=String(entry.detail||entry.verb||entry.title||'').split('/')[0].replace(/\(.*\)/g,'').trim();
    if(textToSpeak)await window.ATELIER_CONJUGATION_AUDIO?.listen?.(textToSpeak);
  }
  break;
}
}}catch(err){toast('No se ha podido completar esa acción. Vuelve a intentarlo.');console.error(err);}});
document.addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal();});
let lastHoverKey='',hoverTimer=null;
function triggerHoverPreview(target){
  if(!target?.closest)return;
  const obj=route.section==='theme'&&route.mode==='explore'?target.closest('.object[data-action="object"]'):null;
  if(obj&&obj.dataset.id){
    const id=obj.dataset.id,key='obj:'+id;
    if(lastHoverKey===key)return;
    lastHoverKey=key;clearTimeout(hoverTimer);
    hoverTimer=setTimeout(()=>{
      const v=byId.get(id);if(!v)return;
      selected=id;markStudied(id);
      document.querySelectorAll('.object-grid .object').forEach(el=>el.classList.toggle('selected',el.dataset.id===id));
      const panel=document.querySelector('.topic-layout > .detail-panel');
      if(panel){const wrap=document.createElement('div');wrap.innerHTML=detailPanel(v);if(wrap.firstElementChild)panel.replaceWith(wrap.firstElementChild);}
      if(hoverAudio)void play(audioOf(v),obj,{silent:true});
    },65);
    return;
  }
  const pic=target.closest('.entry-picture[data-hover-id]');
  if(pic&&pic.dataset.hoverId){
    const id=pic.dataset.hoverId,key='pic:'+id;
    if(lastHoverKey===key)return;
    lastHoverKey=key;clearTimeout(hoverTimer);
    hoverTimer=setTimeout(()=>{
      const v=byId.get(id);if(v&&hoverAudio)void play(audioOf(v),pic,{silent:true});
    },80);
    return;
  }
}
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;triggerHoverPreview(e.target);});
document.addEventListener('focusin',e=>triggerHoverPreview(e.target));
let inputTimer;document.addEventListener('input',e=>{if(e.target.matches('[data-verb-tips-input]')){window.ATELIER_VERB_TIPS?.input(e);return;}if(e.target.matches('[data-verb-lesson-input]')){window.ATELIER_VERB_LESSON_UI?.input(e);return;}if(e.target.matches('[data-exam-review-input]')){window.ATELIER_EXAM_REVIEW?.input(e);return;}if(e.target.matches('[data-mission-input]')){window.ATELIER_VERB_MISSIONS?.input(e);return;}if(e.target.matches('[data-verb-game-input],[data-verb-game-filter]')){window.ATELIER_VERB_GAME?.input(e);return;}if(e.target.matches('[data-game-filter],[data-game-input]')){window.ATELIER_GAMES?.input(e);return;}const el=e.target;if(el.id==='search'){filters.query=el.value;filters.page=1;clearTimeout(inputTimer);const pos=el.selectionStart;inputTimer=setTimeout(()=>{render();const n=document.getElementById('search');n?.focus();try{n?.setSelectionRange(pos,pos);}catch{}},180);}else if(el.id==='theme-search'){themeSearchQuery=el.value;clearTimeout(inputTimer);const pos=el.selectionStart;inputTimer=setTimeout(()=>{render();const n=document.getElementById('theme-search');n?.focus();try{n?.setSelectionRange(pos,pos);}catch{}},160);}else if(el.id==='verb-search'){verbQuery=el.value;clearTimeout(inputTimer);inputTimer=setTimeout(()=>{render();document.getElementById('verb-search')?.focus();},180);}else if(el.id==='mistake-search'){mistakeSearchQuery=el.value;mistakeFlashcardIndex=0;clearTimeout(inputTimer);const pos=el.selectionStart;inputTimer=setTimeout(()=>{render();const n=document.getElementById('mistake-search');n?.focus();try{n?.setSelectionRange(pos,pos);}catch{}},160);}else if(el.id==='mistake-try-input'){mistakeTryText=el.value;}else if(el.id==='dictation'&&quiz)quiz.answerText=el.value;});
document.addEventListener('change',e=>{if(e.target.matches('[data-exam-review-filter]')){window.ATELIER_EXAM_REVIEW?.change(e);return;}if(e.target.matches('[data-verb-tips-filter]')){window.ATELIER_VERB_TIPS?.change(e);return;}if(e.target.matches('[data-adventure-filter]')){window.ATELIER_ADVENTURE?.change(e);return;}if(e.target.matches('[data-verb-game-input],[data-verb-game-filter]')){window.ATELIER_VERB_GAME?.change(e);return;}if(e.target.matches('[data-game-filter],[data-game-input]')){window.ATELIER_GAMES?.change(e);return;}const el=e.target;if(el.id==='labels'){showLabels=el.checked;document.querySelector('.object-grid')?.classList.toggle('labels-on',showLabels);}else if(el.id==='hover-audio'){hoverAudio=el.checked;}else if(el.id==='speed'){playbackRate=Number(el.value);player.playbackRate=playbackRate;}else if(el.id==='level'){filters.level=el.value;filters.page=1;render();}else if(el.id==='category'){filters.category=el.value;filters.page=1;render();}else if(el.id==='pictures-only'){filters.pictures=el.checked;filters.page=1;render();}else if(el.id==='verb-group'){verbGroup=el.value;render();}else if(el.id==='verb-level'){verbLevel=el.value;render();}else if(el.id==='verb-tense'){verbTense=el.value;render();}else if(el.id==='progress-file'&&el.files[0])importProgress(el.files[0]);});
document.addEventListener('keydown',e=>{if(e.target.matches('[data-mission-input]')){window.ATELIER_VERB_MISSIONS?.keydown(e);return;}if(e.key==='Escape')closeModal();if(e.key==='Enter'&&e.target.id==='mistake-try-input'){e.preventDefault();mistakeFlashcardRevealed=true;render();}if(e.key==='Enter'&&e.ctrlKey&&e.target.id==='dictation')checkDictation();const modal=document.getElementById('modal-root');if(modal&&e.key==='Tab'){const focus=[...modal.querySelectorAll('button,a,input,textarea,select,summary,audio[controls]')].filter(el=>!el.disabled&&el.getClientRects().length);const first=focus[0],last=focus[focus.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
window.matchMedia('(max-width:780px)').addEventListener('change',e=>{const sidebar=document.querySelector('.sidebar');if(sidebar)sidebar.inert=e.matches&&!document.querySelector('.shell').classList.contains('menu-open');});
window.addEventListener('hashchange',readRoute);window.addEventListener('pagehide',()=>{window.ATELIER_VERB_LESSON_UI?.leave();window.ATELIER_EXAM_REVIEW?.leave();window.ATELIER_CONJUGATION_AUDIO?.leave();window.ATELIER_VERB_TIPS?.leave();window.ATELIER_GAMES?.leave();window.ATELIER_ADVENTURE?.leave();window.ATELIER_VERB_GAME?.leave();window.ATELIER_VERB_MISSIONS?.leave();stopRecording();stopAudio();});
function awardRound(record){
  const reward=window.ATELIER_REWARDS?.record(progress.journey,record);if(!reward)return;
  progress.journey=reward.journey;persist();
  if(reward.xpEarned)toast(`+${reward.xpEarned} puntos de juego${reward.newBadges?.length?' · ¡Nueva medalla!':''}`);
}
const completedGameRuns=new Set();
function recordGame(record){
  if(record.runId&&(completedGameRuns.has(record.runId)||Object.prototype.hasOwnProperty.call(progress.journey.events||{},record.runId)))return;if(record.runId)completedGameRuns.add(record.runId);
  const missed=new Set(record.missed||[]),assisted=new Set(Array.isArray(record.assisted)?record.assisted:[]);
  for(const id of missed)recordMistakeEntry({id,reason:'wrong'});
  for(const id of assisted){if(!missed.has(id))recordMistakeEntry({id,reason:'hint'});}
  for(const id of unique(record.ids||[])){
    const clean=!missed.has(id)&&!assisted.has(id);
    if(byId.has(id))score(id,clean);
    else if(clean)recordRecovery(id);
  }
  progress.rounds++;progress.games.push({type:record.type,date:new Date().toISOString(),correct:record.correct,total:record.total,missed:[...missed],assisted:[...assisted]});
  if(progress.games.length>200)progress.games=progress.games.slice(-200);awardRound(record);persist();
}
window.ATELIER_GAMES?.configure({render:()=>{if(route.section==='games')render();},play:src=>play(src),toast,onResult:recordGame,onMistake:recordMistakeEntry,open:id=>showItem(id)});
window.ATELIER_ADVENTURE?.configure({render:()=>{if(route.section==='adventure')render();},play:src=>play(src),toast,onResult:recordGame,getProgress:()=>progress,startVerb:()=>go('verb-game'),startExpressions:()=>go('games')});
window.ATELIER_VERB_MISSIONS?.configure({render:()=>{if(route.section==='verb-missions')render();},play:src=>play(src),toast,onResult:recordGame,onMistake:recordMistakeEntry,back:()=>go('adventure'),openCard:id=>showItem(id)});
document.addEventListener('play',event=>{if(event.target?.tagName==='VIDEO'||event.target?.matches?.('[data-ca-recording] audio'))stopAudio(event.target);},true);
window.ATELIER_VERB_LESSON_UI?.configure({render:()=>{if(route.section==='verb-lessons')render();}});
window.ATELIER_EXAM_REVIEW?.configure({render:()=>{if(route.section==='exam-review')render();},play:src=>play(src),toast,onMistake:recordMistakeEntry});
window.ATELIER_CONJUGATION_AUDIO?.configure({beforePlay:stopAudio,toast});
window.ATELIER_VERB_TIPS?.configure({render:()=>{if(route.section==='verb-tips')render();},play:src=>play(src),onResult:recordGame,onMistake:recordMistakeEntry,practice:verbe=>{pendingVerb=verbe;go('verb-game');}});
window.ATELIER_VERB_GAME?.configure({render:()=>{if(route.section==='verb-game')render();},play:src=>play(src),toast,onResult:recordGame,onMistake:recordMistakeEntry,onRecover:recordRecovery,getMistakes:getVaultEntries,back:()=>go('adventure')});
readRoute();
})();
