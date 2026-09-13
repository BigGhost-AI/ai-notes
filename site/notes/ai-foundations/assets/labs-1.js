(function () {
  'use strict';
  window.CourseLabs = window.CourseLabs || {};
  const f = (n, digits = 4) => Number(n).toFixed(digits).replace(/^-0\.0+$/, (s) => s.slice(1));
  const sigmoid = z => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
  const svg = (body, title, height = 310) => '<svg viewBox="0 0 480 ' + height + '" width="100%" height="auto" role="img" aria-label="' + title + '" style="display:block;color:inherit">' + body + '</svg>';
  const text = (x, y, s, size = 13, anchor = 'start') => '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="currentColor" text-anchor="' + anchor + '">' + s + '</text>';
  const line = (x1, y1, x2, y2, extra = '') => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="currentColor" ' + extra + '/>';
  const header = labels => '<thead><tr>' + labels.map(x => '<th>' + x + '</th>').join('') + '</tr></thead>';
  const cellrow = labels => '<tr>' + labels.map(x => '<td>' + x + '</td>').join('') + '</tr>';

  window.CourseLabs.neuron = function (root) {
    const q = s => root.querySelector(s);
    const inputs = Array.from(root.querySelectorAll('input[data-k]'));
    const defaults = {x1: .8, x2: .3, w1: 1, w2: 2, b: -1};
    let reveal = 3;
    const samples = [[.1,.15,0],[.25,.3,0],[.65,.1,0],[.2,.7,1],[.75,.65,1],[.9,.45,1]];
    function values() { const v = {}; inputs.forEach(el => v[el.dataset.k] = +el.value); return v; }
    function draw() {
      const v = values(), p1 = v.x1 * v.w1, p2 = v.x2 * v.w2, z = p1+p2+v.b, p = sigmoid(z);
      inputs.forEach(el => el.setAttribute('aria-valuetext', f(+el.value,2)));
      q('[data-out="values"]').textContent = '输入 x₁=' + f(v.x1,2) + '，x₂=' + f(v.x2,2) + '；参数 w₁=' + f(v.w1,2) + '，w₂=' + f(v.w2,2) + '，b=' + f(v.b,2) + '。分数 z=' + f(z) + '；输出 p=' + f(p) + '；阈值 0.5 下预测：' + (p>=.5?'异常':'正常') + '。';
      const bill = ['① 两条乘法：'+f(v.x1,2)+'×'+f(v.w1,2)+'='+f(p1)+'；'+f(v.x2,2)+'×'+f(v.w2,2)+'='+f(p2), '② 加权和加偏置：'+f(p1)+'+'+f(p2)+'+('+f(v.b,2)+')='+f(z), '③ sigmoid('+f(z)+')='+f(p)+'，再比较阈值 0.5'];
      q('[data-out="bill"]').textContent = bill.slice(0,reveal).join('。 ');
      q('[data-action="step"]').textContent = reveal===3?'从第一项重新展开':'展开下一项';
      let body = '';
      const px = x => 58+x*280, py=y=>254-y*210;
      for(let j=0;j<16;j++) for(let i=0;i<20;i++) {
        const c = v.w1*(i+.5)/20+v.w2*(j+.5)/16+v.b>=0 ? '#9275e7' : '#559cdf';
        body += '<rect x="'+px(i/20)+'" y="'+py((j+1)/16)+'" width="14.2" height="13.4" fill="'+c+'" opacity="0.19"/>';
      }
      const intersections = [];
      const add=(x,y)=>{if(x>=-1e-9&&x<=1+1e-9&&y>=-1e-9&&y<=1+1e-9&&!intersections.some(p=>Math.abs(p[0]-x)+Math.abs(p[1]-y)<1e-8))intersections.push([x,y]);};
      if(Math.abs(v.w2)>1e-9){add(0,-v.b/v.w2);add(1,(-v.b-v.w1)/v.w2);}
      if(Math.abs(v.w1)>1e-9){add(-v.b/v.w1,0);add((-v.b-v.w2)/v.w1,1);}
      if(intersections.length>=2)body+=line(px(intersections[0][0]),py(intersections[0][1]),px(intersections[1][0]),py(intersections[1][1]),'stroke-width="2.5"');
      samples.forEach(([x,y,label]) => { body += label ? '<path d="M '+px(x)+' '+(py(y)-5)+' l 5 10 h -10 Z" fill="#9979f0" stroke="currentColor"/>' : '<circle cx="'+px(x)+'" cy="'+py(y)+'" r="4.5" fill="#70afe9" stroke="currentColor"/>'; });
      body+= '<circle cx="'+px(v.x1)+'" cy="'+py(v.x2)+'" r="9" fill="none" stroke="currentColor" stroke-width="2.5"/>';
      body+=line(58,254,345,254)+line(58,254,58,36)+text(56,272,'0')+text(336,272,'1')+text(43,49,'1')+text(150,295,'温度输入 x₁')+text(58,24,'振动输入 x₂')+text(357,75,'○ 已知正常',12)+text(357,98,'△ 已知异常',12)+text(357,123,'◎ 当前输入',12)+text(357,154,'蓝区：判正常',12)+text(357,177,'紫区：判异常',12);
      if(v.w1===0&&v.w2===0) body+=text(62,320,'两权重为 0：输出与输入无关，无一般直线分界。',12);
      else if(intersections.length<2)body+=text(62,320,'当前边界未穿过 0–1 显示范围。',12);
      else body+=text(62,320,'直线表示分数 z=0；底色表示当前参数的预测。',12);
      q('[data-out="plot"]').innerHTML=svg(body,'温度与振动输入空间中的分类区域、标签点与当前输入',338);
    }
    inputs.forEach(el=>el.addEventListener('input',draw));
    q('[data-action="step"]').addEventListener('click',()=>{reveal=reveal===3?1:reveal+1;draw();});
    q('[data-action="reset"]').addEventListener('click',()=>{inputs.forEach(el=>el.value=defaults[el.dataset.k]);reveal=3;draw();});
    draw();
  };

  window.CourseLabs.xor = function(root) {
    const q=s=>root.querySelector(s), points=[[0,0,0],[1,0,1],[0,1,1],[1,1,0]];
    function calc(x,y,relu){ const h1=relu?Math.max(0,x+y):x+y,h2=relu?Math.max(0,x+y-1):x+y-1;return {h1,h2,s:h1-2*h2}; }
    function draw(){
      const relu=q('[data-k="activation"]').value==='relu', selected=+q('[data-k="point"]').value;
      const [x,y,label]=points[selected], a=calc(x,y,relu);
      q('[data-out="values"]').textContent='当前 ('+x+','+y+')；隐藏值 h₁='+a.h1+'，h₂='+a.h2+'；s='+a.h1+'−2×('+a.h2+')='+a.s+'；预测 '+(a.s>=.5?1:0)+'，标签 '+label+'。'+(relu?'参数手工设定，ReLU 已开启。':'直接传递时 s=2−x₁−x₂。');
      let body=''; const px=x=>65+250*x,py=y=>242-185*y;
      for(let j=0;j<20;j++)for(let i=0;i<24;i++)body+='<rect x="'+px(i/24)+'" y="'+py((j+1)/20)+'" width="10.7" height="9.5" fill="'+(calc((i+.5)/24,(j+.5)/20,relu).s>=.5?'#9275e7':'#559cdf')+'" opacity="0.21"/>';
      points.forEach(([x,y,c],i)=>{const a=calc(x,y,relu),xx=px(x),yy=py(y);body+='<circle cx="'+xx+'" cy="'+yy+'" r="'+(i===selected?10:7)+'" fill="'+(c?'#9275e7':'#559cdf')+'" stroke="currentColor" stroke-width="'+(i===selected?3:1)+'"/>'+text(xx+(x?-12:12),yy+(y?-13:24),'('+x+','+y+'): '+c,12,x?'end':'start');if((a.s>=.5?1:0)!==c)body+=text(xx+12,yy+5,'× 错误',12);});
      body+=line(65,242,325,242)+line(65,242,65,44)+text(180,288,'输入 x₁')+text(35,28,'输入 x₂')+text(350,75,'点内颜色：标签',12)+text(350,101,'蓝：0；紫：1',12)+text(350,137,'底色：预测类别',12)+text(350,163,'粗圈：当前点',12);
      q('[data-out="plot"]').innerHTML=svg(body,'XOR 四点标签与当前两层网络的预测区域');
      let correct=0;
      const rows=points.map(([x,y,c])=>{const a=calc(x,y,relu),pred=a.s>=.5?1:0;if(pred===c)correct++;return cellrow(['('+x+','+y+')',a.h1,a.h2,a.s,pred,c,pred===c?'正确':'错误']);}).join('');
      q('[data-out="table"]').innerHTML='<table>'+header(['输入','h₁','h₂','分数 s','预测','标签','对照'])+'<tbody>'+rows+'</tbody></table><p>四条样本正确 '+correct+'/4。当前参数未训练。</p>';
    }
    root.querySelectorAll('select').forEach(el=>el.addEventListener('change',draw));
    q('[data-action="reset"]').addEventListener('click',()=>{q('[data-k="point"]').value='0';q('[data-k="activation"]').value='relu';draw();});draw();
  };

  window.CourseLabs.dimensions=function(root){
    const q=s=>root.querySelector(s), data=[[.8,.3],[.2,.1],[.6,.9],[.1,.7]],weights=[[1,0,-1],[0,1,1]],bias=[0,0,1];
    const original=[0,1,1,0,0,1,1,0,0,1,1,0,1,1,1,1];let pixels=original.slice();
    function drawPixels(){
      q('[data-out="pixels"]').innerHTML=pixels.map((v,i)=>'<button class="button" type="button" data-pixel="'+i+'" aria-label="第 '+(Math.floor(i/4)+1)+' 行第 '+(i%4+1)+' 列，值 '+v+'，点击切换" aria-pressed="'+(v===1)+'" style="padding:8px;background:'+(v?'rgba(116,85,220,.3)':'transparent')+'">'+v+'</button>').join('');
      q('[data-out="flat"]').textContent='按行展平：['+pixels.join(', ')+']；形状 1×16。';
    }
    function draw(){
      const batch=+q('[data-k="batch"]').value,features=+q('[data-k="features"]').value,u=+q('[data-k="unit"]').value;
      if(features!==2){q('[data-out="values"]').textContent='维度不匹配：X 是 '+batch+'×3，W 是 2×3。中间维度 3≠2，停止前向；参数仍是旧模型的 13 个。';q('[data-out="table"]').innerHTML='<p>需要重新定义可接收 3 项特征的权重，不能沿用当前输出。</p>';q('[data-out="bill"]').textContent='这里只改变输入形状；没有偷偷删除第三项特征，也没有随机创建新参数。';return;}
      q('[data-out="values"]').textContent='X：'+batch+'×2；W：2×3；H：'+batch+'×3；输出：'+batch+'×1。参数仍为 13 个，当前隐藏激活 '+(3*batch)+' 个。';
      const rows=data.slice(0,batch).map(([x,y],i)=>{const h=[x,y,Math.max(0,-x+y+1)],s=h[0]-h[1]+.5*h[2];return cellrow([i+1,'('+f(x,1)+','+f(y,1)+')',h.map(n=>f(n,2)).join(', '),f(s),f(sigmoid(s))]);}).join('');
      q('[data-out="table"]').innerHTML='<table>'+header(['样本','输入 X','隐藏激活 H','输出分数','sigmoid 输出'])+'<tbody>'+rows+'</tbody></table>';
      const [x,y]=data[0],z=x*weights[0][u]+y*weights[1][u]+bias[u];
      q('[data-out="bill"]').textContent='第一条样本 × W 第 '+(u+1)+' 列：'+x+'×('+weights[0][u]+')+'+y+'×('+weights[1][u]+')+'+bias[u]+'='+f(z)+'，ReLU 后 '+f(Math.max(0,z))+'。该列两项是权重，结果是激活。';
    }
    root.querySelectorAll('select').forEach(el=>el.addEventListener('change',draw));
    q('[data-out="pixels"]').addEventListener('click',e=>{const b=e.target.closest('[data-pixel]');if(!b)return;const index=+b.dataset.pixel;pixels[index]=1-pixels[index];drawPixels();q('[data-out="pixels"]').querySelector('[data-pixel="'+index+'"]').focus();});
    q('[data-action="reset"]').addEventListener('click',()=>{q('[data-k="batch"]').value='1';q('[data-k="features"]').value='2';q('[data-k="unit"]').value='0';pixels=original.slice();draw();drawPixels();});draw();drawPixels();
  };

  window.CourseLabs.loss=function(root){
    const q=s=>root.querySelector(s);let ratio=6,exactLogit=null;
    function draw(){
      const p=+q('[data-k="p"]').value,dist=[(1-p)*ratio/(ratio+1),p,(1-p)/(ratio+1)],choice=dist.indexOf(Math.max(...dist)),loss=-Math.log(p);
      q('[data-out="values"]').textContent='概率 (A,B,C)=('+dist.map(x=>f(x)).join(', ')+')，合计 '+f(dist.reduce((a,b)=>a+b,0))+'。标签 B；预测 '+['A','B','C'][choice]+'；本条'+(choice===1?'正确':'错误')+'；交叉熵 −ln('+f(p,2)+')='+f(loss)+'。剩余 A:C 保持 '+ratio+':1。';
      let body=text(50,25,'概率（正确标签 B）');
      dist.forEach((v,i)=>{const y=55+i*48;body+=text(22,y+17,['A','B','C'][i])+ '<rect x="50" y="'+y+'" width="'+(300*v)+'" height="26" rx="4" fill="'+(i===1?'#9477e6':'#579ee0')+'"/>'+text(364,y+18,f(v));});
      body+=line(50,205,350,205)+text(50,225,'0')+text(345,225,'1')+text(160,252,'概率值（条长）');
      q('[data-out="plot"]').innerHTML=svg(body,'A、B、C 概率条，B 为正确类别',270);
      const z=exactLogit===null?+q('[data-k="logit"]').value:exactLogit,m=Math.max(z,0),es=[Math.exp(z-m),Math.exp(-m),Math.exp(-m)],sum=es.reduce((a,b)=>a+b,0);
      q('[data-out="softmax"]').textContent='logits=('+f(z,6)+', 0, 0) → softmax=('+es.map(x=>f(x/sum)).join(', ')+')。'+(exactLogit!==null?'当前使用精确 ln(2)。':'用最大 logit 平移后计算指数，结果不变。');
      const prediction=+q('[data-k="prediction"]').value;q('[data-out="regression"]').textContent='预测 '+f(prediction,1)+'，目标 2；平方误差=('+f(prediction,1)+'−2)²='+f((prediction-2)**2)+'。';
    }
    q('[data-k="p"]').addEventListener('input',draw);
    q('[data-k="logit"]').addEventListener('input',()=>{exactLogit=null;draw();});q('[data-k="prediction"]').addEventListener('input',draw);
    root.querySelectorAll('[data-case]').forEach(el=>el.addEventListener('click',()=>{const second=el.dataset.case==='second';ratio=second?10:6;q('[data-k="p"]').value=second?.45:.3;draw();}));
    q('[data-action="ln2"]').addEventListener('click',()=>{exactLogit=Math.LN2;q('[data-k="logit"]').value=Math.LN2;draw();});
    q('[data-action="reset"]').addEventListener('click',()=>{ratio=6;exactLogit=null;q('[data-k="p"]').value=.3;q('[data-k="logit"]').value=.69;q('[data-k="prediction"]').value=1;draw();});draw();
  };
})();
