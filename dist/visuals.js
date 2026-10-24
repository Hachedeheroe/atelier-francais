'use strict';
(() => {
  const data=window.ATELIER_PICTURE_DATA;
  if(!data||!window.ATELIER_LIBRARY)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const vocabulary=new Map(window.ATELIER_LIBRARY.vocabulary.map(row=>[row.id,row]));
  const originalItems=data.themes.flatMap(theme=>theme.items.map((entry,index)=>{
    const row=vocabulary.get(entry.id);
    return row?{...row,...entry,theme:theme.id,image:theme.sheet,sheet:theme.sheet,col:index%3,row:Math.floor(index/3)}:null;
  }).filter(Boolean));
  const items=[...originalItems], existingIds=new Set(items.map(item=>item.id));
  for(const extra of window.ATELIER_CATALOG_IMAGES?.items||[]){
    const row=vocabulary.get(extra.id);if(!row||existingIds.has(extra.id)||!extra.src)continue;
    // A word can occur in several senses; accents can also share an ASCII slug.
    // Catalog cards therefore address the image by the preserved entry ID.
    const item={...row,...extra,slug:'catalog-'+extra.id,sheet:extra.src,image:extra.src};
    items.push(item);existingIds.add(extra.id);
  }
  const byId=new Map(items.map(item=>[item.id,item]));
  const bySlug=new Map(items.map(item=>[item.slug,item]));
  const themes=data.themes.map(theme=>({...theme,name:theme.fr,words:theme.items.map(item=>item.slug),art:theme.art||[theme.items[0].slug,theme.items[1].slug],items:theme.items.map(item=>byId.get(item.id)).filter(Boolean)}));
  const originalIds=new Set(originalItems.map(item=>item.id));
  const categories=new Map();
  // Recognition rounds use concrete objects. Contextual scenes remain in the
  // catalogue, where their sentence explains the intended relationship.
  for(const item of items){
    if(originalIds.has(item.id)||item.kind!=='object'||!item.audio)continue;
    const category=item.category||'Objets de tous les jours';
    if(!categories.has(category))categories.set(category,[]);
    categories.get(category).push(item);
  }
  const categoryES={'Objets de tous les jours':'Objetos cotidianos','Boissons':'Bebidas','Manger':'Comida','Vêtements':'Ropa','Équiper son logement':'Equipar la casa','Maison : objets et appareils':'Objetos y aparatos de casa','Transports':'Transportes','Corps : nommer et décrire':'El cuerpo','Nature et paysages':'Naturaleza y paisajes','Animaux courants':'Animales','Fruits et légumes':'Frutas y verduras','Aliments et cuisine':'Alimentos y cocina','Vêtements et matériel de loisir':'Ropa y material de ocio','Entretien et objets pratiques':'Limpieza y objetos prácticos','Matières et accessoires':'Materiales y accesorios'};
  const THEMATIC_GROUPS=[
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
  const groupById=new Map(THEMATIC_GROUPS.map(g=>[g.id,g]));
  function classifyTheme(id='',fr='',es=''){
    const text=`${id} ${fr} ${es}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(/\b(table|fruit|legume|boisson|manger|aliment|nourriture|cuisine|repas|gout|plat|pain|fromage|viande|poisson|cafe|restaurant|cuire)/.test(text))return groupById.get('alimentacion');
    if(/\b(maison|logement|meuble|chambre|salon|bain|jardin|entretien|menage|nettoyer|habiter|foyer|porte|fenetre|lit\b|appareil)/.test(text))return groupById.get('hogar');
    if(/\b(animaux|animal|nature|paysage|meteo|climat|plante|arbre|fleur|mer\b|montagne|soleil|pluie|environnement|terre|dehors|campagne)/.test(text))return groupById.get('naturaleza');
    if(/\b(corps|sante|maladie|medecin|soin|emotion|sentiment|caractere|sens\b|visage|main\b|mains\b|oeil|yeux|tete|douleur|psycholog|moral)/.test(text))return groupById.get('cuerpo');
    if(/\b(vetement|armoire|chaussure|mode\b|accessoire|matiere|couleur|forme|taille|aspect|tissu|robe|chemise|chapeau|porter)/.test(text))return groupById.get('ropa');
    if(/\b(ville|route|transport|voyage|train|voiture|avion|lieu|orientation|deplacement|circulation|quartier|hotel|vacance|tourisme|espace|situer)/.test(text))return groupById.get('ciudad');
    if(/\b(objet|outil|technolog|ordinateur|telephone|numerique|internet|machine|instrument|pratique|quotidien|tous les jours|materiel)/.test(text))return groupById.get('objetos');
    if(/\b(famille|personne|ami\b|amis\b|relation|amour|mariage|enfant|age\b|vie\b|sport|jeu|loisir|musique|art\b|arts\b|spectacle|cinema|lecture|livre|fete|culture|rencontre)/.test(text))return groupById.get('sociedad');
    if(/\b(travail|emploi|metier|entreprise|bureau|etude|ecole|universite|apprendre|argent|banque|achat|commerce|prix|economie|politique|justice|droit|media|presse|social|societe|administration|service)/.test(text))return groupById.get('trabajo');
    return groupById.get('expresion');
  }
  for(const [category,rows] of categories){
    const seenWords=new Set(),seenAudio=new Set();
    const eligible=rows.sort((a,b)=>a.rank-b.rank||a.id.localeCompare(b.id)).filter(item=>{
      const key=item.word.normalize('NFC').toLocaleLowerCase('fr');
      if(seenWords.has(key)||seenAudio.has(item.audio))return false;
      seenWords.add(key);seenAudio.add(item.audio);return true;
    });
    if(eligible.length<4)continue;
    const count=Math.ceil(eligible.length/9),size=Math.floor(eligible.length/count),remainder=eligible.length%count;
    const key=category.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    let offset=0;
    for(let index=0;index<count;index++){
      const entries=eligible.slice(offset,offset+size+(index<remainder?1:0));offset+=entries.length;
      const suffix=count>1?` · ${index+1}`:'';
      themes.push({id:`catalog-${key}-${index+1}`,fr:category+suffix,es:(categoryES[category]||category)+suffix,name:category+suffix,color:'#e9eee6',words:entries.map(item=>item.slug),art:entries.slice(0,2).map(item=>item.slug),items:entries,source:'catalogue-reviewed-objects'});
    }
  }
  for(const theme of themes){
    const grp=classifyTheme(theme.id,theme.fr,theme.es);
    theme.group=grp.id;theme.groupLabel=grp.label;theme.groupIcon=grp.icon;
    if(!theme.color||theme.color==='#e9eee6')theme.color=grp.color;
  }
  const allByCategory=new Map();
  for(const item of items){
    if(!item.audio)continue;
    const category=item.category||'Objets de tous les jours';
    if(!allByCategory.has(category))allByCategory.set(category,[]);
    allByCategory.get(category).push(item);
  }
  const catalogThemes=[];
  for(const [category,rows] of allByCategory){
    const sorted=[...rows].sort((a,b)=>(a.rank||0)-(b.rank||0)||String(a.id).localeCompare(String(b.id)));
    if(!sorted.length)continue;
    const key=category.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const grp=classifyTheme(key,category,categoryES[category]||'');
    catalogThemes.push({
      id:`cat-${key}`,
      fr:category,
      es:categoryES[category]||grp.label,
      name:category,
      color:grp.color,
      group:grp.id,
      groupLabel:grp.label,
      groupIcon:grp.icon,
      words:sorted.map(item=>item.slug),
      art:sorted.slice(0,2).map(item=>item.slug),
      items:sorted,
      source:'catalogue-full-category'
    });
  }
  const image=(slug,alt='',cls='')=>{
    const item=bySlug.get(slug);
    if(!item)return `<img class="${esc(cls)}" src="illustrations/${esc(slug)}.svg" alt="${esc(alt)}" draggable="false" loading="lazy">`;
    if(item.src&&!item.crop)return `<img class="catalog-image ${esc(cls)}" src="${esc(item.src)}" alt="${esc(alt)}" loading="lazy" draggable="false">`;
    const crop=item.crop||{width:300,height:300,x:item.col*50,y:item.row*50};
    const aria=alt?`role="img" aria-label="${esc(alt)}"`:'aria-hidden="true"';
    return `<span class="real-photo ${esc(cls)}" ${aria} style="--photo:url('${esc(item.sheet)}');--photo-x:${crop.x}%;--photo-y:${crop.y}%;--photo-w:${crop.width}%;--photo-h:${crop.height}%" draggable="false"></span>`;
  };
  window.ATELIER_VISUALS={themes,catalogThemes,themeGroups:THEMATIC_GROUPS,classifyTheme,items,byId,bySlug,image,meta:data.meta};
})();
