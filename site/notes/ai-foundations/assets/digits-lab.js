(() => {
'use strict';
function forward(pixels, model) {
  if (!Array.isArray(pixels) || pixels.length !== 64 || pixels.some(x=>!Number.isFinite(x)||x<0||x>16)) throw new Error('需要 64 个范围为 0–16 的有限像素值。');
  const input = pixels.map(x=>x/16), z=[], activation=[], pooled=[], flat=[];
  for(let k=0;k<8;k++){
    z[k]=Array.from({length:6},()=>Array(6).fill(0));
    activation[k]=Array.from({length:6},()=>Array(6).fill(0));
    for(let r=0;r<6;r++) for(let c=0;c<6;c++){
      let sum=model.cb[k];
      for(let dy=0;dy<3;dy++) for(let dx=0;dx<3;dx++) sum+=input[(r+dy)*8+c+dx]*model.cw[k][dy][dx];
      z[k][r][c]=sum;activation[k][r][c]=Math.max(0,sum);
    }
    pooled[k]=Array.from({length:3},()=>Array(3).fill(0));
    for(let r=0;r<3;r++) for(let c=0;c<3;c++){
      pooled[k][r][c]=(activation[k][2*r][2*c]+activation[k][2*r][2*c+1]+activation[k][2*r+1][2*c]+activation[k][2*r+1][2*c+1])/4;
      flat.push(pooled[k][r][c]);
    }
  }
  const logits=model.fb.slice();
  for(let j=0;j<10;j++) for(let i=0;i<72;i++) logits[j]+=flat[i]*model.fw[i][j];
  const max=Math.max(...logits),exp=logits.map(x=>Math.exp(x-max)),sum=exp.reduce((a,b)=>a+b,0),probabilities=exp.map(x=>x/sum);
  return {z,activation,pooled,flat,logits,probabilities,prediction:probabilities.indexOf(Math.max(...probabilities))};
}
window.DigitCNNForward = forward;
window.CourseLabs=window.CourseLabs||{};
window.CourseLabs['digit-cnn']=root=>{
 const model=window.DigitModel,live=root.querySelector('[data-live]');
 if(!model){live.textContent='模型参数未加载。上方静态正文和打印说明仍可阅读。';return;}
 const fmt=(n,d=4)=>Number(n).toFixed(d),table=(caption,heads,rows)=>'<div class="table-wrap"><table><caption>'+caption+'</caption><thead><tr>'+heads.map(t=>'<th scope="col">'+t+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((x,i)=>(i?'<td>':'<th scope="row">')+x+(i?'</td>':'</th>')).join('')+'</tr>').join('')+'</tbody></table></div>';
 const example=root.querySelector('[data-example]'),brush=root.querySelector('[data-brush]'),channel=root.querySelector('[data-channel]'),grid=root.querySelector('[data-pixels]'),metric=root.querySelector('[data-metric]');
 let pixels=model.examples[0].pixels.slice(),edited=false,pointer=null,lastPaint=-1;
 example.innerHTML=model.examples.map((e,i)=>{const pred=e.probabilities.indexOf(Math.max(...e.probabilities));return '<option value="'+i+'">标签 '+e.label+' · 样本 '+e.id+(pred!==e.label?' · 真实误判为 '+pred:'')+'</option>';}).join('');
 for(let i=0;i<64;i++){const b=document.createElement('button');b.type='button';b.dataset.pixel=String(i);b.style.cssText='padding:0;min-height:0;min-width:0;width:100%;aspect-ratio:1;border:1px solid var(--line);border-radius:5px;font-size:11px;font-variant-numeric:tabular-nums;line-height:1;touch-action:none';b.tabIndex=i===0?0:-1;grid.appendChild(b);}
 const cells=[...grid.querySelectorAll('[data-pixel]')];
 function activationMap(A){const k=+channel.value,max=Math.max(...A.flat(),.000001),S=48,L=34,T=26;let svg='<svg class="plot" viewBox="0 0 338 338" role="img" aria-label="通道 '+(k+1)+' 的 6×6 ReLU 激活，格内为实际数值" style="width:100%;max-width:420px;height:auto">';for(let i=0;i<6;i++){svg+='<text x="'+(L+i*S+S/2)+'" y="18" text-anchor="middle" fill="currentColor" font-size="12">列'+(i+1)+'</text><text x="28" y="'+(T+i*S+S/2+4)+'" text-anchor="end" fill="currentColor" font-size="12">'+(i+1)+'</text>';for(let j=0;j<6;j++){const ratio=A[i][j]/max;svg+='<rect x="'+(L+j*S)+'" y="'+(T+i*S)+'" width="46" height="46" rx="5" fill="#6557b8" fill-opacity="'+(.10+.78*ratio)+'"/><text x="'+(L+j*S+S/2-1)+'" y="'+(T+i*S+S/2+4)+'" text-anchor="middle" fill="'+(ratio>.6?'white':'currentColor')+'" font-size="11">'+fmt(A[i][j],2)+'</text>';}}
 return '<h4>通道 '+(k+1)+'：ReLU 后的激活</h4><p>行从上向下、列从左向右。颜色按当前图最大值 '+fmt(max)+' 缩放；跨图比较请看数值。</p>'+svg+'<text x="182" y="331" text-anchor="middle" fill="currentColor" font-size="12">卷积输出位置（行 × 列）</text></svg>';}
 function render(){const e=model.examples[+example.value],result=forward(pixels,model),k=+channel.value;cells.forEach((b,i)=>{const n=pixels[i],shade=Math.round(n/16*255);b.textContent=String(n);b.style.backgroundColor='rgb('+shade+','+shade+','+shade+')';b.style.color=n>=8?'#111':'#fff';b.setAttribute('aria-label','第 '+(Math.floor(i/8)+1)+' 行第 '+(i%8+1)+' 列，强度 '+n+' / 16；激活写入笔刷值');});root.querySelector('[data-brush-label]').textContent='当前笔刷：'+brush.value+' / 16；改变笔刷不会自动改图。';root.querySelector('[data-input-description]').innerHTML='<p>'+ (edited?'<strong>自定义图像</strong>：已修改所选样本；原标签 '+e.label+' 仅供参考，修改后没有可靠标注。':'<strong>测试样本 '+e.id+'</strong>：原始真实标签 '+e.label+'；未修改。')+'</p>';
 const comparison=edited?'输入已修改，以下是新前向结果；不与原始记录逐项相等比较。':'与导出测试概率的最大绝对差 '+Math.max(...result.probabilities.map((p,i)=>Math.abs(p-e.probabilities[i]))).toExponential(2)+'。';live.innerHTML='<p class="readout">最高概率类别：'+result.prediction+' · '+fmt(result.probabilities[result.prediction]*100,2)+'%</p><p>'+(edited?'没有自定义图像的真实标签，不显示准确率。':result.prediction===e.label?'本张预测与标签相同。':'真实误判：标签为 '+e.label+'，预测为 '+result.prediction+'。')+' 概率集中不等于结果有保证。</p>'+table('十类候选概率；比例尺 0–100%',['数字','概率','概率条'],result.probabilities.map((p,j)=>[j,fmt(p*100,2)+'%','<div style="width:100%;min-width:65px;height:10px;border-radius:4px;background:var(--soft)"><div style="height:100%;width:'+p*100+'%;background:var(--accent);border-radius:4px"></div></div>']))+'<p class="small">'+comparison+'</p>';root.querySelector('[data-activation]').innerHTML=activationMap(result.activation[k]);root.querySelector('[data-kernel]').innerHTML=table('通道 '+(k+1)+' 的 3×3 卷积核',['行 / 列','1','2','3'],model.cw[k].map((r,i)=>[i+1,...r.map(x=>fmt(x))]))+'<p>该通道偏置 '+fmt(model.cb[k])+'。每个位置是九项输入×权重相加，再加偏置。</p>'+table('通道 '+(k+1)+' 的 3×3 平均池化结果',['行 / 列','1','2','3'],result.pooled[k].map((r,i)=>[i+1,...r.map(x=>fmt(x))]));}
 function paint(i){if(i<0||i>=64||i===lastPaint)return;lastPaint=i;pixels[i]=+brush.value;edited=true;render();}
 grid.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;const b=ev.target.closest('[data-pixel]');if(!b)return;ev.preventDefault();pointer=ev.pointerId;lastPaint=-1;grid.setPointerCapture(pointer);cells.forEach(c=>c.tabIndex=c===b?0:-1);b.focus();paint(+b.dataset.pixel);});
 grid.addEventListener('pointermove',ev=>{if(pointer!==ev.pointerId)return;const bounds=grid.getBoundingClientRect(),x=ev.clientX-bounds.left,y=ev.clientY-bounds.top;if(x<0||x>=bounds.width||y<0||y>=bounds.height){lastPaint=-1;return;}paint(Math.floor(y/bounds.height*8)*8+Math.floor(x/bounds.width*8));});
 const end=()=>{pointer=null;lastPaint=-1;};grid.addEventListener('pointerup',end);grid.addEventListener('pointercancel',end);
 grid.addEventListener('click',ev=>{if(ev.detail!==0)return;const b=ev.target.closest('[data-pixel]');if(b){lastPaint=-1;paint(+b.dataset.pixel);lastPaint=-1;}});
 grid.addEventListener('keydown',ev=>{const b=ev.target.closest('[data-pixel]');if(!b)return;const i=+b.dataset.pixel,delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8}[ev.key];if(delta!==undefined){ev.preventDefault();let target=Math.max(0,Math.min(63,i+delta));if(ev.key==='ArrowLeft'&&i%8===0||ev.key==='ArrowRight'&&i%8===7)target=i;cells.forEach(c=>c.tabIndex=+c.dataset.pixel===target?0:-1);cells[target].focus();}});
 function loadExample(){pixels=model.examples[+example.value].pixels.slice();edited=false;render();}
 example.addEventListener('change',loadExample);brush.addEventListener('input',render);channel.addEventListener('change',render);
 root.querySelector('[data-action="clear"]').onclick=()=>{pixels=Array(64).fill(0);edited=true;render();};root.querySelector('[data-action="restore"]').onclick=loadExample;
 function history(){const field=metric.value,accuracy=field==='accuracy',label=accuracy?'分类准确率 (%)':'交叉熵损失',series=[{key:'train',name:'训练',color:'#0066cc'},{key:'validation',name:'验证',color:'#9357c7'}],maxY=accuracy?100:Math.ceil(Math.max(...model.history.flatMap(h=>[h.train.loss,h.validation.loss]))*2)/2,W=610,H=265,L=54,R=20,T=26,B=43,pw=W-L-R,ph=H-T-B,maxEpoch=model.history[model.history.length-1].epoch;let svg='<svg class="plot" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="真实训练与验证 '+label+' 曲线" style="width:100%;height:auto"><text x="'+L+'" y="16" fill="currentColor" font-size="12">'+label+'</text>';for(let i=0;i<=4;i++){const value=maxY*i/4,y=T+ph*(1-i/4);svg+='<line x1="'+L+'" y1="'+y+'" x2="'+(W-R)+'" y2="'+y+'" stroke="currentColor" opacity=".16"/><text x="'+(L-6)+'" y="'+(y+4)+'" text-anchor="end" fill="currentColor" font-size="11">'+fmt(value,accuracy?0:2)+'</text>';}[0,15,30,45,60].forEach(e=>{svg+='<text x="'+(L+e/maxEpoch*pw)+'" y="'+(H-23)+'" text-anchor="middle" fill="currentColor" font-size="11">'+e+'</text>';});series.forEach((s,k)=>{const points=model.history.map(h=>[L+h.epoch/maxEpoch*pw,T+ph*(1-h[s.key][field]*(accuracy?100:1)/maxY)]);svg+='<polyline points="'+points.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="'+s.color+'" stroke-width="2.5"'+(k?' stroke-dasharray="7 4"':'')+'/>';});svg+='<text x="'+(W/2)+'" y="'+(H-5)+'" text-anchor="middle" fill="currentColor" font-size="12">epoch · 训练集完整遍历轮数</text></svg>';const last=model.history[model.metadata.bestEpoch];root.querySelector('[data-history]').innerHTML=svg+'<p class="small">蓝色实线：训练集；紫色虚线：验证集。第 '+model.metadata.bestEpoch+' 轮：训练 '+fmt(last.train[field]*(accuracy?100:1))+(accuracy?'%':'')+'，验证 '+fmt(last.validation[field]*(accuracy?100:1))+(accuracy?'%':'')+'。</p>';root.querySelector('[data-history-table]').innerHTML=table('真实完整训练记录',['epoch','训练损失','验证损失','训练准确率','验证准确率'],model.history.map(h=>[h.epoch,fmt(h.train.loss),fmt(h.validation.loss),fmt(100*h.train.accuracy,2)+'%',fmt(100*h.validation.accuracy,2)+'%']));}
 metric.onchange=history;root.querySelector('[data-action="reset"]').onclick=()=>{example.value='0';brush.value='16';channel.value='0';metric.value='loss';pointer=null;lastPaint=-1;loadExample();history();};
 const meta=model.metadata;root.querySelector('[data-record]').innerHTML='<div class="stats"><div class="stat">参数 <strong>'+meta.parameters+'</strong></div><div class="stat">训练 / 验证 / 测试 <strong>'+meta.split.train+' / '+meta.split.validation+' / '+meta.split.test+'</strong></div><div class="stat">最终测试 <strong>'+Math.round(meta.test.accuracy*meta.split.test)+' / '+meta.split.test+' 正确</strong></div></div><p>随机种子 '+meta.seed+'；batch='+meta.batch+'；学习率 '+meta.learningRate+'；动量 '+meta.momentum+'；按验证损失选第 '+meta.bestEpoch+' 轮。测试准确率 '+fmt(meta.test.accuracy*100,2)+'%，测试损失 '+fmt(meta.test.loss)+'。数据文件 SHA-256：<code>'+meta.sha256+'</code>。</p>';
 render();history();
};
})();
