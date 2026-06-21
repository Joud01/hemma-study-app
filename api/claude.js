module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt, system, maxTokens = 4000, key } = req.body;
  if (!key) return res.status(400).json({ error: 'NO_KEY' });

  const geminiBody = {
    contents: [{ role: 'user', parts: [{ text: prompt || '' }] }],
    generationConfig: { maxOutputTokens: maxTokens }
  };
  if (system) geminiBody.system_instruction = { parts: [{ text: system }] };

  const isBearer = key.startsWith('AQ.');
  const url = isBearer
    ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
    : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const headers = { 'Content-Type': 'application/json' };
  if (isBearer) headers['Authorization'] = `Bearer ${key}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(geminiBody)
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini error' });
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
