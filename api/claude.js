module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-device-id');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Diagnostic endpoint — visit /api/claude in browser to check config
  if (req.method === 'GET') {
    const apiKey = process.env.GOOGLE_API_KEY;
    return res.status(200).json({
      status: apiKey ? 'ready' : 'missing_key',
      keyConfigured: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      message: apiKey
        ? 'GOOGLE_API_KEY موجود والخادم جاهز'
        : 'GOOGLE_API_KEY غير موجود — أضفه في Environment Variables على Vercel'
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GOOGLE_API_KEY not configured — add it in Vercel Environment Variables'
    });
  }

  const { prompt, system, maxTokens = 4000 } = req.body;

  try {
    const geminiBody = {
      contents: [{ role: 'user', parts: [{ text: prompt || '' }] }],
      generationConfig: { maxOutputTokens: maxTokens }
    };

    if (system) {
      geminiBody.system_instruction = { parts: [{ text: system }] };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Gemini API error',
        details: data.error
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) {
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }

    // Return Anthropic-compatible shape so the frontend works without changes
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
