'use strict';
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const norm = value => String(value ?? '').normalize('NFC').replace(/[’‘]/g,"'").trim();
  const tenses = ['Indicatif — présent','Indicatif — imparfait','Indicatif — futur simple','Conditionnel — présent','Indicatif — passé composé','Indicatif — plus-que-parfait','Indicatif — futur antérieur','Conditionnel — passé (1re forme)','Subjonctif — présent','Subjonctif — passé','Impératif — présent'];
  const tenseLabels = ['Présent · ahora','Imparfait · hábitos del pasado','Futur simple · mañana','Conditionnel · me gustaría…','Passé composé · lo que hice','Plus-que-parfait · lo anterior a otro pasado','Futur antérieur · ya habré…','Conditionnel passé · habría…','Subjonctif présent · deseo, duda, necesidad','Subjonctif passé · una acción anterior','Impératif présent · instrucciones'];
  const people = ['je','tu','il / elle / on','nous','vous','ils / elles'];
  const endings = {presentEr:['e','es','e','ons','ez','ent'],presentFinir:['is','is','it','issons','issez','issent'],presentVendre:['s','s','','ons','ez','ent'],past:['ais','ais','ait','ions','iez','aient'],future:['ai','as','a','ons','ez','ont']};
  const cardMarks = ['-er','-iss-','-re','3','nous','R','R + ais','2','ils / nous','8','avant'];
  const callbacks = {render(){},play(){},practice(){},onResult(){},onMistake(){}};
  const state = {active:false,loading:false,error:false,generation:0,card:'present-er',group:'ir-issant',verb:'parler',tense:tenses[0],revealed:false,person:0,irregular:'être',anchors:false};
  let loadingPromise;
  const data = () => window.ATELIER_VERB_TIPS_DATA || {};
  const library = () => Array.isArray(window.ATELIER_VERBS) ? window.ATELIER_VERBS : [];
  const cards = () => Array.isArray(data().cards) ? data().cards : [];
  const findVerb = value => typeof value === 'object' && value?.verbe ? value : library().find(item=>norm(item.verbe)===norm(value));
  const currentVerb = () => findVerb(state.verb);
  const currentCard = () => cards().find(item=>item.id===state.card) || cards()[0];
  const irregular = () => (data().irregulars || []).find(item=>item.verb===state.irregular);
  const button = (action,text,attrs='',klass='vt-button') => `<button type="button" class="${klass}" data-verb-tips-action="${action}" ${attrs}>${text}</button>`;

  const VERB_GROUPS = [
    {
      id:'er-regular',
      code:'-er',
      badge:'1.er grupo · -er regulares',
      short:'-er regulares (parler, aimer)',
      title:'1.er grupo · Verbos en -er regulares',
      ending:'Infinitivo en -er (salvo aller) · raíz invariable',
      presentFormula:'Raíz + -e, -es, -e, -ons, -ez, -ent',
      participe:'Participio pasado: -é (parlé) · Gerundio: -ant (parlant)',
      howToClassify:'Terminan en -er y su raíz escrita no cambia en ninguna de las 6 personas. Representan casi el 85 % de los verbos franceses.',
      memoryTrick:'Truco de «La Bota Silenciosa»: je parle, tu parles, il parle e ils parlent se escriben con finales distintos (-e, -es, -e, -ent), ¡pero las 4 personas suenan exactamente igual! Solo cambian de sonido nous (-ons) y vous (-ez).',
      sampleVerbs:['parler','aimer','donner','demander','trouver','écouter','regarder','habiter','travailler','marcher']
    },
    {
      id:'er-ajuste',
      code:'-er ✦',
      badge:'1.er grupo · -er con ajuste / bota',
      short:'-er con ajuste (-ger, -cer, -yer, è, ll/tt)',
      title:'1.er grupo · -er con cambio ortográfico o de acento («la bota»)',
      ending:'-ger, -cer, -yer, e/é + consonante + -er, -eler, -eter',
      presentFormula:'Terminaciones -e, -es, -e, -ons, -ez, -ent con ajuste en nous o en la bota (je, tu, il, ils)',
      participe:'Participio pasado: -é (mangé, acheté, appelé) · Gerundio: -ant (mangeant, commençant)',
      howToClassify:'Son verbos del 1.er grupo cuya raíz adapta una letra para conservar el sonido francés: ya sea en nous (-ger → -geons, -cer → -çons) o en las 4 personas de «la bota» (je, tu, il, ils).',
      memoryTrick:'Sepáralos en 2 cajas mentales: 1) Manger y commencer SOLO cambian en NOUS (nous mangeons, nous commençons) para conservar el sonido suave. 2) Acheter (j’achète), préférer (je préfère), payer (je paie) y appeler (j’appelle) cambian DENTRO DE LA BOTA (je, tu, il, ils), pero en nous y vous vuelven al infinitivo (nous achetons, nous préférons, nous payons, nous appelons).',
      sampleVerbs:['manger','commencer','acheter','préférer','payer','essayer','appeler','jeter','lever','envoyer']
    },
    {
      id:'ir-issant',
      code:'-ir · -issant',
      badge:'2.º grupo · -ir con -issant / -issons',
      short:'-ir con -issant / -issons (finir, choisir)',
      title:'2.º grupo · Verbos en -ir con alargamiento -iss- (-issons / -issant)',
      ending:'Infinitivo en -ir + puente -iss- en plural',
      presentFormula:'Raíz + -is, -is, -it · -issons, -issez, -issent',
      participe:'Participio pasado: -i (fini, choisi) · Participio presente: -issant (finissant)',
      howToClassify:'Su prueba infalible es la 1.ª persona del plural (nous) y el gerundio: si hacen «nous -issons / en -issant» (finir → nous finissons, choisir → nous choisissons, réussir → nous réussissons), pertenecen al 2.º grupo y son 100 % regulares en todos los tiempos.',
      memoryTrick:'¿Cómo distinguirlos de los -ir del 3.er grupo? Truco del Adjetivo: Casi todos los verbos que expresan cambio de estado a partir de un adjetivo o color llevan -issons: grand → grandir, gros → grossir, rouge → rougir, jaune → jaunir, riche → enrichir, clair → éclaircir, vieil → vieillir. Además, memoriza el bloque frecuente: finir, choisir, réussir, réfléchir, agir, remplir, obéir, établir, réagir.',
      sampleVerbs:['finir','choisir','réussir','grandir','réfléchir','agir','remplir','établir','obéir','réagir']
    },
    {
      id:'ir-partir',
      code:'-ir · partir',
      badge:'3.er grupo · -ir sin -issant (tipo partir/dormir)',
      short:'-ir sin -issant · 2 raíces (partir, dormir, sortir)',
      title:'3.er grupo · Verbos en -ir de 2 raíces sin -issant (partir, dormir, sortir…)',
      ending:'-tir, -mir, -vir, -courir (plural en -ons, sin -iss-)',
      presentFormula:'Singular corto: -s, -s, -t · Plural largo con consonante: -ons, -ez, -ent',
      participe:'Participio pasado: -i (parti, dormi, sorti) o -u (couru) · Gerundio: -ant (partant, dormant)',
      howToClassify:'Terminan en -ir pero NO usan -iss- en plural (nous partons, nous dormons, nous sortons). En singular pierden la consonante final de la raíz y en plural la recuperan.',
      memoryTrick:'Truco de «Los 6 Hermanos y la Consonante Dormida»: Memoriza juntos PARTIR, SORTIR, DORMIR, SENTIR, MENTIR, SERVIR. En singular (je, tu, il), la consonante antes de -ir (t, m, v) se duerme y desaparece: je pars, tu dors, il sert. En plural (nous, vous, ils), esa consonante despierta: nous partons, nous dormons, nous servons.',
      sampleVerbs:['partir','sortir','dormir','sentir','servir','mentir','courir','mourir','fuir']
    },
    {
      id:'ir-ouvrir',
      code:'-ir → -e',
      badge:'3.er grupo · -ir como -er (ouvrir / offrir)',
      short:'-ir que se conjugan como -er (ouvrir, offrir)',
      title:'3.er grupo · Verbos en -ir que se conjugan en presente como -er',
      ending:'-vrir, -frir, -cueillir',
      presentFormula:'Raíz + -e, -es, -e, -ons, -ez, -ent (¡exactamente igual que parler!)',
      participe:'Participio pasado en -ERT: ouvert, offert, découvert, souffert (accueilli en -i)',
      howToClassify:'Todos los verbos terminados en -vrir (ouvrir, couvrir, découvrir), -frir (offrir, souffrir) y -cueillir (accueillir, cueillir).',
      memoryTrick:'Truco del «Disfraz de -er y Participio en -ERT»: En presente se disfrazan de verbos en -er: j’ouvre, tu ouvres, il ouvre, j’offre, il découvre (¡nunca pongas -s en je ni -t en il!). Y en passé composé todos los de -vrir/-frir hacen su participio en -ERT: j’ai ouvert, j’ai offert, j’ai découvert, j’ai souffert.',
      sampleVerbs:['ouvrir','offrir','découvrir','couvrir','souffrir','accueillir','cueillir']
    },
    {
      id:'ir-venir',
      code:'-venir / -tenir',
      badge:'3.er grupo · familia -venir / -tenir',
      short:'-venir y -tenir (viens / venons / viennent)',
      title:'3.er grupo · Familia nasal -venir y -tenir',
      ending:'-venir y -tenir (y todos sus compuestos)',
      presentFormula:'je -iens, tu -iens, il -ient · nous -enons, vous -enez · ils -iennent',
      participe:'Participio pasado en -U: venu, devenu, revenu, tenu, obtenu · Futuro en -IENDR-',
      howToClassify:'Venir, tenir y sus más de 20 derivados (devenir, revenir, se souvenir, prévenir, convenir, tenir, obtenir, retenir, soutenir, appartenir, maintenir).',
      memoryTrick:'Dominando UN solo molde dominas toda la familia: 1) Bota con diptongo «ie» (je viens, tu viens, il vient). 2) Nosotros/vosotros suave con «e» (nous venons, vous venez). 3) Ellos duplica la N (ils viennent [vjɛn]). 4) Futuro y condicional SIEMPRE añaden una D puente: je viendrai, je tiendrai, il obtiendra.',
      sampleVerbs:['venir','tenir','devenir','revenir','obtenir','appartenir','soutenir','retenir','prévenir','maintenir']
    },
    {
      id:'dre-vendre',
      code:'-dre',
      badge:'3.er grupo · -dre regulares (vendre)',
      short:'-dre regulares (vendre, attendre, répondre)',
      title:'3.er grupo · Verbos en -dre regulares (modelo vendre / attendre)',
      ending:'-dre (excepto -prendre y -aindre/-eindre/-oindre)',
      presentFormula:'Raíz en -d + -s, -s, ∅ (sin -t), -ons, -ez, -ent',
      participe:'Participio pasado siempre en -DU: vendu, attendu, répondu, entendu, perdu, rendu',
      howToClassify:'Todos los verbos en -dre, -endre, -ondre, -erdre que no llevan «prendre» ni «-indre» (vendre, attendre, entendre, répondre, perdre, rendre, descendre, défendre, confondre, fondre, tendre).',
      memoryTrick:'Truco de «La D Escudo + Participio en -DU»: En je y tu añades -s (je vends, tu attends), pero en il/elle/on la D final de la raíz hace de escudo y NO se añade -t: «il vend, il attend, il répond, il perd». Y en plural conservan la D sonora: nous vendons, ils attendent. Su participio pasado siempre termina en -DU.',
      sampleVerbs:['vendre','attendre','répondre','entendre','perdre','rendre','descendre','défendre','tendre']
    },
    {
      id:'dre-prendre',
      code:'-prendre',
      badge:'3.er grupo · familia -prendre',
      short:'Familia -prendre (prends / prenons / prennent)',
      title:'3.er grupo · Familia -prendre (prendre, comprendre, apprendre…)',
      ending:'-prendre',
      presentFormula:'je prends, tu prends, il prend · nous prenons, vous prenez · ils prennent',
      participe:'Participio pasado siempre en -IS: pris, compris, appris, repris, surpris',
      howToClassify:'Prendre y todos sus compuestos (comprendre, apprendre, reprendre, surprendre, entreprendre).',
      memoryTrick:'Compáralo con vendre: en singular son idénticos (je prends, tu prends, il prend), pero al cruzar al plural ¡la D se cae! (nous prenons, vous prenez → sonido [ə]) y en ils/elles la N se duplica para abrir la vocal (ils prennent [pʁɛn]). Su participio pasado es siempre en -IS: j’ai pris, j’ai compris, j’ai appris.',
      sampleVerbs:['prendre','comprendre','apprendre','reprendre','surprendre','entreprendre']
    },
    {
      id:'dre-indre',
      code:'-indre → -gn-',
      badge:'3.er grupo · -aindre / -eindre / -oindre',
      short:'-aindre, -eindre, -oindre (cambio a -gn-)',
      title:'3.er grupo · Familia -aindre, -eindre, -oindre (puente -gn-)',
      ending:'-aindre, -eindre, -oindre',
      presentFormula:'Singular sin d: -s, -s, -t · Plural con -gn-: -gnons, -gnez, -gnent',
      participe:'Participio pasado en -T (igual que il en presente): craint, peint, éteint, atteint, joint',
      howToClassify:'Todos los verbos que terminan en -aindre (craindre, plaindre), -eindre (peindre, éteindre, atteindre, feindre) u -oindre (joindre, rejoindre).',
      memoryTrick:'Truco del «Puente Ñ (-GN-)»: A diferencia de vendre, estos verbos PIERDEN la D en todo el presente. En singular hacen -s, -s, -t (je crains, tu crains, il craint; j’éteins, il éteint) y en todo el plural (e imperfecto y subjuntivo) cambian -nd- por -gn-: nous craignons, nous peignons, nous éteignons, nous rejoignons. Su participio pasado es igual que «il»: il a peint, il a éteint, il a rejoint.',
      sampleVerbs:['craindre','peindre','éteindre','atteindre','joindre','rejoindre','plaindre']
    },
    {
      id:'re-autres',
      code:'-re · familias',
      badge:'3.er grupo · otros -re (-mettre, -uire, -ire, -aître)',
      short:'Otros -re (mettre, lire, dire, écrire, conduire, connaître…)',
      title:'3.er grupo · Otras familias en -re (-mettre, -uire, -ire, -crire, -aître, boire, vivre)',
      ending:'-mettre/-battre, -uire, -ire, -crire, -aître, -vivre/-suivre, -boire/-croire',
      presentFormula:'Singular -s, -s, -t (o ∅ en met/bat) · Plural reactiva consonante (-tt-, -s-, -ss-, -v-)',
      participe:'mis (-mettre), -uit (conduit), écrit (-crire), lu/bu/connu/vécu (-u), dit/fait (-it)',
      howToClassify:'Resto de verbos en -re agrupados en 5 micro-familias muy regulares entre sí: 1) mettre/battre, 2) -uire/lire/dire, 3) écrire/décrire, 4) connaître/paraître/naître, 5) boire/croire/vivre/suivre.',
      memoryTrick:'Clasifícalos por la consonante que despierta en NOUS: 1) METTRE/BATTRE → 1 t en singular (je mets, il met), 2 tt en plural (nous mettons; part. mis). 2) -UIRE (conduire, traduire, construire) + LIRE/DIRE → despierta -S- (nous conduisons, nous lisons; ¡ojo a vous dites!). 3) -CRIRE (écrire, décrire, inscrire) → despierta -V- (nous écrivons; part. écrit). 4) -AÎTRE (connaître, paraître) → lleva î antes de t (il connaît) y -SS- en plural (nous connaissons; part. connu).',
      sampleVerbs:['mettre','permettre','lire','dire','écrire','conduire','construire','traduire','connaître','boire','croire','suivre','vivre']
    },
    {
      id:'oir-piliers',
      code:'-oir + pilares',
      badge:'Pilares e irregulares · -oir',
      short:'-oir y grandes pilares (être, avoir, aller, faire, pouvoir, vouloir…)',
      title:'Los 4 Pilares (être, avoir, aller, faire) y la familia en -oir (pouvoir, vouloir, savoir, devoir, voir…)',
      ending:'être, avoir, aller, faire + verbos en -oir',
      presentFormula:'3 anclas (je · nous · ils) · je peux/veux/vaux con -x · ils sont/ont/vont/font en -ont',
      participe:'Participios cortos en -U: pu, voulu, su, dû, vu, reçu, fallu, valu (y été, eu, allé, fait)',
      howToClassify:'Los verbos de altísima frecuencia que estructuran el francés: los auxiliares y semiauxiliares (être, avoir, aller, faire) y los modales/perceptivos en -oir (pouvoir, vouloir, savoir, devoir, voir, recevoir, valoir, falloir, pleuvoir).',
      memoryTrick:'Tres llaves maestras: 1) Los 4 ÚNICOS verbos con 3.ª plural en -ONT son: ils sont, ils ont, ils vont, ils font. 2) Los 3 ÚNICOS con vous en -TES son: vous êtes, vous faites, vous dites. 3) POUVOIR, VOULOIR y VALOIR llevan -X en je y tu (je peux, tu peux; je veux, tu veux) y cambian de vocal en nous (pouvons / peuvent, voulons / veulent).',
      sampleVerbs:['être','avoir','aller','faire','pouvoir','vouloir','savoir','devoir','voir','recevoir','falloir','valoir']
    },
    {
      id:'pronominal',
      code:'se / s’',
      badge:'Verbos pronominales · se / s’',
      short:'Pronominales (se lever, s’amuser, se souvenir…)',
      title:'Verbos pronominales (se / s’ · en todos los grupos)',
      ending:'se / s’ + infinitivo (-er, -ir, -re, -oir)',
      presentFormula:'je me (m’), tu te (t’), il/elle/on se (s’), nous nous, vous vous, ils/elles se (s’) + verbo',
      participe:'Tiempos compuestos SIEMPRE con el auxiliar ÊTRE (je me suis levé/e)',
      howToClassify:'Cualquier verbo precedido del pronombre reflexivo se / s’ (s’amuser, se lever, se réveiller, s’appeler, se souvenir, se passer, se rendre compte, s’asseoir).',
      memoryTrick:'Dos reglas que nunca fallan: 1) El verbo sigue el patrón exacto de su familia base (s’amuser → -er regular; se lever → -er con bota je me lève; se souvenir → familia venir; se taire → familia -re). 2) En TODOS los tiempos compuestos usan ÊTRE: «je me suis amusé(e), nous nous sommes souvenu(e)s». En imperativo afirmativo el pronombre va detrás con guion y te pasa a toi: «lève-toi !, amusons-nous !».',
      sampleVerbs:["s'amuser","se souvenir","se lever","s'appeler","se passer","s'asseoir","se réveiller","se coucher"]
    }
  ];
  const verbGroupById = new Map(VERB_GROUPS.map(g => [g.id, g]));
  function stripReflexive(raw) {
    return norm(raw).toLocaleLowerCase('fr').replace(/^(se |s')/u, '').trim();
  }
  function isPronominalVerb(verbValue) {
    const verb = typeof verbValue === 'object' && verbValue?.verbe ? verbValue : findVerb(verbValue);
    const raw = norm(verb?.verbe || (typeof verbValue === 'string' ? verbValue : '')).toLocaleLowerCase('fr');
    return Boolean(verb?.pronominal || /^(se |s')/u.test(raw));
  }
  function classifyVerb(verbValue) {
    const verb = typeof verbValue === 'object' && verbValue?.verbe ? verbValue : findVerb(verbValue);
    const raw = norm(verb?.verbe || (typeof verbValue === 'string' ? verbValue : '')).toLocaleLowerCase('fr');
    const inf = stripReflexive(raw);
    if (!inf) return verbGroupById.get('er-regular');
    if (['être','avoir','aller','faire'].includes(inf) || inf.endsWith('oir')) return verbGroupById.get('oir-piliers');
    if (inf.endsWith('er')) {
      const pres = verb?.formes?.['Indicatif — présent'];
      if (Array.isArray(pres) && pres.length === 6) {
        const stem = inf.slice(0, -2);
        const regularEndings = ['e','es','e','ons','ez','ent'];
        const isStrictRegular = pres.every((slot, idx) => {
          const first = Array.isArray(slot) ? slot[0] : '';
          const parsed = parseForm(first);
          if (!parsed) return false;
          const body = parsed.body.replace(/^(me |m'|te |t'|se |s'|nous |vous )/u, '').trim();
          return body === stem + regularEndings[idx];
        });
        return verbGroupById.get(isStrictRegular ? 'er-regular' : 'er-ajuste');
      }
      if (/(ger|cer|yer|eler|eter|[eé][^aeiouy]+er)$/u.test(inf)) return verbGroupById.get('er-ajuste');
      return verbGroupById.get('er-regular');
    }
    if (inf.endsWith('ir')) {
      if (/(venir|tenir)$/u.test(inf)) return verbGroupById.get('ir-venir');
      if (/(vrir|frir|cueillir)$/u.test(inf)) return verbGroupById.get('ir-ouvrir');
      const partPres = norm(verb?.formes?.['Participe — présent']?.[0]?.[0] || '').toLocaleLowerCase('fr');
      const nousPres = norm(verb?.formes?.['Indicatif — présent']?.[3]?.[0] || '').toLocaleLowerCase('fr');
      if (partPres.endsWith('issant') || nousPres.endsWith('issons')) return verbGroupById.get('ir-issant');
      if (verb?.formes) {
        const jePres = norm(verb?.formes?.['Indicatif — présent']?.[0]?.[0] || '').toLocaleLowerCase('fr');
        if (jePres.endsWith('e')) return verbGroupById.get('ir-ouvrir');
        return verbGroupById.get('ir-partir');
      }
      if (/(partir|sortir|dormir|sentir|mentir|servir|courir|mourir|fuir|bouillir|vêtir|acquérir|conquérir|faillir)$/u.test(inf)) return verbGroupById.get('ir-partir');
      return verbGroupById.get('ir-issant');
    }
    if (inf.endsWith('dre')) {
      if (inf.endsWith('prendre')) return verbGroupById.get('dre-prendre');
      if (/(aindre|eindre|oindre)$/u.test(inf)) return verbGroupById.get('dre-indre');
      return verbGroupById.get('dre-vendre');
    }
    return verbGroupById.get('re-autres');
  }
  function matchesVerbGroup(verbValue, groupId) {
    if (!groupId || groupId === 'all') return true;
    if (groupId === 'pronominal') return isPronominalVerb(verbValue);
    return classifyVerb(verbValue)?.id === groupId;
  }
  window.ATELIER_VERB_GROUPS = {
    groups: VERB_GROUPS,
    byId: verbGroupById,
    classify: classifyVerb,
    matches: matchesVerbGroup,
    isPronominal: isPronominalVerb
  };

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
    const grp=classifyVerb(verb||name);
    if(tense===tenses[1])return {title:'La llave es nous ('+grp.badge+')',text:'Recuerda la forma de nous en presente. Quita -ons y añade la terminación del imparfait: ais, ais, ait, ions, iez, aient. Être usa ét-. '+grp.memoryTrick,sourceIds:['imparfait']};
    if(tense===tenses[2])return {title:'Busca la R del futuro ('+grp.badge+')',text:'Recupera la base del futuro y añade ai, as, a, ons, ez, ont. La base acaba en r; algunos verbos usan una raíz irregular. No cambies la base para cada persona.',sourceIds:['future']};
    if(tense===tenses[3])return {title:'Dos piezas que ya conoces',text:'Recupera la base del futuro y combínala con ais, ais, ait, ions, iez, aient. Distingue -ai del futuro y -ais del condicional.',sourceIds:['conditional']};
    if(tense===tenses[4])return {title:'Auxiliar + participio ('+grp.participe+')',text:'Primero conjuga el auxiliar en presente; después añade el participio ('+grp.participe+'). Aprende cada verbo con avoir o être. Revisa la concordancia.',sourceIds:['pc','aux','accordEtre']};
    if(tense==='Subjonctif — présent')return {title:'Dos anclas: ils y nous',text:'Para muchos verbos, toma la base de ils para je, tu, il/elle/on e ils/elles, y la de nous para nous y vous. Añade e, es, e, ions, iez, ent. Los irregulares y los ajustes escritos se comprueban aparte.',sourceIds:['subjForms']};
    if(tense==='Subjonctif — passé')return {title:'El subjuntivo mira hacia atrás',text:'Pon el auxiliar en subjuntivo presente y añade el participio. La acción se presenta como anterior al punto de referencia. Conserva el auxiliar del verbo y las condiciones de concordancia.',sourceIds:['subjForms','subjSequence','accordEtre']};
    if(tense==='Indicatif — plus-que-parfait')return {title:'Un pasado anterior a otro pasado',text:'Conjuga el auxiliar en imparfait y añade el participio. Marca el punto de referencia pasado: el plus-que-parfait expresa lo que ya había ocurrido antes.',sourceIds:['pluperfect','aux']};
    if(tense==='Indicatif — futur antérieur')return {title:'Ya estará terminado entonces',text:'Conjuga el auxiliar en futur simple y añade el participio. Imagina un punto futuro desde el que la acción ya estará completada.',sourceIds:['futureAnterior','aux']};
    if(tense==='Conditionnel — passé (1re forme)')return {title:'Lo que habría ocurrido',text:'Usa el auxiliar en conditionnel présent y añade el participio. Puede expresar un resultado hipotético pasado; con si, el conditionnel no sustituye al plus-que-parfait en la condición.',sourceIds:['conditionalPast','conditionalUse','aux']};
    if(tense==='Impératif — présent')return {title:'Tres personas, sin sujeto escrito',text:'Da una instrucción o un consejo. Comprueba las formas de tu, nous y vous; no escribas el pronombre sujeto. Hay irregulares y cambios de escritura: usa el modelo exacto.',sourceIds:['imperative']};
    if(tense===tenses[0]&&grp) {
      return {title:`${grp.badge} · ${grp.presentFormula}`,text:`${grp.howToClassify} ${grp.memoryTrick}`,sourceIds:['present']};
    }
    return {title:'Separa las piezas',text:'Identifica primero la persona y el tiempo. Recupera la raíz y después la terminación; en un tiempo compuesto, separa auxiliar y participio. Comprueba la forma exacta en el modelo.',sourceIds:['present']};
  }
  function renderHint(verb,tense,{compact=false}={}) {
    const hint=hintText(verb,tense);
    return `<aside class="vt-context-tip${compact?' vt-context-tip-compact':''}" aria-label="Truco de conjugación"><span class="vt-bulb" aria-hidden="true">✦</span><div><strong>${esc(hint.title)}</strong><p>${esc(hint.text)}</p>${compact?'':`<a href="#verb-tips">Explorar los grupos y patrones <span aria-hidden="true">→</span></a>`}</div></aside>`;
  }
  function renderCompact(verbValue) {
    const verb=findVerb(verbValue),name=verb?.verbe||(typeof verbValue==='string'?verbValue:verbValue?.verbe)||'';
    const grp=classifyVerb(verb||name);
    const pron=isPronominalVerb(verb||name);
    return `<aside class="vt-compact"><span class="vt-compact-symbol" aria-hidden="true">✦</span><div><span class="vt-kicker">CLASIFICACIÓN Y TRUCO DE MEMORIA · ${esc(grp.badge.toUpperCase())}${pron?' · PRONOMINAL (SE/S’)':''}</span><h2>${esc(grp.title)}</h2><p><strong>Fórmula:</strong> ${esc(grp.presentFormula)} · <strong>${esc(grp.participe)}</strong></p><p style="margin-top:6px"><strong>Cómo clasificarlo:</strong> ${esc(grp.howToClassify)}</p><p style="margin-top:6px"><strong>💡 Truco:</strong> ${esc(grp.memoryTrick)}</p></div><div class="vt-compact-actions">${name?button('practice',`🚂 Practicar ${esc(name)}`,`data-verb="${esc(name)}"`):''}${button('practice',`🎯 Practicar grupo ${esc(grp.code)}`,`data-verb="group:${esc(grp.id)}"`,'vt-button vt-secondary')}<a class="vt-button vt-secondary" href="#verb-tips">Guía de grupos y trucos <span aria-hidden="true">→</span></a></div></aside>`;
  }
  function hero() {
    return `<header class="vt-hero"><div><p class="vt-kicker">Le déclic des verbes</p><h1>Clasifica el grupo.<br><em>Memoriza el patrón.</em></h1><p>Aprende a distinguir de un vistazo los verbos en <strong>-er</strong>, <strong>-ir con -issant</strong>, <strong>-ir como partir u ouvrir</strong>, <strong>-dre / -prendre / -indre</strong>, <strong>-re</strong> y <strong>-oir</strong>, y practica cada familia en el tren.</p><a class="vt-button vt-hero-button" href="#vt-groups" data-verb-tips-action="groups-jump">Explorar los 12 grupos verbales <span aria-hidden="true">↓</span></a></div><div class="vt-word-art" aria-hidden="true"><span class="vt-art-label">CLASIFICAR PARA RECORDAR</span><div class="vt-art-word"><span>fin</span><b>ir</b></div><div class="vt-art-link">↓</div><div class="vt-art-forms"><span>nous <b>fin<span>issons</span></b></span><span>en <b>fin<span>issant</span></b></span></div><div class="vt-art-caption"><i></i> raíz <i></i> señal de grupo</div><span class="vt-art-spark">✦</span></div></header>`;
  }
  function groupExplorerSection() {
    const grp = verbGroupById.get(state.group) || VERB_GROUPS[0];
    const allVerbs = library();
    const matchingVerbs = allVerbs.length ? allVerbs.filter(v => matchesVerbGroup(v, grp.id)) : grp.sampleVerbs.map(v => ({verbe:v, es:''}));
    return `<section class="vt-patterns" id="vt-groups" aria-labelledby="vt-groups-title"><div class="vt-section-heading"><div><p class="vt-kicker">00 · Clasificación por familias morfológicas</p><h2 id="vt-groups-title">Los grupos verbales: cómo reconocerlos y memorizarlos</h2></div><p>Elige un grupo (-er, -ir con -issant, -ir tipo partir, -dre, -prendre, -indre, -re, -oir) para ver su regla de clasificación, sus trucos y practicar solo ese tipo de verbos.</p></div><div class="vt-pattern-grid">${VERB_GROUPS.map(item => {
      const count = allVerbs.length ? allVerbs.filter(v => matchesVerbGroup(v, item.id)).length : item.sampleVerbs.length;
      return button('select-group', `<span class="vt-card-mark" aria-hidden="true">${esc(item.code)}</span><span><strong>${esc(item.short)}</strong><small>${esc(item.badge)} · ${count} verbos</small></span><span class="vt-card-arrow" aria-hidden="true">↗</span>`, `data-group="${esc(item.id)}" aria-pressed="${item.id===grp.id}"`, 'vt-pattern-card' + (item.id===grp.id ? ' is-selected' : ''));
    }).join('')}</div><article class="vt-pattern-detail" aria-live="polite"><div class="vt-rule-copy"><span class="vt-kicker">${esc(grp.badge)} · ${matchingVerbs.length} VERBOS EN TU BIBLIOTECA</span><h3>${esc(grp.title)}</h3><p><strong>¿Cómo reconocer si un verbo pertenece a este grupo?</strong><br>${esc(grp.howToClassify)}</p><div class="vt-memory"><span aria-hidden="true">💡</span><p><strong>Truco para memorizarlo:</strong> ${esc(grp.memoryTrick)}</p></div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px">${button('practice', `🚂 Practicar este grupo en el Tren (${matchingVerbs.length} verbos) →`, `data-verb="group:${esc(grp.id)}"`)} ${matchingVerbs[0]?button('load-verb', `Ver modelo de «${esc(matchingVerbs[0].verbe)}» en la mesa ↓`, `data-verb="${esc(matchingVerbs[0].verbe)}"`, 'vt-button vt-secondary'):''}</div></div><div class="vt-rule-notebook"><span class="vt-kicker">Fórmula y terminaciones</span><p class="vt-formula" lang="fr">${esc(grp.ending)}</p><p class="vt-formula" lang="fr">${esc(grp.presentFormula)}</p><p class="vt-formula" lang="fr">${esc(grp.participe)}</p><div style="margin-top:14px"><span class="vt-kicker">Verbos representativos de este grupo (toca para abrir o escuchar)</span><div class="vt-verb-chips" style="margin-top:8px">${matchingVerbs.slice(0, 18).map(v => button('load-verb', `${esc(v.verbe)}${v.es ? ' · ' + esc(v.es.split(';')[0]) : ''}`, `data-verb="${esc(v.verbe)}"`, 'vt-verb-chip' + (v.verbe===state.verb ? ' is-selected' : ''))).join('')}</div></div></div></article></section>`;
  }
  function patternSection() {
    const card=currentCard();if(!card)return '';
    return `<section class="vt-patterns" aria-labelledby="vt-pattern-title"><div class="vt-section-heading"><div><p class="vt-kicker">01 · Encuentra una pista por tiempo</p><h2 id="vt-pattern-title">Patrones para recordar cada tiempo</h2></div><p>Elige una tarjeta para descubrir cómo se construye cada tiempo verbal.</p></div><div class="vt-pattern-grid">${cards().map((item,index)=>button('card',`<span class="vt-card-mark" aria-hidden="true">${esc(cardMarks[index]||'✦')}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.subtitle)}</small></span><span class="vt-card-arrow" aria-hidden="true">↗</span>`,`data-card="${esc(item.id)}" aria-pressed="${item.id===card.id}"`,'vt-pattern-card'+(item.id===card.id?' is-selected':''))).join('')}</div><article class="vt-pattern-detail" aria-live="polite"><div class="vt-rule-copy"><span class="vt-kicker">${esc(card.subtitle)}</span><h3>${esc(card.title)}</h3><p>${esc(card.rule)}</p><div class="vt-memory"><span aria-hidden="true">✦</span><p>${esc(card.memoryTip)}</p></div>${button('example','Probar este patrón <span aria-hidden="true">→</span>',`data-card="${esc(card.id)}"`,'vt-button vt-secondary')}</div><div class="vt-rule-notebook"><span class="vt-kicker">El mapa del patrón</span>${(card.formula||[]).map(line=>`<p class="vt-formula" lang="fr">${esc(line)}</p>`).join('')}<details class="vt-pitfalls"><summary>Ojo con las excepciones</summary><ul>${(card.pitfalls||[]).map(line=>`<li>${esc(line)}</li>`).join('')}</ul></details>${sources(card.sourceIds)}</div></article></section>`;
  }
  function formRows(verb,tense) {
    const rows=verb.formes?.[tense];if(!Array.isArray(rows)||![3,6].includes(rows.length))return '<p class="vt-empty">Este modelo no tiene formas personales disponibles para este tiempo. Elige otro verbo.</p>';
    return `<div class="vt-forms">${rows.map((forms,index)=>`<div class="vt-form-row"><span>${esc(personLabel(verb,index,tense))}</span><div lang="fr">${Array.isArray(forms)&&forms.length?forms.map(form=>`<p>${segmented(form,verb,tense,index)}${window.ATELIER_CONJUGATION_AUDIO?.controls(form,{compact:true})||''}</p>`).join(''):'<span class="vt-no-form" lang="es">Sin forma personal</span>'}</div></div>`).join('')}</div>`;
  }
  function laboratory() {
    if(state.loading||!library().length)return `<section class="vt-lab" id="vt-laboratory"><h2>Preparando tus conjugaciones…</h2><p>Un momento: estamos abriendo los modelos de tu biblioteca.</p></section>`;
    const verb=currentVerb();if(!verb)return '';
    const rows=verb.formes?.[state.tense],available=syncPerson();
    return `<section class="vt-lab" id="vt-laboratory" aria-labelledby="vt-lab-title"><div class="vt-section-heading"><div><p class="vt-kicker">02 · Prueba antes de mirar</p><h2 id="vt-lab-title">Tu mesa de conjugaciones</h2></div><span class="vt-count">${library().length} verbos de tus materiales</span></div><div class="vt-lab-selectors"><label>Verbo<select data-verb-tips-filter="verb">${library().map(item=>`<option value="${esc(item.verbe)}"${item.verbe===state.verb?' selected':''}>${esc(item.verbe)}${item.es?' · '+esc(item.es):''} (${esc(classifyVerb(item).code)})</option>`).join('')}</select></label><label>Tiempo<select data-verb-tips-filter="tense">${tenses.map((tense,index)=>`<option value="${esc(tense)}"${tense===state.tense?' selected':''}>${esc(tenseLabels[index])}</option>`).join('')}</select></label></div><div class="vt-recall-stage"><div class="vt-recall-copy"><span class="vt-kicker">Di o escribe la forma · ${esc(classifyVerb(verb).badge)}</span><h3 lang="fr">${esc(available.length?personLabel(verb,state.person,state.tense):'—')} <span>+ ${esc(verb.verbe)}</span></h3><p>${available.length?esc(tenseLabels[tenses.indexOf(state.tense)]||state.tense)+'. Recupera la forma y úsala en una frase verdadera para ti.':'Este tiempo no ofrece formas personales para este verbo. Elige otro tiempo o verbo.'}</p>${button('person','Cambiar de persona <span aria-hidden="true">↻</span>',available.length<=1?'disabled aria-disabled="true"':'','vt-link')}</div><div class="vt-recall-actions">${button('reveal',state.revealed?'Tapar el modelo':'Ver las formas',`aria-expanded="${state.revealed}" aria-controls="vt-model"`)}${button('practice','Llevarlo al juego <span aria-hidden="true">→</span>',`data-verb="${esc(verb.verbe)}" data-tense="${esc(state.tense)}"`,'vt-button vt-secondary')}</div></div>${renderHint(verb,state.tense,{compact:true})}<div id="vt-model" class="vt-model"${state.revealed?'':' hidden'}>${state.revealed?`<div class="vt-model-heading"><h3 lang="fr">${esc(verb.verbe)}</h3><p><span class="vt-root-dot"></span> raíz <span class="vt-ending-dot"></span> terminación <span>· formas exactas de tu tabla</span></p></div>${formRows(verb,state.tense)}${state.tense===tenses[4]?'<p class="vt-agreement">Las variantes conservan masculino/femenino y singular/plural del material. En los tiempos con avoir, la tabla no presupone un complemento directo anterior.</p>':''}<p class="vt-model-note">Comprueba también las letras que no se oyen. Si la raíz cambia, el modelo exacto manda.</p>`:''}</div>${!Array.isArray(rows)?'<p class="vt-empty">Elige un verbo con formas disponibles en este tiempo.</p>':''}</section>`;
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
    return `<div class="vt-page"><nav class="vt-top-links" aria-label="Volver a practicar"><a href="#verbs">← Biblioteca de verbos</a><a href="#verb-game">Tren de los verbos →</a><a href="#mistakes">🔒 Mi cuaderno de errores →</a></nav>${hero()}${groupExplorerSection()}${patternSection()}${laboratory()}${subjunctiveSection()}${irregularSection()}${routeSection()}<p class="vt-source-policy">Trucos redactados para tu atelier y contrastados con OQLF y Académie française. Conjugaciones y audios de tus materiales, con ejemplos didácticos originales del atelier.</p></div>`;
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
    if(action==='subj-check'&&!subjState.attempted){const answer=decisionKey(subjState.answer);if(!answer){subjState.notice='Escribe una forma o una letra antes de comprobar.';refresh('vt-case-answer');return true;}const selected=item.options.find((o,i)=>decisionKey(o.text)===answer||String.fromCharCode(97+i)===answer);const clean=selected?.id===item.correctId;subjState.results.push({index,id:'subj-use|'+item.id,clean});if(!clean)callbacks.onMistake?.({id:'subj-use|'+item.id,kind:'subjunctive',title:item.prompt,subtitle:item.context+' · '+item.group,detail:item.modelFR,explanation:item.explanation,userAnswer:subjState.answer,speakText:item.corpusRef?.form||item.modelFR});subjState.attempted=true;subjState.notice='';refresh();return true;}
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
    if(action==='select-group'&&verbGroupById.has(dataset.group)){state.group=dataset.group;refresh();return true;}
    if(action==='groups-jump'){if(typeof document!=='undefined')document.getElementById('vt-groups')?.scrollIntoView({behavior:'smooth',block:'start'});return true;}
    if(action==='load-verb'&&dataset.verb){state.verb=dataset.verb;state.revealed=true;syncPerson(true);refresh();scrollToLab();void window.ATELIER_CONJUGATION_AUDIO?.listen?.(dataset.verb);return true;}
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
