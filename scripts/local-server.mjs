import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { CodexBridge } from './codex-bridge.mjs';
import { WorkspaceStore } from './workspace-store.mjs';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const APP='ondo-local-office-v1';
export function createOfficeServer({root=resolve('public'),store=new WorkspaceStore(resolve('.local/office.json')),bridge=new CodexBridge()}={}) {
  const token=randomBytes(32).toString('hex');
  const server=createServer(async(req,res)=> {
    const send=(code,value)=> { if (res.destroyed) return; res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(value)); };
    res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer'); res.setHeader('X-Frame-Options','DENY');
    const port=server.address()?.port, hosts=[`localhost:${port}`,`127.0.0.1:${port}`];
    if (!hosts.includes(req.headers.host)) return send(403,{error:'이 PC의 로컬 주소로 접속해 주세요.'});
    if (req.headers.origin && !hosts.some(host=>req.headers.origin === `http://${host}`)) return send(403,{error:'다른 사이트의 요청은 허용되지 않습니다.'});
    if (req.headers['sec-fetch-site'] === 'cross-site') return send(403,{error:'다른 사이트의 요청은 허용되지 않습니다.'});
    const url=new URL(req.url,`http://${req.headers.host}`);
    if (url.pathname === '/api/health' && req.method === 'GET') return send(200,{app:APP,mode:'local'});
    if (url.pathname === '/api/session' && req.method === 'GET') return send(200,{app:APP,token});
    if (url.pathname.startsWith('/api/')) {
      if (!['GET','POST','PUT'].includes(req.method)) return send(405,{error:'지원하지 않는 요청입니다.'});
      if (req.method !== 'GET' && req.headers['x-ondo-token'] !== token) return send(403,{error:'연결을 새로고침한 뒤 다시 시도해 주세요.'});
      let body;
      if (req.method !== 'GET') {
        if (!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'JSON 형식이 필요합니다.'});
        try {
          let bytes=0; const chunks=[];
          for await(const chunk of req) { bytes+=chunk.length; if(bytes > 10_000_000) return send(413,{error:'저장할 데이터가 너무 큽니다.'}); chunks.push(chunk); }
          body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch { return send(400,{error:'올바른 JSON 요청이 필요합니다.'}); }
      }
      try {
        if (url.pathname === '/api/assistant') {
          if (req.method === 'GET') return send(200,await bridge.status());
          if (req.method !== 'POST') return send(405,{error:'지원하지 않는 요청입니다.'});
          if (!body || typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 2000 || JSON.stringify(body).length > 100000 || (body.context && (typeof body.context !== 'object' || Array.isArray(body.context)))) return send(400,{error:'AI 요청은 2,000자 이내로 입력해 주세요.'});
          const controller=new AbortController(); res.on('close',()=> { if (!res.writableEnded) controller.abort(); });
          try { return send(200,await bridge.ask(body,controller.signal)); } catch(error) { return send(503,{error:error.message}); }
        }
        if (url.pathname === '/api/workspace') {
          if (req.method === 'GET') return send(200,{data:await store.read()});
          if (req.method === 'PUT') { await store.write(body); return send(200,{saved:true}); }
          return send(405,{error:'지원하지 않는 요청입니다.'});
        }
        if (url.pathname === '/api/shutdown' && req.method === 'POST') { send(200,{stopped:true}); server.close(); setTimeout(()=>server.closeAllConnections(),500).unref(); return; }
        return send(404,{error:'존재하지 않는 기능입니다.'});
      } catch(error) { return send(400,{error:error.message || '데이터를 처리하지 못했어요.'}); }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(405,{error:'지원하지 않는 요청입니다.'});
    try {
      const file=resolve(root,'.'+decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!file.startsWith(root+sep)) return send(403,{error:'허용되지 않는 파일입니다.'});
      const content=await readFile(file); res.setHeader('Content-Type',types[extname(file)] || 'application/octet-stream'); res.setHeader('Cache-Control','no-cache');
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch { send(404,{error:'파일을 찾을 수 없습니다.'}); }
  });
  server.requestTimeout=180000; return server;
}
