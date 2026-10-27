import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialData, shiftDate, taskMatches, summarize } from '../public/domain.js';
import { validWorkspace } from '../public/workspace-validation.js';
test('date calculations cross year and leap-day boundaries correctly', () => {
  assert.equal(shiftDate('2026-12-31',1),'2027-01-01');
  assert.equal(shiftDate('2028-02-28',1),'2028-02-29');
});
test('today includes overdue tasks but excludes completed and future tasks', () => {
  const task = {date:'2026-10-26', done:false};
  assert.equal(taskMatches(task,'today','2026-10-27'),true);
  assert.equal(taskMatches({...task,done:true},'today','2026-10-27'),false);
  assert.equal(taskMatches({...task,date:'2026-10-28'},'today','2026-10-27'),false);
  assert.equal(taskMatches(task,'overdue','2026-10-27'),true);
});
test('briefing reflects task completion and only the selected day’s events', () => {
  const data = createInitialData('2026-10-27');
  assert.equal(summarize(data,'2026-10-27').today.length,3);
  data.tasks[0].done = true;
  assert.equal(summarize(data,'2026-10-27').today.length,2);
  assert.equal(summarize(data,'2026-10-27').events.length,3);
  assert.equal(summarize(data,'2026-10-28').events.length,0);
});
test('backup import accepts valid data and rejects invalid dates and duplicate IDs', () => {
  const data=createInitialData('2026-10-27');
  assert.equal(validWorkspace(data),true);
  data.tasks[0].date='2026-02-31'; assert.equal(validWorkspace(data),false);
  data.tasks[0].date='2026-10-27'; data.tasks.push({...data.tasks[0]}); assert.equal(validWorkspace(data),false);
});
