(function () {
  'use strict';
  window.CourseLabs = window.CourseLabs || {};
  const f=(n,d=4)=>Math.abs(n)>=10000?Number(n).toExponential(3):Number(n).toFixed(d).replace(/^-0\.0+$/,s=>s.slice(1));
  const sig=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
  const tx=(x,y,s,size=12,anchor='start')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="currentColor" text-anchor="'+anchor+'">'+s+'</text>';
  const ln=(x1,y1,x2,y2,extra='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="currentColor" '+extra+'/>';
  const svg=(body,title,h=300)=>'<svg viewBox="0 0 480 '+h+'" width="100%" height="auto" role="img" aria-label="'+title+'" style="display:block;color:inherit">'+body+'</svg>';
  const table=(heads,rows)=>'<table><thead><tr>'+heads.map(v=>'<th>'+v+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  function curve(records, keys, label='完整轮次 epoch') {
    if(!records.length)return '';
    const maxX=Math.max(1,records[records.length-1].n),maxY=Math.max(.01,...records.flatMap(r=>keys.map(k=>r[k.key])))*1.08;
    const x=n=>62+365*n/maxX,y=v=>228-176*v/maxY;
    let body=ln(62,228,432,228)+ln(62,228,62,38)+tx(62,24,'损失 L')+tx(62,248,'0')+tx(428,248,String(maxX),12,'end')+tx(29,232,'0')+tx(55,55,f(maxY,2),11,'end')+tx(205,275,label);
    keys.forEach((key,i)=>{const pts=records.map(r=>x(r.n)+','+y(r[key.key])).join(' ');body+='<polyline points="'+pts+'" fill="none" stroke="'+key.color+'" stroke-width="2.5" '+(i?'stroke-dasharray="6 4"':'')+'/>';if(records.length===1)body+='<circle cx="'+x(0)+'" cy="'+y(records[0][key.key])+'" r="4" fill="'+key.color+'"/>';body+=tx(210+i*124,24,key.label+(i?'（虚线）':'（实线）'),11);});
    return svg(body,'真实计算得到的损失历史，横轴为'+label);
  }
  window.CourseLabs.descent=function(root){
    const q=s=>root.querySelector(s);let w=[0,0],history=[],timer=null,last='尚未更新。';
    function loss(p){return q('[data-k="mode"]').value==='one'?(p[0]-3)**2:(p[0]-1)**2+(p[1]+1)**2;}
    function gradient(p){return q('[data-k="mode"]').value==='one'?[2*(p[0]-3),0]:[2*(p[0]-1),2*(p[1]+1)];}
    function pause(){if(timer!==null)clearInterval(timer);timer=null;q('[data-action="run"]').disabled=false;}
    function draw(){
      const two=q('[data-k="mode"]').value==='two',g=gradient(w),n=history.length-1;
      q('[data-out="values"]').textContent='第 '+n+' 步；参数 '+(two?'(w₁,w₂)=('+w.map(x=>f(x)).join(', ')+')':'w='+f(w[0]))+'；梯度 '+(two?'('+g.map(x=>f(x)).join(', ')+')':f(g[0]))+'；损失 '+f(loss(w))+'。'+last;
      let body='';
      if(!two){
        const low=Math.min(-1,...history.map(r=>r.w[0])),high=Math.max(7,...history.map(r=>r.w[0])),maxL=Math.max((low-3)**2,(high-3)**2,.1)*1.08,xx=x=>62+365*(x-low)/(high-low),yy=y=>227-176*y/maxL;
        const points=Array.from({length:101},(_,i)=>{const x=low+(high-low)*i/100;return xx(x)+','+yy((x-3)**2);}).join(' ');
        body+='<polyline points="'+points+'" fill="none" stroke="#8a73e5" stroke-width="2"/>';
        body+=ln(62,227,432,227)+ln(62,227,62,36)+tx(62,25,'L(w)=(w−3)²')+tx(62,248,f(low,1))+tx(427,248,f(high,1),12,'end')+tx(28,230,'0')+tx(56,51,f(maxL,1),10,'end')+tx(214,275,'参数 w');
        history.forEach((r,i)=>{body+='<circle cx="'+xx(r.w[0])+'" cy="'+yy(r.loss)+'" r="'+(i===n?6:3)+'" fill="'+(i===n?'#d5823d':'#579ee0')+'"/>';});
      }else{
        const extent=Math.max(2,...history.flatMap(r=>r.w.map(Math.abs))),xx=x=>240+x*170/extent,yy=y=>145-y*102/extent;
        for(let r=1;r<=3;r++)body+='<ellipse cx="'+xx(1)+'" cy="'+yy(-1)+'" rx="'+(r*170/extent)+'" ry="'+(r*102/extent)+'" fill="none" stroke="currentColor" opacity="0.2"/>';
        body+=ln(64,145,418,145)+ln(240,38,240,254)+tx(416,166,'w₁')+tx(247,38,'w₂')+tx(64,275,'坐标范围 ±'+f(extent,1)+'；椭圆是等损失线。',12);
        const pts=history.map(r=>xx(r.w[0])+','+yy(r.w[1])).join(' ');body+='<polyline points="'+pts+'" stroke="#9477e6" stroke-width="2" fill="none"/><circle cx="'+xx(w[0])+'" cy="'+yy(w[1])+'" r="6" fill="#d5823d"/>'+tx(xx(1)+8,yy(-1)+5,'最低点 (1,−1)',11);
      }
      q('[data-out="plot"]').innerHTML=svg(body,two?'两参数的等损失线与实际参数轨迹':'一参数损失抛物线与实际更新点')+curve(history.map((r,i)=>({n:i,loss:r.loss})),[{key:'loss',color:'#7a75e7',label:'损失'}],'更新步数 step');
      q('[data-out="history"]').innerHTML=table(['步数','参数','损失'],history.slice(-8).map(r=>[r.n,r.w.slice(0,two?2:1).map(v=>f(v)).join(', '),f(r.loss)]));
      q('[data-action="step"]').disabled=n>=20;q('[data-action="run"]').disabled=timer!==null||n>=20;
    }
    function step(){if(history.length>20){pause();draw();return;}const eta=+q('[data-k="rate"]').value,g=gradient(w),delta=g.map(v=>-eta*v);w=w.map((v,i)=>v+delta[i]);last='上一步更新量 '+delta.slice(0,q('[data-k="mode"]').value==='one'?1:2).map(v=>f(v)).join(', ')+'。';history.push({n:history.length,w:w.slice(),loss:loss(w)});if(history.length>20){last+='已到 20 步上限。';pause();}draw();}
    function reset(){pause();w=[0,0];history=[{n:0,w:w.slice(),loss:loss(w)}];last='从同一起点重新记录。';draw();}
    q('[data-action="step"]').addEventListener('click',()=>{pause();step();});q('[data-action="run"]').addEventListener('click',()=>{if(timer!==null)return;timer=setInterval(step,180);draw();});q('[data-action="pause"]').addEventListener('click',()=>{pause();draw();});q('[data-action="reset"]').addEventListener('click',()=>{q('[data-k="mode"]').value='one';q('[data-k="rate"]').value='0.1';reset();});root.querySelectorAll('select').forEach(el=>el.addEventListener('change',reset));reset();
  };

  function scalarForward(p,target){const z=2*p.w1+p.b1,h=Math.max(0,z),yhat=p.w2*h+p.b2;return {z,h,yhat,loss:.5*(yhat-target)**2};}
  function scalarGrad(p,target){const a=scalarForward(p,target),delta=a.yhat-target,dz=delta*p.w2*(a.z>0?1:0);return {w1:dz*2,b1:dz,w2:delta*a.h,b2:delta};}
  window.CourseLabs.backprop=function(root){
    const q=s=>root.querySelector(s),keys=['w1','b1','w2','b2'];let p,phase=0,forward=null,grads=null,lastUpdate=null;
    function render(){
      const target=+q('[data-k="target"]').value;
      let s='参数：w₁='+f(p.w1)+', b₁='+f(p.b1)+', w₂='+f(p.w2)+', b₂='+f(p.b2)+'；x=2，目标 y='+target+'。';
      if(phase>=1)s+=' 前向 z='+f(forward.z)+' → h='+f(forward.h)+' → ŷ='+f(forward.yhat)+' → L='+f(forward.loss,6)+'。';
      if(phase>=2)s+=' 损失对输出的变化率 δ=ŷ−y='+f(forward.yhat-target)+'。';
      if(phase>=3)s+=' ∂L/∂h=δw₂='+f((forward.yhat-target)*p.w2)+'；ReLU 局部导数 '+(forward.z>0?1:0)+'；∂L/∂z='+f(grads.b1)+'。';
      q('[data-out="values"]').textContent=s;
      q('[data-out="status"]').textContent=['当前参数已准备。下一步先算前向，参数暂不改变。','前向完成并冻结；下一步求损失对输出的变化率。','输出梯度已算出；下一步沿 h 与 ReLU 的依赖回溯。','链式关系已算出；下一步汇总四项参数梯度。','梯度齐全，参数仍未改变。可以做数值核对，再统一更新。'][phase];
      let tableHTML=phase>=4?table(['当前参数','冻结旧值','解析梯度','η=0.1 更新量'],keys.map(k=>[k,f(p[k]),f(grads[k]),f(-.1*grads[k])])):'';
      if(lastUpdate)tableHTML+='<p>上一次已完成的统一更新（历史账单）：</p>'+table(['参数','旧值','梯度','新值'],lastUpdate);
      q('[data-out="table"]').innerHTML=tableHTML;
      q('[data-action="update"]').disabled=phase!==4;q('[data-action="check"]').disabled=phase!==4;q('[data-action="step"]').disabled=phase===4;
    }
    function branch(){const w=+q('[data-k="shared"]').value,u=2*w,v=3*w,s=u+v;q('[data-out="branch"]').textContent='w='+f(w,2)+'；u=2w='+f(u)+'，v=3w='+f(v)+'，s='+f(s)+'，L=0.5s²='+f(.5*s*s)+'。通过 u 的梯度贡献 2s='+f(2*s)+'；通过 v 的贡献 3s='+f(3*s)+'；合计 '+f(5*s)+'。';}
    function reset(){p={w1:+q('[data-k="w1"]').value,b1:0,w2:1,b2:0};phase=0;forward=null;grads=null;lastUpdate=null;q('[data-out="check"]').textContent='';render();branch();}
    q('[data-action="step"]').addEventListener('click',()=>{if(phase===0)forward=scalarForward(p,+q('[data-k="target"]').value);if(phase===2)grads=scalarGrad(p,+q('[data-k="target"]').value);phase=Math.min(4,phase+1);render();});
    q('[data-action="check"]').addEventListener('click',()=>{if(phase!==4)return;const eps=.001,target=+q('[data-k="target"]').value;const rows=keys.map(k=>{const plus={...p,[k]:p[k]+eps},minus={...p,[k]:p[k]-eps},numerical=(scalarForward(plus,target).loss-scalarForward(minus,target).loss)/(2*eps);return [k,f(grads[k],6),f(numerical,6),Math.abs(grads[k]-numerical).toExponential(2)];});q('[data-out="check"]').innerHTML='<p>中心差分 ε=0.001，其他参数固定；核对不会更新模型。</p>'+table(['参数','解析梯度','中心差分','绝对差'],rows);});
    q('[data-action="update"]').addEventListener('click',()=>{if(phase!==4)return;const next={};lastUpdate=keys.map(k=>{next[k]=p[k]-.1*grads[k];return[k,f(p[k]),f(grads[k]),f(next[k])];});p=next;grads=null;forward=scalarForward(p,+q('[data-k="target"]').value);phase=1;q('[data-out="check"]').textContent='参数已统一更新，旧梯度失效。这里显示新参数的重新前向结果。';render();});
    root.querySelectorAll('select').forEach(el=>el.addEventListener('change',reset));q('[data-k="shared"]').addEventListener('input',branch);
    q('[data-action="reset"]').addEventListener('click',()=>{q('[data-k="target"]').value='0';q('[data-k="w1"]').value='0.5';q('[data-k="shared"]').value='.2';reset();});reset();
  };

  // The same deterministic numerical engine powers both training lessons.
  // It has no DOM or network dependencies and never evaluates test data itself.
  function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  function shuffle(items,random){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function makeData(){const random=rng(20260913),points=Array.from({length:200},(_,i)=>{const x=2*random()-1,y=2*random()-1,label=x*x+y*y>.55?1:0;return {id:i,x,y,label,original:label};});const order=shuffle(points,rng(7301));return {train:order.slice(0,120),val:order.slice(120,160),test:order.slice(160)};}
  function makeChallenge(){const random=rng(9107);return Array.from({length:60},(_,i)=>{const x=2.8*random()-1.4,y=2.8*random()-1.4,label=x*x+y*y>.55?1:0;return {id:'挑战'+i,x,y,label,original:label};});}
  function initModel(width){const random=rng(31415),m={a:[],b:[],c:[],v:[],out:0};for(let i=0;i<width;i++){m.a.push((2*random()-1)*Math.sqrt(3));m.b.push((2*random()-1)*Math.sqrt(3));m.c.push(0);m.v.push((2*random()-1)*Math.sqrt(6/width));}return m;}
  function cloneModel(m){return {a:m.a.slice(),b:m.b.slice(),c:m.c.slice(),v:m.v.slice(),out:m.out};}
  function predict(m,d){const z=m.a.map((a,i)=>a*d.x+m.b[i]*d.y+m.c[i]),h=z.map(v=>Math.max(0,v));let score=m.out;for(let i=0;i<h.length;i++)score+=m.v[i]*h[i];return {z,h,score,p:sig(score)};}
  function bce(score,label){return Math.max(score,0)-score*label+Math.log1p(Math.exp(-Math.abs(score)));}
  function evaluate(m,data){let total=0,correct=0;for(const d of data){const a=predict(m,d);total+=bce(a.score,d.label);if((a.p>=.5?1:0)===d.label)correct++;}return {loss:total/data.length,accuracy:correct/data.length,correct,total:data.length};}
  function batchGradient(m,data){const g={a:m.a.map(()=>0),b:m.b.map(()=>0),c:m.c.map(()=>0),v:m.v.map(()=>0),out:0};for(const d of data){const a=predict(m,d),delta=a.p-d.label;g.out+=delta;for(let j=0;j<m.a.length;j++){g.v[j]+=delta*a.h[j];const dz=delta*m.v[j]*(a.z[j]>0?1:0);g.a[j]+=dz*d.x;g.b[j]+=dz*d.y;g.c[j]+=dz;}}const scale=1/data.length;for(const k of ['a','b','c','v'])g[k]=g[k].map(v=>v*scale);g.out*=scale;return g;}
  function batchUpdate(m,data,rate){const g=batchGradient(m,data);for(const k of ['a','b','c','v'])for(let j=0;j<m[k].length;j++)m[k][j]-=rate*g[k][j];m.out-=rate*g.out;return g;}
  function createRun({width=8,count=120,noise=false,rate=.05,batch=20}={}){
    const split=makeData(),train=split.train.slice(0,count).map((d,i)=>({...d,label:noise&&i<12?1-d.label:d.label}));
    const r={model:initModel(width),train,val:split.val,test:split.test,width,count,noise,rate,batch,step:0,epoch:0,pos:0,random:rng(81173),order:[],history:[],snapshots:[],best:0};
    r.order=shuffle(train,r.random);record(r);return r;
  }
  function record(r){const tr=evaluate(r.model,r.train),va=evaluate(r.model,r.val);r.history.push({n:r.epoch,step:r.step,train:tr.loss,val:va.loss,trainAccuracy:tr.accuracy,valAccuracy:va.accuracy});r.snapshots.push(cloneModel(r.model));if(va.loss<r.history[r.best].val)r.best=r.history.length-1;}
  function trainStep(r){const data=r.order.slice(r.pos,r.pos+r.batch);batchUpdate(r.model,data,r.rate);r.step++;r.pos+=data.length;if(r.pos>=r.train.length){r.epoch++;r.pos=0;record(r);r.order=shuffle(r.train,r.random);}}
  function trainEpoch(r){const target=r.epoch+1;while(r.epoch<target)trainStep(r);}
  window.CourseTrainingCore={rng,makeData,makeChallenge,initModel,cloneModel,predict,bce,evaluate,batchGradient,batchUpdate,createRun,trainStep,trainEpoch,scalarForward,scalarGrad};

  function boundary(m,points,kind){
    let body='';const px=x=>65+(x+1)*156,py=y=>256-(y+1)*104;
    for(let j=0;j<22;j++)for(let i=0;i<30;i++){const p=predict(m,{x:-1+(i+.5)*2/30,y:-1+(j+.5)*2/22}).p;body+='<rect x="'+px(-1+i*2/30)+'" y="'+py(-1+(j+1)*2/22)+'" width="10.6" height="9.7" fill="'+(p>=.5?'#9275e7':'#559cdf')+'" opacity="'+(.13+.24*Math.abs(p-.5)*2)+'"/>';}
    for(const d of points){const xx=px(d.x),yy=py(d.y),p=predict(m,d).p,pred=p>=.5?1:0,err=pred!==d.label;body+=d.label?'<path d="M '+xx+' '+(yy-3.5)+' l 3.5 7 h -7 Z" fill="#a589f0" stroke="currentColor" stroke-width=".6"/>':'<circle cx="'+xx+'" cy="'+yy+'" r="3.1" fill="#65a9e6" stroke="currentColor" stroke-width=".6"/>';if(err)body+='<circle cx="'+xx+'" cy="'+yy+'" r="5.8" fill="none" stroke="currentColor" stroke-width=".8"/>';if(d.original!==d.label)body+='<path d="M '+(xx-5)+' '+(yy-5)+' l 10 10 m 0 -10 l -10 10" stroke="#c77330" stroke-width="1.2"/>';}
    body+=ln(65,256,382,256)+ln(65,256,65,41)+tx(60,277,'−1')+tx(220,277,'0')+tx(373,277,'1')+tx(47,52,'1')+tx(39,260,'−1')+tx(201,302,'输入 x₁')+tx(65,25,'输入 x₂ · '+kind)+tx(389,69,'○ 标签 0',10)+tx(389,91,'△ 标签 1',10)+tx(389,117,'外圈：错分',10)+tx(389,145,'蓝区：预测 0',10)+tx(389,167,'紫区：预测 1',10)+tx(389,195,'×：翻转标签',10);
    return svg(body,'真实网络的二维判断区域与'+kind+'；圆点为标签 0，三角为标签 1，外圈标记错分',320);
  }
  function renderHistory(el,records){el.innerHTML=table(['完整轮次','step','训练损失','验证损失'],records.slice(-6).map(r=>[r.n,r.step,f(r.train),f(r.val)]));}
  function metrics(m,train,val){const tr=evaluate(m,train),va=evaluate(m,val);return '训练损失 '+f(tr.loss)+'，准确率 '+f(100*tr.accuracy,1)+'%（'+tr.correct+'/'+tr.total+'）；验证损失 '+f(va.loss)+'，准确率 '+f(100*va.accuracy,1)+'%（'+va.correct+'/'+va.total+'）。';}
  const curveKeys=[{key:'train',color:'#4e9ddf',label:'训练'},{key:'val',color:'#9b7ae5',label:'验证'}];

  window.CourseLabs.training=function(root){
    const q=s=>root.querySelector(s);let r,timer=null;
    function stop(){if(timer!==null)clearInterval(timer);timer=null;}
    function draw(){q('[data-out="values"]').textContent='step='+r.step+'；完整 epoch='+r.epoch+'；本轮已用 '+r.pos+'/'+r.train.length+' 条。'+metrics(r.model,r.train,r.val);q('[data-out="status"]').textContent=(timer!==null?'正在训练。':r.epoch>=200?'已到 200 轮上限。':'已暂停，可单步。')+' 数据种子 20260913；划分 7301；初始化 31415；打乱 81173。测试 40 条未计算成绩。';q('[data-out="plot"]').innerHTML=boundary(r.model,r.train,'训练样本');q('[data-out="curve"]').innerHTML=curve(r.history,curveKeys);renderHistory(q('[data-out="history"]'),r.history);q('[data-action="run"]').disabled=timer!==null||r.epoch>=200;q('[data-action="step"]').disabled=r.epoch>=200;q('[data-action="epoch"]').disabled=r.epoch>=200;}
    function step(){if(r.epoch>=200){stop();draw();return;}trainStep(r);if(r.epoch>=200)stop();draw();}
    function epoch(){if(r.epoch>=200)return;trainEpoch(r);if(r.epoch>=200)stop();draw();}
    function reset(){stop();r=createRun({rate:+q('[data-k="rate"]').value,batch:+q('[data-k="batch"]').value});draw();}
    q('[data-action="step"]').addEventListener('click',()=>{stop();step();});q('[data-action="epoch"]').addEventListener('click',()=>{stop();epoch();});q('[data-action="run"]').addEventListener('click',()=>{if(timer!==null||r.epoch>=200)return;timer=setInterval(epoch,80);draw();});q('[data-action="pause"]').addEventListener('click',()=>{stop();draw();});q('[data-action="reset"]').addEventListener('click',()=>{q('[data-k="rate"]').value='0.05';q('[data-k="batch"]').value='20';q('[data-k="scale"]').value='35';scale();reset();});root.querySelectorAll('select').forEach(el=>el.addEventListener('change',reset));
    function scale(){const value=+q('[data-k="scale"]').value;q('[data-out="scale"]').textContent='训练值 20、30 → 均值 25、总体标准差 5。新值 '+value+' 使用相同统计量：('+value+'−25)/5='+f((value-25)/5,2)+'。';}q('[data-k="scale"]').addEventListener('input',scale);scale();reset();
  };

  window.CourseLabs.generalization=function(root){
    const q=s=>root.querySelector(s),settings={baseline:{width:8,count:120,noise:false},small:{width:8,count:24,noise:false},wide:{width:24,count:120,noise:false},noise:{width:8,count:120,noise:true}},names={baseline:'基线',small:'只减数据',wide:'只加宽度',noise:'翻转 12 条训练标签'};
    const testKey='bigghost-ai-course-circle-test-seen-v1';let testSeen=false,storageOK=true;try{testSeen=localStorage.getItem(testKey)==='yes';}catch(e){storageOK=false;}
    let r,timer=null,selected=0,records=[],testText='';
    function stop(){if(timer!==null)clearInterval(timer);timer=null;}
    function testNotice(){return (testSeen?'这份固定测试集已被查看；后续测试为复查，不能再称全新独立测试。':'测试 40 条尚未计算成绩；确定条件与快照后再进行最终评估。')+(storageOK?'':' 浏览器无法保存标记；本次页面内仍保留，重新打开也请自行记住是否已查看。');}
    function draw(){
      const m=r.snapshots[selected],hist=r.history[selected];q('[data-out="values"]').textContent='当前训练到 epoch='+r.epoch+'、step='+r.step+'；正在查看第 '+hist.n+' 轮的实际快照（step '+hist.step+'）。'+metrics(m,r.train,r.val)+' 验证历史最低在第 '+r.history[r.best].n+' 轮。';
      q('[data-out="status"]').textContent=(timer!==null?'正在训练。':r.epoch>=300?'已到 300 轮上限。':'已暂停。')+' '+names[q('[data-k="condition"]').value]+'；学习率 0.05，批量 20，SGD。数据/划分/初始化/打乱种子：20260913 / 7301 / 31415 / 81173。';
      q('[data-k="snapshot"]').max=String(r.history.length-1);q('[data-k="snapshot"]').value=String(selected);q('[data-k="snapshot"]').setAttribute('aria-valuetext','第 '+hist.n+' 轮，验证损失 '+f(hist.val));
      const points=q('[data-k="points"]').value==='train'?r.train:r.val;q('[data-out="plot"]').innerHTML=boundary(m,points,q('[data-k="points"]').value==='train'?'训练样本':'验证样本');q('[data-out="curve"]').innerHTML=curve(r.history,curveKeys);renderHistory(q('[data-out="history"]'),r.history);
      q('[data-action="run"]').disabled=timer!==null||r.epoch>=300;q('[data-action="step"]').disabled=r.epoch>=300;q('[data-action="test"]').disabled=r.epoch===0||timer!==null;
      q('[data-out="comparison"]').innerHTML=records.length?'<p>已记录 '+records.length+' 组；记录按当时选中的实际快照保存。</p>'+table(['条件','训练到 / 选中轮','选中 step','训练损失','验证损失'],records.map(v=>[v.name,v.finalEpoch+' / '+v.epoch,v.step,f(v.train),f(v.val)])):'<p>点击“记录当前对照”，在更换条件前保存该实验的设置与成绩。</p>';
      q('[data-out="test"]').innerHTML=testText||'<p>'+testNotice()+'</p>';
    }
    function epoch(){if(r.epoch>=300){stop();draw();return;}testText='';trainEpoch(r);selected=r.history.length-1;if(r.epoch>=300)stop();draw();}
    function reset(){stop();r=createRun(settings[q('[data-k="condition"]').value]);selected=0;testText='';q('[data-k="points"]').value='train';draw();}
    function exampleRows(m,data){const mapped=data.map(d=>{const a=predict(m,d);return {d,p:a.p,correct:(a.p>=.5?1:0)===d.label};});const ok=mapped.find(v=>v.correct),bad=mapped.find(v=>!v.correct),rows=[];for(const [name,v] of [['成功',ok],['失败',bad]]){if(v)rows.push([name+' #'+v.d.id,'('+f(v.d.x,3)+', '+f(v.d.y,3)+')',v.d.label,f(v.p),v.p>=.5?1:0]);}return '<div class="table-wrap">'+table(['实例','输入','标签','输出 p','预测'],rows)+'</div>'+(ok?'':'<p>本次集合没有成功样本。</p>')+(bad?'':'<p>本次有限测试集合没有失败样本，不代表未来不会出错。</p>');}
    q('[data-action="step"]').addEventListener('click',()=>{stop();epoch();});q('[data-action="run"]').addEventListener('click',()=>{if(timer!==null||r.epoch>=300)return;timer=setInterval(epoch,80);draw();});q('[data-action="pause"]').addEventListener('click',()=>{stop();draw();});q('[data-action="reset"]').addEventListener('click',reset);q('[data-k="condition"]').addEventListener('change',reset);
    q('[data-k="snapshot"]').addEventListener('input',()=>{stop();selected=+q('[data-k="snapshot"]').value;testText='';draw();});q('[data-k="points"]').addEventListener('change',draw);q('[data-action="best"]').addEventListener('click',()=>{stop();selected=r.best;testText='';draw();});
    q('[data-action="archive"]').addEventListener('click',()=>{const a=r.history[selected];records.push({name:names[q('[data-k="condition"]').value]+'（n='+r.count+', h='+r.width+'）',finalEpoch:r.epoch,epoch:a.n,step:a.step,train:a.train,val:a.val});if(records.length>12)records.shift();draw();});
    q('[data-action="test"]').addEventListener('click',()=>{if(timer!==null||r.epoch===0)return;const wasSeen=testSeen,m=r.snapshots[selected],hist=r.history[selected],te=evaluate(m,r.test),challenge=makeChallenge(),ch=evaluate(m,challenge);testSeen=true;try{localStorage.setItem(testKey,'yes');}catch(e){storageOK=false;}testText='<p><strong>'+(wasSeen?'已查看测试集的复查':'本次最终测试评估')+'</strong>：'+names[q('[data-k="condition"]').value]+'，实际第 '+hist.n+' 轮快照。测试损失 '+f(te.loss)+'，准确率 '+f(te.accuracy*100,1)+'%（'+te.correct+'/40）。</p><p>分布变化挑战：坐标范围扩大到 [−1.4,1.4]，标签规则相同，独立种子 9107；损失 '+f(ch.loss)+'，准确率 '+f(ch.accuracy*100,1)+'%（'+ch.correct+'/60）。这是另一组分布，单独报告。</p>'+exampleRows(m,r.test)+'<p>'+testNotice()+'</p>';draw();});reset();
  };
})();
