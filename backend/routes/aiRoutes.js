const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

const parseRetryAfterHeader = (value) => {
  if (!value) return null;

  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber >= 0) {
    return Math.ceil(asNumber);
  }

  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime())) {
    const diffSeconds = Math.ceil((asDate.getTime() - Date.now()) / 1000);
    return diffSeconds > 0 ? diffSeconds : 0;
  }

  return null;
};

const extractReplyText = (data) => {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputItems = Array.isArray(data?.output) ? data.output : [];
  const chunks = [];

  for (const item of outputItems) {
    const contentItems = Array.isArray(item?.content) ? item.content : [];
    for (const content of contentItems) {
      if (typeof content?.text === 'string' && content.text.trim()) {
        chunks.push(content.text.trim());
      } else if (typeof content?.value === 'string' && content.value.trim()) {
        chunks.push(content.value.trim());
      }
    }
  }

  return chunks.join('\n\n').trim();
};

router.post('/helper', auth, async (req, res) => {
  const prompt = (req.body?.prompt || '').trim();
  const requestedLanguage = (req.body?.language || 'en').toLowerCase();

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (prompt.length > 4000) {
    return res.status(400).json({ error: 'Prompt is too long (max 4000 characters)' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const languageMap = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    it: 'Italian',
  };
  const responseLanguage = languageMap[requestedLanguage] || 'English';

  if (!apiKey) {
    return res.status(503).json({ error: 'AI service is not configured on server' });
  }

  try {
    const requestBody = {
      model,
      instructions: `You are a helpful AI assistant for the Stay Fit app. Give practical, concise, fitness-focused guidance and general app help. Do not provide medical diagnosis. Always reply in ${responseLanguage}.`,
      input: prompt,
      max_output_tokens: 1200,
    };

    if (!model.startsWith('gpt-5')) {
      requestBody.temperature = 0.7;
    } else {
      requestBody.reasoning = { effort: 'minimal' };
      requestBody.text = { verbosity: 'low' };
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const providerCode = data?.error?.code;
      const providerMessage = data?.error?.message || 'AI provider request failed';

      if (response.status === 429 || providerCode === 'insufficient_quota' || providerCode === 'rate_limit_exceeded') {
        const retryAfterSeconds = parseRetryAfterHeader(response.headers.get('retry-after'));
        const retryAt = Number.isFinite(retryAfterSeconds)
          ? new Date(Date.now() + (retryAfterSeconds * 1000)).toISOString()
          : null;

        if (providerCode === 'insufficient_quota') {
          return res.status(429).json({
            error: 'AI helper credits are exhausted. Please add credits/billing and try again.',
            code: 'ai_insufficient_quota',
            retryAfterSeconds,
            retryAt,
          });
        }

        return res.status(429).json({
          error: 'AI helper is temporarily unavailable due to API rate limits. Please try again later.',
          code: 'ai_rate_limited',
          retryAfterSeconds,
          retryAt,
        });
      }

      return res.status(response.status).json({ error: providerMessage });
    }

    const reply = extractReplyText(data);

    if (!reply) {
      return res.json({
        reply: 'I could not generate a response right now. Please try rephrasing your question or try again shortly.',
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error('AI helper error:', error);
    return res.status(500).json({ error: 'Failed to process AI request' });
  }
});

module.exports = router;
