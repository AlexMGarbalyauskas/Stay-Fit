// block 1 notes and consts
//aiRoiutes.js - Handles AI helper requests for the Stay Fit app. 
// Provides a /helper endpoint that accepts user prompts and returns 
// AI-generated responses using OpenAI's API. 
// Implements error handling for rate limits and quota issues, 
// and ensures responses are concise and fitness-focused.



// Note: This code assumes you have set up authentication middleware (auth)
// and have your OpenAI API key configured in the environment variables.



// The /helper endpoint accepts POST requests with a JSON body containing:
const express = require('express');
// For making HTTP requests to the OpenAI API
const auth = require('../middleware/auth');
// const router used to define the AI helper route
const router = express.Router();
//1 end






// block 2 >const parse
// Helper function to parse 'Retry-After' header values, which can be either seconds or a date string
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
//2 end






// block 3 >const
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
//3 end







// block 4 >router.post
// POST /api/ai/helper
router.post('/helper', auth, async (req, res) => {
  
  // Extract and validate the prompt and language from the request body
  const prompt = (req.body?.prompt || '').trim();
  const requestedLanguage = (req.body?.language || 'en').toLowerCase();

  // Validate prompt
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Enforce a maximum prompt length to prevent abuse and ensure performance
  if (prompt.length > 4000) {
    return res.status(400).json({ error: 'Prompt is too long (max 4000 characters)' });
  }



  // Map of supported language codes to their full names for the AI instructions
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const languageMap = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    it: 'Italian',
  };



  // Determine the response language based on the requested language, 
  // defaulting to English if unsupported
  const responseLanguage = languageMap[requestedLanguage] || 'English';


  // If the API key is not configured, return a 503 Service Unavailable error
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
//4 end 








// module,exports the router so it can be used in the main server
//  file to handle /api/ai routes
module.exports = router;
