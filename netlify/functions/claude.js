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
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { prompt, system, maxTokens = 4000 } = body;
  const key = 'AQ.Ab8RN6J30LMJgQ0rBlqAjRdkE0D4Du75AEf6eT3KR0dht4VfeA';

  const geminiBody = {
    contents: [{ role: 'user', parts: [{ text: prompt || '' }] }],
    generationConfig: { maxOutputTokens: maxTokens }
  };
  if (system) geminiBody.system_instruction = { parts: [{ text: system }] };

  const isBearer = key.startsWith('AQ.');
  const url = isBearer
    ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
    : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const reqHeaders = { 'Content-Type': 'application/json' };
  if (isBearer) reqHeaders['Authorization'] = `Bearer ${key}`;

  try {
    const res = await fetch(url, { method: 'POST', headers: reqHeaders, body: JSON.stringify(geminiBody) });
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
