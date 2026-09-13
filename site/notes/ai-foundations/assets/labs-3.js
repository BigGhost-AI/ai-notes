(function () {
  'use strict';
  const labs = window.CourseLabs = window.CourseLabs || {};
  const f = (x, n = 4) => Number(x.toFixed(n)).toString();
  const table = (heads, rows) => '<div class="table-wrap"><table><thead><tr>' + heads.map(x => '<th scope="col">' + x + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map(x => '<td>' + x + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  labs.convolution = function (root) {
    const $ = s => root.querySelector(s);
    let pixels, pos = 0, terms = 9;
    function render() {
      const stride = Number($('[data-stride]').value);
      const kind = $('[data-kernel]').value;
      const kernel = kind === 'edge' ? [1,0,-1,1,0,-1,1,0,-1] : kind === 'identity' ? [0,0,0,0,1,0,0,0,0] : Array(9).fill(1/9);
      const side = Math.floor((5-3)/stride)+1;
      pos = Math.max(0, Math.min(pos, side*side-1));
      const y = Math.floor(pos / side)*stride, x = (pos % side)*stride;
      const inputRows = pixels.map((row,r) => row.map((v,c) => {
        const active = r>=y && r<y+3 && c>=x && c<x+3;
        return '<button class="button" data-pixel="'+r+','+c+'" aria-label="输入第 '+(r+1)+' 行第 '+(c+1)+' 列，值 '+v+'，点击切换"'+(active?' style="border:2px solid var(--accent, #7455dc)"':'')+'>'+v+(active?'<span class="small"> 窗口</span>':'')+'</button>';
      }));
      $('[data-input]').innerHTML=table(['列 1','列 2','列 3','列 4','列 5'],inputRows);
      $('[data-kernel-grid]').innerHTML=table(['核列 1','核列 2','核列 3'],[0,1,2].map(r=>kernel.slice(r*3,r*3+3).map(v=>f(v))));
      const product = kernel.map((w,j)=>({v:pixels[y+Math.floor(j/3)][x+j%3], w}));
      const sum = product.reduce((s,p)=>s+p.v*p.w,0);
      $('[data-output]').innerHTML='<p><strong>窗口左上角：第 '+(y+1)+' 行、第 '+(x+1)+' 列；输出位置 '+(pos+1)+' / '+(side*side)+'</strong></p><p>'+product.slice(0,terms).map(p=>'('+p.v+' × '+f(p.w)+')').join(' + ')+(terms<9?' + …':'')+'</p><p>已展开 '+terms+' / 9 项，小计 <strong>'+f(product.slice(0,terms).reduce((s,p)=>s+p.v*p.w,0))+'</strong>；完整输出 <strong>'+f(sum)+'</strong>。共有 9 个核权重与 1 个偏置，位置移动不会增加参数。</p>';
      const out = Array.from({length:side},(_,r)=>Array.from({length:side},(_,c)=>{
        let v=0;kernel.forEach((w,j)=>{v+=w*pixels[r*stride+Math.floor(j/3)][c*stride+j%3];});
        return (r*side+c===pos?'<strong>当前 ':'')+f(v)+(r*side+c===pos?'</strong>':'');
      }));
      $('[data-feature]').innerHTML='<p><strong>完整特征图 '+side+'×'+side+'</strong>（有符号数值，未接 ReLU）</p>'+table(Array.from({length:side},(_,i)=>'输出列 '+(i+1)),out);
      $('[data-action="prev"]').disabled=pos===0;
      $('[data-action="next"]').disabled=pos===side*side-1;
      $('[data-action="term"]').textContent=terms===9?'从第一项重新展开':'显示下一项乘法';
    }
    function reset(){pixels=Array.from({length:5},()=>[0,0,1,1,1]);pos=0;terms=9;$('[data-kernel]').value='edge';$('[data-stride]').value='1';render();}
    root.addEventListener('click',e=>{
      const b=e.target.closest('button'); if(!b||!root.contains(b))return;
      if(b.hasAttribute('data-pixel')){const [r,c]=b.dataset.pixel.split(',').map(Number);pixels[r][c]=1-pixels[r][c];render();return;}
      const a=b.dataset.action;
      if(a==='reset'){reset();return;}
      if(a==='shift') pixels=pixels.map(r=>[0,...r.slice(0,4)]);
      if(a==='prev'){pos--;terms=9;} if(a==='next'){pos++;terms=9;}
      if(a==='term')terms=terms===9?1:terms+1;
      render();
    });
    root.addEventListener('change',()=>{pos=0;terms=9;render();});reset();
  };
  labs['cnn-shapes'] = function(root){
    const $=s=>root.querySelector(s);
    function render(){
      const n=Number($('[data-size]').value),k=Number($('[data-k]').value),p=$('[data-pad]').value==='same'?(k-1)/2:0,pool=$('[data-pool]').value==='on';
      let d=n,channels=1,total=0,invalid='';const rows=[['输入',n+'×'+n+'×1','0','输入 / 激活']];
      function conv(name,ks,ps,cout){
        if(invalid)return;const next=d+2*ps-ks+1;
        if(next<1){invalid=name+'：输入边长 '+d+'，填充 '+ps+'，放不下 '+ks+'×'+ks+' 核。';rows.push([name,'无法连接','—','结构错误']);return;}
        const params=(ks*ks*channels+1)*cout;total+=params;d=next;channels=cout;rows.push([name,d+'×'+d+'×'+channels,params,'核 '+ks+'×'+ks+'，填充 '+ps]);rows.push(['ReLU',d+'×'+d+'×'+channels,0,'仅改数值，不改形状']);
      }
      function pooling(name){if(!pool||invalid)return;const next=Math.floor((d-2)/2)+1;if(next<1){invalid=name+'：输入 '+d+'×'+d+' 放不下 2×2 池化窗口。';rows.push([name,'无法连接','—','结构错误']);return;}d=next;rows.push([name,d+'×'+d+'×'+channels,0,'2×2 / 步长 2']);}
      conv('卷积 1',k,p,4);pooling('池化 1');conv('卷积 2',3,0,8);pooling('池化 2');
      let length=0;if(!invalid){length=d*d*channels;rows.push(['展平',length,0,'重排激活']);let params=length*10+10;total+=params;rows.push(['全连接头','10',params,'按当前输入维度重建']);rows.push(['softmax','10 个概率',0,'这里不计算未训练的类别预测']);}
      $('[data-route]').innerHTML=table(['层','输出形状','参数量','计算说明'],rows);
      $('[data-output]').innerHTML=invalid?'<p><strong>结构无效：</strong>'+invalid+'</p>':'<p>展平长度 <strong>'+length+'</strong>；总参数 <strong>'+total+'</strong>。卷积 1 '+((k*k+1)*4)+'、卷积 2 296、分类头 '+(length*10+10)+'。</p><p>此结构可连接；这不是准确率结论。'+(length!==288?'展平长度不同于默认 288，原默认分类头不能直接沿用。':'默认形状与 288→10 分类头兼容。')+'</p>';
    }
    root.addEventListener('change',render);$('[data-action="reset"]').addEventListener('click',()=>{$('[data-size]').value='28';$('[data-k]').value='3';$('[data-pad]').value='same';$('[data-pool]').value='on';render();});render();
  };
  labs.residual = function(root){
    const $=s=>root.querySelector(s);
    function render(){const a=Number($('[data-f0]').value),b=Number($('[data-f1]').value),d=Number($('[data-derivative]').value),c=Number($('[data-channels]').value);
      $('[data-diagram]').innerHTML='<svg viewBox="0 0 390 210" width="100%" height="auto" role="img" aria-label="输入分成直接路径与分支路径，再在加法节点汇合"><text x="12" y="100" font-size="13">x=[2,−1]</text><path d="M85 105H100V45H310V105M100 105V155H135M260 155H310V115M320 110H345" fill="none" stroke="currentColor" stroke-width="2"/><path d="M306 98L310 105L314 98M306 122L310 115L314 122M338 106L345 110L338 114" fill="none" stroke="currentColor"/><text x="150" y="33" font-size="13">直接保留 [2,−1]</text><rect x="135" y="132" width="125" height="46" rx="10" fill="none" stroke="currentColor"/><text x="146" y="150" font-size="12">分支 F(x)</text><text x="146" y="168" font-size="12">['+f(a)+', '+f(b)+']</text><circle cx="310" cy="110" r="10" fill="var(--surface,white)" stroke="currentColor"/><text x="305" y="115" font-size="14">+</text><text x="351" y="114" font-size="13">y</text><text x="180" y="200" font-size="13">y=['+f(2+a)+', '+f(-1+b)+']</text></svg>';
      $('[data-output]').innerHTML='<p>向量前向结果：<strong>['+f(2+a)+', '+f(-1+b)+']</strong>。</p><p>独立标量反向例：直接路径 1 + 分支路径 '+f(d)+' = <strong>'+f(1+d)+'</strong>。普通分支 y=F(x) 的局部导数则为 '+f(d)+'。'+(Math.abs(1+d)<1e-9?'这里两条路径恰好抵消；残差并不保证总导数永不为零。':'这只是一个局部导数计算，不能当作整体训练性能。')+'</p>'+table(['结构（等宽 C='+c+'）','参数（忽略偏置）','理论感受野'],[['两层 3×3','18×'+c+'² = '+18*c*c,'5×5'],['一层 5×5','25×'+c+'² = '+25*c*c,'5×5']])+'<p>两层之间有非线性，因此不是同一运算；修改中间通道宽度后需重新计数。</p>';
    }
    root.addEventListener('input',render);root.addEventListener('change',render);$('[data-action="reset"]').addEventListener('click',()=>{$('[data-f0]').value='.5';$('[data-f1]').value='.2';$('[data-derivative]').value='.2';$('[data-channels]').value='16';render();});render();
  };
  labs['vision-tasks'] = function(root){
    const $=s=>root.querySelector(s);let updated=false;
    const digits=[{label:'3',x:30,rows:['111','001','111','001','111'],color:'#2768cb'},{label:'8',x:170,rows:['111','101','111','101','111'],color:'#8050c8'}];
    function render(){
      const task=$('[data-task]').value;
      let shapes='';digits.forEach(d=>{d.rows.forEach((row,r)=>[...row].forEach((v,c)=>{if(v==='1')shapes+='<rect x="'+(d.x+c*20)+'" y="'+(30+r*20)+'" width="20" height="20" fill="'+(task==='segmentation'?d.color:'#66738d')+'" stroke="white" stroke-width="1"/>';}));if(task==='detection')shapes+='<rect x="'+d.x+'" y="30" width="60" height="100" fill="none" stroke="'+d.color+'" stroke-width="3"/><text x="'+d.x+'" y="20" fill="currentColor" font-size="13">类别 '+d.label+'</text>';});
      $('[data-image]').innerHTML='<svg viewBox="0 0 300 160" width="100%" height="auto" role="img" aria-label="人工合成的数字 3 和 8，当前展示'+(task==='classification'?'多标签类别':task==='detection'?'人工检测框':'逐像素人工类别掩码')+'"><rect width="300" height="160" rx="12" fill="none" stroke="currentColor" opacity=".2"/>'+shapes+'</svg>';
      $('[data-labels]').textContent=task==='classification'?'人工目标：类别集合 {3,8}，不含位置。':task==='detection'?'人工目标：3 的框 (x=30,y=30,w=60,h=100)；8 的框 (170,30,60,100)。坐标为图中示意像素单位，原点在左上角。':'人工目标：左侧字形各像素标类别 3（蓝），右侧标类别 8（紫），其余为背景。相同类别不区分实例。';
      const mode=$('[data-train]').value,mask=[mode==='all',mode!=='head',true],initial=[1,.8,.5],grad=[-.16,-.2,-.32],weights=initial.map((v,i)=>updated&&mask[i]?v-.1*grad[i]:v);
      const a=2*weights[0],b=a*weights[1],y=b*weights[2],loss=.5*(y-1)**2;
      $('[data-output]').innerHTML=table(['部件','参数初值','更新状态','当前参数'],['骨干前段','骨干末段','任务头'].map((n,i)=>[n,initial[i],mask[i]?'可更新':'冻结',f(weights[i])]))+'<p>'+ (updated?'已由共同初值执行一次更新':'尚未执行更新')+'。当前前向：2 → '+f(a)+' → '+f(b)+' → <strong>'+f(y)+'</strong>；损失 <strong>'+f(loss,6)+'</strong>。</p><p>初值处梯度依次为 [−0.16,−0.20,−0.32]，只应用于允许更新的参数。切换范围会重新从初值比较。</p><p><strong>U-Net 形状检查：</strong>'+($('[data-merge]').value==='concat'?'8×8×4 与 8×8×6 沿通道拼接 → 8×8×10。':'无法逐元素相加：4 与 6 个通道不兼容，需要先做尺寸适配。')+'</p>';
    }
    root.addEventListener('change',e=>{if(e.target.matches('[data-train]'))updated=false;render();});$('[data-action="update"]').addEventListener('click',()=>{updated=true;render();});$('[data-action="reset"]').addEventListener('click',()=>{$('[data-task]').value='classification';$('[data-train]').value='head';$('[data-merge]').value='concat';updated=false;render();});render();
  };
})();
