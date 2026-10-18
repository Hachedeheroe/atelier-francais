'use strict';
(() => {
  const data=window.ATELIER_PICTURE_DATA;
  if(!data||!window.ATELIER_LIBRARY)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const vocabulary=new Map(window.ATELIER_LIBRARY.vocabulary.map(row=>[row.id,row]));
  const items=data.themes.flatMap(theme=>theme.items.map((entry,index)=>{
    const row=vocabulary.get(entry.id);
    return row?{...row,...entry,theme:theme.id,image:theme.sheet,sheet:theme.sheet,col:index%3,row:Math.floor(index/3)}:null;
  }).filter(Boolean));
  const byId=new Map(items.map(item=>[item.id,item]));
  const bySlug=new Map(items.map(item=>[item.slug,item]));
  const themes=data.themes.map(theme=>({...theme,name:theme.fr,words:theme.items.map(item=>item.slug),art:theme.art||[theme.items[0].slug,theme.items[1].slug],items:theme.items.map(item=>byId.get(item.id)).filter(Boolean)}));
  const image=(slug,alt='',cls='')=>{
    const item=bySlug.get(slug);
    if(!item)return `<img class="${esc(cls)}" src="illustrations/${esc(slug)}.svg" alt="${esc(alt)}" draggable="false" loading="lazy">`;
    const crop=item.crop||{width:300,height:300,x:item.col*50,y:item.row*50};
    const aria=alt?`role="img" aria-label="${esc(alt)}"`:'aria-hidden="true"';
    return `<span class="real-photo ${esc(cls)}" ${aria} style="--photo:url('${esc(item.sheet)}');--photo-x:${crop.x}%;--photo-y:${crop.y}%;--photo-w:${crop.width}%;--photo-h:${crop.height}%" draggable="false"></span>`;
  };
  window.ATELIER_VISUALS={themes,items,byId,bySlug,image,meta:data.meta};
})();
