'use strict';
(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const canonical=value=>String(value??'').normalize('NFC').replace(/[’‘]/g,"'").toLocaleLowerCase('fr-FR').replace(/\s+/g,' ').trim().replace(/[.!?…]+$/u,'').trim();
  const spokenForm=value=>String(value??'').replace(/\s*\+\s*infinitif\b/giu,'').trim();
  const callbacks={beforePlay(){},toast(){}};
  const state={generation:0,text:'',status:'',source:'',active:false,recording:false,recordUrl:'',error:''};
  let audio=null,utterance=null,cancelPending=null,gapTimer=null,recorder=null,stream=null,recordTimer=null,recordGeneration=0;
  let audioContext=null,bufferSource=null,fetchController=null;
  const buffers=new Map();
  let indexPromise=null;
  const synth=()=>window.speechSynthesis;
  function voices(){return synth()?.getVoices?.().filter(v=>/^fr(?:[-_]|$)/i.test(v.lang))||[];}
  function frenchVoice(){return voices().sort((a,b)=>Number(/^fr[-_]FR$/i.test(b.lang))-Number(/^fr[-_]FR$/i.test(a.lang))||Number(b.localService)-Number(a.localService))[0];}
  function fileFor(text){return window.ATELIER_CONJUGATION_AUDIO_DATA?.files?.[canonical(text)]||'';}
  function ensureIndex(text){
    if(fileFor(text)||!window.ATELIER_CONJUGATION_AUDIO_DATA?.meta?.fullIndex)return Promise.resolve();
    if(indexPromise)return indexPromise;
    indexPromise=new Promise(resolve=>{
      if(typeof document==='undefined'){resolve();return;}
      const script=document.createElement('script');script.src=window.ATELIER_CONJUGATION_AUDIO_DATA.meta.fullIndex;script.async=true;
      script.onload=()=>resolve();script.onerror=()=>{indexPromise=null;script.remove();resolve();};document.head.appendChild(script);
    });return indexPromise;
  }
  function controls(text,{compact=false}={}) {
    text=spokenForm(text);
    if(!String(text||'').trim()||/^[-—]$/.test(text))return '';
    const attr=`data-text="${esc(text)}"`;
    if(window.ATELIER_CONJUGATION_AUDIO_DATA?.meta?.generationInProgress&&!fileFor(text)&&!frenchVoice())return `<span class="ca-controls ca-pending"><button type="button" disabled title="Se está preparando el audio de esta forma" aria-label="Audio de ${esc(text)} en preparación">▷ <small>En preparación</small></button></span>`;
    return `<span class="ca-controls${compact?' ca-small':''}" role="group" aria-label="Pronunciación de ${esc(text)}"><button type="button" data-conjugation-audio-action="listen" ${attr} title="Escuchar" aria-label="Escuchar ${esc(text)}">▷</button><button type="button" data-conjugation-audio-action="slow" ${attr} title="Escuchar más despacio" aria-label="Escuchar despacio ${esc(text)}">0,8×</button><button type="button" data-conjugation-audio-action="repeat" ${attr} title="Escuchar, repetir y comparar" aria-label="Escuchar y repetir ${esc(text)}">↻</button></span>`;
  }
  function variants(text,{compact=true}={}){return String(text||'').split(/\s+\/\s+/u).map(form=>`<span class="ca-variant"><span lang="fr">${esc(form)}</span>${controls(form,{compact})}</span>`).join('');}
  function dock(){return `<aside class="ca-dock" id="ca-dock"${state.active||state.recording||state.recordUrl?'':' hidden'} aria-label="Escucha y repetición"><div class="ca-dock-copy"><span class="ca-eyebrow">PRONUNCIACIÓN · ESCUCHA Y REPITE</span><strong lang="fr" data-ca-text>${esc(state.text)}</strong><p data-ca-status role="status">${esc(state.status)}</p><small data-ca-source>${esc(state.source)}</small></div><div class="ca-dock-actions"><button type="button" data-conjugation-audio-action="again">Escuchar</button><button type="button" data-conjugation-audio-action="record" data-ca-record>${state.recording?'Detener grabación':'Grabar mi repetición'}</button><button type="button" data-conjugation-audio-action="stop" aria-label="Detener pronunciación">■</button></div><div class="ca-recording" data-ca-recording data-ca-record-url="${esc(state.recordUrl)}">${state.recordUrl?`<audio controls src="${esc(state.recordUrl)}" aria-label="Escuchar mi repetición"></audio><small>Tu grabación permanece en este dispositivo. Compara con el modelo; no hay puntuación automática.</small>`:''}</div></aside>`;}
  function update(){
    const node=typeof document!=='undefined'?document.getElementById('ca-dock'):null;if(!node)return;
    node.hidden=!(state.active||state.recording||state.recordUrl);
    for(const [selector,value] of [['[data-ca-text]',state.text],['[data-ca-status]',state.status],['[data-ca-source]',state.source]]){const el=node.querySelector(selector);if(el)el.textContent=value;}
    const record=node.querySelector('[data-ca-record]');if(record){record.textContent=state.recording?'Detener grabación':'Grabar mi repetición';record.disabled=!state.text;}
    const recording=node.querySelector('[data-ca-recording]');if(recording&&recording.dataset?.caRecordUrl!==state.recordUrl){recording.innerHTML=state.recordUrl?`<audio controls src="${esc(state.recordUrl)}" aria-label="Escuchar mi repetición"></audio><small>Tu grabación permanece en este dispositivo. Compara con el modelo; no hay puntuación automática.</small>`:'';if(recording.dataset)recording.dataset.caRecordUrl=state.recordUrl;}
  }
  function stop(exceptMedia){
    state.generation++;state.active=false;
    if(typeof document!=='undefined')document.querySelectorAll('[data-ca-recording] audio').forEach(element=>{if(element!==exceptMedia)element.pause();});
    if(audio){audio.pause();audio.removeAttribute?.('src');audio.remove?.();audio=null;}
    if(utterance){synth()?.cancel?.();utterance=null;}
    if(bufferSource){try{bufferSource.stop();}catch{}bufferSource=null;}
    if(fetchController){fetchController.abort();fetchController=null;}
    if(gapTimer){clearTimeout(gapTimer);gapTimer=null;}
    if(cancelPending){const done=cancelPending;cancelPending=null;done({ok:false,duration:0});}
    state.status=exceptMedia?.closest?.('[data-ca-recording]')?'Escucha tu repetición y compárala con el modelo.':'Reproducción detenida.';update();
  }
  function speak(text,rate,token,forceVoice=false,forceNative=false){
    return new Promise(resolve=>{
      let settled=false;const began=Date.now();
      const done=result=>{if(settled)return;settled=true;cancelPending=null;resolve(result);};cancelPending=done;
      const source=!forceVoice&&fileFor(text);
      if(source&&typeof source==='object'&&(rate!==1||forceNative||window.location?.protocol==='file:'||!(window.AudioContext||window.webkitAudioContext))&&typeof Audio!=='undefined'){
        if(!source.path||source.start<0||!(source.end>source.start)){done({ok:false,duration:0,retryVoice:true});return;}
        // Native temporal media fragments preserve the voice pitch when slowed.
        // Every stored boundary is inside an audited silent pause.
        audio=new Audio(`${source.path}#t=${source.start},${source.end}`);const element=audio;
        element.id='ca-native-player';element.hidden=true;element.playbackRate=rate;element.preservesPitch=true;element.webkitPreservesPitch=true;
        if(typeof document!=='undefined')document.body?.appendChild?.(element);
        state.source=rate===1?'Audio francés incluido · fragmento individual':'Audio francés incluido · fragmento lento';update();
        const finished=()=>done({ok:true,duration:(source.end-source.start)*1000/rate});
        const begin=()=>{
          if(token!==state.generation){done({ok:false,duration:0});return;}
          const play=()=>{if(token!==state.generation){done({ok:false,duration:0});return;}element.play()?.catch(()=>done({ok:false,duration:0,retryVoice:true}));};
          if(Number.isFinite(element.duration)&&source.end>element.duration+.1){done({ok:false,duration:0,retryVoice:true});return;}
          if(Math.abs(element.currentTime-source.start)>.01){element.onseeked=()=>{element.onseeked=null;play();};element.currentTime=source.start;}else play();
        };
        element.onloadedmetadata=begin;element.onended=finished;
        element.onpause=()=>{if(element.currentTime>=source.end-.02)finished();};
        element.ontimeupdate=()=>{if(element.currentTime>=source.end){element.pause();finished();}};
        element.onerror=()=>done({ok:false,duration:0,retryVoice:true});
        if(element.readyState>=1)begin();return;
      }
      if(source&&typeof source==='object'){
        const Context=window.AudioContext||window.webkitAudioContext;
        if(!Context||!source.path||!(source.end>source.start)){done({ok:false,duration:0,retryVoice:true});return;}
        if(!audioContext)audioContext=new Context();
        state.source='Audio francés incluido · fragmento individual';update();
        (async()=>{
          await audioContext.resume();if(token!==state.generation){done({ok:false,duration:0});return;}let buffer=buffers.get(source.path);
          if(!buffer){fetchController=typeof AbortController!=='undefined'?new AbortController():null;const response=await fetch(source.path,fetchController?{signal:fetchController.signal}:{});if(!response.ok)throw new Error('audio');buffer=await audioContext.decodeAudioData(await response.arrayBuffer());buffers.set(source.path,buffer);if(buffers.size>6)buffers.delete(buffers.keys().next().value);}
          if(token!==state.generation){done({ok:false,duration:0});return;}
          if(source.start<0||source.end>buffer.duration+.1)throw new Error('segment');
          fetchController=null;bufferSource=audioContext.createBufferSource();bufferSource.buffer=buffer;bufferSource.playbackRate.value=rate;bufferSource.connect(audioContext.destination);bufferSource.onended=()=>done({ok:true,duration:(source.end-source.start)*1000/rate});bufferSource.start(0,source.start,source.end-source.start);
        })().catch(error=>done({ok:false,duration:0,...(error.message==='segment'?{retryVoice:true}:{retryNative:true})}));return;
      }
      if(source&&typeof Audio!=='undefined'){
        audio=new Audio(source);audio.playbackRate=rate;audio.preservesPitch=true;
        audio.id='ca-native-player';audio.hidden=true;if(typeof document!=='undefined')document.body?.appendChild?.(audio);
        state.source='Audio francés incluido en tu biblioteca';update();
        audio.onended=()=>done({ok:true,duration:(Date.now()-began)});
        audio.onerror=()=>done({ok:false,duration:0,retryVoice:true});
        const pending=audio.play();pending?.catch(()=>done({ok:false,duration:0,retryVoice:true}));return;
      }
      const voice=frenchVoice();
      if(!voice||typeof SpeechSynthesisUtterance==='undefined'){state.source='';done({ok:false,duration:0,noVoice:true});return;}
      utterance=new SpeechSynthesisUtterance(text);utterance.lang=voice.lang;utterance.voice=voice;utterance.rate=rate;utterance.pitch=1;
      state.source=`Voz francesa del dispositivo · ${voice.name}`;update();
      utterance.onend=()=>done({ok:true,duration:(Date.now()-began)});
      utterance.onerror=()=>done({ok:false,duration:0});
      if(token!==state.generation){done({ok:false,duration:0});return;}synth().speak(utterance);
    });
  }
  async function playModel(text,rate,token){
    let result=await speak(text,rate,token);
    if(result.retryNative&&token===state.generation)result=await speak(text,rate,token,false,true);
    if(result.retryVoice&&token===state.generation)result=await speak(text,rate,token,true);
    return result;
  }
  async function listen(text,{rate=1,repeat=false}={}){
    text=spokenForm(text);if(!text)return;
    if(canonical(text)!==canonical(state.text)){recordGeneration++;clearTimeout(recordTimer);if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(track=>track.stop());stream=null;state.recording=false;if(state.recordUrl)URL.revokeObjectURL(state.recordUrl);state.recordUrl='';}
    stop();callbacks.beforePlay();const token=++state.generation;state.active=true;state.text=text;state.status='Escucha el modelo.';state.source='';state.error='';update();
    await ensureIndex(text);if(token!==state.generation)return;
    const result=await playModel(text,rate,token);
    if(token!==state.generation)return;
    if(!result.ok){state.active=false;state.status=result.noVoice?'Este dispositivo necesita una voz francesa para esta forma. Las formas con audio incluido siguen disponibles.':'No se pudo reproducir esta forma. Pulsa Escuchar para intentarlo de nuevo.';callbacks.toast(state.status);update();return;}
    if(repeat){
      state.status='Tu turno: repite en voz alta. Después escucharás el modelo otra vez.';update();
      await new Promise(resolve=>{cancelPending=()=>resolve();gapTimer=setTimeout(()=>{gapTimer=null;cancelPending=null;resolve();},Math.max(2400,Math.min(12000,result.duration+1000)));});
      if(token!==state.generation)return;state.status='Compara tu repetición con el modelo.';update();
      const second=await playModel(text,rate,token);
      if(token!==state.generation)return;
      if(!second.ok){state.active=false;state.status='No se pudo reproducir la comparación. Puedes volver a pulsar Escuchar.';callbacks.toast(state.status);update();return;}
    }
    if(token!==state.generation)return;state.status='Ahora repítela y úsala en una frase propia.';state.active=false;update();
    // Keep the comparison panel open after playback, without persisting audio.
    const node=typeof document!=='undefined'?document.getElementById('ca-dock'):null;if(node)node.hidden=false;
  }
  async function record(){
    if(state.recording){recorder?.stop();return;}
    if(!state.text)return;
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){callbacks.toast('La grabación requiere un navegador compatible y HTTPS o localhost.');return;}
    stop();
    const recordToken=++recordGeneration;
    try{
      const opened=await navigator.mediaDevices.getUserMedia({audio:true});
      if(recordToken!==recordGeneration){opened.getTracks().forEach(track=>track.stop());return;}
      stream=opened;const chunks=[],createdRecorder=new MediaRecorder(stream);recorder=createdRecorder;
      createdRecorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      createdRecorder.onstop=()=>{opened.getTracks().forEach(track=>track.stop());if(recordToken!==recordGeneration)return;clearTimeout(recordTimer);if(stream===opened)stream=null;state.recording=false;if(state.recordUrl)URL.revokeObjectURL(state.recordUrl);state.recordUrl=URL.createObjectURL(new Blob(chunks,{type:createdRecorder.mimeType||'audio/webm'}));state.status='Escucha tu repetición y compárala con el modelo.';update();};
      createdRecorder.onerror=()=>{opened.getTracks().forEach(track=>track.stop());if(recordToken!==recordGeneration)return;clearTimeout(recordTimer);state.recording=false;stream=null;state.status='La grabación se ha interrumpido. Puedes repetir en voz alta o intentarlo de nuevo.';update();};
      state.recording=true;state.status='Grabando tu repetición · máximo 30 segundos.';createdRecorder.start();recordTimer=setTimeout(()=>{if(createdRecorder.state==='recording')createdRecorder.stop();},30000);update();
    }catch{if(recordToken!==recordGeneration)return;stream?.getTracks().forEach(track=>track.stop());stream=null;state.recording=false;callbacks.toast('No se ha podido abrir el micrófono. Puedes repetir en voz alta sin grabarte.');update();}
  }
  async function speakStation(question,tenseInfo={}){
    if(!question?.verb)return;
    const verbText=spokenForm(question.verb);
    const subjText=String(question.prompt||question.subject||'').replace(/'/g,'’').trim();
    const cueText=String(tenseInfo?.cue||'').replace(/…$/u,'').trim();
    const tenseText=String(tenseInfo?.fr||question.tense||'').trim();
    stop();callbacks.beforePlay();
    const token=++state.generation;
    state.active=true;
    state.text=`${verbText} · ${tenseText}${subjText?' · '+subjText:''}`;
    state.status=cueText?`Estación: ${cueText} · Conjuga con «${subjText}»`:`Conjuga «${verbText}» con «${subjText}»`;
    state.source='';state.error='';update();
    await ensureIndex(verbText);if(token!==state.generation)return;
    const first=await playModel(verbText,1,token);
    if(token!==state.generation)return;
    if(frenchVoice()&&subjText){
      const promptPhrase=[cueText,tenseText,subjText].filter(Boolean).join(', ');
      await speak(promptPhrase,1,token,true);
    }else if(!first.ok&&frenchVoice()){
      await speak(`${verbText}, ${tenseText}, ${subjText}`,1,token,true);
    }
    if(token!==state.generation)return;
    state.active=false;
    state.status=`Estación escuchada: ${verbText} (${subjText}). Escribe la forma conjugada.`;
    update();
  }
  function leave(){recordGeneration++;stop();clearTimeout(recordTimer);if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(track=>track.stop());stream=null;if(state.recordUrl)URL.revokeObjectURL(state.recordUrl);state.recordUrl='';state.text='';state.recording=false;update();}
  async function handle(action,node){const text=node?.dataset?.text||state.text;if(action==='listen'||action==='again')await listen(text);else if(action==='slow')await listen(text,{rate:.8});else if(action==='repeat')await listen(text,{repeat:true});else if(action==='stop')stop();else if(action==='record')await record();}
  window.ATELIER_CONJUGATION_AUDIO={configure(options){Object.assign(callbacks,options||{});},controls,variants,dock,listen,speakStation,handle,stop,leave,canonical,fileFor,voices};
})();
