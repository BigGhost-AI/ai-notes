(function(){
  'use strict';
  const labs=window.CourseLabs=window.CourseLabs||{};
  const f=(x,n=4)=>Number(x.toFixed(n)).toString();
  const table=(heads,rows)=>'<div class="table-wrap"><table><thead><tr>'+heads.map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  labs['token-embedding']=function(root){
    const $=s=>root.querySelector(s),words=['温度','偏高','正常','检查'],vectors=[[1,0],[.8,.6],[.2,.9],[0,1]];
    function render(){
      const reverse=$('[data-order]').value==='reverse',id=i=>reverse?3-i:i;
      const order=reverse?[3,2,1,0]:[0,1,2,3];
      $('[data-vocab]').innerHTML=table(['当前 ID','词表项','手设嵌入 E 的对应行'],order.map(i=>[id(i),words[i],'['+vectors[i].join(', ')+']']));
      const source=Array.from($('[data-text]').value).slice(0,80).join('');const tokens=[];let offset=0;
      while(offset<source.length){const cp=String.fromCodePoint(source.codePointAt(offset));if(/\s/u.test(cp)){offset+=cp.length;continue;}
        let match=-1;words.forEach((w,i)=>{if(source.startsWith(w,offset)&&(match<0||w.length>words[match].length))match=i;});
        if(match>=0){tokens.push({text:words[match],index:match});offset+=words[match].length;}else{tokens.push({text:cp,index:-1});offset+=cp.length;}
      }
      const container=$('[data-tokens]');container.replaceChildren();
      tokens.forEach((token,i)=>{const div=document.createElement('p');div.className='token';div.textContent='位置 '+(i+1)+' · “'+token.text+'” → '+(token.index<0?'词表外：无 ID、无向量':'ID '+id(token.index)+' → ['+vectors[token.index].join(', ')+']');container.appendChild(div);});
      const known=tokens.filter(t=>t.index>=0).length,unknown=tokens.length-known;
      $('[data-output]').textContent=tokens.length===0?'尚无处理单位。输入教学词表中的词开始查表。':'共 '+tokens.length+' 个教学处理单位；已知 '+known+'、词表外 '+unknown+'。嵌入表始终为 4×2，共 8 个手设参数。'+(unknown?'存在未知项，不能拼出完整的嵌入序列；不会静默删除未知内容。':'完整 ID 序列 ['+tokens.map(t=>id(t.index)).join(', ')+']；嵌入激活形状 '+known+'×2。');
      const dims=Number($('[data-dim]').value),ab=dims===3?2:0;
      $('[data-distance]').textContent='人工向量 A=[1,0,0]，B=[1,0,2]，C=[0.9,0.1,0]。当前使用 '+dims+' 维：A–B 欧氏距离 '+ab+'；A–C 距离 '+f(Math.sqrt(.02))+ '。'+(dims===2?'A 与 B 在投影中重合，但完整向量不同。':'B 在第三维与 A 不同；丢掉该维会隐藏差别。');
    }
    root.addEventListener('input',render);root.addEventListener('change',render);$('[data-action="reset"]').addEventListener('click',()=>{$('[data-text]').value='温度 正常';$('[data-order]').value='normal';$('[data-dim]').value='3';render();});render();
  };
  labs['rnn-state']=function(root){
    const $=s=>root.querySelector(s);let step=0;
    function calculate(){const len=Number($('[data-length]').value),kind=$('[data-sequence]').value,wh=Number($('[data-wh]').value),xs=Array(len).fill(0);xs[kind==='last'?len-1:0]=kind==='negative'?-1:1;const states=[0],zs=[],derivs=[];for(const x of xs){const z=x+wh*states[states.length-1],h=Math.tanh(z);zs.push(z);states.push(h);derivs.push(wh*(1-h*h));}return{len,wh,xs,states,zs,derivs};}
    function render(){const {len,wh,xs,states,zs,derivs}=calculate();step=Math.max(0,Math.min(step,len));const product=derivs.slice(0,step).reduce((a,b)=>a*b,1);
      $('[data-output]').innerHTML='<p>输入 ['+xs.join(', ')+']；当前前向 <strong>'+step+' / '+len+' 步</strong>，h<sub>'+step+'</sub>=<strong>'+f(states[step],6)+'</strong>。</p><p>共享参数：Wₓ=1，Wₕ='+f(wh)+'，b=0，始终 <strong>3 个</strong>。当前状态对初始状态的局部导数 ∂h<sub>'+step+'</sub>/∂h₀='+f(product,8)+'（沿已计算路径连乘；h₀ 对自身为 1）。</p>';
      const rows=[['0','—','初始状态','0','—']];for(let i=0;i<step;i++)rows.push([i+1,xs[i],f(xs[i])+' + '+f(wh)+' × '+f(states[i])+' = '+f(zs[i]),f(states[i+1],6),f(derivs[i],6)]);
      if(step<len)rows.push([step+1,xs[step],'等待“前向一步”','未展开','未展开']);
      $('[data-table]').innerHTML=table(['时间步','输入 x','加权和','状态 h=tanh(加权和)','对旧状态的局部导数'],rows);
      $('[data-action="step"]').disabled=step===len;$('[data-action="back"]').disabled=step===0;$('[data-action="all"]').disabled=step===len;
    }
    root.addEventListener('change',()=>{step=0;render();});$('[data-wh]').addEventListener('input',()=>{step=0;render();});root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!root.contains(b))return;const a=b.dataset.action;if(a==='step')step++;if(a==='back')step--;if(a==='all')step=Number($('[data-length]').value);if(a==='reset'){step=0;$('[data-sequence]').value='first';$('[data-length]').value='3';$('[data-wh]').value='.5';}render();});render();
  };
  labs['gated-state']=function(root){
    const $=s=>root.querySelector(s),num=s=>Number($(s).value);
    function render(){const c=num('[data-c]'),fg=num('[data-f]'),ig=num('[data-i]'),g=num('[data-g]'),o=num('[data-o]'),keep=fg*c,write=ig*g,next=keep+write,h=o*Math.tanh(next),n=num('[data-steps]'),z=num('[data-z]'),r=num('[data-gradient]');
      $('[data-output]').innerHTML='<p>旧 c='+f(c)+'；f='+f(fg)+'；i='+f(ig)+'；候选='+f(g)+'；o='+f(o)+'。</p>'+table(['操作','具体计算','数值'],[['保留',f(fg)+' × '+f(c),f(keep)],['写入',f(ig)+' × '+f(g),f(write)],['新 c','保留 + 写入',f(next)],['输出 h',f(o)+' × tanh('+f(next)+')',f(h,6)]])+(o===0?'<p><strong>输出门为 0：</strong>h=0，但 c='+f(next)+'，内部状态没有因关闭读出而清空。</p>':'');
      $('[data-retention]').textContent='独立保留对照：初始 c=1、每步 i=0、f='+f(fg)+'，经过 '+n+' 个占位步骤后 c='+f(fg**n,6)+'。'+(fg===1?'理想设定完整保留，不是训练后无限记忆的证明。':'每次仅保留一部分，连续多步会累积泄漏。');
      $('[data-gru]').textContent='GRU 独立例：旧 h=0.8，候选=−0.2，z='+f(z)+'；(1−z)×0.8+z×(−0.2)='+f((1-z)*.8-z*.2)+'。本课记号中 z 越大，越采用候选。';
      $('[data-gradient-output]').textContent='理想反向路径：每步局部导数 '+r+'，共 '+n+' 步，乘积 '+r+'^'+n+'='+f(r**n,8)+'。这是导数的连乘，和上面的前向保留例是两个不同计算。';
    }
    root.addEventListener('input',render);root.addEventListener('change',render);root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!root.contains(b))return;const a=b.dataset.action;if(a==='keep')$('[data-f]').value='1';if(a==='leak')$('[data-f]').value='.8';if(a==='reset'){[['c','.8'],['f','.9'],['i','.2'],['g','.5'],['o','.5'],['z','.25'],['steps','10'],['gradient','.5']].forEach(([k,v])=>$('[data-'+k+']').value=v);}render();});render();
  };
  labs['seq-attention']=function(root){
    const $=s=>root.querySelector(s),sets=[[0,Math.log(2),Math.log(3)],[Math.log(3),0,Math.log(2)],[Math.log(2),Math.log(3),0]];
    function render(){const mode=$('[data-mode]').value,scoreMode=mode==='scores',v2=Number($('[data-v2]').value),vectors=[[1,0],[0,v2],[1,1]],row=Number($('[data-target]').value);let weights,scores,rawShares;
      $('[data-score-controls]').hidden=!scoreMode;[0,1,2].forEach(i=>$('[data-a'+i+']').disabled=scoreMode);
      if(scoreMode){scores=sets[row].slice();scores[0]+=Number($('[data-offset]').value);const max=Math.max(...scores),ex=scores.map(x=>Math.exp(x-max)),sum=ex.reduce((a,b)=>a+b,0);weights=ex.map(x=>x/sum);}else{const raw=[0,1,2].map(i=>Number($('[data-a'+i+']').value)),sum=raw.reduce((a,b)=>a+b,0);rawShares=raw;if(sum===0){$('[data-output]').textContent='三项份额均为 0，无法归一化。请至少提高一项，或重置。';$('[data-bars]').replaceChildren();$('[data-table]').replaceChildren();return;}weights=raw.map(x=>x/sum);}
      const parts=vectors.map((v,i)=>v.map(x=>x*weights[i])),result=[0,1].map(d=>parts.reduce((s,v)=>s+v[d],0));
      $('[data-output]').innerHTML='<p>'+(scoreMode?'目标位置 '+(row+1)+' 的教学分数 ['+scores.map(x=>f(x)).join(', ')+']，经 softmax 得到':'直接份额 ['+rawShares.join(', ')+'] 归一化得到')+'权重 <strong>['+weights.map(x=>f(x)).join(', ')+']</strong>，和为 '+f(weights.reduce((a,b)=>a+b,0))+'。</p><p>上下文 c=<strong>['+result.map(x=>f(x,6)).join(', ')+']</strong>。'+(v2===4?'第二个源向量现在为 [0,4]；同一权重图也会得到不同结果。':'源向量为 [1,0]、[0,2]、[1,1]。')+'</p>';
      $('[data-table]').innerHTML=table(['源位置','源向量','读取权重','逐维贡献'],vectors.map((v,i)=>[i+1,'['+v.join(', ')+']',f(weights[i],6),'['+parts[i].map(x=>f(x,6)).join(', ')+']']));
      let bars='';weights.forEach((w,i)=>{const y=24+i*44;bars+='<text x="5" y="'+(y+17)+'" fill="currentColor" font-size="13">源 '+(i+1)+'</text><rect x="55" y="'+y+'" width="'+(220*w)+'" height="25" rx="5" fill="'+['#4c76ce','#8b63ce','#368990'][i]+'"/><text x="285" y="'+(y+17)+'" fill="currentColor" font-size="12">'+f(w*100,1)+'%</text>';});
      bars+='<path d="M55 160H275M55 156V164M165 156V164M275 156V164" fill="none" stroke="currentColor"/><text x="55" y="181" fill="currentColor" font-size="12">0%</text><text x="154" y="181" fill="currentColor" font-size="12">50%</text><text x="250" y="181" fill="currentColor" font-size="12">100%</text>';
      $('[data-bars]').innerHTML='<svg viewBox="0 0 340 190" width="100%" height="auto" role="img" aria-label="当前三个源位置的读取比例，数值见旁边表格；横轴从零到百分之百">'+bars+'</svg>';
    }
    root.addEventListener('input',render);root.addEventListener('change',e=>{if(e.target.matches('[data-target]'))$('[data-offset]').value='0';render();});root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!root.contains(b))return;const a=b.dataset.action;if(a==='first'){$('[data-mode]').value='weights';[100,0,0].forEach((v,i)=>$('[data-a'+i+']').value=String(v));}if(a==='reset'){$('[data-mode]').value='weights';[20,50,30].forEach((v,i)=>$('[data-a'+i+']').value=String(v));$('[data-v2]').value='2';$('[data-target]').value='0';$('[data-offset]').value='0';}render();});render();
  };
})();
(function(){
  'use strict';
  const labs=window.CourseLabs=window.CourseLabs||{},f=(x,n=4)=>Number(x.toFixed(n)).toString();
  const table=(heads,rows)=>'<div class="table-wrap"><table><thead><tr>'+heads.map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  labs['tree-baseline']=function(root){const $=s=>root.querySelector(s),data=[[1,1,0],[1,2,0],[2,1,0],[2,3,0],[3,2,1],[3,3,1],[4,2,1],[4,4,1]];
    function render(){const axis=Number($('[data-axis]').value),threshold=Number($('[data-threshold]').value),groups=[data.filter(p=>p[axis]<=threshold),data.filter(p=>p[axis]>threshold)];const info=groups.map(g=>{const n1=g.reduce((s,p)=>s+p[2],0),n0=g.length-n1,pred=n1>n0?1:0,gini=g.length?1-(n1/g.length)**2-(n0/g.length)**2:0;return{n1,n0,pred,gini,n:g.length};});const weighted=info.reduce((s,g)=>s+g.n/8*g.gini,0),errors=data.reduce((s,p)=>s+(p[2]!==info[p[axis]<=threshold?0:1].pred?1:0),0);
      $('[data-output]').innerHTML='<p>条件：<strong>'+['x','y'][axis]+' ≤ '+threshold+'</strong>。加权 Gini <strong>'+f(weighted,6)+'</strong>；这 8 条展示样本的错误数 <strong>'+errors+'/8</strong>。</p>'+table(['分支','标签 0 / 1 数量','叶子预测','Gini'],info.map((g,i)=>[i===0?'条件成立':'条件不成立',g.n0+' / '+g.n1,g.n?g.pred:'空叶（默认 0）',f(g.gini)]))+'<p>叶子按当前组标签多数预测，平票或空叶固定为 0。没有独立测试集，不能据此报告泛化能力。</p>';
      $('[data-table]').innerHTML=table(['样本','x','y','人工标签','进入分支','当前预测'],data.map((p,i)=>[i+1,...p,p[axis]<=threshold?'成立':'不成立',info[p[axis]<=threshold?0:1].pred]));
    }
    root.addEventListener('input',render);root.addEventListener('change',render);$('[data-action="reset"]').addEventListener('click',()=>{$('[data-axis]').value='0';$('[data-threshold]').value='2.5';render();});render();
  };
  labs.kmeans=function(root){const $=s=>root.querySelector(s),points=[[1,1],[1,2],[2,1],[5,5],[5,6],[6,5]];let centers,groups,round=0,stable=false,history=[];
    const distance=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
    const assign=()=>points.map(p=>distance(p,centers[0])<=distance(p,centers[1])?0:1);
    const cost=()=>points.reduce((s,p,i)=>s+distance(p,centers[groups[i]]),0);
    function render(){const sse=cost();$('[data-output]').innerHTML='<p>已执行 <strong>'+round+' 轮</strong>；A 中心 ['+centers[0].map(x=>f(x)).join(', ')+']，B 中心 ['+centers[1].map(x=>f(x)).join(', ')+']。</p><p>当前分配下的平方距离和 <strong>'+f(sse,6)+'</strong>。'+(stable?'本例分配与中心已稳定；收敛不等于所有问题的全局最优。':'每轮先按旧中心重新分组，再对该分组更新均值。')+'</p><p>记录（初始及每轮更新后）：'+history.map(x=>f(x,4)).join(' → ')+'</p>';
      let svg='<path d="M35 20V265H290" fill="none" stroke="currentColor"/><text x="280" y="288" fill="currentColor" font-size="12">x</text><text x="12" y="20" fill="currentColor" font-size="12">y</text>';
      for(let i=0;i<=7;i++){svg+='<text x="'+(31+i*35)+'" y="282" fill="currentColor" font-size="10">'+i+'</text><text x="18" y="'+(269-i*35)+'" fill="currentColor" font-size="10">'+i+'</text>';}
      points.forEach((p,i)=>{const cx=35+p[0]*35,cy=265-p[1]*35,g=groups[i];svg+='<circle cx="'+cx+'" cy="'+cy+'" r="6" fill="'+(g===0?'#3976ce':'#9261c5')+'"/><text x="'+(cx+9)+'" y="'+(cy-5)+'" fill="currentColor" font-size="11">'+(i+1)+(g===0?'A':'B')+'</text>';});centers.forEach((p,i)=>{const cx=35+p[0]*35,cy=265-p[1]*35;svg+='<path d="M'+(cx-8)+' '+cy+'H'+(cx+8)+'M'+cx+' '+(cy-8)+'V'+(cy+8)+'" stroke="currentColor" stroke-width="3"/><text x="'+(cx+9)+'" y="'+(cy+15)+'" fill="currentColor" font-size="11">中心 '+(i===0?'A':'B')+'</text>';});
      $('[data-plot]').innerHTML='<svg viewBox="0 0 330 300" width="100%" height="auto" role="img" aria-label="二维点与 k-means 分组，十字表示中心，横轴 x、纵轴 y，坐标与组别见表">'+svg+'</svg>';
      $('[data-table]').innerHTML=table(['点','坐标','当前组','至该中心平方距离'],points.map((p,i)=>[i+1,'['+p.join(', ')+']',groups[i]===0?'A':'B',f(distance(p,centers[groups[i]]),6)]));$('[data-action="step"]').disabled=stable||round>=20;
    }
    function reset(){centers=$('[data-seed]').value==='far'?[[1,1],[6,5]]:[[1,1],[2,1]];groups=assign();round=0;stable=false;history=[cost()];render();}
    $('[data-seed]').addEventListener('change',reset);$('[data-action="step"]').addEventListener('click',()=>{const nextGroups=assign(),next=centers.map((c,g)=>{const pts=points.filter((p,i)=>nextGroups[i]===g);return pts.length?[0,1].map(d=>pts.reduce((s,p)=>s+p[d],0)/pts.length):c.slice();});stable=nextGroups.every((g,i)=>g===groups[i])&&next.every((c,i)=>distance(c,centers[i])<1e-16);groups=nextGroups;centers=next;round++;history.push(cost());render();});$('[data-action="reset"]').addEventListener('click',()=>{$('[data-seed]').value='near';reset();});reset();
  };
  labs.pca=function(root){const $=s=>root.querySelector(s),points=[[-2,-1],[-1,-2],[1,2],[2,1]];
    function render(){const angle=Number($('[data-angle]').value),theta=angle*Math.PI/180,u=[Math.cos(theta),Math.sin(theta)],ts=points.map(p=>p[0]*u[0]+p[1]*u[1]),recon=ts.map(t=>u.map(x=>t*x)),variance=ts.reduce((s,t)=>s+t*t,0)/4,error=points.reduce((s,p,i)=>s+(p[0]-recon[i][0])**2+(p[1]-recon[i][1])**2,0)/4;
      $('[data-output]').innerHTML='<p>方向 <strong>'+angle+'°</strong>，单位向量 ['+u.map(x=>f(x)).join(', ')+']。</p><p>总方差 5；投影保留 <strong>'+f(variance)+'</strong>（'+f(variance/5*100,2)+'%）；平均重建平方误差 <strong>'+f(error)+'</strong>。保留方差 + 重建误差 = 5。</p>';
      const xy=p=>[165+40*p[0],155-40*p[1]];let svg='<path d="M35 155H295M165 25V285" fill="none" stroke="currentColor" opacity=".4"/><text x="296" y="150" fill="currentColor" font-size="12">x</text><text x="171" y="20" fill="currentColor" font-size="12">y</text>';
      for(const i of [-3,-2,-1,0,1,2,3]){const p=xy([i,0]),q=xy([0,i]);svg+='<text x="'+(p[0]-4)+'" y="173" fill="currentColor" font-size="10">'+i+'</text>'+(i===0?'':'<text x="143" y="'+(q[1]+4)+'" fill="currentColor" font-size="10">'+i+'</text>');}
      const start=xy(u.map(x=>-3*x)),end=xy(u.map(x=>3*x));svg+='<path d="M'+start.join(' ')+'L'+end.join(' ')+'" stroke="#8b63c7" stroke-width="2"/>';
      points.forEach((p,i)=>{const a=xy(p),b=xy(recon[i]);svg+='<path d="M'+a.join(' ')+'L'+b.join(' ')+'" stroke="#65748a" stroke-dasharray="4 3"/><circle cx="'+a[0]+'" cy="'+a[1]+'" r="5" fill="#3b78c9"/><rect x="'+(b[0]-4)+'" y="'+(b[1]-4)+'" width="8" height="8" fill="#9568c8"/><text x="'+(a[0]+8)+'" y="'+(a[1]-8)+'" fill="currentColor" font-size="12">点 '+(i+1)+'</text>';});
      $('[data-plot]').innerHTML='<svg viewBox="0 0 330 310" width="100%" height="auto" role="img" aria-label="二维原始点为圆，投影重建点为方块，虚线表示丢失的正交分量，坐标见表">'+svg+'</svg><p class="small">圆点：原始数据；方块：投影后的重建；虚线：被舍弃的正交分量。横纵轴为相同单位。</p>';
      $('[data-table]').innerHTML=table(['原始点','投影坐标 t','二维重建'],points.map((p,i)=>['['+p.join(', ')+']',f(ts[i]),'['+recon[i].map(x=>f(x)).join(', ')+']']));
    }
    $('[data-angle]').addEventListener('input',render);['best','reset'].forEach(a=>$('[data-action="'+a+'"]').addEventListener('click',()=>{$('[data-angle]').value='45';render();}));render();
  };
})();
