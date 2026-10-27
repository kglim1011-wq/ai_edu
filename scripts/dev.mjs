import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assistant from '../api/assistant.mjs';
const root = resolve('public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/assistant') {
    res.status = code => { res.statusCode = code; return res; };
    res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 64000) { res.statusCode = 413; res.end(); return; } }
    try { req.body = body ? JSON.parse(body) : {}; } catch { res.status(400).json({ error: '올바른 JSON 요청이 필요합니다.' }); return; }
    await assistant(req, res); return;
  }
  try {
    const file = resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) throw new Error('Invalid path');
    const content = await readFile(file);
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.end(content);
  } catch { res.statusCode = 404; res.end('Not found'); }
}).listen(3000, '127.0.0.1', () => console.log('ONDO Office: http://127.0.0.1:3000'));
