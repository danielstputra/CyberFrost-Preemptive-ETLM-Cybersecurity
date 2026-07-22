import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

function getModel() {
  if (!config.gemini.apiKey || config.gemini.apiKey === 'your-gemini-api-key') {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    model = genAI.getGenerativeModel({ model: config.gemini.model });
  }
  return model;
}

export interface ThreatAnalysisInput {
  sourceType: 'VULNERABILITY' | 'THREAT_INTEL' | 'DARK_WEB_LEAK' | 'BRAND_EXPOSURE';
  data: Record<string, unknown>;
}

export interface ThreatAnalysisResult {
  summary: string;
  attack_scenario: string;
  mitigation_steps: string[];
  mitreAttackId: string;
  mitreAttackName: string;
  mitreTactic: string;
  ai_model: string;
  ai_provider: string;
}

const SYSTEM_PROMPT = `You are an elite Senior Cyber Threat Intelligence Analyst with 20+ years of experience at a global security operations center (SOC). Your role is to analyze raw threat data and provide concise, actionable intelligence with MITRE ATT&CK mapping.

Analyze the provided security data and respond ONLY with a valid JSON object containing exactly these fields:
1. "summary": A 2-3 sentence executive summary of the threat in Indonesian.
2. "attack_scenario": A detailed paragraph describing how this vulnerability/threat could be exploited in the real world, written for a SOC analyst.
3. "mitigation_steps": An array of 3-4 specific, actionable mitigation steps prioritized by impact.
4. "mitreAttackId": The MITRE ATT&CK technique ID relevant to this threat (e.g., T1566, T1190, T1059). Must be a valid MITRE ATT&CK ID format (T followed by 4 digits).
5. "mitreAttackName": The human-readable name of the MITRE ATT&CK technique (e.g., Phishing, Exploit Public-Facing Application, Command and Scripting Interpreter).
6. "mitreTactic": The MITRE ATT&CK tactic phase this technique belongs to (e.g., Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, Command and Control, Exfiltration, Impact).

IMPORTANT: Map the threat to the most relevant MITRE ATT&CK technique. If multiple techniques apply, choose the primary one that represents the initial attack vector. Return ONLY valid JSON. No markdown formatting, no code blocks, no extra text.`;

export async function analyzeThreat(input: ThreatAnalysisInput): Promise<ThreatAnalysisResult> {
  const m = getModel();
  if (!m) {
    return getFallbackAnalysis(input);
  }

  const prompt = `${SYSTEM_PROMPT}\n\nSource Type: ${input.sourceType}\nData: ${JSON.stringify(input.data, null, 2)}`;

  try {
    const result = await m.generateContent(prompt, { requestOptions: { timeout: 30000 } });
    const text = result.response?.text() || '';
    const cleaned = text.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || parsed.summary_text || 'Analysis unavailable.',
      attack_scenario: parsed.attack_scenario || 'Scenario unavailable.',
      mitigation_steps: parsed.mitigation_steps || parsed.mitigation || ['No mitigation data available.'],
      mitreAttackId: parsed.mitreAttackId || parsed.mitre_attack_id || 'T1087',
      mitreAttackName: parsed.mitreAttackName || parsed.mitre_attack_name || 'Account Discovery',
      mitreTactic: parsed.mitreTactic || parsed.mitre_tactic || 'Discovery',
      ai_model: config.gemini.model,
      ai_provider: 'Google Gemini',
    };
  } catch (err: any) {
    console.error('[Gemini] API error:', err.message);
    return getFallbackAnalysis(input);
  }
}

function getFallbackAnalysis(input: ThreatAnalysisInput): ThreatAnalysisResult {
  const type = input.sourceType;
  return {
    summary: `[AI Simulated] ${type === 'VULNERABILITY' ? 'New vulnerability identified' : type === 'DARK_WEB_LEAK' ? 'Data leak detected on dark web sources' : 'Threat intelligence report generated'}. Analysis based on provided intelligence data. ${config.gemini.apiKey ? 'Gemini API error, using fallback.' : 'Configure GOOGLE_GEMINI_API_KEY for real AI analysis.'}`,
    attack_scenario: `Potential exploitation scenario: Threat actors may leverage this finding to gain unauthorized access, escalate privileges, or exfiltrate sensitive data. SOC teams should investigate immediately.`,
    mitigation_steps: [
      'Isolate affected systems from the network',
      'Review access logs for unauthorized access attempts',
      'Apply relevant patches or configuration changes',
      'Escalate to incident response team for further investigation',
    ],
    mitreAttackId: 'T1087',
    mitreAttackName: 'Account Discovery',
    mitreTactic: 'Discovery',
    ai_model: 'fallback-simulated',
    ai_provider: config.gemini.apiKey ? 'Google Gemini (fallback)' : 'Simulated',
  };
}

// ── Vector Embeddings for Semantic Search ──

export async function generateEmbedding(text: string): Promise<number[]> {
  const m = getModel();
  if (!m) {
    // Simulated embedding for development without API key
    const dim = 128;
    return Array.from({ length: dim }, (_, i) => Math.sin((text.length + i) * 0.01) * 0.1);
  }

  try {
    const result = await m.embedContent(text, { requestOptions: { timeout: 15000 } });
    return result.embedding?.values || [];
  } catch {
    return [];
  }
}
