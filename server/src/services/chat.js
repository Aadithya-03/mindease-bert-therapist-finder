import { config } from '../config.js';
import { ruleReply } from './rules.js';

const SYSTEM = `You are MindEase, a warm, supportive companion inside a mental-wellness app. You are not a therapist and you never diagnose.
- Reply in 2-4 short sentences of plain language. No lists, headings or emojis.
- Reflect what the person said, validate it, then offer at most one gentle question or one small coping idea.
- If they describe ongoing or heavy distress, gently suggest talking to a counsellor or therapist and mention the app's "Nearby Therapist" page.
- If they mention self-harm or suicide, respond with care, encourage contacting local emergency services or a crisis line, and never give method information.
- Reply in the same language the person writes in.`;

/** Anthropic needs strictly alternating roles starting with "user". */
function toApiMessages(history, message) {
  const raw = [
    ...history.map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
    { role: 'user', content: message },
  ];
  const merged = [];
  for (const m of raw) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += `\n${m.content}`;
    else merged.push({ ...m });
  }
  while (merged.length && merged[0].role !== 'user') merged.shift();
  return merged;
}

async function llmReply(history, message, analysis) {
  const hint = analysis
    ? `\nThe app's mood classifier read the latest message as "${analysis.label}" (${Math.round(analysis.confidence * 100)}% confidence). Treat it as a hint, not a fact.`
    : '';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': config.anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: config.claudeModel,
      max_tokens: 400,
      system: SYSTEM + hint,
      messages: toApiMessages(history, message),
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  const text = data.content?.find((b) => b.type === 'text')?.text?.trim();
  if (!text) throw new Error('Empty LLM reply');
  return text;
}

export async function generateReply({ history, message, analysis }) {
  if (config.anthropicKey) {
    try {
      return { reply: await llmReply(history, message, analysis), source: 'llm' };
    } catch (err) {
      console.warn('LLM reply failed, using rule engine:', err.message);
    }
  }
  const lastBot = [...history].reverse().find((m) => m.role === 'bot')?.text;
  return { reply: ruleReply(message, analysis, lastBot), source: 'rules' };
}
