const url=`http://localhost:${Number(process.env.ONDO_PORT || 3000)}`;
try {
  const health=await fetch(`${url}/api/health`,{signal:AbortSignal.timeout(1500)}).then(r=>r.json());
  if (health.app !== 'ondo-local-office-v1') throw Error('이 주소의 프로그램은 ONDO 오피스가 아닙니다.');
  const {token}=await fetch(`${url}/api/session`).then(r=>r.json());
  const response=await fetch(`${url}/api/shutdown`,{method:'POST',headers:{'Content-Type':'application/json','X-ONDO-Token':token},body:'{}'});
  if (!response.ok) throw Error('종료하지 못했습니다.');
  console.log('ONDO 오피스를 종료했습니다. 저장된 업무 데이터는 유지됩니다.');
} catch(error) { if(error.cause?.code === 'ECONNREFUSED') console.log('ONDO 오피스가 실행 중이 아닙니다.'); else { console.error(error.message); process.exitCode=1; } }
