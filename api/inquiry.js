const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const sbHeaders = () => ({
  apikey: SB_KEY,
  ...(String(SB_KEY).startsWith('eyJ') ? { Authorization: `Bearer ${SB_KEY}` } : {}),
  'Content-Type': 'application/json',
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능해요' });
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Supabase 연결 정보가 없어요. Vercel Storage 연결 후 다시 배포해 주세요.' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (b.website) return res.status(200).json({ ok: true }); // 스팸 함정 칸(사람에게는 안 보임)
  const row = {
    organization: clip(b.organization, 100),
    name: clip(b.name, 50),
    email: clip(b.email, 100),
    event_date: clip(b.event_date, 10),
    region: clip(b.region, 50),
    consent: b.consent === true,
  };
  if (!row.organization || !row.name || !row.email || !row.event_date || !row.region) {
    return res.status(400).json({ error: '빈칸을 모두 채워 주세요.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return res.status(400).json({ error: '이메일 주소를 다시 확인해 주세요.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.event_date)) return res.status(400).json({ error: '행사 날짜를 다시 골라 주세요.' });
  if (!row.consent) return res.status(400).json({ error: '개인정보 수집·이용에 동의해 주세요.' });
  const r = await fetch(`${SB_URL}/rest/v1/inquiries`, { method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!r.ok) return res.status(500).json({ error: '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' });
  return res.status(200).json({ ok: true });
};
