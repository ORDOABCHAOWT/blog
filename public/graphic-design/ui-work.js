(()=>{
 const tabs=[...document.querySelectorAll('[data-ui]')],before=document.querySelector('#ui-before-img'),after=document.querySelector('#ui-after-img'),panel=document.querySelector('#ui-comparison');
 const notes = [...document.querySelectorAll('[data-ui-copy]')];
 let sequence=0;
 async function select(tab){const id=tab.dataset.ui,n=++sequence;const images=[new Image(),new Image()];images[0].src=`/graphic-design/assets/app-before-${id}.webp`;images[1].src=`/graphic-design/assets/app-after-${id}.webp`;
  try{await Promise.all(images.map(i=>i.decode()));if(n!==sequence)return;const label=tab.textContent.trim();[before,after].forEach((img,i)=>{img.src=images[i].src;img.width=images[i].naturalWidth;img.height=images[i].naturalHeight;img.alt=`民生宝改版${i?'后':'前'}的${label}`;img.parentElement.scrollTop=0});notes.forEach(note=>{note.hidden=note.dataset.uiCopy!==id});tabs.forEach(b=>{b.setAttribute('aria-selected',String(b===tab));b.tabIndex=b===tab?0:-1});panel.setAttribute('aria-labelledby',tab.id)}catch(error){console.error('界面加载失败',error)}
 }
 tabs.forEach((tab,index)=>{tab.onclick=()=>select(tab);tab.addEventListener('keydown',e=>{let target;if(e.key==='ArrowRight')target=(index+1)%tabs.length;if(e.key==='ArrowLeft')target=(index+tabs.length-1)%tabs.length;if(e.key==='Home')target=0;if(e.key==='End')target=tabs.length-1;if(target!==undefined){e.preventDefault();tabs[target].focus();select(tabs[target])}})});
 const options=[...document.querySelectorAll('[data-wallpaper]')],preview=document.querySelector('#wallpaper-preview');let wallpaperSequence=0;
 options.forEach(button=>button.onclick=async()=>{const n=++wallpaperSequence,im=new Image();im.src=`/graphic-design/assets/wallpaper-${button.dataset.wallpaper}.webp`;try{await im.decode();if(n!==wallpaperSequence)return;preview.src=im.src;preview.alt=button.innerText+'主题 MacBook 桌面，含软件图标与 Dock';options.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('#wallpaper-announcement').textContent='当前壁纸：'+button.innerText}catch(error){console.error('壁纸加载失败',error)}});
})();
