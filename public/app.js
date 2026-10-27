import { dateKey, prettyDate, taskMatches, createInitialData, summarize } from './domain.js';
import { validWorkspace } from './workspace-validation.js';
const $ = selector => document.querySelector(selector);
const main = $('#main');
const KEY = 'ondo-office-v1';
const labels = { dashboard: '대시보드', tasks: '할 일', calendar: '일정', documents: '문서' };
const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="m8 12 3 3 5-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8m-8 4h5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  settings: '<path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z"/><circle cx="12" cy="12" r="3"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  leaf: '<path d="M4 20C-1 6 10 2 21 3c1 12-7 19-17 17ZM4 20 15 9"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z"/>',
  left: '<path d="m15 6-6 6 6 6"/>', right: '<path d="m9 6 6 6-6 6"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.file}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });
let data, storageIssue = '', firstVisit = false;
try {
  const saved = localStorage.getItem(KEY);
  firstVisit = !saved;
  data = saved ? JSON.parse(saved) : createInitialData();
  if (!validWorkspace(data)) throw Error('Invalid data');
} catch {
  // Keep a damaged record intact so it can be recovered rather than silently replacing it.
  data = createInitialData();
  storageIssue = '브라우저 저장소를 읽을 수 없어 임시로 실행 중입니다. 데이터 백업 후 저장소 설정을 확인해 주세요.';
}
let taskFilter = 'today', fullFilter = 'open', calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1), search = '';
let toastTimer;
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3500); }
function save() {
  if (storageIssue) { toast('임시 변경입니다. 데이터 백업으로 보관해 주세요.'); return; }
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { storageIssue = '저장 공간이 부족하거나 접근이 차단돼 변경 사항을 저장하지 못했어요. 데이터 백업을 이용해 주세요.'; toast(storageIssue); }
}
const page = () => Object.hasOwn(labels, location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard';
const empty = (text, type = 'leaf') => `<div class="empty">${icon(type)}${text}</div>`;
const addButton = (type, text) => `<button class="button primary" data-new="${type}">${icon('plus')}${text}</button>`;
const title = (name, desc, action = '') => `<div class="page-title"><div><span class="eyebrow">MY WORKSPACE</span><h1>${name}</h1><p>${desc}</p></div>${action}</div>`;
function taskRow(task) {
  const due = task.date < dateKey() && !task.done ? ' · 기한 지남' : '';
  return `<div class="task-row ${task.done ? 'done' : ''}"><input type="checkbox" class="task-check" data-toggle="${esc(task.id)}" ${task.done ? 'checked' : ''} aria-label="${esc(task.title)} 완료"><div class="task-body"><button data-edit="task" data-id="${esc(task.id)}">${esc(task.title)}</button><small>${esc(task.project || '개인 업무')}<span> · ${prettyDate(task.date)}${due}</span></small></div><span class="pill ${esc(task.priority)}">${{ high: '높음', medium: '보통', low: '낮음' }[task.priority]}</span></div>`;
}
function docCard(doc) {
  return `<button class="doc-card" data-edit="doc" data-id="${esc(doc.id)}"><span class="doc-icon">${icon('file')}</span><span class="doc-tag">${esc(doc.category || '노트')}</span><strong>${esc(doc.title)}</strong><p>${esc(doc.content || '아직 내용이 없어요. 생각을 기록해 보세요.')}</p><small>${prettyDate(dateKey(new Date(doc.updated)))} 수정</small></button>`;
}
function eventRow(event) {
  return `<div class="event-row"><span class="event-time">${esc(event.time)}</span><button class="event-card ${esc(event.color)}" data-edit="event" data-id="${esc(event.id)}"><strong>${esc(event.title)}</strong><small>${esc(event.time)} – ${esc(event.end)} &nbsp;·&nbsp; ${esc(event.place || '장소 미정')}</small></button></div>`;
}
function dashboard() {
  const s = summarize(data), doneToday = s.done.filter(t => t.date === dateKey()).length;
  const completion = data.tasks.length ? Math.round(s.done.length / data.tasks.length * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '반가워요' : '수고한 하루예요';
  const stats = [
    ['오늘 할 일', s.today.length, '개', `${s.overdue.length ? `기한 지난 업무 ${s.overdue.length}개 포함` : '오늘의 작은 목표를 시작해요'}`, 'check'],
    ['오늘의 일정', s.events.length, '개', s.events[0] ? `첫 일정 ${s.events[0].time}` : '새로운 일정을 등록해 보세요', 'calendar'],
    ['보관 중인 문서', data.docs.length, '개', '흩어진 생각을 한곳에', 'file'],
    ['업무 달성률', completion, '%', `오늘 마감 업무 중 ${doneToday}개 완료`, 'leaf']
  ];
  const tasks = data.tasks.filter(t => taskMatches(t, taskFilter)).sort((a, b) => a.date.localeCompare(b.date));
  return title('나의 하루, 한눈에', '복잡한 업무는 가볍게, 중요한 일에 더 집중하세요.', `<button class="date-button" data-action="today">${icon('calendar')}${prettyDate(dateKey(), { year: 'numeric', weekday: 'short' })}</button>`) +
  `<section class="hero"><div class="hero-content"><span class="eyebrow">A LITTLE CLARITY, A BETTER DAY</span><h2>${greeting} ☀<br><strong>오늘도 나만의 속도로, 시작해 볼까요?</strong></h2><p>할 일 ${s.today.length}개와 일정 ${s.events.length}개가 기다리고 있어요.<br>가장 중요한 일부터 하나씩 정리해 보세요.</p><div class="hero-buttons"><button class="button primary" data-action="briefing">✦ 오늘의 업무 브리핑</button><a class="text-button" href="#calendar">일정 살펴보기 ${icon('arrow')}</a></div></div><div class="hero-art" aria-hidden="true"><div class="art-paper"></div><div class="art-orb">✦</div><div class="art-leaf"></div></div></section>
  <section class="stats" aria-label="업무 현황">${stats.map(([label, value, unit, detail, glyph]) => `<div class="stat"><div class="stat-top">${label}<span class="stat-icon">${icon(glyph)}</span></div><div class="stat-number"><strong>${value}</strong><span>${unit}</span></div><p class="stat-bottom"><span class="mini-dot"></span>${detail}</p></div>`).join('')}</section>
  <div class="dashboard-grid"><div><section class="panel"><div class="panel-header"><h2>나의 할 일 <span class="count">${s.today.length}</span></h2><a class="text-button" href="#tasks">전체 보기 ${icon('arrow')}</a></div><div class="tabs" role="group" aria-label="할 일 필터">${[['today', '오늘'], ['open', '진행 중'], ['done', '완료']].map(([key, label]) => `<button data-filter="${key}" class="${taskFilter === key ? 'selected' : ''}">${label}</button>`).join('')}</div>${tasks.slice(0, 5).map(taskRow).join('') || empty('여유로운 하루네요.<br>새로운 할 일을 추가해 보세요.')}<div class="panel-bottom"><button data-new="task">${icon('plus')}새로운 할 일 추가</button></div></section><section class="panel docs-panel"><div class="panel-header"><h2>최근 문서</h2><a class="text-button" href="#documents">전체 보기 ${icon('arrow')}</a></div><div class="doc-grid">${[...data.docs].sort((a,b) => b.updated.localeCompare(a.updated)).slice(0,3).map(docCard).join('') || empty('첫 문서를 작성해 보세요.', 'file')}</div></section></div>
  <div class="dashboard-right"><section class="panel"><div class="panel-header"><h2>오늘의 일정 <span class="count">${s.events.length}</span></h2><a class="text-button" href="#calendar" aria-label="전체 일정 보기">${icon('arrow')}</a></div><p class="agenda-label">${prettyDate(dateKey(), { weekday: 'long' })}</p><div class="timeline">${s.events.map(eventRow).join('') || empty('오늘은 등록된 일정이 없어요.', 'calendar')}</div><div class="panel-bottom"><button data-new="event">${icon('plus')}일정 추가하기</button></div></section><section class="focus-card"><span class="eyebrow">A MOMENT FOR YOU</span><h3>잘하고 있어요. 잠깐 쉬어 갈까요?</h3><p>작은 휴식이 새로운 집중을 만들어요.<br>물 한 잔과 함께 생각을 정리해 보세요.</p><button data-new="doc">떠오른 생각 기록하기 ↗</button><span class="focus-symbol" aria-hidden="true">✳</span></section></div></div>`;
}
function tasksPage() {
  const tasks = data.tasks.filter(t => taskMatches(t, fullFilter)).sort((a,b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date));
  return title('할 일', '하나씩 마무리하며, 나의 속도를 만들어 가세요.', addButton('task', '할 일 추가')) + `<div class="section-toolbar"><select id="task-filter" aria-label="할 일 필터">${[['open','진행 중'],['today','오늘까지'],['overdue','기한 지남'],['done','완료'],['all','전체']].map(([key,label]) => `<option value="${key}" ${key === fullFilter ? 'selected' : ''}>${label}</option>`).join('')}</select><span>${tasks.length}개의 할 일</span></div><section class="panel full-task">${tasks.map(taskRow).join('') || empty('해당하는 할 일이 없어요. 새로운 목표를 추가해 보세요.')}</section>`;
}
function documentsPage() {
  return title('문서', '아이디어부터 회의록까지, 필요한 기록을 한곳에.', addButton('doc', '새 문서')) + `<section class="panel"><div class="panel-header"><h2>모든 문서 <span class="count">${data.docs.length}</span></h2><span class="panel-subtitle">최근 수정 순</span></div><div class="doc-grid full-docs">${[...data.docs].sort((a,b) => b.updated.localeCompare(a.updated)).map(docCard).join('') || empty('아직 문서가 없어요. 첫 기록을 남겨 보세요.', 'file')}</div></section>`;
}
function calendarPage() {
  const start = new Date(calendarMonth); start.setDate(1 - start.getDay());
  const cells = Array.from({length:42}, (_,i) => { const d = new Date(start); d.setDate(start.getDate()+i); const key = dateKey(d); return `<div class="calendar-day ${d.getMonth() !== calendarMonth.getMonth() ? 'other' : ''} ${key === dateKey() ? 'today' : ''}" data-day="${key}" role="button" tabindex="0" aria-label="${prettyDate(key)} 일정 추가"><span class="day-number">${d.getDate()}</span>${data.events.filter(e => e.date === key).sort((a,b) => a.time.localeCompare(b.time)).map(e => `<button class="calendar-event ${esc(e.color)}" data-edit="event" data-id="${esc(e.id)}">${esc(e.time)} ${esc(e.title)}</button>`).join('')}</div>`; });
  return title('일정', '할 일 사이사이, 나를 위한 시간도 남겨 두세요.', addButton('event', '일정 추가')) + `<section class="panel"><div class="panel-header"><div class="calendar-toolbar"><button class="icon-button" data-month="-1" aria-label="이전 달">${icon('left')}</button><h2>${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth()+1}월</h2><button class="icon-button" data-month="1" aria-label="다음 달">${icon('right')}</button></div><button class="button" data-action="today">오늘</button></div><div class="calendar">${['일','월','화','수','목','금','토'].map(d => `<div class="calendar-weekday">${d}</div>`).join('')}${cells.join('')}</div></section>`;
}
function searchPage() {
  const query = search.toLocaleLowerCase();
  const results = [...data.tasks.map(t => ({...t, type:'task', label:'할 일', detail:t.project})), ...data.docs.map(d => ({...d, type:'doc', label:'문서', detail:d.content})), ...data.events.map(e => ({...e, type:'event', label:'일정', detail:e.date}))].filter(item => `${item.title} ${item.detail}`.toLocaleLowerCase().includes(query));
  return title('검색 결과', `“${esc(search)}” 검색 결과 ${results.length}개`) + `<div class="search-results">${results.map(item => `<button class="search-result" data-edit="${item.type}" data-id="${esc(item.id)}">${icon(item.type === 'task' ? 'check' : item.type === 'event' ? 'calendar' : 'file')}<div>${esc(item.title)}<small>${item.label} · ${esc(String(item.detail || '').slice(0,70))}</small></div></button>`).join('') || empty('검색 결과가 없어요. 다른 단어로 검색해 보세요.', 'search')}</div>`;
}
function render() {
  const current = page();
  $('#breadcrumb-title').textContent = search ? '검색 결과' : labels[current];
  document.querySelectorAll('nav [data-page]').forEach(a => { a.classList.toggle('active', a.dataset.page === current && !search); if (a.dataset.page === current && !search) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  $('#nav-task-count').textContent = data.tasks.filter(t => !t.done).length;
  main.innerHTML = (storageIssue ? `<div class="storage-error">${esc(storageIssue)}</div>` : '') + (search ? searchPage() : ({dashboard, tasks:tasksPage, documents:documentsPage, calendar:calendarPage}[current])());
}
function openDialog(id) { const d = document.getElementById(id); if (!d.open) d.showModal(); }
function editorHeader(title, eyebrow = 'YOUR WORKSPACE') { return `<div class="dialog-header"><div><span class="eyebrow">${eyebrow}</span><h2 id="editor-title">${title}</h2></div><button class="icon-button" data-close="editor" aria-label="닫기">×</button></div>`; }
function field(label, name, value = '', type = 'text', extras = '') { return `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extras}></label>`; }
function edit(type, id, chosenDate) {
  const collection = {task:'tasks', event:'events', doc:'docs'}[type];
  const item = data[collection].find(x => x.id === id);
  const value = item || {date:chosenDate || dateKey(), time:'09:00', end:'10:00', priority:'medium', color:'green', category:'노트'};
  let fields = field('제목', 'title', value.title, 'text', 'required maxlength="120" placeholder="제목을 입력하세요"');
  if (type === 'task') fields += field('프로젝트 또는 분류', 'project', value.project, 'text', 'maxlength="60" placeholder="개인 업무"') + `<div class="field-row">${field('마감일','date',value.date,'date','required')}<label class="field"><span>우선순위</span><select name="priority">${[['high','높음'],['medium','보통'],['low','낮음']].map(([k,v])=>`<option value="${k}" ${value.priority === k ? 'selected':''}>${v}</option>`).join('')}</select></label></div>`;
  if (type === 'event') fields += field('날짜','date',value.date,'date','required') + `<div class="field-row">${field('시작','time',value.time,'time','required')}${field('종료','end',value.end,'time','required')}</div>` + field('장소','place',value.place,'text','maxlength="100" placeholder="회의실, 온라인 미팅 등"') + `<label class="field"><span>색상</span><select name="color">${[['green','그린'],['violet','라벤더'],['peach','피치']].map(([k,v])=>`<option value="${k}" ${value.color === k ? 'selected':''}>${v}</option>`).join('')}</select></label>`;
  if (type === 'doc') fields += field('분류','category',value.category,'text','maxlength="40"') + `<label class="field"><span>내용</span><textarea name="content" maxlength="50000" placeholder="자유롭게 생각을 기록해 보세요.">${esc(value.content || '')}</textarea></label>`;
  $('#editor').innerHTML = editorHeader(`${item ? '수정' : '새로 만들기'} · ${{task:'할 일', event:'일정', doc:'문서'}[type]}`) + `<form id="item-form" data-type="${type}" data-id="${id || ''}">${fields}<div class="dialog-footer">${item ? '<button type="button" class="delete" data-action="delete-item">삭제</button>' : ''}<button type="button" class="button" data-close="editor">취소</button><button class="button primary" type="submit">저장하기</button></div></form>`;
  openDialog('editor');
}
document.addEventListener('submit', event => {
  if (event.target.id !== 'item-form') return;
  event.preventDefault();
  const form = event.target, values = Object.fromEntries(new FormData(form)), type = form.dataset.type;
  if (!values.title.trim()) { form.elements.title.setCustomValidity('제목을 입력해 주세요.'); form.elements.title.reportValidity(); return; }
  if (type === 'event' && values.end <= values.time) { form.elements.end.setCustomValidity('종료 시간은 시작 시간보다 늦어야 해요.'); form.elements.end.reportValidity(); return; }
  const collection = {task:'tasks', event:'events', doc:'docs'}[type];
  const existing = data[collection].find(x=>x.id === form.dataset.id);
  const entry = {...existing, ...values, title:values.title.trim(), id:existing?.id || crypto.randomUUID()};
  if (type === 'task') entry.done = existing?.done || false;
  if (type === 'doc') entry.updated = new Date().toISOString();
  if (existing) Object.assign(existing,entry); else data[collection].push(entry);
  save(); $('#editor').close(); render(); toast(storageIssue ? '임시로 반영했어요. 데이터 백업을 해 주세요.' : '저장했어요.');
});
document.addEventListener('input', event => { if (event.target.form?.id === 'item-form') event.target.setCustomValidity(''); });
function briefing() {
  const s = summarize(data);
  $('#editor').innerHTML = editorHeader('오늘의 업무 브리핑', 'DAILY BRIEFING') + `<p class="info-copy">${prettyDate(dateKey(),{weekday:'long'})} · 저장된 업무를 바탕으로 정리했어요.</p><div class="brief-list"><p>☑ 오늘까지 마무리할 업무는 <strong>${s.today.length}개</strong>예요.${s.overdue.length ? ` 이 중 기한이 지난 업무는 ${s.overdue.length}개예요.` : ''}</p><p>⚑ 우선순위가 높은 업무는 <strong>${s.high.length}개</strong>예요.${s.high[0] ? `<br>먼저 “${esc(s.high[0].title)}”부터 시작해 보세요.` : ' 여유 있게 오늘의 목표를 정해 보세요.'}</p><p>◷ 오늘 일정은 <strong>${s.events.length}개</strong>예요.${s.events.map(e => `<br>${esc(e.time)} · ${esc(e.title)}`).join('')}</p></div><div class="dialog-footer"><button class="button" data-close="editor">닫기</button><button class="button primary" data-close="editor" data-go="tasks">할 일 관리하기</button></div>`;
  openDialog('editor');
}
const actions = {
  briefing,
  today() { calendarMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1); if (location.hash === '#calendar') render(); else location.hash = 'calendar'; },
  notifications() {
    const events = data.events.filter(e => e.date >= dateKey()).sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0,8);
    $('#editor').innerHTML = editorHeader('다가오는 일정') + (events.length ? events.map(e => `<p class="agenda-label">${prettyDate(e.date)}</p>${eventRow(e)}`).join('') : empty('다가오는 일정이 없어요.','calendar')); openDialog('editor');
  },
  settings() { $('#editor').innerHTML = editorHeader('나만의 워크스페이스') + '<p class="info-copy">ONDO Office · 웹 버전<br><br>문서, 일정, 할 일은 현재 브라우저에 저장돼요. 다른 기기나 브라우저와 자동으로 동기화되지 않아요. 중요한 기록은 JSON 백업으로 보관해 주세요.<br><br>기존 PC 버전 데이터도 백업 가져오기로 옮길 수 있어요. 가져오면 현재 브라우저의 데이터가 교체돼요.<br><br>처음 표시된 업무와 일정은 사용법을 위한 예시예요.</p><div class="dialog-footer"><button class="button" data-action="import">백업 가져오기</button><button class="button" data-action="export">JSON 백업</button><button class="button primary" data-close="editor">확인</button></div>'; openDialog('editor'); },
  import() { $('#backup-file').click(); },
  export() { const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`ondo-backup-${dateKey()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); toast('백업 파일을 다운로드했어요.'); },
  'delete-item'() {
    const form = $('#item-form');
    if (!form || !confirm('이 항목을 삭제할까요? 삭제 전에 데이터 백업으로 보관할 수 있어요.')) return;
    const collection = {task:'tasks',event:'events',doc:'docs'}[form.dataset.type];
    data[collection] = data[collection].filter(x=>x.id !== form.dataset.id); save(); $('#editor').close(); render(); toast('삭제했어요.');
  }
};
document.addEventListener('click', event => {
  const el = event.target.closest('[data-action],[data-new],[data-edit],[data-close],[data-filter],[data-month],[data-day]'); if (!el) return;
  if (el.dataset.go) { document.getElementById('editor').close(); location.hash=el.dataset.go; }
  else if (el.dataset.close) document.getElementById(el.dataset.close).close();
  else if (el.dataset.action) actions[el.dataset.action]?.();
  else if (el.dataset.new) edit(el.dataset.new);
  else if (el.dataset.edit) edit(el.dataset.edit,el.dataset.id);
  else if (el.dataset.filter) { taskFilter=el.dataset.filter; render(); }
  else if (el.dataset.month) { calendarMonth.setMonth(calendarMonth.getMonth()+Number(el.dataset.month)); render(); }
  else if (el.dataset.day) edit('event',null,el.dataset.day);
});
document.addEventListener('change', event => {
  if (event.target.dataset.toggle) { const task=data.tasks.find(t=>t.id === event.target.dataset.toggle); if (task) { task.done=event.target.checked; save(); render(); } }
  if (event.target.id === 'task-filter') { fullFilter=event.target.value; render(); }
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName) && !document.querySelector('dialog[open]')) { event.preventDefault(); $('#global-search').focus(); }
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.calendar-day')) { event.preventDefault(); edit('event',null,event.target.dataset.day); }
});
$('#global-search').addEventListener('input', event=> { search=event.target.value.trim(); render(); });
window.addEventListener('hashchange',()=> { search=''; $('#global-search').value=''; render(); main.focus({preventScroll:true}); });
$('#backup-file').addEventListener('change',async event=> {
  const file=event.target.files[0]; event.target.value=''; if(!file) return;
  try {
    if(file.size>10_000_000) throw Error('백업 파일이 너무 큽니다.');
    const imported=JSON.parse(await file.text());
    if(!validWorkspace(imported)) throw Error('올바른 ONDO 백업 파일이 아닙니다.');
    if(!confirm('백업 파일의 내용으로 현재 업무 데이터를 교체할까요? 현재 데이터는 먼저 백업해 주세요.')) return;
    data=imported; storageIssue=''; save(); render();
    toast(storageIssue ? '저장에 실패했어요. 백업 파일을 보관해 주세요.' : '백업 데이터를 가져왔어요.');
  } catch(error) { toast(error.message); }
});
render();
if (firstVisit && !storageIssue) { save(); toast('예시 데이터로 시작했어요. 내 업무로 자유롭게 바꿔 보세요.'); }
