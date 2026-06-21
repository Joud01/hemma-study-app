exports.handler = async function(event) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: 'Method not allowed' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch {
    return { statusCode: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { prompt, system, maxTokens = 4000 } = body;
  const safePrompt = prompt && prompt.length > 30000 ? prompt.slice(0, 30000) + '\n\n[النص مقتطع]' : prompt;

  const geminiBody = {
    system_instruction: { parts: [{ text: 'أنت مساعد دراسة ذكي. يجب أن تجيب باللغة العربية فقط دائماً بدون استثناء.\n\n' + (system || '') }] },
    contents: [{ role: 'user', parts: [{ text: safePrompt || '' }] }],
    generationConfig: { maxOutputTokens: maxTokens }
  };

  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': 'AQ.Ab8RN6KZHvVaDcRXd075xvtQXWTpCtkuzFXjiq8xuS4jsyXXng'
        },
        body: JSON.stringify(geminiBody)
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error?.message || 'Gemini error' }) };
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: [{ type: 'text', text }] }) };
  } catch (err) {
    return { statusCode: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }) };
  }
};
