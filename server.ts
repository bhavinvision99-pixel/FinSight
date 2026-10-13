import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processAiAsk, processScenarioInsight, processBoardSummary } from './src/server/aiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Permissive CORS middleware for dev and preview environments
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Request logging for audit diagnostics
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.url}`);
  }
  next();
});

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
app.post(['/api/ai/ask', '/api/ai/ask/'], async (req: Request, res: Response) => {
  try {
    const { question, financialContext, companyName } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const answer = await processAiAsk(question, financialContext, companyName);

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
app.post(['/api/ai/scenario-insight', '/api/ai/scenario-insight/'], async (req: Request, res: Response) => {
  try {
    const { scenarioSummary, companyName } = req.body;
    const insight = await processScenarioInsight(scenarioSummary, companyName);
    return res.json({ insight });
  } catch (error: any) {
    console.error('Error in /api/ai/scenario-insight:', error);
    return res.status(500).json({ error: error.message || 'Scenario insight error' });
  }
});

/**
 * AI Executive Summary & Board Pack Generator
 */
app.post(['/api/ai/board-summary', '/api/ai/board-summary/'], async (req: Request, res: Response) => {
  try {
    const { summaryData, companyName, period } = req.body;
    const report = await processBoardSummary(summaryData, companyName, period);
    return res.json({ report });
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
    console.log('Vite development middlewares attached to FinSight Express server.');
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
