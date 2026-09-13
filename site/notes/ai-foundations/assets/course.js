/* Shared progressive enhancement. All lesson prose and answers exist in HTML. */
(() => {
  'use strict';
  const key = 'bigghost-ai-foundations-v1';
  let state = {completed: [], notes: {}, last: 1};
  let storageWorks = true;
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (value && typeof value === 'object') {
      state.completed = Array.isArray(value.completed) ? [...new Set(value.completed.filter(n => Number.isInteger(n) && n >= 1 && n <= 28))] : [];
      state.notes = value.notes && typeof value.notes === 'object' && !Array.isArray(value.notes) ? value.notes : {};
      state.last = Number.isInteger(value.last) && value.last >= 1 && value.last <= 28 ? value.last : 1;
    }
  } catch (_) { storageWorks = false; }
  function readLatest() {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      if(value && typeof value === 'object') return {
        completed: Array.isArray(value.completed) ? [...new Set(value.completed.filter(n => Number.isInteger(n) && n>=1 && n<=28))] : [],
        notes: value.notes && typeof value.notes === 'object' && !Array.isArray(value.notes) ? value.notes : {},
        last: Number.isInteger(value.last) && value.last>=1 && value.last<=28 ? value.last : 1
      };
    } catch (_) { storageWorks=false; }
    return state;
  }
  function storageStatus() {
    document.querySelectorAll('[data-storage-status]').forEach(el => {el.textContent=storageWorks ? '进度与笔记保存在此浏览器；换设备前可导出记录。' : '浏览器保存受限：本页改动暂留在内存中，请导出笔记保留内容。';});
  }
  function save(patch) {
    const latest = storageWorks ? readLatest() : state;
    state = {...latest, ...patch, notes: {...latest.notes, ...(patch.notes || {})}};
    try { localStorage.setItem(key, JSON.stringify(state)); storageWorks=true; storageStatus(); return true; }
    catch (_) { storageWorks=false; storageStatus(); return false; }
  }
  function updateProgress() {
    document.querySelectorAll('[data-progress-text]').forEach(el => {el.textContent = `已完成 ${state.completed.length} / 28 讲`;});
    document.querySelectorAll('.progress-fill').forEach(el => { el.style.width = `${state.completed.length / 28 * 100}%`; });
    document.querySelectorAll('[data-complete]').forEach(button => {
      const done = state.completed.includes(Number(button.dataset.complete));
      button.textContent = done ? '✓ 已学完 · 撤销' : '标记本讲已学完';
      button.setAttribute('aria-pressed', String(done));
    });
    document.querySelectorAll('[data-stage-progress]').forEach(el => {
      const n = Number(el.dataset.stageProgress);
      const count = state.completed.filter(x => x > (n - 1) * 4 && x <= n * 4).length;
      el.textContent = `${count} / 4 讲已完成`;
    });
    const resume = document.querySelector('[data-resume]');
    if (resume) {
      const n = state.last;
      resume.href = `stage-${Math.ceil(n / 4)}.html#lesson-${n}`;
      resume.textContent = state.completed.length || n > 1 ? `继续学习 · 第 ${n} 讲 →` : '从第 1 讲开始 →';
    }
  }
  document.querySelectorAll('[data-complete]').forEach(button => button.addEventListener('click', () => {
    const n = Number(button.dataset.complete);
    if(storageWorks) state=readLatest();
    const completed=state.completed.includes(n) ? state.completed.filter(x => x !== n) : [...state.completed,n].sort((a,b)=>a-b);
    save({completed,last:Math.min(28,n+1)}); updateProgress();
  }));
  document.querySelectorAll('[data-note]').forEach(input => {
    const value = state.notes[input.dataset.note];
    if (typeof value === 'string') input.value = value;
    const status = input.parentElement.querySelector('.save-status');
    input.addEventListener('input', () => {
      const saved = save({notes:{[input.dataset.note]:input.value}});
      if (status) status.textContent = saved ? '已保存在此浏览器。换设备前可导出笔记。' : '此浏览器无法保存，请导出笔记以保留内容。';
    });
  });
  function exportNotes() {
    if(storageWorks) state=readLatest();
    let content = '# 从一个神经元到大模型 · 我的学习记录\n\n';
    content += `已完成：${state.completed.join('、') || '尚未标记'}\n\n`;
    Object.entries(state.notes).forEach(([name, value]) => {if (typeof value === 'string' && value.trim()) content += `## ${name}\n\n${value}\n\n`;});
    const blob = new Blob([content], {type:'text/markdown;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const dialog=document.createElement('dialog');dialog.className='export-dialog';
    const heading=document.createElement('h2');heading.textContent='导出学习记录';
    const intro=document.createElement('p');intro.textContent='保存为 Markdown，或复制到自己的笔记中。';
    const area=document.createElement('textarea');area.readOnly=true;area.value=content;area.setAttribute('aria-label','待导出的学习记录');
    const actions=document.createElement('div');actions.className='controls';
    const link=document.createElement('a');link.href=url;link.download='AI学习记录.md';link.className='button primary';link.textContent='保存 Markdown 文件';
    const copy=document.createElement('button');copy.textContent='复制全部文字';
    const close=document.createElement('button');close.textContent='关闭';
    const message=document.createElement('p');message.className='small muted';message.setAttribute('role','status');
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(content);message.textContent='已复制。';}catch(_){area.focus();area.select();message.textContent='文字已选中，请按 Command+C 或 Ctrl+C 复制。';}});
    close.addEventListener('click',()=>{if(dialog.close)dialog.close();else dialog.remove();});
    dialog.addEventListener('close',()=>{URL.revokeObjectURL(url);dialog.remove();});
    actions.append(link,copy,close);dialog.append(heading,intro,area,actions,message);document.body.appendChild(dialog);
    if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
  }

  document.querySelectorAll('[data-export]').forEach(b => b.addEventListener('click', exportNotes));
  const theme = document.querySelector('[data-theme-toggle]');
  const motion = document.querySelector('[data-motion-toggle]');
  function syncControls() {
    const dark = document.documentElement.dataset.theme === 'dark';
    if (theme) { theme.textContent = dark ? '浅色' : '深色'; theme.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式'); theme.setAttribute('aria-pressed', String(dark)); }
    if (motion) {const off = document.documentElement.dataset.motion === 'off'; motion.textContent = off ? '动效已关' : '关闭动效'; motion.setAttribute('aria-pressed', String(off));}
    const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = dark ? '#0c0e16' : '#f5f5f7';
  }
  if (theme) theme.addEventListener('click', () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try {localStorage.setItem('bigghost-note-ai-foundations-theme',document.documentElement.dataset.theme);} catch (_) {}
    syncControls(); document.dispatchEvent(new Event('course-theme-change'));
  });
  if (motion) motion.addEventListener('click', () => {
    document.documentElement.dataset.motion = document.documentElement.dataset.motion === 'off' ? 'on' : 'off';
    try {localStorage.setItem('bigghost-note-ai-foundations-motion',document.documentElement.dataset.motion);} catch (_) {}
    syncControls();
  });
  document.querySelectorAll('[data-quiz]').forEach(field => {
    const button = field.querySelector('[data-check]');
    const output = field.querySelector('.quiz-feedback');
    button.addEventListener('click', () => {
      const selected = field.querySelector('input:checked');
      output.classList.remove('correct');
      if (!selected) {output.textContent = '先选一个答案，再检查自己的判断。'; return;}
      const correct = selected.value === field.dataset.correct;
      output.classList.toggle('correct',correct);
      output.textContent = (correct ? '判断正确。' : '再想一步：') + field.querySelector('[data-answer-text]').textContent;
    });
  });
  const search = document.querySelector('[data-search]');
  if (search) search.addEventListener('input', () => {
    const q = search.value.trim().toLocaleLowerCase(); let count = 0;
    document.querySelectorAll('.stage-card').forEach(card => {card.hidden = !card.dataset.search.toLocaleLowerCase().includes(q); if (!card.hidden) count++;});
    const output = document.querySelector('[data-search-status]'); if(output) output.textContent = q ? `找到 ${count} 个相关阶段` : '';
  });
  const lessons = document.querySelectorAll('.lesson[id]');
  if ('IntersectionObserver' in window && lessons.length) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if(entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.lesson-nav a').forEach(a => {const active = a.getAttribute('href') === '#' + id; a.classList.toggle('active', active); if(active) a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
        const n = Number(id.replace('lesson-','')); if(n >= 1 && n <= 28) {save({last:n});}
      }
    },{rootMargin:'-90px 0px -60% 0px'});
    lessons.forEach(el => observer.observe(el));
  }
  const printDetails = [];
  window.addEventListener('beforeprint', () => {
    printDetails.length=0;
    document.querySelectorAll('details').forEach(el => {if (!el.open) {printDetails.push(el);el.open=true;}});
    document.querySelectorAll('.print-note').forEach(el => el.remove());
    document.querySelectorAll('[data-note]').forEach(input => {
      const copy=document.createElement('div');copy.className='print-note print-only';copy.textContent=input.value || '（留白：写下你的解释、算例与实验记录）';input.after(copy);
    });
  });
  window.addEventListener('afterprint', () => {printDetails.forEach(el=>el.open=false);document.querySelectorAll('.print-note').forEach(el=>el.remove());});
  document.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
  document.querySelectorAll('.lab[data-lab]').forEach(root => {
    const init = (window.CourseLabs || {})[root.dataset.lab];
    if (typeof init !== 'function') return;
    try { init(root); root.dataset.ready='true'; }
    catch(error) {const p=document.createElement('p');p.className='callout';p.textContent='这个实验暂时无法启动，下面的算例与讲解仍可阅读。';root.appendChild(p);console.error(root.dataset.lab,error);}
  });
  if(!storageWorks) document.querySelectorAll('[data-storage-status]').forEach(el=>{el.textContent='浏览器保存受限，学习结束前请导出笔记。';});
  window.addEventListener('storage', event => {
    if(event.key !== key) return;
    state=readLatest(); updateProgress();
    document.querySelectorAll('[data-note]').forEach(input=>{if(document.activeElement!==input && typeof state.notes[input.dataset.note]==='string') input.value=state.notes[input.dataset.note];});
  });
  updateProgress(); syncControls(); storageStatus();
})();
