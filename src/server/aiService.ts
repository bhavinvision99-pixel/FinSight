import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export async function processAiAsk(question: string, financialContext: any, companyName: string): Promise<string> {
  const ai = getGeminiClient();

  const deterministicFallback = `### CFO Analytical Summary: ${companyName || 'HarbourStack Software Ltd'}\n\n` +
    `**Query:** *"${question}"*\n\n` +
    `**1. Verified Financial Position:**\n` +
    `- **Total Operating Revenue:** £${financialContext?.kpis?.totalRevenue?.toLocaleString() ?? '0'} (Net of VAT)\n` +
    `- **Operating Expenses:** £${financialContext?.kpis?.totalOperatingExpenses?.toLocaleString() ?? '0'}\n` +
    `- **Operating Profit:** £${financialContext?.kpis?.operatingProfit?.toLocaleString() ?? '0'} (${financialContext?.kpis?.operatingProfitMargin ?? 0}% operating margin)\n` +
    `- **Recurring SaaS Percentage:** ${financialContext?.kpis?.recurringRevenuePercentage ?? 0}% ARR predictability\n` +
    `- **Outstanding Receivables:** £${financialContext?.kpis?.outstandingReceivables?.toLocaleString() ?? '0'}\n\n` +
    `**2. Key Operational Drivers:**\n` +
    `- Core performance is anchored by recurring enterprise subscription commitments with strong gross margins.\n` +
    `- Operating expenditures remain heavily weighted toward Salaries & Engineering Payroll alongside Cloud Hosting infrastructure (AWS & Google Cloud).\n\n` +
    `**3. Strategic CFO Recommendation:**\n` +
    `- Maintain collection discipline on the £${financialContext?.kpis?.outstandingReceivables?.toLocaleString() ?? '0'} outstanding invoices to safeguard working capital.\n` +
    `- Model pricing adjustments in the Scenario Lab to evaluate sensitivity on operating profit.`;

  if (!ai) {
    return deterministicFallback;
  }

  const systemInstruction = `You are FinSight's Senior AI Financial Analyst and CFO Advisor for "${companyName || 'HarbourStack Software Ltd'}".
You provide rigorous, CFO-grade answers to financial analysts, directors, and SME owners.

CRITICAL ACCOUNTING & REASONING RULES:
1. STRICT TRUTH: All financial figures must derive exclusively from the verified financialContext provided below. DO NOT invent or estimate unverified numbers.
2. NET OF VAT: When discussing operating revenue, expenses, or profit, use the verified Net figures.
3. ACCRUAL VS CASH: Do not confuse operating profit with cash in the bank. Mention outstanding invoices (receivables) when discussing working capital.
4. STRUCTURE YOUR ANSWER CLEANLY:
   - **Executive Summary / Direct Answer**: Direct 1-2 sentence conclusion.
   - **Financial Breakdown & Evidence**: Cite exact figures (£ and %) from the provided context.
   - **Key Drivers & Observations**: Explain what drove these results (e.g., specific customers, recurring subscriptions, major cost categories like Cloud Hosting or Payroll).
   - **Strategic CFO Recommendation**: 1-2 actionable, pragmatic steps for the management team.
5. Tone: Professional, authoritative, clear, and reassuring. Keep formatting clean with markdown headings and bullet points.`;

  const prompt = `User Question: "${question}"

Verified Financial Data Context:
${JSON.stringify(financialContext, null, 2)}

Provide your CFO-grade analysis now:`;

  const models = ['gemini-3.8-flash', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
      if (response.text) return response.text;
    } catch (err: any) {
      console.warn(`[Gemini SDK] Model ${model} unavailable:`, err.message || err);
    }
  }

  return deterministicFallback;
}

export async function processScenarioInsight(scenarioSummary: any, companyName: string): Promise<string> {
  const ai = getGeminiClient();

  const profitVar = scenarioSummary?.simulationResults?.variances?.profit ?? scenarioSummary?.variances?.profit ?? 0;
  const marginVar = scenarioSummary?.simulationResults?.variances?.marginDeltaPct ?? scenarioSummary?.variances?.marginDeltaPct ?? 0;

  const fallback = `### CFO Strategic Scenario Evaluation\n\n` +
    `**1. Net Financial Variance:**\n` +
    `- Operating Profit shift: **${profitVar >= 0 ? '+' : ''}£${profitVar.toLocaleString()}**\n` +
    `- Operating Margin impact: **${marginVar >= 0 ? '+' : ''}${marginVar}% pts**\n\n` +
    `**2. Operational Feasibility Assessment:**\n` +
    `- Levers impacting pricing and cloud infrastructure directly bolster EBITDA margins.\n` +
    `- Verify that cost reductions in cloud infrastructure do not compromise SLA uptime.\n\n` +
    `**3. Recommendation:**\n` +
    `- Stagger implementation over Q1-Q2 with milestone check-ins on ARR churn.`;

  if (!ai) return fallback;

  const systemInstruction = `You are the Chief Strategy Officer and CFO for "${companyName || 'HarbourStack Software Ltd'}".
The user has simulated business decisions (e.g. price shifts, hiring, cost cuts, churn) in FinSight's Scenario Lab.

Evaluate the simulation results:
1. Direct Impact: How does this change the bottom line (£ profit variance and margin change)?
2. Operational Risks & Side Effects (e.g. will cutting hosting jeopardize SLAs? will hiring engineers pay off in long-term ARR?).
3. Verdict & Implementation Checklist: Clear Go / No-Go / Conditional recommendation with next milestones.
Keep it concise, high-impact, and strictly aligned with the figures in the scenario data.`;

  const prompt = `Simulated Business Scenario Data:\n${JSON.stringify(scenarioSummary, null, 2)}\n\nEvaluate this scenario from a CFO's perspective:`;

  const models = ['gemini-3.8-flash', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction, temperature: 0.25 },
      });
      if (response.text) return response.text;
    } catch (err: any) {
      console.warn(`[Gemini SDK] Model ${model} unavailable for scenario:`, err.message || err);
    }
  }

  return fallback;
}

export async function processBoardSummary(summaryData: any, companyName: string, period: string): Promise<string> {
  const ai = getGeminiClient();

  const fallback = `## Official Board of Directors Financial Briefing: ${companyName}\n` +
    `**Reporting Period:** ${period} • **Accounting Standard:** UK GAAP Net Accruals\n\n` +
    `### 1. Executive Summary\n` +
    `For the reporting period, ${companyName} achieved **£${summaryData?.kpis?.totalRevenue?.toLocaleString() ?? '0'}** in operating revenue, generating an operating profit of **£${summaryData?.kpis?.operatingProfit?.toLocaleString() ?? '0'}** (${summaryData?.kpis?.operatingProfitMargin ?? 0}% operating margin).\n\n` +
    `### 2. Revenue Dynamics & Stability\n` +
    `- Operating revenue is anchored by contracted recurring enterprise SaaS subscriptions, providing strong forward visibility.\n` +
    `- Unpaid receivables total £${summaryData?.kpis?.outstandingReceivables?.toLocaleString() ?? '0'}, presenting manageable credit exposure.\n\n` +
    `### 3. Operational Expenditure Structure\n` +
    `- Operating expenses amounted to £${summaryData?.kpis?.totalOperatingExpenses?.toLocaleString() ?? '0'}.\n` +
    `- Primary allocations comprise Engineering & Salaries alongside Cloud Hosting (AWS EMEA & GCP Ireland).\n\n` +
    `### 4. Board Strategic Directives\n` +
    `- Reinvest operating cash flow into enterprise customer acquisition.\n` +
    `- Maintain strict working capital discipline regarding DSO (Days Sales Outstanding).`;

  if (!ai) return fallback;

  const systemInstruction = `You are preparing an official Board Pack Financial Briefing for "${companyName}" for reporting period "${period}".
Include:
1. Executive Summary
2. Revenue & Growth Dynamics (MRR recurring vs one-off, customer concentration)
3. Cost Structure & Operational Margins (Cloud hosting, headcount, general opex)
4. Working Capital & Cash Health (Receivables status, unpaid invoices)
5. Strategic Guidance for the Board of Directors

Maintain formal, crisp British corporate financial reporting standards.`;

  const models = ['gemini-3.8-flash', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Reporting Context:\n${JSON.stringify(summaryData, null, 2)}`,
        config: { systemInstruction, temperature: 0.2 },
      });
      if (response.text) return response.text;
    } catch (err: any) {
      console.warn(`[Gemini SDK] Model ${model} unavailable for board summary:`, err.message || err);
    }
  }

  return fallback;
}
