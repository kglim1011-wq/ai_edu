import { spawn } from 'node:child_process';
import { mkdir, open } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.ONDO_PORT || 3000);
const url=`http://localhost:${port}`;
async function ready() {
  try { const res=await fetch(`${url}/api/health`,{signal:AbortSignal.timeout(1000)}); return res.ok && (await res.json()).app === 'ondo-local-office-v1'; } catch { return false; }
}
if (!await ready()) {
  await mkdir(resolve(root,'.local'),{recursive:true});
  const log=await open(resolve(root,'.local/server.log'),'a');
  try {
    const child=spawn(process.execPath,[resolve(root,'scripts/dev.mjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',log.fd,log.fd]});
    child.on('error',()=>{}); child.unref();
  } finally { await log.close(); }
  const deadline=Date.now()+12000;
  while (Date.now()<deadline && !await ready()) await new Promise(r=>setTimeout(r,300));
  if (!await ready()) { console.error('오피스를 열지 못했습니다. 3000번 포트가 사용 중인지 확인해 주세요.'); process.exit(1); }
}
if (process.platform === 'win32' && !process.argv.includes('--no-browser')) {
  const browser=spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{windowsHide:true,detached:true,stdio:'ignore'});
  browser.on('error',()=>console.log(`브라우저에서 ${url} 주소를 열어 주세요.`)); browser.unref();
}
console.log(`ONDO PC Office: ${url}`);
