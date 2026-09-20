(() => {
'use strict';
const $=id=>document.getElementById(id),Engine=window.SiteEngine,Schema=window.SiteSchema,Pack=window.SitePackage;
if(!Engine||!Schema||!Pack||!window.SiteContent||!window.SiteBundle){$('status').textContent='编辑文件不完整，请完整解压网站包后打开 editor.html。';return;}
let data=structuredClone(SiteContent),sectionKey='profile',selectedId=null,query='',history=[],focusSnapshot=null,saveTimer=null,pendingDraft=null;
const storageKey='qh-bilingual-draft-v1',E=Engine.escape;
const section=()=>Schema.sections.find(s=>s.key===sectionKey);
const record=()=>section().single?data[sectionKey]:data[sectionKey].find(r=>r.id===selectedId);
const message=(text,warning=false)=>{$('status').textContent=text;$('status').classList.toggle('warning',warning);};
const snapshot=()=>JSON.stringify({data,sectionKey,selectedId});
function remember(s=snapshot()){history.push(s);if(history.length>25)history.shift();$('undo').disabled=false;}
function today(){const dt=new Date();return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;}
function save(){clearTimeout(saveTimer);try{localStorage.setItem(storageKey,JSON.stringify({data,at:new Date().toISOString()}));message('已保存本机草稿 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+' · 尚未更新线上网站');}catch{message('浏览器未能保存草稿，请及时下载资料备份。',true);}}
function changed(){data.updated=today();message('正在保存本机草稿…');clearTimeout(saveTimer);saveTimer=setTimeout(save,350);$('errors').hidden=true;}
function label(row){const v=row.title||row.text||row.organization;return Engine.pick(v,'zh')||'未命名条目';}
function drawNav(){const nav=$('section-nav');nav.innerHTML=Schema.sections.map(s=>`<button type="button" data-section="${s.key}"${s.key===sectionKey?' aria-current="true"':''}>${E(s.label)}${!s.single?`<span class="badge">${data[s.key].length}</span>`:''}</button>`).join('');}
function drawList(){const s=section();$('record-panel').hidden=s.single;if(s.single)return;const list=data[sectionKey].filter(r=>!query||JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));$('record-count').textContent=query?`找到 ${list.length} / ${data[sectionKey].length} 条`:`共 ${list.length} 条 · ${sectionKey==='publications'?'按年份分组，同年内可排序':'可调整显示顺序'}`;$('record-list').innerHTML=list.map(r=>{const missing=s.fields.some(f=>Schema.isBi(f.type)&&f.required&&(!r[f.key].zh.trim()||!r[f.key].en.trim()));return `<button type="button" class="record-button" data-record="${E(r.id)}"${r.id===selectedId?' aria-current="true"':''}>${E(label(r).slice(0,100))}<small>${E(r.year||Engine.pick(r.date,'zh')||'')}${missing?' · <span class="missing">有语言待补充</span>':''}${r.selected?' · 首页代表论文':''}</small></button>`;}).join('')||'<p class="small">没有匹配条目。</p>';}
function fieldHTML(f,r){const id='field-'+f.key,value=r[f.key];if(Schema.isBi(f.type)){return `<fieldset class="field"><legend>${E(f.label)}${f.required?'<span>至少填写一种语言</span>':''}</legend><div class="bilingual-fields">${['zh','en'].map(l=>`<div><label for="${id}-${l}">${l==='zh'?'中文':'English'}</label>${f.multiline?`<textarea id="${id}-${l}" class="${l}" data-field="${f.key}" data-lang="${l}" rows="${f.key==='introduction'?7:4}">${E(value[l])}</textarea>`:`<input id="${id}-${l}" data-field="${f.key}" data-lang="${l}" type="${f.type==='biurl'?'url':'text'}" value="${E(value[l])}">`}</div>`).join('')}</div></fieldset>`;}
if(f.type==='checkbox')return `<div class="field"><label class="checkbox-label" for="${id}"><input id="${id}" data-field="${f.key}" type="checkbox"${value?' checked':''}>${E(f.label)}</label></div>`;
let control=f.type==='select'?`<select id="${id}" data-field="${f.key}">${f.options.map(([v,t])=>`<option value="${v}"${v===value?' selected':''}>${E(t)}</option>`).join('')}</select>`:f.type==='textarea'?`<textarea id="${id}" data-field="${f.key}" rows="4">${E(value)}</textarea>`:`<input id="${id}" data-field="${f.key}" type="${['number','email','url'].includes(f.type)?f.type:'text'}" ${f.type==='number'?'min="1000" max="3000" step="1" ':''}value="${E(value)}">`;
return `<div class="field"><label class="field-label" for="${id}">${E(f.label)}</label>${control}</div>`;}
function drawForm(){const s=section(),r=record();$('content-form').innerHTML=r?s.fields.map(f=>fieldHTML(f,r)).join(''):'';$('empty-state').hidden=!!r;$('record-toolbar').hidden=s.single||!r;$('section-help').textContent=s.help||'中英文内容并排维护。某一语言留空时，网站使用另一语言的内容；不会自动翻译。正文使用纯文本，空行分段。';if(r&&!s.single){const i=data[sectionKey].findIndex(x=>x.id===r.id);$('record-position').textContent=`第 ${i+1} / ${data[sectionKey].length} 条`;$('up').disabled=i===0;$('down').disabled=i===data[sectionKey].length-1;}
if(sectionKey==='profile'){$('content-form').insertAdjacentHTML('beforeend',`<div class="photo-edit"><img id="photo-preview" src="${data.photo?`data:${data.photo.mime};base64,${data.photo.base64}`:'assets/portrait.jpg'}" alt="当前头像"><div><label for="photo-file">更换个人照片</label><input id="photo-file" type="file" accept="image/jpeg,image/png,image/webp"><p>支持 JPG、PNG、WebP，最大 4 MB。照片会随网站包导出。</p></div></div>`);$('photo-file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>4*1024*1024){message('请选择不超过 4 MB 的 JPG、PNG 或 WebP 图片。',true);return;}try{const url=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(f);});await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=url;});remember();data.photo={mime:f.type,base64:url.split(',')[1]};$('photo-preview').src=url;changed();}catch{message('图片无法读取，请换一张图片。',true);}});}}
function draw(){const s=section();if(!s.single&&!data[sectionKey].some(r=>r.id===selectedId))selectedId=data[sectionKey][0]?.id||null;drawNav();$('section-title').textContent=s.label;$('add').hidden=s.single;$('workspace').classList.toggle('single',!!s.single);drawList();drawForm();focusSnapshot=null;}
$('section-nav').addEventListener('click',e=>{const b=e.target.closest('[data-section]');if(!b)return;sectionKey=b.dataset.section;selectedId=null;query='';$('search').value='';draw();});
$('record-list').addEventListener('click',e=>{const b=e.target.closest('[data-record]');if(!b)return;selectedId=b.dataset.record;drawList();drawForm();focusSnapshot=null;});
$('search').addEventListener('input',e=>{query=e.target.value;drawList();});
$('content-form').addEventListener('submit',e=>e.preventDefault());
$('content-form').addEventListener('focusin',e=>{if(e.target.dataset.field)focusSnapshot=snapshot();});
$('content-form').addEventListener('input',e=>{const key=e.target.dataset.field;if(!key)return;if(focusSnapshot){remember(focusSnapshot);focusSnapshot=null;}const f=section().fields.find(f=>f.key===key),r=record();let v=e.target.type==='checkbox'?e.target.checked:e.target.value;if(f.type==='number'&&v!=='')v=Number(v);if(e.target.dataset.lang)r[key][e.target.dataset.lang]=v;else r[key]=v;drawList();changed();});
$('add').addEventListener('click',()=>{remember();const r=Schema.fresh(section());data[sectionKey].unshift(r);selectedId=r.id;query='';$('search').value='';draw();changed();$('content-form').querySelector('input,textarea,select')?.focus();});
function move(delta){const rows=data[sectionKey],i=rows.findIndex(r=>r.id===selectedId);if(i<0||i+delta<0||i+delta>=rows.length)return;remember();[rows[i],rows[i+delta]]=[rows[i+delta],rows[i]];draw();changed();}
$('up').addEventListener('click',()=>move(-1));$('down').addEventListener('click',()=>move(1));
$('duplicate').addEventListener('click',()=>{const r=record();if(!r)return;remember();const copy=structuredClone(r);copy.id=Schema.fresh(section()).id;const at=data[sectionKey].indexOf(r);data[sectionKey].splice(at+1,0,copy);selectedId=copy.id;draw();changed();});
$('remove').addEventListener('click',()=>{if(!record())return;remember();const at=data[sectionKey].findIndex(r=>r.id===selectedId);data[sectionKey].splice(at,1);selectedId=data[sectionKey][Math.min(at,data[sectionKey].length-1)]?.id||null;draw();changed();message('条目已移除，可点击顶部“撤销操作”恢复。');});
$('undo').addEventListener('click',()=>{const s=history.pop();if(!s)return;const previous=JSON.parse(s);data=previous.data;sectionKey=previous.sectionKey;selectedId=previous.selectedId;query='';$('search').value='';draw();$('undo').disabled=!history.length;changed();});
function reportErrors(errors){$('errors').hidden=!errors.length;$('errors').innerHTML=errors.length?'<strong>请先完善以下内容：</strong><ul>'+errors.slice(0,18).map(s=>'<li>'+E(s)+'</li>').join('')+'</ul>'+(errors.length>18?`<p>另有 ${errors.length-18} 项。</p>`:''):'';if(errors.length)$('errors').scrollIntoView({block:'center'});return errors.length>0;}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('export').addEventListener('click',()=>{if(reportErrors(Schema.validate(data)))return;try{data.updated=today();save();const bytes=Pack.zip(Pack.files(data,SiteBundle));download('qingxu-huang-bilingual-'+data.updated+'.zip',bytes,'application/zip');message('完整网站包已导出。解压后将包内文件上传到 GitHub 仓库根目录。');}catch(e){message('导出失败：'+e.message,true);}});
$('backup').addEventListener('click',()=>{download('qingxu-huang-content-'+today()+'.json',JSON.stringify(data,null,2),'application/json');message('资料备份已下载。备份只包含内容；发布网站请使用“导出网站 ZIP”。');});
$('import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error('备份文件大于 10 MB');const imported=JSON.parse(await file.text());if(reportErrors(Schema.validate(imported,'draft')))return;remember();data=structuredClone(imported);sectionKey='profile';selectedId=null;query='';$('search').value='';draw();changed();message('备份已导入。可预览后导出完整网站包。');}catch(err){message('无法导入：'+err.message,true);}finally{e.target.value='';}});
function preview(initialHash=''){
if(typeof initialHash!=='string')initialHash='';
if(reportErrors(Schema.validate(data)))return;
const lang=$('preview-language').value,page=$('preview-page').value;
const css=Pack.text(SiteBundle,'assets/style.css'),js=Pack.text(SiteBundle,'assets/site.js');
const photo=data.photo?`data:${data.photo.mime};base64,${data.photo.base64}`:'data:image/jpeg;base64,'+SiteBundle['assets/portrait.jpg'];
let html=Engine.render(data,lang,page,{css,siteJs:js,photoInline:photo});
const bridge=`<script>
var previewHash=${Engine.scriptJSON(initialHash)};
function scrollPreview(id){var target=document.getElementById(id);if(target)target.scrollIntoView({block:'start'});}
document.addEventListener('DOMContentLoaded',function(){if(previewHash)scrollPreview(previewHash);});
document.addEventListener('click',function(event){
var a=event.target.closest('a[href]');if(!a)return;
var href=a.getAttribute('href');
if(href.startsWith('#')){event.preventDefault();previewHash=href.slice(1);scrollPreview(previewHash);return;}
if(!/^(https?:|mailto:)/.test(href)){
event.preventDefault();
var path=href.split('#')[0],page=path.split('/').pop().replace('.html','');
var lang=a.dataset.language||'${lang}';
parent.postMessage({type:'qh-preview',page:page,lang:lang,hash:href.split('#')[1]||(a.dataset.language?previewHash:'')},'*');
}
});
</script>`;
html=html.replace('</body>',bridge+'</body>');
$('preview-frame').srcdoc=html;
if(!$('preview-dialog').open)$('preview-dialog').showModal();
}
$('preview').addEventListener('click',preview);$('preview-language').addEventListener('change',preview);$('preview-page').addEventListener('change',preview);$('close-preview').addEventListener('click',()=>$('preview-dialog').close());
window.addEventListener('message',event=>{if(event.source!==$('preview-frame').contentWindow||event.data?.type!=='qh-preview'||!Engine.pages.includes(event.data.page)||!['en','zh'].includes(event.data.lang))return;$('preview-language').value=event.data.lang;$('preview-page').value=event.data.page;preview(typeof event.data.hash==='string'?event.data.hash:'');});
function pendingUI(on){$('restore-banner').hidden=!on;document.querySelector('.editor-shell').inert=on;for(const id of ['export','preview'])$(id).disabled=on;}
$('restore').addEventListener('click',()=>{remember();data=structuredClone(pendingDraft.data);pendingDraft=null;pendingUI(false);draw();message('本机草稿已恢复。');});
$('ignore-draft').addEventListener('click',()=>{pendingDraft=null;pendingUI(false);message('已使用当前网站包内的资料，下一次修改会替换本机草稿。');});
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved?.data&&Schema.validate(saved.data,'draft').length===0&&JSON.stringify(saved.data)!==JSON.stringify(data)){pendingDraft=saved;$('restore-text').textContent='发现本机草稿（'+new Date(saved.at).toLocaleString('zh-CN')+'），请选择要继续编辑的版本。';pendingUI(true);}}catch{}
window.addEventListener('pagehide',()=>{if(saveTimer&&!pendingDraft)save();});
draw();
})();
