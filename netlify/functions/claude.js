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
  const safePrompt = prompt && prompt.length > 20000 ? prompt.slice(0, 20000) + '\n\n[النص مقتطع لحجمه]' : prompt;

  const systemContent = 'أنت مساعد دراسة ذكي. يجب أن تجيب باللغة العربية فقط دائماً بدون استثناء.\n\n' + (system || '');
  const messages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: safePrompt || '' }
  ];

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: maxTokens
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error?.message || 'Groq error' }) };
    }
    const text = data.choices?.[0]?.message?.content || '';
    return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: [{ type: 'text', text }] }) };
  } catch (err) {
    return { statusCode: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }) };
  }
};
