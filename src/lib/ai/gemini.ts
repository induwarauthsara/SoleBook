import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, PROMPT_VERSION } from './prompts';
import { sanitizeForAI } from './sanitizer';
import { filterAIOutput, filterUserInput } from './safety-filter';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface AIAuditEntry {
  model_id: string;
  prompt_template_version: string;
  context_schema_version: string;
  context_hash: string;
  output_passed_safety: boolean;
  denied_reasons: string[];
  latency_ms: number;
}

export async function streamChat(
  messages: ChatMessage[],
  context: string,
  userMessage: string
): Promise<{ stream: AsyncGenerator<string>; audit: AIAuditEntry }> {
  const inputCheck = filterUserInput(userMessage);
  if (!inputCheck.safe) {
    throw new Error(inputCheck.reason || 'Unsafe input');
  }

  const sanitizedContext = sanitizeForAI(context);
  const contextHash = simpleHash(JSON.stringify(sanitizedContext));
  const startTime = Date.now();

  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: `System: ${SYSTEM_PROMPT}\n\nContext: ${sanitizedContext}` }] },
      { role: 'model', parts: [{ text: 'I understand. I\'m ready to help as your SoleBook AI Advisor. How can I assist you with your business finances today?' }] },
      ...messages,
    ],
  });

  const result = await chat.sendMessageStream(userMessage);

  let fullOutput = '';
  const audit: AIAuditEntry = {
    model_id: 'gemini-2.5-flash-lite',
    prompt_template_version: PROMPT_VERSION,
    context_schema_version: 'v1',
    context_hash: contextHash,
    output_passed_safety: true,
    denied_reasons: [],
    latency_ms: 0,
  };

  async function* generateStream(): AsyncGenerator<string> {
    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullOutput += text;
      yield text;
    }
    audit.latency_ms = Date.now() - startTime;
    const safety = filterAIOutput(fullOutput);
    audit.output_passed_safety = safety.passed;
    audit.denied_reasons = safety.blockedReasons;
  }

  return { stream: generateStream(), audit };
}

export async function generateInsights(
  prompt: string
): Promise<{ content: string; audit: AIAuditEntry }> {
  const startTime = Date.now();
  const contextHash = simpleHash(prompt);

  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: prompt },
  ]);

  const output = result.response.text();
  const safety = filterAIOutput(output);

  return {
    content: safety.passed ? output : '[]',
    audit: {
      model_id: 'gemini-2.5-flash-lite',
      prompt_template_version: PROMPT_VERSION,
      context_schema_version: 'v1',
      context_hash: contextHash,
      output_passed_safety: safety.passed,
      denied_reasons: safety.blockedReasons,
      latency_ms: Date.now() - startTime,
    },
  };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
