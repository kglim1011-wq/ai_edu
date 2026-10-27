import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CodexBridge, codexEnvironment, inferenceArgs, parseInference, cleanContext } from '../scripts/codex-bridge.mjs';
import { WorkspaceStore, validWorkspace } from '../scripts/workspace-store.mjs';
import { createOfficeServer } from '../scripts/local-server.mjs';
import { createInitialData } from '../public/domain.js';

test('child process receives OS essentials but no API credentials or parent session',()=> {
  const env=codexEnvironment({Path:'bin',USERPROFILE:'user',CODEX_HOME:'login',OPENAI_API_KEY:'secret',AI_GATEWAY_API_KEY:'other',CODEX_THREAD_ID:'parent',OPENAI_BASE_URL:'proxy'});
  assert.deepEqual(env,{Path:'bin',USERPROFILE:'user',CODEX_HOME:'login'});
  const args=inferenceArgs('work');
  assert.ok(args.includes('forced_login_method="chatgpt"'));
  assert.ok(args.includes('--ignore-user-config'));
  assert.ok(args.includes('features.shell_tool=false'));
  assert.ok(args.includes('--ephemeral'));
});
test('API-key login is refused before inference with no fallback',async()=> {
  let calls=0;
  const bridge=new CodexBridge({locate:async()=> 'codex',run:async()=>{calls++;return {code:0,stdout:'Logged in using an API key',stderr:''};}});
  assert.equal((await bridge.status()).configured,false);
  await assert.rejects(bridge.ask({prompt:'test'}),/ChatGPT/);
  assert.equal(calls,2);
});
test('AI context omits document bodies and bounds each list',()=> {
  const context=cleanContext({documents:[{title:'Title',content:'private-body',category:'Note'}],tasks:Array.from({length:70},()=>({title:'a'.repeat(200)}))});
  assert.equal(JSON.stringify(context).includes('private-body'),false);
  assert.equal(context.tasks.length,50); assert.equal(context.tasks[0].title.length,120);
});
test('only a completed inference can be reported as an answer',()=> {
  const events=[{type:'item.completed',item:{type:'agent_message',text:'업무 계획'}},{type:'turn.completed',usage:{input_tokens:10,output_tokens:5}}];
  const result=parseInference({code:0,stderr:'',stdout:events.map(e=>JSON.stringify(e)).join('\n')});
  assert.equal(result.text,'업무 계획'); assert.equal(result.billing,'chatgpt-plan');
  assert.throws(()=>parseInference({code:0,stderr:'',stdout:JSON.stringify(events[0])}));
  assert.throws(()=>parseInference({code:1,stderr:'usage limit reached',stdout:''}),/사용 한도/);
});
test('workspace writes survive restart and retain the previous snapshot',async()=> {
  const dir=await mkdtemp(join(tmpdir(),'ondo-store-')),file=join(dir,'office.json');
  const store=new WorkspaceStore(file),first=createInitialData('2026-10-27');
  assert.equal(await store.read(),null); await store.write(first);
  const next=structuredClone(first); next.tasks[0].done=true;
  await store.write(next);
  assert.equal((await new WorkspaceStore(file).read()).tasks[0].done,true);
  assert.equal(JSON.parse(await readFile(file+'.previous','utf8')).tasks[0].done,false);
  await assert.rejects(store.write({version:1,tasks:'bad'}));
  await writeFile(file,'broken'); await assert.rejects(store.read());
  assert.equal(await readFile(file,'utf8'),'broken');
});
test('backup validation rejects impossible dates and ambiguous duplicate IDs',()=> {
  const data=createInitialData('2026-10-27');
  data.tasks[0].date='2026-02-31'; assert.equal(validWorkspace(data),false);
  data.tasks[0].date='2026-10-27'; data.tasks.push({...data.tasks[0]}); assert.equal(validWorkspace(data),false);
});
test('local HTTP enforces host, origin, session token and valid workspace',async()=> {
  const dir=await mkdtemp(join(tmpdir(),'ondo-http-'));
  let aiCalls=0;
  const server=createOfficeServer({store:new WorkspaceStore(join(dir,'office.json')),bridge:{status:async()=>({configured:true,mode:'local'}),ask:async()=>{aiCalls++;return {text:'ok'};}}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    const {token}=await fetch(base+'/api/session').then(r=>r.json());
    const request={method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(createInitialData('2026-10-27'))};
    assert.equal((await fetch(base+'/api/workspace',request)).status,403);
    request.headers['X-ONDO-Token']=token;
    request.headers.Origin='https://unrelated.example';
    assert.equal((await fetch(base+'/api/workspace',request)).status,403);
    request.headers.Origin=base;
    assert.equal((await fetch(base+'/api/workspace',request)).status,200);
    assert.equal((await fetch(base+'/api/workspace').then(r=>r.json())).data.tasks.length,5);
    assert.equal((await fetch(base+'/api/workspace',{...request,body:'{"bad":true}'})).status,400);
    assert.equal((await fetch(base+'/api/assistant',{...request,method:'POST',body:'{"prompt":""}'})).status,400);
    assert.equal(aiCalls,0);
    assert.equal((await fetch(base+'/api/assistant',{...request,method:'POST',body:'{"prompt":"test"}'})).status,200);
    assert.equal(aiCalls,1);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
