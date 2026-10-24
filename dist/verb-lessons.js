'use strict';
(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const canonical=value=>String(value??'').normalize('NFC').toLocaleLowerCase('fr').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().replace(/[.!?]+$/u,'');
  const state={id:'',answer:'',revealed:false,feedback:'',checked:false};
  const callbacks={render(){}};
  const lessons=()=>window.ATELIER_VERB_LESSONS?.lessons||[];
  const active=()=>lessons().find(lesson=>lesson.id===state.id)||lessons()[0];
  const button=(action,label,attrs='',cls='vl-button')=>`<button type="button" class="${cls}" data-verb-lesson-action="${action}" ${attrs}>${label}</button>`;
  function start(){if(!active())return;state.id=active().id;state.revealed=false;state.feedback='';state.checked=false;}
  function leave(){window.ATELIER_CONJUGATION_AUDIO?.stop();if(typeof document!=='undefined')document.querySelectorAll('.vl-player video').forEach(video=>video.pause());}
  function refresh(focus){leave();callbacks.render();if(focus&&typeof document!=='undefined')document.getElementById(focus)?.focus({preventScroll:true});}
  function render(){
    const lesson=active();
    if(!lesson)return '<div class="empty-state"><h1>Lecciones de verbos</h1><p>Preparando las animaciones de formación y pronunciación.</p></div>';
    const exercise=lesson.exercise||{},answer=Array.isArray(exercise.answer)?exercise.answer.join(' / '):exercise.answer||'';
    return `<section class="vl-page"><header class="vl-header"><p class="eyebrow">FORMACIÓN · SONIDO · PRÁCTICA</p><h1>Del verbo escrito<br>al verbo que se oye.</h1><p>Observa cómo se construye la forma. Escucha la pronunciación, pausa el vídeo y repite antes de continuar.</p></header><nav class="vl-selector" aria-label="Elegir una lección">${lessons().map((item,index)=>button('select',`<small>${String(index+1).padStart(2,'0')}</small><strong>${esc(item.title)}</strong>`,`data-id="${esc(item.id)}" aria-pressed="${item.id===lesson.id}"`,'vl-card'+(item.id===lesson.id?' active':''))).join('')}</nav><article class="vl-content"><div class="vl-player"><video controls playsinline preload="metadata" poster="${esc(lesson.poster)}" aria-label="${esc(lesson.title)}"><source src="${esc(lesson.video)}" type="video/mp4">${lesson.captions?`<track kind="captions" src="${esc(lesson.captions)}" srclang="es" label="Español" default>`:''}<p>Tu navegador no puede reproducir el vídeo. <a href="${esc(lesson.video)}">Abrir el archivo</a>.</p></video></div><div class="vl-description"><div><p class="eyebrow">LECCIÓN ${String(lessons().indexOf(lesson)+1).padStart(2,'0')} · ${Math.round(lesson.duration||32)} SEGUNDOS</p><h2>${esc(lesson.title)}</h2><p>${esc(lesson.description)}</p></div><a class="vl-quiet" href="#verb-tips">Consultar los patrones →</a></div><section class="vl-listening"><h3>Escucha cada forma y repítela</h3><p>El vídeo relaciona escritura y sonido. Aquí puedes repetir una forma por separado y dejar un espacio para tu voz.</p><div class="vl-forms">${(lesson.forms||[]).map(form=>`<div><span lang="fr">${esc(form)}</span>${window.ATELIER_CONJUGATION_AUDIO?.controls(form)||''}</div>`).join('')}</div></section><section class="vl-exercise"><p class="eyebrow">APLICA LO QUE HAS VISTO</p><h3>Primero inténtalo.</h3><p lang="fr" class="vl-prompt">${esc(exercise.prompt||'Escribe una forma del verbo y úsala en una frase personal.')}</p><label for="vl-answer">Tu respuesta antes de mirar</label><textarea id="vl-answer" data-verb-lesson-input="answer" lang="fr" placeholder="Écris ici…" spellcheck="false">${esc(state.answer)}</textarea><div class="vl-actions">${button('solution',state.revealed?'Ocultar la solución':'Ver la solución y practicar',`aria-expanded="${state.revealed}" aria-controls="vl-solution"`)}</div>${state.revealed?`<div class="vl-solution" id="vl-solution"><p class="eyebrow">SOLUCIÓN COMENTADA</p><p lang="fr" class="vl-model">${esc(answer)}</p><p>${esc(exercise.explanation)}</p><div class="vl-recover"><h4>Ahora recupérala de nuevo</h4><p>Oculta el modelo, borra tu respuesta y vuelve a escribirla. Comprueba también los acentos.</p>${button('reset','Tapar y volver a intentar','','vl-button vl-secondary')}${answer?button('check','Comparar mi respuesta','','vl-button vl-secondary'):''}</div></div>`:''}${state.feedback?`<p class="vl-feedback" role="status">${esc(state.feedback)}</p>`:''}</section></article><footer class="vl-note">Animaciones creadas con Manim 3D. La voz francesa es una síntesis de pronunciación; las letras coloreadas muestran la formación escrita. Puedes detener el movimiento con los controles del vídeo.</footer></section>`;
  }
  function handle(action,node){
    if(action==='select'&&lessons().some(lesson=>lesson.id===node?.dataset?.id)){leave();state.id=node.dataset.id;state.answer='';state.revealed=false;state.feedback='';state.checked=false;refresh();}
    else if(action==='solution'){
      if(!state.revealed&&!state.answer.trim()){state.feedback='Escribe primero tu respuesta; después podrás abrir la solución y practicar.';refresh('vl-answer');return;}
      state.revealed=!state.revealed;state.feedback='';refresh();
    }
    else if(action==='reset'){state.revealed=false;state.answer='';state.feedback='';refresh();}
    else if(action==='check'){
      const expected=active()?.exercise?.answer;const options=Array.isArray(expected)?expected:[expected];
      state.feedback=!state.answer.trim()?'Escribe primero tu respuesta.':options.filter(Boolean).some(answer=>canonical(answer)===canonical(state.answer))?'La forma coincide con el modelo. Vuelve a decirla sin mirar.':'Compara tu respuesta con el modelo: fíjate en el sujeto, la raíz, la terminación y los acentos.';state.checked=true;refresh();
    }
  }
  function input(event){if(event.target?.dataset?.verbLessonInput==='answer')state.answer=String(event.target.value).slice(0,2000);}
  window.ATELIER_VERB_LESSON_UI={configure(options){Object.assign(callbacks,options||{});},start,leave,render,handle,input};
})();
