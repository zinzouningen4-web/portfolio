(() => {
  'use strict';
  const root=document.documentElement;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton=document.querySelector('.motion-toggle');
  const motionAnimations=new Set();
  let paused=preference.matches;
  function syncMotion(){
    root.classList.toggle('motion-paused',paused);
    root.classList.toggle('js-motion',!paused);
    motionButton.setAttribute('aria-pressed',String(paused));
    const label=paused?'アニメーションを再開':'アニメーションを停止';
    motionButton.setAttribute('aria-label',label);motionButton.title=label;
    motionButton.firstElementChild.textContent=paused?'▶':'Ⅱ';
    if(paused){
      root.classList.add('intro-complete');
      document.getElementById('hero-scene').classList.add('entrance-complete');
      motionAnimations.forEach(animation=>{try{animation.finish();}catch{animation.cancel();}});
    }
  }
  motionButton.addEventListener('click',()=>{paused=!paused;syncMotion();});
  preference.addEventListener('change',e=>{paused=e.matches;syncMotion();});
  syncMotion();
  if(paused)root.classList.add('intro-complete');
  else setTimeout(()=>root.classList.add('intro-complete'),1650);
  document.getElementById('hero-canvas').addEventListener('animationend',event=>{
    if(event.animationName==='scene-arrive')document.getElementById('hero-scene').classList.add('entrance-complete');
  });

  function animateElement(element,keyframes,options){
    if(paused||!element.animate)return null;
    const animation=element.animate(keyframes,options);
    motionAnimations.add(animation);
    animation.finished.catch(()=>{}).finally(()=>motionAnimations.delete(animation));
    return animation;
  }
  document.querySelectorAll('.screenshot-grid figure,.engine-figure,.gameplay-section,.planet-media').forEach(el=>el.classList.add('media-reveal'));
  document.addEventListener('focusin',event=>{event.target.closest?.('.reveal')?.classList.add('visible');});

  if('IntersectionObserver' in window){
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}});
    },{threshold:.08});
    document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
    const sectionObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting)document.querySelectorAll('.header nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id));});
    },{rootMargin:'-20% 0px -65% 0px'});
    document.querySelectorAll('section[id]').forEach(section=>sectionObserver.observe(section));
  } else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
  const header=document.querySelector('.header');
  let scrollQueued=false;
  function updateHeader(){header.classList.toggle('is-scrolled',scrollY>20);scrollQueued=false;}
  window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateHeader);}},{passive:true});
  updateHeader();
  const menuButton=document.querySelector('.menu-toggle');
  const mobileNav=document.getElementById('mobile-nav');
  function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','メニューを開く');mobileNav.hidden=true;}
  menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));menuButton.setAttribute('aria-label',open?'メニューを開く':'メニューを閉じる');mobileNav.hidden=open;});
  mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobileNav.hidden){closeMenu();menuButton.focus();}});
  matchMedia('(min-width: 801px)').addEventListener('change',e=>{if(e.matches)closeMenu();});

  const wreckGallery=[
    {src:'assets/wreck-01.webp',caption:'モード選択',alt:'WRECK RALLYのモード選択画面'},
    {src:'assets/wreck-02.webp',caption:'遊具のあるステージ',alt:'青・黄・緑の遊具が並ぶカラフルなステージ'},
    {src:'assets/wreck-03.webp',caption:'コインバトル',alt:'黄色い地形と植物に囲まれたコインバトルの森ステージ'},
    {src:'assets/wreck-04.webp',caption:'武器を使ったアクション',alt:'武器のエフェクトが広がるコインバトル'},
    {src:'assets/wreck-05.webp',caption:'森のレース',alt:'複数の車両が森を駆け抜けるレース'},
    {src:'assets/wreck-title.webp',caption:'タイトル画面',alt:'オレンジの車とWRECK RALLYのタイトルロゴ'}
  ];
  const engineGallery=[
    {src:'assets/engine-editor.webp',caption:'自作エディターの全体画面',alt:'自作エディターのシーン・階層・マテリアル・アセット・負荷モニター'},
    {src:'assets/engine-render.webp',caption:'自作エンジンでの描画例',alt:'自作エンジンで描画した黄色い車の質感と床への映り込み'}
  ];
  const lightbox=document.getElementById('lightbox');
  const lightboxImage=document.getElementById('lightbox-image');
  let activeGallery=wreckGallery,activeIndex=0,imageRequest=0,displayedIndex=0,imageAnimation=null,pendingOpen=false;
  function updateLightbox(){
    const item=activeGallery[activeIndex];
    const image=document.getElementById('lightbox-image');image.src=item.src;image.alt=item.alt;
    document.getElementById('lightbox-caption').textContent=item.caption;
    document.getElementById('lightbox-count').textContent=`${activeIndex+1} / ${activeGallery.length}`;
    document.getElementById('lightbox-original').href=item.src;
  }
  async function decodeImage(src){
    const image=new Image();image.src=src;
    try{await image.decode();return true;}catch{return false;}
  }
  function finishImageAnimation(){
    if(imageAnimation){imageAnimation.cancel();imageAnimation=null;}
    lightbox.classList.remove('image-opening');
  }
  async function openGallery(items,index,source){
    const request=++imageRequest;
    pendingOpen=true;
    const decoded=await decodeImage(items[index].src);
    if(request!==imageRequest)return;
    pendingOpen=false;
    if(!decoded)return;
    const from=source.getBoundingClientRect();
    finishImageAnimation();activeGallery=items;activeIndex=displayedIndex=index;
    updateLightbox();lightbox.showModal();document.body.classList.add('modal-open');
    document.querySelector('.lightbox-close').focus({preventScroll:true});
    if(paused)return;
    const to=lightboxImage.getBoundingClientRect();
    if(!to.width||!to.height)return;
    lightbox.classList.add('image-opening');
    const animation=animateElement(lightboxImage,[
      {transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`,opacity:.65},
      {transform:'translate(0,0) scale(1)',opacity:1}
    ],{duration:420,easing:'cubic-bezier(.2,.72,.15,1)',fill:'none'});
    imageAnimation=animation;
    if(animation)animation.finished.catch(()=>{}).finally(()=>{if(imageAnimation===animation){imageAnimation=null;lightbox.classList.remove('image-opening');}});
    else lightbox.classList.remove('image-opening');
  }
  document.querySelectorAll('[data-wreck-image]').forEach(button=>button.addEventListener('click',()=>openGallery(wreckGallery,Number(button.dataset.wreckImage),button)));
  document.querySelectorAll('[data-engine-image]').forEach(button=>button.addEventListener('click',()=>openGallery(engineGallery,Number(button.dataset.engineImage),button)));
  document.querySelector('.lightbox-close').addEventListener('click',()=>lightbox.close());
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&pendingOpen){imageRequest++;pendingOpen=false;}});
  lightbox.addEventListener('close',()=>{imageRequest++;finishImageAnimation();document.body.classList.remove('modal-open');});
  lightbox.addEventListener('click',event=>{if(event.target!==lightbox)return;const rect=lightbox.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)lightbox.close();});
  async function stepImage(step){
    activeIndex=(activeIndex+step+activeGallery.length)%activeGallery.length;
    const index=activeIndex,request=++imageRequest;
    const decoded=await decodeImage(activeGallery[index].src);
    if(request!==imageRequest||!lightbox.open)return;
    if(!decoded){activeIndex=displayedIndex;return;}
    finishImageAnimation();displayedIndex=index;updateLightbox();
    imageAnimation=animateElement(lightboxImage,[
      {transform:`translateX(${step*14}px)`,opacity:.5},
      {transform:'translateX(0)',opacity:1}
    ],{duration:260,easing:'cubic-bezier(.2,.65,.2,1)'});
  }
  document.querySelector('.lightbox-prev').addEventListener('click',()=>stepImage(-1));
  document.querySelector('.lightbox-next').addEventListener('click',()=>stepImage(1));
  lightbox.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();stepImage(-1);}else if(event.key==='ArrowRight'){event.preventDefault();stepImage(1);}});

  document.querySelectorAll('.video-wrapper').forEach(wrapper=>{
    const video=wrapper.querySelector('video'),button=wrapper.querySelector('.video-start');
    let buttonAnimation=null,playRequest=0;
    button.addEventListener('click',async()=>{
      const request=++playRequest;
      button.disabled=true;button.style.pointerEvents='none';
      try{
        await video.play();
        if(request!==playRequest)return;
        buttonAnimation=animateElement(button,[{opacity:1},{opacity:0}],{duration:180,easing:'ease-out'});
        if(buttonAnimation)await buttonAnimation.finished.catch(()=>{});
        if(request===playRequest)button.classList.add('hidden');
      }catch{if(request===playRequest)button.classList.remove('hidden');}
      finally{if(request===playRequest){button.disabled=false;button.style.pointerEvents='';}}
    });
    video.addEventListener('play',()=>{if(!button.disabled)button.classList.add('hidden');document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();});});
    video.addEventListener('ended',()=>{playRequest++;buttonAnimation?.cancel();button.disabled=false;button.style.pointerEvents='';button.classList.remove('hidden');});
  });
  if('IntersectionObserver' in window){
    const playbackObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)entry.target.pause();}),{threshold:0});
    document.querySelectorAll('video').forEach(video=>playbackObserver.observe(video));
  }
  document.getElementById('copy-email').addEventListener('click',async()=>{
    const status=document.getElementById('copy-status');
    try{await navigator.clipboard.writeText('kd1389274@st.kobedenshi.ac.jp');status.textContent='メールアドレスをコピーしました。';}
    catch{status.textContent='上のメールアドレスを選択してコピーしてください。';}
  });
})();
