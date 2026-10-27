// External AI transmission requires the user's explicit authorization.
// This initial version keeps all workspace content in the browser.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ configured: false });
  if (req.method === 'POST') return res.status(503).json({ error: 'AI 연동 전입니다. 대시보드의 기본 업무 브리핑을 이용해 주세요.' });
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: '지원하지 않는 요청입니다.' });
}
