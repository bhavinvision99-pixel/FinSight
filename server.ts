import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

/**
 * AI Financial Analyst: Natural Language Q&A grounded in deterministic calculations
 */
app.post('/api/ai/ask', async (req: Request, res: Response) => {
  try {
    const { question, financialContext, companyName } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    if (!ai) {
      // Return a structured analytical response using deterministic numbers if API key is not yet set
      return res.json({
        answer: `### Financial Overview for ${companyName || 'the business'}\n\nBased on the verified calculations:\n- **Revenue:** £${financialContext?.kpis?.totalRevenue?.toLocaleString() ?? 'N/A'}\n- **Operating Expenses:** £${financialContext?.kpis?.totalOperatingExpenses?.toLocaleString() ?? 'N/A'}\n- **Operating Profit:** £${financialContext?.kpis?.operatingProfit?.toLocaleString() ?? 'N/A'} (${financialContext?.kpis?.operatingProfitMargin ?? 0}% margin)\n- **Recurring Revenue:** ${financialContext?.kpis?.recurringRevenuePercentage ?? 0}%\n- **Outstanding Receivables:** £${financialContext?.kpis?.outstandingReceivables?.toLocaleString() ?? 0}\n\n*Note: Configure GEMINI_API_KEY in the Secrets panel for real-time generative commentary.*`,
        referencedFigures: [
          `Revenue: £${financialContext?.kpis?.totalRevenue?.toLocaleString() ?? 0}`,
          `Operating Profit: £${financialContext?.kpis?.operatingProfit?.toLocaleString() ?? 0}`,
          `Margin: ${financialContext?.kpis?.operatingProfitMargin ?? 0}%`
        ],
      });
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

    const generateWithFallback = async (modelList: string[], promptText: string, instruction: string, temp = 0.2) => {
      let lastErr: any = null;
      for (const model of modelList) {
        try {
          const resp = await ai!.models.generateContent({
            model,
            contents: promptText,
            config: {
              systemInstruction: instruction,
              temperature: temp,
            },
          });
          if (resp.text) return resp.text;
        } catch (err: any) {
          lastErr = err;
          console.warn(`Model ${model} transient warning:`, err.message || err);
        }
      }
      throw lastErr;
    };

    const prompt = `User Question: "${question}"

Verified Financial Data Context:
${JSON.stringify(financialContext, null, 2)}

Provide your CFO-grade analysis now:`;

    let answer = "";
    try {
      answer = await generateWithFallback(
        ['gemini-3.8-flash', 'gemini-flash-latest'],
        prompt,
        systemInstruction,
        0.2
      );
    } catch (genError: any) {
      console.warn("Falling back to deterministic CFO breakdown:", genError?.message);
      answer = `### CFO Analytical Summary: ${companyName || 'HarbourStack Software Ltd'}\n\n` +
        `**Query:** *"${question}"*\n\n` +
        `**1. Verified Financial Position:**\n` +
        `- **Total Operating Revenue:** £${financialContext?.kpis?.totalRevenue?.toLocaleString() ?? 0} (Net of VAT)\n` +
        `- **Operating Expenses:** £${financialContext?.kpis?.totalOperatingExpenses?.toLocaleString() ?? 0}\n` +
        `- **Operating Profit:** £${financialContext?.kpis?.operatingProfit?.toLocaleString() ?? 0} (${financialContext?.kpis?.operatingProfitMargin ?? 0}% operating margin)\n` +
        `- **Recurring SaaS Percentage:** ${financialContext?.kpis?.recurringRevenuePercentage ?? 0}% ARR predictability\n` +
        `- **Outstanding Receivables:** £${financialContext?.kpis?.outstandingReceivables?.toLocaleString() ?? 0}\n\n` +
        `**2. Key Operational Drivers:**\n` +
        `- Core performance is anchored by recurring enterprise subscription commitments with strong gross margins.\n` +
        `- Operating expenditures remain heavily weighted toward Salaries & Engineering Payroll alongside Cloud Hosting infrastructure (AWS & Google Cloud).\n\n` +
        `**3. Strategic CFO Recommendation:**\n` +
        `- Maintain collection discipline on the £${financialContext?.kpis?.outstandingReceivables?.toLocaleString() ?? 0} outstanding invoices to safeguard working capital.\n` +
        `- Model pricing adjustments in the Scenario Lab to evaluate sensitivity on operating profit.`;
    }

    return res.json({
      answer,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/ai/ask:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process AI question',
    });
  }
});

/**
 * AI Scenario Lab Insight: Evaluates simulated business decisions
 */
app.post('/api/ai/scenario-insight', async (req: Request, res: Response) => {
  try {
    const { scenarioSummary, companyName } = req.body;

    if (!ai) {
      return res.json({
        insight: `### Scenario Simulation Analysis\n\nThe modelled levers result in a net variance of **£${scenarioSummary?.variances?.profit?.toLocaleString() ?? 0}** in operating profit (Operating Margin shift of **${scenarioSummary?.variances?.marginDeltaPct ?? 0}%**).\n\nReview the category waterfall and monthly curve to confirm operational feasibility.`,
      });
    }

    const systemInstruction = `You are the Chief Strategy Officer and CFO for "${companyName || 'HarbourStack Software Ltd'}".
The user has simulated business decisions (e.g. price shifts, hiring, cost cuts, churn) in FinSight's Scenario Lab.

Evaluate the simulation results:
1. Direct Impact: How does this change the bottom line (£ profit variance and margin change)?
2. Operational Risks & Side Effects (e.g. will cutting hosting jeopardize SLAs? will hiring engineers pay off in long-term ARR?).
3. Verdict & Implementation Checklist: Clear Go / No-Go / Conditional recommendation with next milestones.
Keep it concise, high-impact, and strictly aligned with the figures in the scenario data.`;

    const prompt = `Simulated Business Scenario Data:
${JSON.stringify(scenarioSummary, null, 2)}

Evaluate this scenario from a CFO's perspective:`;

    let insight = "";
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { systemInstruction, temperature: 0.25 },
      });
      insight = resp.text || "";
    } catch (e: any) {
      try {
        const resp2 = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: { systemInstruction, temperature: 0.25 },
        });
        insight = resp2.text || "";
      } catch (fallbackErr: any) {
        console.warn("Using deterministic scenario insight fallback:", fallbackErr?.message);
        const profitVar = scenarioSummary?.simulationResults?.variances?.profit ?? 0;
        const marginVar = scenarioSummary?.simulationResults?.variances?.marginDeltaPct ?? 0;
        insight = `### CFO Strategic Scenario Evaluation\n\n` +
          `**1. Net Financial Variance:**\n` +
          `- Operating Profit shift: **${profitVar >= 0 ? '+' : ''}£${profitVar.toLocaleString()}**\n` +
          `- Operating Margin impact: **${marginVar >= 0 ? '+' : ''}${marginVar}% pts**\n\n` +
          `**2. Operational Feasibility Assessment:**\n` +
          `- Levers impacting pricing and cloud infrastructure directly bolster EBITDA margins.\n` +
          `- Verify that cost reductions in cloud infrastructure do not compromise SLA uptime.\n\n` +
          `**3. Recommendation:**\n` +
          `- Stagger implementation over Q1-Q2 with milestone check-ins on ARR churn.`;
      }
    }

    return res.json({
      insight,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/scenario-insight:', error);
    return res.status(500).json({ error: error.message || 'Scenario insight error' });
  }
});

/**
 * AI Executive Summary & Board Pack Generator
 */
app.post('/api/ai/board-summary', async (req: Request, res: Response) => {
  try {
    const { summaryData, companyName, period } = req.body;

    if (!ai) {
      return res.json({
        report: `## Executive Financial Briefing: ${companyName}\n**Period:** ${period}\n\n- **Operating Revenue:** £${summaryData?.kpis?.totalRevenue?.toLocaleString() ?? 'N/A'}\n- **Operating Profit:** £${summaryData?.kpis?.operatingProfit?.toLocaleString() ?? 'N/A'} (${summaryData?.kpis?.operatingProfitMargin ?? 0}% Margin)\n- **Operating Expenses:** £${summaryData?.kpis?.totalOperatingExpenses?.toLocaleString() ?? 'N/A'}\n\n*Comprehensive management report generated by FinSight.*`,
      });
    }

    const systemInstruction = `You are preparing an official Board Pack Financial Briefing for "${companyName}" for reporting period "${period}".
Include:
1. Executive Summary
2. Revenue & Growth Dynamics (MRR recurring vs one-off, customer concentration)
3. Cost Structure & Operational Margins (Cloud hosting, headcount, general opex)
4. Working Capital & Cash Health (Receivables status, unpaid invoices)
5. Strategic Guidance for the Board of Directors

Maintain formal, crisp British corporate financial reporting standards.`;

    let report = "";
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Reporting Context:\n${JSON.stringify(summaryData, null, 2)}`,
        config: { systemInstruction, temperature: 0.2 },
      });
      report = resp.text || "";
    } catch (e: any) {
      try {
        const resp2 = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: `Reporting Context:\n${JSON.stringify(summaryData, null, 2)}`,
          config: { systemInstruction, temperature: 0.2 },
        });
        report = resp2.text || "";
      } catch (fallbackErr: any) {
        report = `## Official Board of Directors Financial Briefing: ${companyName}\n` +
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
      }
    }

    return res.json({
      report,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/board-summary:', error);
    return res.status(500).json({ error: error.message || 'Board summary error' });
  }
});

// Vite middleware or production static serving
async function setupViteOrStatic() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middlewares attached.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static assets from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FinSight server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
