import { createOfficeServer } from './local-server.mjs';
const port=Number(process.env.ONDO_PORT || 3000);
const server=createOfficeServer();
server.on('error',error=> { console.error(error.code === 'EADDRINUSE' ? '이 포트가 이미 사용 중입니다. AI오피스 실행.cmd로 기존 오피스를 열어 주세요.' : '오피스 서버를 시작할 수 없습니다.'); process.exitCode=1; });
server.listen(port,'127.0.0.1',()=>console.log(`ONDO PC Office: http://localhost:${port}`));
