import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve('public');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
// Development preview only; production serves the static build directly on Vercel.
const server=createServer(async(req,res)=> {
  if(!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end('Method not allowed'); return; }
  try {
    const pathname=new URL(req.url,'http://localhost').pathname;
    const file=resolve(root,'.'+decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if(!file.startsWith(root+sep)) throw Error('Invalid path');
    const content=await readFile(file);
    res.setHeader('Content-Type',types[extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control','no-cache');
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.on('error',()=> { console.error('개발 서버를 시작할 수 없습니다. 포트 사용 상태를 확인해 주세요.'); process.exitCode=1; });
server.listen(Number(process.env.PORT || 3000),'127.0.0.1',()=>console.log('ONDO development preview: http://localhost:3000'));
