export interface AiAskResponse {
  answer: string;
  referencedFigures?: string[];
  timestamp?: string;
  error?: string;
}

export async function askFinancialAnalyst(
  question: string,
  financialContext: any,
  companyName: string
): Promise<AiAskResponse> {
  const res = await fetch('/api/ai/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, financialContext, companyName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with ${res.status}`);
  }

  return res.json();
}

export async function getScenarioInsight(
  scenarioSummary: any,
  companyName: string
): Promise<{ insight: string }> {
  const res = await fetch('/api/ai/scenario-insight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioSummary, companyName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with ${res.status}`);
  }

  return res.json();
}

export async function generateBoardReport(
  summaryData: any,
  companyName: string,
  period: string
): Promise<{ report: string }> {
  const res = await fetch('/api/ai/board-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summaryData, companyName, period }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with ${res.status}`);
  }

  return res.json();
}
