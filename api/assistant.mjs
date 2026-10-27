// Hosted previews never access the PC's Codex authentication or spawn Codex.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ configured: false, mode: 'web', reason: 'Codex 요금제 연결은 PC 버전에서 사용할 수 있어요. AI오피스 실행.cmd를 실행해 주세요.' });
  if (req.method === 'POST') return res.status(503).json({ error: 'Codex 요금제 연결은 PC에서만 실행됩니다. AI오피스 실행.cmd를 열어 주세요.' });
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: '지원하지 않는 요청입니다.' });
}
