import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialData, shiftDate, taskMatches, summarize } from '../public/domain.js';
import assistant from '../api/assistant.mjs';
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
test('hosted version cannot access local Codex authentication', async () => {
  const res={setHeader(){},status(code){this.code=code;return this;},json(value){this.body=value;}};
  await assistant({method:'GET'},res);
  assert.equal(res.body.configured,false);
  assert.equal(res.body.mode,'web');
  await assistant({method:'POST'},res);
  assert.equal(res.code,503);
  assert.equal(typeof res.body.error,'string');
});
