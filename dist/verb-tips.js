'use strict';
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const norm = value => String(value ?? '').normalize('NFC').replace(/[’‘]/g,"'").trim();
  const tenses = ['Indicatif — présent','Indicatif — imparfait','Indicatif — futur simple','Conditionnel — présent','Indicatif — passé composé','Indicatif — plus-que-parfait','Indicatif — futur antérieur','Conditionnel — passé (1re forme)','Subjonctif — présent','Subjonctif — passé','Impératif — présent'];
  const tenseLabels = ['Présent · ahora','Imparfait · hábitos del pasado','Futur simple · mañana','Conditionnel · me gustaría…','Passé composé · lo que hice','Plus-que-parfait · lo anterior a otro pasado','Futur antérieur · ya habré…','Conditionnel passé · habría…','Subjonctif présent · deseo, duda, necesidad','Subjonctif passé · una acción anterior','Impératif présent · instrucciones'];
  const people = ['je','tu','il / elle / on','nous','vous','ils / elles'];
  const endings = {presentEr:['e','es','e','ons','ez','ent'],presentFinir:['is','is','it','issons','issez','issent'],presentVendre:['s','s','','ons','ez','ent'],past:['ais','ais','ait','ions','iez','aient'],future:['ai','as','a','ons','ez','ont']};
  const cardMarks = ['-er','-iss-','-re','3','nous','R','R + ais','2','ils / nous','8','avant'];
  const callbacks = {render(){},play(){},practice(){},onResult(){}};
  const state = {active:false,loading:false,error:false,generation:0,card:'present-er',verb:'parler',tense:tenses[0],revealed:false,person:0,irregular:'être',anchors:false};
  let loadingPromise;
  const data = () => window.ATELIER_VERB_TIPS_DATA || {};
  const library = () => Array.isArray(window.ATELIER_VERBS) ? window.ATELIER_VERBS : [];
  const cards = () => Array.isArray(data().cards) ? data().cards : [];
  const findVerb = value => typeof value === 'object' && value?.verbe ? value : library().find(item=>norm(item.verbe)===norm(value));
  const currentVerb = () => findVerb(state.verb);
  const currentCard = () => cards().find(item=>item.id===state.card) || cards()[0];
  const irregular = () => (data().irregulars || []).find(item=>item.verb===state.irregular);
  const button = (action,text,attrs='',klass='vt-button') => `<button type="button" class="${klass}" data-verb-tips-action="${action}" ${attrs}>${text}</button>`;
  function refresh(focus) { callbacks.render(); if(focus && typeof document!=='undefined')document.getElementById(focus)?.focus({preventScroll:true}); }
  function scrollToLab() { if(typeof document!=='undefined')document.getElementById('vt-laboratory')?.scrollIntoView({behavior:'smooth',block:'start'}); }
  function parseForm(form) { const match=norm(form).match(/^((?:que |qu')?)(j'|je |tu |il |elle |on |nous |vous |ils |elles )(.+)$/u); return match?{prefix:match[1]+match[2],body:match[3]}:null; }
  function validPersons(verb=currentVerb(),tense=state.tense) {
    const rows=verb?.formes?.[tense];
    return Array.isArray(rows)?rows.map((forms,index)=>Array.isArray(forms)&&forms.some(form=>typeof form==='string'&&(parseForm(form)||(tense==='Impératif — présent'&&form.trim()&&!['—','-'].includes(form.trim()))))?index:-1).filter(index=>index>=0):[];
  }
  function syncPerson(reset=false) {
    const available=validPersons();
    if(reset||!available.includes(state.person))state.person=available[0]??0;
    return available;
  }
  function personLabel(verb,index,tense) {
    if(tense==='Impératif — présent')return ['tu · sin pronombre escrito','nous · sin pronombre escrito','vous · sin pronombre escrito'][index]||'—';
    const forms=verb?.formes?.[tense]?.[index];
    const names=[...new Set((Array.isArray(forms)?forms:[]).map(form=>parseForm(form)?.prefix).filter(Boolean).map(prefix=>prefix==="j'"?'je':prefix==="que j'"?'que je':prefix.trim()))];
    return names.length?names.join(' / '):people[index];
  }
  function primaryForms(verb,tense) { const rows=verb?.formes?.[tense]; return Array.isArray(rows)&&rows.length===6 ? rows.map(row=>Array.isArray(row)?row[0]:undefined) : []; }
  function exactPattern(verb,kind) {
    const forms=primaryForms(verb,tenses[0]); if(forms.length!==6||forms.some(form=>!parseForm(form)))return false;
    const ending=kind==='finir'?endings.presentFinir:endings.presentVendre;
    const base=verb.verbe.slice(0,-2);
    return forms.every((form,index)=>parseForm(form).body===base+ending[index]);
  }
  // Highlights only identify a suffix already present in the source. They never
  // manufacture a form or infer an irregular root from an infinitive.
  function segmented(form,verb,tense,index) {
    const part=parseForm(form);if(!part)return esc(form);
    let ending;
    if(tense===tenses[1]||tense===tenses[3])ending=endings.past[index];
    else if(tense===tenses[2])ending=endings.future[index];
    else if(tense==='Subjonctif — présent')ending=['e','es','e','ions','iez','ent'][index];
    else if(tense===tenses[0]) {
      if(verb?.verbe?.endsWith('er')&&verb.verbe!=='aller')ending=endings.presentEr[index];
      else if(exactPattern(verb,'finir'))ending=endings.presentFinir[index];
      else if(exactPattern(verb,'vendre'))ending=endings.presentVendre[index];
    }
    if(ending===undefined||!part.body.endsWith(ending)||part.body.includes(' ')||part.body.includes("'"))return esc(form);
    const root=ending?part.body.slice(0,-ending.length):part.body;
    return `${esc(part.prefix)}<span class="vt-root">${esc(root)}</span>${ending?`<span class="vt-ending">${esc(ending)}</span>`:'<span class="vt-zero" title="Sin terminación añadida">∅</span>'}`;
  }
  function sources(ids) {
    const entries=[...new Set(ids||[])].map(id=>data().sources?.[id]).filter(item=>item&&/^https:\/\//.test(item.url));
    return entries.length?`<details class="vt-sources"><summary>Comprobar la regla</summary><div>${entries.map(item=>`<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)} <span aria-hidden="true">↗</span></a>`).join('')}</div></details>`:'';
  }
  async function ensureLibrary() {
    if(library().length){state.loading=false;state.error=false;return true;}
    if(loadingPromise)return loadingPromise;
    state.loading=true;state.error=false;
    loadingPromise=new Promise(resolve=>{
      if(typeof document==='undefined'){state.loading=false;state.error=true;resolve(false);return;}
      const script=document.createElement('script');script.src='data/verbs.js';script.async=true;
      script.onload=()=>{state.loading=false;state.error=!library().length;loadingPromise=null;if(state.active)refresh();resolve(!state.error);};
      script.onerror=()=>{state.loading=false;state.error=true;loadingPromise=null;script.remove();if(state.active)refresh();resolve(false);};
      document.head.appendChild(script);
    });
    return loadingPromise;
  }
  async function start(verb) {
    state.active=true;state.generation++;state.revealed=false;state.anchors=false;
    if(verb)state.verb=typeof verb==='string'?verb:verb.verbe;
    const generation=state.generation;
    if(!(await ensureLibrary())||!state.active||generation!==state.generation)return;
    if(!currentVerb())state.verb=library()[0]?.verbe||'parler';
    syncPerson(true);
    refresh();
  }
  function leave(){state.active=false;state.generation++;state.revealed=false;state.anchors=false;}
  function hintText(verbValue,tense) {
    const verb=findVerb(verbValue),name=norm(verb?.verbe||(typeof verbValue==='object'?verbValue?.verbe:verbValue));
    if(tense===tenses[1])return {title:'La llave es nous',text:'Recuerda la forma de nous en presente. Quita -ons y añade la terminación del imparfait: ais, ais, ait, ions, iez, aient. Être usa una raíz propia. Revisa también los ajustes de escritura.',sourceIds:['imparfait']};
    if(tense===tenses[2])return {title:'Busca la R del futuro',text:'Recupera la base del futuro y añade ai, as, a, ons, ez, ont. La base acaba en r; algunos verbos usan una raíz irregular. No cambies la base para cada persona.',sourceIds:['future']};
    if(tense===tenses[3])return {title:'Dos piezas que ya conoces',text:'Recupera la base del futuro y combínala con ais, ais, ait, ions, iez, aient. Distingue -ai del futuro y -ais del condicional.',sourceIds:['conditional']};
    if(tense===tenses[4])return {title:'Piensa en una pareja',text:'Primero conjuga el auxiliar en presente; después añade el participio. Aprende cada verbo con avoir o être. Revisa la concordancia: con avoir no depende automáticamente del sujeto; los pronominales tienen condiciones propias.',sourceIds:['pc','aux','accordEtre']};
    if(tense==='Subjonctif — présent')return {title:'Dos anclas: ils y nous',text:'Para muchos verbos, toma la base de ils para je, tu, il/elle/on e ils/elles, y la de nous para nous y vous. Añade e, es, e, ions, iez, ent. Los irregulares y los ajustes escritos se comprueban aparte.',sourceIds:['subjForms']};
    if(tense==='Subjonctif — passé')return {title:'El subjuntivo mira hacia atrás',text:'Pon el auxiliar en subjuntivo presente y añade el participio. La acción se presenta como anterior al punto de referencia. Conserva el auxiliar del verbo y las condiciones de concordancia.',sourceIds:['subjForms','subjSequence','accordEtre']};
    if(tense==='Indicatif — plus-que-parfait')return {title:'Un pasado anterior a otro pasado',text:'Conjuga el auxiliar en imparfait y añade el participio. Marca el punto de referencia pasado: el plus-que-parfait expresa lo que ya había ocurrido antes.',sourceIds:['pluperfect','aux']};
    if(tense==='Indicatif — futur antérieur')return {title:'Ya estará terminado entonces',text:'Conjuga el auxiliar en futur simple y añade el participio. Imagina un punto futuro desde el que la acción ya estará completada.',sourceIds:['futureAnterior','aux']};
    if(tense==='Conditionnel — passé (1re forme)')return {title:'Lo que habría ocurrido',text:'Usa el auxiliar en conditionnel présent y añade el participio. Puede expresar un resultado hipotético pasado; con si, el conditionnel no sustituye al plus-que-parfait en la condición.',sourceIds:['conditionalPast','conditionalUse','aux']};
    if(tense==='Impératif — présent')return {title:'Tres personas, sin sujeto escrito',text:'Da una instrucción o un consejo. Comprueba las formas de tu, nous y vous; no escribas el pronombre sujeto. Hay irregulares y cambios de escritura: usa el modelo exacto.',sourceIds:['imperative']};
    if(tense===tenses[0]) {
      if(name.endsWith('er')&&name!=='aller')return {title:'Dos bloques para los -er',text:'Recita e, es, e / ons, ez, ent. Relaciona cada final con su persona. Conserva los ajustes de escritura del verbo; aller tiene su propio modelo.',sourceIds:['present','er']};
      if((verb&&exactPattern(verb,'finir'))||cards().find(card=>card.id==='present-finir')?.practiceVerbs?.includes(name))return {title:'Reconoce la familia -issons',text:'En el modelo finir, retira -ir y recuerda is, is, it / issons, issez, issent. La señal -iss- aparece en el plural. No extiendas este patrón a todos los -ir.',sourceIds:['ir','present']};
      if((verb&&exactPattern(verb,'vendre'))||cards().find(card=>card.id==='present-vendre')?.practiceVerbs?.includes(name))return {title:'Una base, tres finales pequeños',text:'En el modelo vendre, piensa s, s, ninguna letra / ons, ez, ent. La consonante de la base se conserva. Es una familia concreta, no una regla para todos los -re.',sourceIds:['vendre']};
      return {title:'Recupera el cambio de raíz',text:'Recuerda por separado je, nous e ils. Estas tres anclas ayudan a reconocer el cambio de raíz; después comprueba las seis personas. Revisa vous aparte. La estrategia ayuda a recordar, pero no genera todas las formas.',sourceIds:['irregular','present']};
    }
    return {title:'Separa las piezas',text:'Identifica primero la persona y el tiempo. Recupera la raíz y después la terminación; en un tiempo compuesto, separa auxiliar y participio. Comprueba la forma exacta en el modelo.',sourceIds:['present']};
  }
  function renderHint(verb,tense,{compact=false}={}) {
    const hint=hintText(verb,tense);
    return `<aside class="vt-context-tip${compact?' vt-context-tip-compact':''}" aria-label="Truco de conjugación"><span class="vt-bulb" aria-hidden="true">✦</span><div><strong>${esc(hint.title)}</strong><p>${esc(hint.text)}</p>${compact?'':`<a href="#verb-tips">Explorar los patrones <span aria-hidden="true">→</span></a>`}</div></aside>`;
  }
  function renderCompact(verbValue) {
    const verb=findVerb(verbValue),name=verb?.verbe||(typeof verbValue==='string'?verbValue:verbValue?.verbe)||'';
    const hint=hintText(verbValue,tenses[0]);
    return `<aside class="vt-compact"><span class="vt-compact-symbol" aria-hidden="true">✦</span><div><span class="vt-kicker">Un truco antes de practicar</span><h2>${esc(hint.title)}</h2><p>${esc(hint.text)}</p></div><div class="vt-compact-actions"><a class="vt-button vt-secondary" href="#verb-tips">Trucos y conjugaciones <span aria-hidden="true">→</span></a>${name?button('practice',`Practicar ${esc(name)}`,`data-verb="${esc(name)}"`):''}</div></aside>`;
  }
  function hero() {
    return `<header class="vt-hero"><div><p class="vt-kicker">Le déclic des verbes</p><h1>Las piezas encajan.<br><em>Los verbos se quedan.</em></h1><p>Descubre el patrón, prueba de memoria y comprueba la conjugación con tus materiales.</p><a class="vt-button vt-hero-button" href="#vt-laboratory" data-verb-tips-action="laboratory">Probar con un verbo <span aria-hidden="true">↓</span></a></div><div class="vt-word-art" aria-hidden="true"><span class="vt-art-label">UNA RAÍZ · MUCHAS POSIBILIDADES</span><div class="vt-art-word"><span>parl</span><b>er</b></div><div class="vt-art-link">↓</div><div class="vt-art-forms"><span>je <b>parl<span>e</span></b></span><span>nous <b>parl<span>ons</span></b></span></div><div class="vt-art-caption"><i></i> raíz <i></i> terminación</div><span class="vt-art-spark">✦</span></div></header>`;
  }
  function patternSection() {
    const card=currentCard();if(!card)return '';
    return `<section class="vt-patterns" aria-labelledby="vt-pattern-title"><div class="vt-section-heading"><div><p class="vt-kicker">01 · Encuentra una pista</p><h2 id="vt-pattern-title">Ocho formas de hacer clic</h2></div><p>Elige una tarjeta para descubrir su patrón.</p></div><div class="vt-pattern-grid">${cards().map((item,index)=>button('card',`<span class="vt-card-mark" aria-hidden="true">${esc(cardMarks[index]||'✦')}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.subtitle)}</small></span><span class="vt-card-arrow" aria-hidden="true">↗</span>`,`data-card="${esc(item.id)}" aria-pressed="${item.id===card.id}"`,'vt-pattern-card'+(item.id===card.id?' is-selected':''))).join('')}</div><article class="vt-pattern-detail" aria-live="polite"><div class="vt-rule-copy"><span class="vt-kicker">${esc(card.subtitle)}</span><h3>${esc(card.title)}</h3><p>${esc(card.rule)}</p><div class="vt-memory"><span aria-hidden="true">✦</span><p>${esc(card.memoryTip)}</p></div>${button('example','Probar este patrón <span aria-hidden="true">→</span>',`data-card="${esc(card.id)}"`,'vt-button vt-secondary')}</div><div class="vt-rule-notebook"><span class="vt-kicker">El mapa del patrón</span>${(card.formula||[]).map(line=>`<p class="vt-formula" lang="fr">${esc(line)}</p>`).join('')}<details class="vt-pitfalls"><summary>Ojo con las excepciones</summary><ul>${(card.pitfalls||[]).map(line=>`<li>${esc(line)}</li>`).join('')}</ul></details>${sources(card.sourceIds)}</div></article></section>`;
  }
  function formRows(verb,tense) {
    const rows=verb.formes?.[tense];if(!Array.isArray(rows)||![3,6].includes(rows.length))return '<p class="vt-empty">Este modelo no tiene formas personales disponibles para este tiempo. Elige otro verbo.</p>';
    return `<div class="vt-forms">${rows.map((forms,index)=>`<div class="vt-form-row"><span>${esc(personLabel(verb,index,tense))}</span><div lang="fr">${Array.isArray(forms)&&forms.length?forms.map(form=>`<p>${segmented(form,verb,tense,index)}${window.ATELIER_CONJUGATION_AUDIO?.controls(form,{compact:true})||''}</p>`).join(''):'<span class="vt-no-form" lang="es">Sin forma personal</span>'}</div></div>`).join('')}</div>`;
  }
  function laboratory() {
    if(state.loading||!library().length)return `<section class="vt-lab" id="vt-laboratory"><h2>Preparando tus conjugaciones…</h2><p>Un momento: estamos abriendo los modelos de tu biblioteca.</p></section>`;
    const verb=currentVerb();if(!verb)return '';
    const rows=verb.formes?.[state.tense],available=syncPerson();
    return `<section class="vt-lab" id="vt-laboratory" aria-labelledby="vt-lab-title"><div class="vt-section-heading"><div><p class="vt-kicker">02 · Prueba antes de mirar</p><h2 id="vt-lab-title">Tu mesa de conjugaciones</h2></div><span class="vt-count">${library().length} verbos de tus materiales</span></div><div class="vt-lab-selectors"><label>Verbo<select data-verb-tips-filter="verb">${library().map(item=>`<option value="${esc(item.verbe)}"${item.verbe===state.verb?' selected':''}>${esc(item.verbe)}${item.es?' · '+esc(item.es):''}</option>`).join('')}</select></label><label>Tiempo<select data-verb-tips-filter="tense">${tenses.map((tense,index)=>`<option value="${esc(tense)}"${tense===state.tense?' selected':''}>${esc(tenseLabels[index])}</option>`).join('')}</select></label></div><div class="vt-recall-stage"><div class="vt-recall-copy"><span class="vt-kicker">Di o escribe la forma</span><h3 lang="fr">${esc(available.length?personLabel(verb,state.person,state.tense):'—')} <span>+ ${esc(verb.verbe)}</span></h3><p>${available.length?esc(tenseLabels[tenses.indexOf(state.tense)]||state.tense)+'. Recupera la forma y úsala en una frase verdadera para ti.':'Este tiempo no ofrece formas personales para este verbo. Elige otro tiempo o verbo.'}</p>${button('person','Cambiar de persona <span aria-hidden="true">↻</span>',available.length<=1?'disabled aria-disabled="true"':'','vt-link')}</div><div class="vt-recall-actions">${button('reveal',state.revealed?'Tapar el modelo':'Ver las formas',`aria-expanded="${state.revealed}" aria-controls="vt-model"`)}${button('practice','Llevarlo al juego <span aria-hidden="true">→</span>',`data-verb="${esc(verb.verbe)}" data-tense="${esc(state.tense)}"`,'vt-button vt-secondary')}</div></div>${renderHint(verb,state.tense,{compact:true})}<div id="vt-model" class="vt-model"${state.revealed?'':' hidden'}>${state.revealed?`<div class="vt-model-heading"><h3 lang="fr">${esc(verb.verbe)}</h3><p><span class="vt-root-dot"></span> raíz <span class="vt-ending-dot"></span> terminación <span>· formas exactas de tu tabla</span></p></div>${formRows(verb,state.tense)}${state.tense===tenses[4]?'<p class="vt-agreement">Las variantes conservan masculino/femenino y singular/plural del material. En los tiempos con avoir, la tabla no presupone un complemento directo anterior.</p>':''}<p class="vt-model-note">Comprueba también las letras que no se oyen. Si la raíz cambia, el modelo exacto manda.</p>`:''}</div>${!Array.isArray(rows)?'<p class="vt-empty">Elige un verbo con formas disponibles en este tiempo.</p>':''}</section>`;
  }
  function irregularSection() {
    const item=irregular();if(!item)return '';
    const example=item.materialExample;
    return `<section class="vt-irregulars" aria-labelledby="vt-irregular-title"><div class="vt-section-heading"><div><p class="vt-kicker">03 · Guarda tres anclas</p><h2 id="vt-irregular-title">Los irregulares también tienen pistas</h2></div><p>Je · nous · ils. Después comprueba las seis personas.</p></div><div class="vt-verb-chips" aria-label="Elegir un verbo irregular">${(data().irregulars||[]).map(value=>button('irregular',esc(value.verb),`data-verb="${esc(value.verb)}" aria-pressed="${value.verb===item.verb}"`,'vt-verb-chip'+(value.verb===item.verb?' is-selected':''))).join('')}</div><article class="vt-anchor-card"><div class="vt-anchor-heading"><div><h3 lang="fr">${esc(item.verb)}</h3><span>${esc(item.translation)}</span></div>${button('anchors',state.anchors?'Tapar las anclas':'Recordar y comprobar',`aria-expanded="${state.anchors}" aria-controls="vt-anchor-model"`,'vt-button vt-secondary')}</div>${state.anchors?`<div id="vt-anchor-model"><div class="vt-anchor-forms">${(item.anchors||[]).map((form,index)=>`<div><small>${['01 · JE','02 · NOUS','03 · ILS'][index]}</small><strong lang="fr">${window.ATELIER_CONJUGATION_AUDIO?.variants(form)||esc(form)}</strong></div>`).join('')}</div><p class="vt-anchor-tip">${esc(item.memoryTip)}</p><div class="vt-anchor-foot"><p>Raíz del futuro <strong lang="fr">${esc(item.futureRoot)}</strong></p>${button('irregular-model','Ver su modelo completo <span aria-hidden="true">→</span>',`data-verb="${esc(item.verb)}"`,'vt-link')}</div></div>`:'<div id="vt-anchor-model" class="vt-anchor-covered"><span aria-hidden="true">je <i>?</i> nous <i>?</i> ils <i>?</i></span><p>Intenta decir las tres antes de abrir la ficha. Es una ayuda de memoria; revisa también tu, il y vous.</p></div>'}${example?.audio?`<div class="vt-material-example"><div><span class="vt-kicker">Un ejemplo de tus materiales</span><p lang="fr">${esc(example.phrase)}</p><small>${esc(example.translation)}</small></div>${button('audio','<span aria-hidden="true">▷</span> Escuchar el ejemplo',`data-verb="${esc(item.verb)}"`,'vt-button vt-secondary')}</div>`:''}${sources(item.sourceIds)}</article></section>`;
  }
  function routeSection() {
    const route=data().studyRoute;if(!route)return '';
    return `<section class="vt-routine" aria-labelledby="vt-routine-title"><p class="vt-kicker">Una rutina para que se quede</p><h2 id="vt-routine-title">Mira menos. Recupera más.</h2><ol>${(route.steps||[]).map((item,index)=>`<li><span aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></div></li>`).join('')}</ol><p class="vt-routine-note">Propuesta de práctica a tu ritmo. Los juegos guardan tus resultados como hasta ahora.</p></section>`;
  }
  function render() {
    if(state.error)return `<div class="vt-page"><div class="vt-load-error"><p class="vt-kicker">Tus modelos siguen aquí</p><h1>No se pudieron abrir las conjugaciones</h1><p>Comprueba la conexión y vuelve a intentarlo.</p>${button('retry','Volver a intentar')}</div></div>`;
    return `<div class="vt-page"><nav class="vt-top-links" aria-label="Volver a practicar"><a href="#verbs">← Biblioteca de verbos</a><a href="#verb-missions">Misión verbos →</a></nav>${hero()}${patternSection()}${laboratory()}${subjunctiveSection()}${irregularSection()}${routeSection()}<p class="vt-source-policy">Trucos redactados para tu atelier y contrastados con OQLF y Académie française. Conjugaciones y audios de tus materiales, con ejemplos didácticos originales del atelier.</p></div>`;
  }
  const subjState={active:false,queue:[],position:0,answer:'',attempted:false,solution:false,rehearsal:null,results:[],done:false,emitted:false,runId:'',notice:'',irregular:'être',irregularOpen:false};
  const subjData=()=>data().subjunctive||{};
  const subjCases=()=>subjData().decisions||[];
  const decisionKey=value=>norm(value).toLocaleLowerCase('fr').replace(/[.!?]+$/u,'').trim();
  function resetSubjCase(){subjState.answer='';subjState.attempted=false;subjState.solution=false;subjState.rehearsal=null;subjState.notice='';}
  function startSubj(queue){subjState.active=true;subjState.queue=queue||subjCases().map((_,i)=>i);subjState.position=0;subjState.results=[];subjState.done=false;subjState.emitted=false;subjState.runId=`subj-use-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;resetSubjCase();}
  function input(event){if(event?.target?.dataset?.verbTipsInput==='decision'&&!subjState.attempted)subjState.answer=String(event.target.value).slice(0,160);}
  function learningExample(example){return `<p class="vt-subj-example" lang="fr">${esc(example.fr)}</p><p class="vt-subj-translation">${esc(example.es)}</p>`;}
  function subjunctivePractice(){
    if(!subjState.active)return `<div class="vt-subj-start"><div><h3>¿Indicativo o subjuntivo?</h3><p>16 situaciones. Escribe primero tu elección; después abre la solución y refuérzala con las opciones.</p></div>${button('subj-start','Probar los casos de uso →')}</div>`;
    if(subjState.done){const clean=subjState.results.filter(r=>r.clean).length,pending=subjState.results.filter(r=>!r.clean);return `<div class="vt-subj-practice" id="vt-subj-practice"><p class="vt-kicker">Recorrido terminado</p><h3>${clean} de ${subjState.results.length} a la primera</h3><p>${pending.length?'Los intentos que necesitan otra vuelta te esperan en el repaso.':'Has completado todas las situaciones. Recupera ahora una frase en voz alta.'}</p><div class="vt-subj-actions">${pending.length?button('subj-retry',`Repasar ${pending.length} situaciones`):''}${button('subj-start','Otro recorrido','','vt-button vt-secondary')}</div></div>`;}
    const index=subjState.queue[subjState.position],item=subjCases()[index];if(!item)return '';
    const correct=item.options.find(o=>o.id===item.correctId),result=subjState.results.at(-1);
    return `<article class="vt-subj-practice" id="vt-subj-practice" aria-labelledby="vt-case-title"><div class="vt-subj-case-meta"><span>Situación ${subjState.position+1} de ${subjState.queue.length}</span><span>${esc(item.group)}</span></div><h3 id="vt-case-title">${esc(item.context)}</h3><p class="vt-subj-prompt" lang="fr">${esc(item.prompt)}</p><div class="vt-subj-options" aria-label="Opciones para completar la frase">${item.options.map((o,i)=>`<span><b>${String.fromCharCode(65+i)}</b> <span lang="fr">${esc(o.text)}</span></span>`).join('')}</div><label class="vt-subj-answer-label" for="vt-case-answer">Tu intento · escribe la forma o A/B<input id="vt-case-answer" data-verb-tips-input="decision" type="text" value="${esc(subjState.answer)}" autocomplete="off" autocapitalize="off" spellcheck="false" ${subjState.attempted?'readonly':''}></label><div class="vt-subj-actions">${!subjState.attempted?button('subj-check','Comprobar mi intento'):button('subj-solution',subjState.solution?'Tapar la solución':'Ver solución',`aria-expanded="${subjState.solution}" aria-controls="vt-case-solution"`,'vt-button vt-secondary')}${subjState.attempted?button('subj-next',subjState.position+1===subjState.queue.length?'Terminar el recorrido':'Siguiente situación →'):''}</div><p class="vt-subj-feedback" role="status">${esc(subjState.notice||(subjState.attempted?(result?.clean?'Tu intento coincide con el modelo.':'Intento guardado. Abre la solución para comprobar la elección.'):'Primero prueba de memoria; la explicación permanece tapada.'))}</p><div id="vt-case-solution"${subjState.solution?'':' hidden'}>${subjState.solution?`<div class="vt-subj-solution"><p class="vt-kicker">Modelo y explicación</p><p class="vt-subj-model" lang="fr">${esc(item.modelFR)}</p><p>${esc(item.modelES)}</p><p>${esc(item.explanation)}</p>${item.corpusRef?.form?`<div class="vt-subj-form-audio"><span lang="fr">${esc(item.corpusRef.form)}</span>${window.ATELIER_CONJUGATION_AUDIO?.controls(item.corpusRef.form,{compact:true})||''}</div>`:''}<p class="vt-subj-rehearse-label">Refuerza ahora la elección:</p><div class="vt-subj-rehearse">${item.options.map(o=>button('subj-rehearse',esc(o.text),`data-option="${esc(o.id)}" aria-pressed="${subjState.rehearsal===o.id}"`,'vt-button vt-secondary')).join('')}</div>${subjState.rehearsal!==null?`<p role="status">${subjState.rehearsal===correct.id?'Exacto. Vuelve a decir la frase completa.':'Revisa la intención y compara el modelo.'}</p>`:''}${sources(item.sourceIds)}</div>`:''}</div></article>`;
  }
  function subjunctiveSection(){
    const d=subjData();if(!d.decisions?.length)return '';
    const irregular=(d.irregulars||[]).find(v=>v.verb===subjState.irregular)||d.irregulars?.[0];
    return `<section class="vt-subj-section" id="vt-subjunctive" aria-labelledby="vt-subj-title"><div class="vt-section-heading"><div><p class="vt-kicker">Un modo · distintas intenciones</p><h2 id="vt-subj-title">El subjuntivo tiene su momento.</h2></div>${button('subj-train','Subir al tren del subjuntivo →','','vt-button vt-secondary')}</div><p class="vt-subj-intro">Primero decide qué quieres expresar. Después recupera la forma. «Que» por sí solo no elige el modo.</p><details class="vt-subj-learning"><summary>Cuándo usarlo · seis pistas cotidianas</summary><div class="vt-subj-use-grid">${(d.usageGroups||[]).map(group=>`<article><span class="vt-kicker">${esc(group.cue)}</span><h3>${esc(group.title)}</h3><p>${esc(group.rule)}</p>${learningExample(group)}<small>${esc(group.note||'')}</small>${sources(group.sourceIds)}</article>`).join('')}</div></details><details class="vt-subj-learning"><summary>Cuatro contrastes que conviene recordar</summary><div class="vt-subj-contrast-grid">${(d.contrasts||[]).map(item=>`<article><h3>${esc(item.title)}</h3><p>${esc(item.rule)}</p>${(item.examples||[]).map(learningExample).join('')}<small>${esc(item.note||'')}</small>${sources(item.sourceIds)}</article>`).join('')}</div></details><details class="vt-subj-learning"><summary>Ocho irregulares · recordar y comprobar</summary><div class="vt-subj-irregulars"><div class="vt-verb-chips" aria-label="Elegir irregular del subjuntivo">${(d.irregulars||[]).map(v=>button('subj-irregular',esc(v.verb),`data-verb="${esc(v.verb)}" aria-pressed="${v.verb===irregular?.verb}"`,'vt-verb-chip'+(v.verb===irregular?.verb?' is-selected':''))).join('')}</div><p>Intenta decir las formas de <strong lang="fr">${esc(irregular?.verb)}</strong> antes de abrir la tabla.</p>${button('subj-irregular-model',subjState.irregularOpen?'Tapar las formas':'Comprobar las formas',`aria-expanded="${subjState.irregularOpen}" aria-controls="vt-subj-irregular-model"`,'vt-button vt-secondary')}<div id="vt-subj-irregular-model"${subjState.irregularOpen?'':' hidden'}>${subjState.irregularOpen&&irregular?formRows(findVerb(irregular.verb),'Subjonctif — présent'):''}</div></div></details>${subjunctivePractice()}<p class="vt-source-policy">Los ejemplos de uso son originales del atelier y están contrastados con las fuentes enlazadas. Las tablas conservan las formas de tus materiales. Los controles de audio de la solución corresponden a la forma verbal indicada, no a toda la frase.</p></section>`;
  }
  function handleSubjunctive(action,dataset){
    if(action==='subj-start'){startSubj();refresh('vt-case-answer');document?.getElementById('vt-subj-practice')?.scrollIntoView?.({behavior:'smooth',block:'start'});return true;}
    if(action==='subj-train'){callbacks.practice({verbe:'prendre',tense:'Subjonctif — présent'});return true;}
    if(action==='subj-irregular'){if((subjData().irregulars||[]).some(v=>v.verb===dataset.verb)){subjState.irregular=dataset.verb;subjState.irregularOpen=false;refresh();}return true;}
    if(action==='subj-irregular-model'){subjState.irregularOpen=!subjState.irregularOpen;refresh();return true;}
    if(!subjState.active||subjState.done){if(action==='subj-retry'){const queue=subjState.results.filter(r=>!r.clean).map(r=>r.index);if(queue.length){startSubj(queue);refresh('vt-case-answer');}}return true;}
    const index=subjState.queue[subjState.position],item=subjCases()[index];if(!item)return true;
    if(action==='subj-check'&&!subjState.attempted){const answer=decisionKey(subjState.answer);if(!answer){subjState.notice='Escribe una forma o una letra antes de comprobar.';refresh('vt-case-answer');return true;}const selected=item.options.find((o,i)=>decisionKey(o.text)===answer||String.fromCharCode(97+i)===answer);subjState.results.push({index,id:'subj-use|'+item.id,clean:selected?.id===item.correctId});subjState.attempted=true;subjState.notice='';refresh();return true;}
    if(action==='subj-solution'&&subjState.attempted){subjState.solution=!subjState.solution;refresh();return true;}
    if(action==='subj-rehearse'&&subjState.solution&&item.options.some(o=>o.id===dataset.option)){subjState.rehearsal=dataset.option;refresh();return true;}
    if(action==='subj-next'&&subjState.attempted){if(subjState.position+1<subjState.queue.length){subjState.position++;resetSubjCase();refresh('vt-case-answer');}else{subjState.done=true;if(!subjState.emitted){subjState.emitted=true;callbacks.onResult({runId:subjState.runId,type:'subjunctive-use',ids:subjState.results.map(r=>r.id),correct:subjState.results.filter(r=>r.clean).length,total:subjState.results.length,missed:subjState.results.filter(r=>!r.clean).map(r=>r.id),assisted:[]});}refresh();}return true;}
    return true;
  }
  function selectCard(id,goToLab) {
    const card=cards().find(item=>item.id===id);if(!card)return;
      state.card=card.id;
    if(goToLab){const example=card.examples?.[0];if(example){state.verb=example.verb;state.tense=example.tense;}state.revealed=false;syncPerson(true);}
    refresh();if(goToLab)scrollToLab();
  }
  function handle(action,node) {
    const dataset=node?.dataset||{};
    if(action==='card'){selectCard(dataset.card,false);return true;}
    if(action==='example'){selectCard(dataset.card,true);return true;}
    if(action==='laboratory'){scrollToLab();return true;}
    if(action==='reveal'){state.revealed=!state.revealed;refresh();return true;}
    if(action==='person'){const available=syncPerson();if(available.length<=1)return true;state.person=available[(available.indexOf(state.person)+1)%available.length];state.revealed=false;refresh();return true;}
    if(action==='practice'){callbacks.practice(dataset.tense?{verbe:dataset.verb||state.verb,tense:dataset.tense}:dataset.verb||state.verb);return true;}
    if(action.startsWith('subj-'))return handleSubjunctive(action,dataset);
    if(action==='irregular'){state.irregular=dataset.verb;state.anchors=false;refresh();return true;}
    if(action==='anchors'){state.anchors=!state.anchors;refresh();return true;}
    if(action==='irregular-model'){state.verb=dataset.verb;state.tense=tenses[0];state.revealed=false;syncPerson(true);refresh();scrollToLab();return true;}
    if(action==='audio'){const item=(data().irregulars||[]).find(value=>value.verb===dataset.verb);if(item?.materialExample?.audio)callbacks.play(item.materialExample.audio);return true;}
    if(action==='retry'){start();refresh();return true;}
    return false;
  }
  function change(event) {
    const element=event?.target,kind=element?.dataset?.verbTipsFilter;
    if(kind==='verb'&&findVerb(element.value)){state.verb=element.value;state.revealed=false;syncPerson(true);refresh();return true;}
    if(kind==='tense'&&tenses.includes(element.value)){state.tense=element.value;state.revealed=false;syncPerson(true);refresh();return true;}
    return false;
  }
  window.ATELIER_VERB_TIPS={configure(options){Object.assign(callbacks,options||{});},render,handle,change,input,start,leave,renderHint,renderCompact};
})();
