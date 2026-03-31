/**
 * Vercel Serverless Function: AI Chat
 * POST /api/ai-chat
 *
 * Routes legal queries to the optimal AI model (Gemini or GPT) server-side,
 * keeping API keys out of the client bundle.
 *
 * Body: { query, conversationHistory?, legalContext?, caseContext?, effortLevel?, documentSources? }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================
// Rate Limiting (in-memory, per-user, resets every minute)
// ============================================================

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupRateLimits() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  cleanupRateLimits();
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count++;
  return { allowed: true };
}

// ============================================================
// CORS (same pattern as api/process-file.ts)
// ============================================================

function isAllowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return origin;
    if (hostname.endsWith('.vercel.app')) return origin;
    if (hostname === 'clarity-hub-app.vercel.app') return origin;
  } catch {
    // Malformed origin
  }
  return null;
}

// ============================================================
// AI Client Singletons
// ============================================================

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  openaiClient = new OpenAI({ apiKey: key });
  return openaiClient;
}

let geminiModel: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']> | null = null;
function getGeminiModel() {
  if (geminiModel) return geminiModel;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const genAI = new GoogleGenerativeAI(key);
  geminiModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });
  return geminiModel;
}

function getServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ============================================================
// Citation extraction
// ============================================================

function extractCitations(text: string): string[] {
  const citations: string[] = [];
  const patterns = [
    /\d{4}\s+(?:SCC|ONCA|ONSC|BCCA|ABCA|CanLII)\s+\d+/g,
    /\[\d{4}\]\s+\d+\s+(?:SCR|OR|OJ)\s+(?:No\s+)?\d+/g,
    /(?:R\.S\.O\.|S\.O\.|R\.S\.C\.)\s+\d{4},\s+c\.\s+[\w.-]+/g,
    /O\.\s*Reg\.\s*\d+\/\d+/g,
  ];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) citations.push(...matches);
  }
  return [...new Set(citations)];
}

// ============================================================
// Effort configuration (mirrors client-side EFFORT_CONFIG)
// ============================================================

type EffortLevel = 'quick' | 'standard' | 'thorough' | 'deep';

const EFFORT_CONFIG: Record<EffortLevel, {
  reasoning: 'low' | 'medium' | 'high' | undefined;
  maxTokens: number;
}> = {
  quick:    { reasoning: undefined, maxTokens: 1500 },
  standard: { reasoning: 'low',    maxTokens: 2000 },
  thorough: { reasoning: 'medium', maxTokens: 3000 },
  deep:     { reasoning: 'high',   maxTokens: 4000 },
};

// ============================================================
// GPT call
// ============================================================

async function callGPT(params: {
  query: string;
  legalContext: string;
  caseContext?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  reasoningEffort?: 'low' | 'medium' | 'high';
  maxCompletionTokens?: number;
}): Promise<{ content: string; citations: string[] }> {
  const openai = getOpenAI();
  if (!openai) throw new Error('OpenAI not configured server-side');

  const systemPrompt = `You are a legal research assistant specializing in Ontario employment law. You have knowledge of the Employment Standards Act, 2000, the Human Rights Code, the common law of wrongful dismissal, and Ontario Rules of Civil Procedure.

CITATION RULES:
- Always cite cases with neutral citations (e.g., 2024 ONSC 1234).
- Never fabricate case citations. If you don't know a case, say so.
- ONLY cite cases and legislation that exist in the provided legal context. If the context doesn't contain relevant authority, say so explicitly.
- Distinguish between binding authority (SCC, ONCA) and persuasive authority (trial decisions, other provinces).
- Always identify the current status of principles (active, modified, overruled).

TERMINATION ANALYSIS:
- When analyzing termination, consider: Bardal factors (age, length of service, character of employment, availability of similar employment), ESA minimums, any contractual termination clause and its enforceability after Waksdale.

COSTS:
- When discussing costs, reference the Ontario costs grid and partial/substantial indemnity scales.

GENERAL RULES:
- When uncertain, clearly state "I am not certain about this" rather than guessing.
- Flag any areas where the law is unsettled or evolving.

When analyzing legal issues:
1. Identify the applicable legal framework (statute + common law)
2. State the governing legal test or principle with its source
3. Apply the test to the specific facts
4. Note any counterarguments or risks
5. Provide a practical recommendation`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (params.conversationHistory?.length) {
    for (const msg of params.conversationHistory.slice(-6)) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  let userContent = '';
  if (params.legalContext) {
    userContent += `--- LEGAL KNOWLEDGE BASE ---\n${params.legalContext}\n\n`;
  }
  if (params.caseContext) {
    userContent += `--- CASE FILE CONTEXT ---\n${params.caseContext}\n\n`;
  }
  userContent += `--- QUESTION ---\n${params.query}`;
  messages.push({ role: 'user', content: userContent });

  const requestParams = {
    model: 'gpt-5.2' as const,
    messages,
    max_completion_tokens: params.maxCompletionTokens ?? 16384,
    ...(params.reasoningEffort ? { reasoning_effort: params.reasoningEffort } : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await openai.chat.completions.create(requestParams as any);
  const content = response.choices[0]?.message?.content ?? '';

  return { content, citations: extractCitations(content) };
}

// ============================================================
// Gemini call
// ============================================================

async function callGemini(params: {
  query: string;
  legalContext: string;
  caseContext?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxOutputTokens?: number;
}): Promise<{ content: string; citations: string[] }> {
  const model = getGeminiModel();
  if (!model) throw new Error('Gemini not configured server-side');

  const history = (params.conversationHistory ?? []).slice(-10).map((msg) => ({
    role: msg.role === 'user' ? 'user' : ('model' as const),
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: params.maxOutputTokens ?? 4096,
      temperature: 0.8,
    },
  });

  const contextParts: string[] = [];
  if (params.legalContext) contextParts.push(params.legalContext);
  if (params.caseContext) contextParts.push(params.caseContext);

  const contextPrompt = `
You are a legal research assistant specializing in Ontario employment law. You have knowledge of the Employment Standards Act, 2000, the Human Rights Code, the common law of wrongful dismissal, and Ontario Rules of Civil Procedure.

Always cite cases with neutral citations (e.g., 2024 ONSC 1234). Never fabricate case citations. If you don't know a case, say so.
When analyzing termination, consider: Bardal factors (age, length of service, character of employment, availability of similar employment), ESA minimums, any contractual termination clause and its enforceability after Waksdale.
When discussing costs, reference the Ontario costs grid and partial/substantial indemnity scales.

Here's the relevant context:

${contextParts.join('\n\n')}

User Question: ${params.query}

Provide a detailed, legally-informed response focusing on:
1. Direct answer to the question
2. Relevant legal considerations under Ontario law
3. Citations to the provided documents and case law (neutral citations only)
4. Practical next steps if applicable
`;

  const result = await chat.sendMessage(contextPrompt);
  const response = await result.response;
  const content = response.text();

  return { content, citations: extractCitations(content) };
}

// ============================================================
// Follow-up generation (Gemini, low tokens)
// ============================================================

async function generateFollowUps(query: string, response: string): Promise<string[]> {
  const model = getGeminiModel();
  if (!model) return [];

  try {
    const prompt = `Given this question and answer about a legal case, suggest 3 brief follow-up questions the user might ask next. Return only the 3 questions, one per line, no numbering or bullets.

Question: ${query.slice(0, 500)}

Answer: ${response.slice(0, 1000)}`;

    const chat = model.startChat({ generationConfig: { maxOutputTokens: 512 } });
    const result = await chat.sendMessage(prompt);
    const text = (await result.response).text();

    return text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l.length < 120)
      .slice(0, 3);
  } catch {
    return [];
  }
}

// ============================================================
// Handler
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const allowedOrigin = isAllowedOrigin(req.headers.origin as string | undefined);
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // --- Auth ---
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.slice(7);
    const serviceClient = getServiceClient();
    if (!serviceClient) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' });
    }

    // --- Rate limit ---
    const userId = userData.user.id;
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)));
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait before sending more requests.' });
    }

    // --- Parse body ---
    const {
      query,
      conversationHistory,
      legalContext,
      caseContext,
      effortLevel,
      documentSources,
      enableWebSearch,
    } = req.body ?? {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'query is required and must be a non-empty string' });
    }

    const effort: EffortLevel = ['quick', 'standard', 'thorough', 'deep'].includes(effortLevel)
      ? effortLevel
      : 'standard';

    const effortCfg = EFFORT_CONFIG[effort];

    // Build citation instruction if document sources are provided
    const citationInstruction = documentSources && documentSources.length > 0
      ? '\n\nIMPORTANT: When referencing information from the provided document search results, cite them using [Source N] notation (e.g., [Source 1], [Source 2]). Each [Source N] corresponds to a specific document chunk provided in the context. Only cite sources that are actually relevant to your answer.'
      : '';

    // Web research (when enabled): Tavily live search + CanLII case law lookup
    let webSearchContext = '';
    let webSourcesList: Array<{ index: number; title: string; url: string }> = [];
    if (enableWebSearch) {
      const webParts: string[] = [];

      // 1. CanLII: detect case citations in the query and fetch metadata
      if (process.env.CANLII_API_KEY) {
        try {
          const canliiKey = process.env.CANLII_API_KEY;
          // Extract neutral citations like "2024 ONCA 123"
          const citationPattern = /(\d{4})\s+(SCC|ONCA|ONSC|ONSCDC|HRTO|CanLII)\s+(\d+)/gi;
          const citations = [...query.matchAll(citationPattern)];

          const canliiResults: string[] = [];

          // A. Fetch specific cited cases (e.g. "2024 ONCA 391")
          const dbMap: Record<string, string> = {
            scc: 'csc-scc', onca: 'onca', onsc: 'onsc', onscdc: 'onscdc',
            hrto: 'onhrt', canlii: 'onca', oncece: 'oncece',
          };

          for (const cite of citations.slice(0, 3)) {
            const year = cite[1];
            const court = cite[2].toLowerCase();
            const num = cite[3];
            const dbId = dbMap[court];
            if (!dbId) continue;

            const caseId = `${year}${court}${num}`;
            const metaUrl = `https://api.canlii.org/v1/caseBrowse/en/${dbId}/${caseId}/?api_key=${canliiKey}`;
            const metaResp = await fetch(metaUrl).catch(() => null);
            if (metaResp?.ok) {
              const meta = await metaResp.json();
              canliiResults.push(
                `**${meta.title || caseId}** (${meta.citation || `${year} ${court.toUpperCase()} ${num}`})\n` +
                `Date: ${meta.decisionDate || 'Unknown'} | Court: ${dbId.toUpperCase()}\n` +
                `URL: ${meta.url || `https://canlii.org/en/${dbId}/${caseId}/`}`
              );
            }
          }

          // B. Browse recent decisions from a specific court/tribunal mentioned in the query
          const courtMentions: Record<string, string> = {
            'hrto': 'onhrt', 'human rights tribunal': 'onhrt',
            'onca': 'onca', 'court of appeal': 'onca',
            'onsc': 'onsc', 'superior court': 'onsc',
            'divisional court': 'onscdc', 'onscdc': 'onscdc',
            'labour arbitration': 'onla', 'onlat': 'onla',
            'wsiat': 'onwsiat',
          };

          const queryLower = query.toLowerCase();
          let detectedCourtDb: string | null = null;
          let detectedCourtName = '';
          for (const [term, db] of Object.entries(courtMentions)) {
            if (queryLower.includes(term)) {
              detectedCourtDb = db;
              detectedCourtName = term.toUpperCase();
              break;
            }
          }

          // If a court/tribunal is mentioned, fetch recent decisions from it
          if (detectedCourtDb && citations.length === 0) {
            try {
              // Get decisions from the last 12 months
              const oneYearAgo = new Date();
              oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
              const dateAfter = oneYearAgo.toISOString().split('T')[0];

              const browseUrl = `https://api.canlii.org/v1/caseBrowse/en/${detectedCourtDb}/?offset=0&resultCount=25&decisionDateAfter=${dateAfter}&api_key=${canliiKey}`;
              const browseResp = await fetch(browseUrl).catch(() => null);

              if (browseResp?.ok) {
                const browseResult = await browseResp.json();
                const cases = (browseResult.cases || []) as Array<{
                  caseId: string; title: string; citation: string;
                }>;

                if (cases.length > 0) {
                  const caseList = cases
                    .map((c) => `- ${c.title} (${c.citation})`)
                    .join('\n');
                  canliiResults.push(
                    `**Recent ${detectedCourtName} Decisions (last 12 months, ${cases.length} most recent):**\n${caseList}\n\n` +
                    `Use these citations to identify which decisions are relevant to the user's query. ` +
                    `The user asked about: "${query.trim()}". ` +
                    `Identify which of these cases likely relate to the topic based on the case title and parties.`
                  );
                }
              }
            } catch {
              // non-blocking
            }
          }

          if (canliiResults.length > 0) {
            webParts.push(
              `--- CANLII CASE LAW ---\n${canliiResults.join('\n\n')}\n--- END CANLII ---`
            );
          }
        } catch (canliiError) {
          console.error('CanLII lookup failed (non-blocking):', canliiError);
        }
      }

      // 2. Tavily: targeted legal web search
      // Run two searches: one on CanLII specifically, one broader across legal sources
      if (process.env.TAVILY_API_KEY) {
        const tavilyKey = process.env.TAVILY_API_KEY;
        const allWebResults: Array<{ title: string; url: string; content: string }> = [];

        // Search A: CanLII-specific search (most relevant for case law)
        try {
          const canliiSearch = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: query.trim(),
              search_depth: 'advanced',
              max_results: 5,
              include_domains: ['canlii.org'],
            }),
          });

          if (canliiSearch.ok) {
            const result = await canliiSearch.json();
            allWebResults.push(...(result.results || []));
          }
        } catch { /* non-blocking */ }

        // Search B: broader legal sources (legislation, tribunal guides, commentary)
        try {
          const broadSearch = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: `${query.trim()} Ontario`,
              search_depth: 'basic',
              max_results: 3,
              include_domains: [
                'ontario.ca', 'laws-lois.justice.gc.ca', 'ohrc.on.ca',
                'tribunalsontario.ca', 'scc-csc.ca', 'lso.ca',
              ],
            }),
          });

          if (broadSearch.ok) {
            const result = await broadSearch.json();
            allWebResults.push(...(result.results || []));
          }
        } catch { /* non-blocking */ }

        // Deduplicate by URL
        const seen = new Set<string>();
        const dedupedResults = allWebResults.filter((r) => {
          if (seen.has(r.url)) return false;
          seen.add(r.url);
          return true;
        });

        if (dedupedResults.length > 0) {
          const formatted = dedupedResults
            .map((r, i) => `[Web ${i + 1}: ${r.title}](${r.url})\n${r.content.slice(0, 500)}`)
            .join('\n\n');
          webParts.push(
            `--- LIVE WEB SEARCH RESULTS ---\n${formatted}\n--- END WEB SEARCH ---`
          );
          // Collect web sources for client-side rendering
          webSourcesList = dedupedResults.map((r, i) => ({
            index: i + 1,
            title: r.title,
            url: r.url,
          }));
        }
      }

      if (webParts.length > 0) {
        webSearchContext = '\n\n' + webParts.join('\n\n') +
          '\n\nNote: The above are live research results. Cite CanLII cases with their neutral citations and web results as [Web N]. Verify against authoritative sources before relying on them.';
      }
    }

    const fullLegalContext = (legalContext || '') + citationInstruction + webSearchContext;

    // --- Determine model ---
    const geminiAvailable = !!getGeminiModel();
    const gptAvailable = !!getOpenAI();

    let model: 'gemini' | 'gpt';
    if (effort === 'quick') {
      model = geminiAvailable ? 'gemini' : gptAvailable ? 'gpt' : 'gemini';
    } else if (effort === 'deep') {
      model = gptAvailable ? 'gpt' : geminiAvailable ? 'gemini' : 'gpt';
    } else {
      // standard/thorough: use Gemini by default, GPT for complex queries
      model = geminiAvailable ? 'gemini' : gptAvailable ? 'gpt' : 'gemini';
    }

    // Verify at least one model is available
    if (!geminiAvailable && !gptAvailable) {
      return res.status(503).json({ error: 'No AI model configured on the server. Contact admin.' });
    }

    // --- Call AI with 60-second timeout ---
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 60_000);

    let responseText: string;
    let citations: string[];

    try {
      const aiPromise = model === 'gpt'
        ? callGPT({
            query: query.trim(),
            legalContext: fullLegalContext,
            caseContext,
            conversationHistory,
            reasoningEffort: effortCfg.reasoning,
            maxCompletionTokens: effortCfg.maxTokens,
          })
        : callGemini({
            query: query.trim(),
            legalContext: fullLegalContext,
            caseContext,
            conversationHistory,
            maxOutputTokens: effortCfg.maxTokens,
          });

      // Race AI call against the timeout
      const result = await Promise.race([
        aiPromise,
        new Promise<never>((_, reject) => {
          abortController.signal.addEventListener('abort', () => {
            reject(new Error('AI request timed out after 60 seconds'));
          });
        }),
      ]);

      responseText = result.content;
      citations = result.citations;
    } finally {
      clearTimeout(timeoutId);
    }

    // --- Generate follow-ups (non-blocking, best-effort, with short timeout) ---
    let followUps: string[] = [];
    try {
      const followUpPromise = generateFollowUps(query.trim(), responseText);
      const followUpTimeout = new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 10_000));
      followUps = await Promise.race([followUpPromise, followUpTimeout]);
    } catch {
      // Non-critical
    }

    return res.status(200).json({
      response: responseText,
      citations,
      model,
      effortLevel: effort,
      followUps,
      webSearchUsed: webSearchContext.length > 0,
      webSources: webSourcesList.length > 0 ? webSourcesList : undefined,
    });
  } catch (error) {
    console.error('AI chat error:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('timed out')) {
      return res.status(504).json({ error: message });
    }

    return res.status(500).json({ error: message });
  }
}

export const config = {
  maxDuration: 120, // 2 minutes max for Vercel serverless
};
