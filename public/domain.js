export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const shiftDate = (date, days) => { const next = new Date(date + 'T12:00:00'); next.setDate(next.getDate() + days); return dateKey(next); };
export const prettyDate = (date, options = {}) => new Date(date + 'T12:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', ...options });
export function taskMatches(task, filter, today = dateKey()) {
  if (filter === 'done') return task.done;
  if (filter === 'all') return true;
  if (filter === 'overdue') return !task.done && task.date < today;
  if (filter === 'today') return !task.done && task.date <= today;
  return !task.done;
}
export function createInitialData(today = dateKey()) {
  return {
    version: 1,
    tasks: [
      { id: 'sample-t1', title: '이번 주 업무 계획 정리하기', project: '업무 기획', date: today, priority: 'high', done: false },
      { id: 'sample-t2', title: '프로젝트 제안서 초안 작성', project: '프로젝트', date: today, priority: 'high', done: false },
      { id: 'sample-t3', title: '회의 내용 정리하고 공유하기', project: '커뮤니케이션', date: today, priority: 'medium', done: false },
      { id: 'sample-t4', title: '다음 주 일정 확인하기', project: '개인 업무', date: shiftDate(today, 1), priority: 'low', done: false },
      { id: 'sample-t5', title: '오피스 둘러보고 업무 준비하기', project: '시작하기', date: today, priority: 'low', done: true }
    ],
    events: [
      { id: 'sample-e1', title: '주간 업무 미팅', date: today, time: '10:00', end: '10:30', place: '온라인 미팅', color: 'green' },
      { id: 'sample-e2', title: '프로젝트 아이디어 회의', date: today, time: '14:00', end: '15:00', place: '회의실 A', color: 'violet' },
      { id: 'sample-e3', title: '오늘의 업무 돌아보기', date: today, time: '17:00', end: '17:30', place: '개인 업무', color: 'peach' },
      { id: 'sample-e4', title: '제안서 검토', date: shiftDate(today, 2), time: '11:00', end: '12:00', place: '온라인 미팅', color: 'green' }
    ],
    docs: [
      { id: 'sample-d1', title: '이번 주 업무 계획', category: '업무 기획', content: '이번 주에는 어떤 일에 집중할까요?\n\n1. 가장 중요한 목표를 정해 보세요.\n2. 목표를 작은 할 일로 나누어 보세요.\n3. 캘린더에서 집중할 시간을 확보하세요.\n\n이 문서는 시작을 돕기 위한 예시입니다. 자유롭게 수정해 주세요.', updated: new Date().toISOString() },
      { id: 'sample-d2', title: '프로젝트 아이디어 노트', category: '아이디어', content: '떠오른 아이디어를 편하게 기록하는 공간입니다.\n\n프로젝트 이름:\n해결하고 싶은 문제:\n누구를 위한 서비스인가요?\n가장 먼저 만들어 볼 기능:\n\n작은 아이디어가 다음 프로젝트의 시작이 됩니다.', updated: new Date().toISOString() },
      { id: 'sample-d3', title: '회의록 템플릿', category: '회의록', content: '회의 주제:\n참석자:\n\n이야기한 내용\n- \n\n결정한 내용\n- \n\n다음 할 일\n- 담당자 / 내용 / 마감일', updated: new Date().toISOString() }
    ]
  };
}
export function summarize(data, today = dateKey()) {
  const open = data.tasks.filter(t => !t.done);
  return { today: open.filter(t => t.date <= today), overdue: open.filter(t => t.date < today), high: open.filter(t => t.priority === 'high'), done: data.tasks.filter(t => t.done), events: data.events.filter(e => e.date === today).sort((a, b) => a.time.localeCompare(b.time)) };
}
