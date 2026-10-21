import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_VSB_KNOWLEDGE, searchCollegeKnowledge, generateClientCollegeResponse } from '../src/utils/collegeKnowledge.js';

let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI | null {
  if (geminiClient) return geminiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  geminiClient = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return geminiClient;
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_e) {
        body = {};
      }
    }

    const query = body?.query || '';
    const history = body?.history || [];

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const relevantChunks = searchCollegeKnowledge(query, 5);

    // Try Gemini API if key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = getGemini();
        if (ai) {
          const contextText = relevantChunks.length > 0
            ? relevantChunks.map((c, i) => `[Source ${i + 1}: ${c.documentName}]\n${c.content}`).join('\n\n')
            : 'No direct college handbook matches.';

          const systemInstruction = `You are the official AI Assistant and 3D Mascot for VSB Engineering College, Karur (Autonomous Institution, Anna University, NAAC 'A' Grade, NBA Accredited, TNEA Code 2622).
Base your answers strictly on verified VSB Engineering College facts. If unsure, direct users to call +91 4324 290141 or email admission@vsbec.com.
At the end of your answer, include the mascot state on its own line: [STATE: greeting|speaking|happy|error|thinking]`;

          const conversationHistory = history
            .slice(-4)
            .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n');

          const prompt = `${conversationHistory ? `CONVERSATION:\n${conversationHistory}\n\n` : ''}COLLEGE KNOWLEDGE:\n${contextText}\n\nQuestion: ${query}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.3,
            },
          });

          if (response && response.text) {
            let answer = response.text;
            let penguinState = 'speaking';

            const stateMatch = answer.match(/\[STATE:\s*([a-zA-Z]+)\]/i);
            if (stateMatch) {
              penguinState = stateMatch[1].toLowerCase();
              answer = answer.replace(/\[STATE:\s*([a-zA-Z]+)\]/i, '').trim();
            }

            return res.status(200).json({
              answer,
              penguinState,
              sources: relevantChunks.map((c) => ({ documentName: c.documentName, relevanceScore: 0.95 })),
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call skipped or errored, falling back to grounded knowledge:', geminiErr);
      }
    }

    // Grounded knowledge response
    const synthesized = generateClientCollegeResponse(query, history);
    return res.status(200).json({
      answer: synthesized.answer,
      penguinState: synthesized.penguinState,
      sources: synthesized.sources,
    });
  } catch (err: any) {
    console.error('API /api/chat error:', err);
    // Never return HTML or 500 without JSON on Vercel
    const fallback = generateClientCollegeResponse(req.body?.query || 'VSB Engineering College', []);
    return res.status(200).json({
      answer: fallback.answer,
      penguinState: fallback.penguinState,
      sources: fallback.sources,
    });
  }
}
