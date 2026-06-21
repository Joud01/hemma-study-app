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

  const messages = [
    { role: 'system', content: 'أنت مساعد دراسة ذكي. يجب أن تجيب باللغة العربية فقط دائماً بدون استثناء.\n\n' + (system || '') },
    { role: 'user', content: safePrompt || '' }
  ];

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer EoWXmAosG0SSZJZTb8bX7TtIoBfHoH76'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages,
        max_tokens: maxTokens
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error?.message || data.message || 'Mistral error' }) };
    }
    const text = data.choices?.[0]?.message?.content || '';
    return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: [{ type: 'text', text }] }) };
  } catch (err) {
    return { statusCode: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }) };
  }
};
