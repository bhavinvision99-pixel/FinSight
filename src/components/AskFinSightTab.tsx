import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { Transaction } from '../types/financial';
import {
  calculateKPIs,
  calculateMonthlySeries,
  calculateCategoryBreakdown,
  calculateTopCustomers,
  calculateYoYComparison,
} from '../services/calculationEngine';
import { askFinancialAnalyst } from '../services/aiClient';
import { formatGBP } from '../utils/formatters';

interface AskFinSightTabProps {
  transactions: Transaction[];
  companyName: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  referencedFigures?: string[];
  timestamp: string;
}

export const AskFinSightTab: React.FC<AskFinSightTabProps> = ({
  transactions,
  companyName,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am **FinSight AI**, your executive financial analyst for **${companyName}**.\n\nI analyse your imported transaction records using our deterministic accounting engine and explain key drivers, cost trends, margin dynamics, and customer concentration.\n\nAsk me any question below or pick a pre-set analysis prompt.`,
      timestamp: 'Just now',
    },
  ]);

  // Pre-calculated deterministic context to supply to the backend
  const financialContext = useMemo(() => {
    const kpis2025 = calculateKPIs(transactions, 2025, 2024);
    const kpis2024 = calculateKPIs(transactions, 2024);
    const revCategories = calculateCategoryBreakdown(transactions, 'income', 2025);
    const expCategories = calculateCategoryBreakdown(transactions, 'expense', 2025);
    const topClients = calculateTopCustomers(transactions, 2025, 5);
    const yoy = calculateYoYComparison(transactions, [2024, 2025]);

    return {
      kpis: kpis2025,
      previousYearKPIs: kpis2024,
      yoyCategoryDeltas: yoy.categoryDeltas,
      topCustomers2025: topClients,
      topRevenueCategories2025: revCategories,
      topExpenseCategories2025: expCategories,
      totalRecordCount: transactions.length,
    };
  }, [transactions]);

  const presetQuestions = [
    'Why did our operating profit and margins improve from 2024 to 2025?',
    'What is our customer concentration risk across our top enterprise clients?',
    'How much did AWS Cloud Hosting and infrastructure increase between 2024 and 2025?',
    'What is our recurring subscription revenue percentage and ARR predictability?',
    'What are our outstanding unpaid invoices and cash collection risk?',
  ];

  const handleSend = async (userQuestion: string) => {
    if (!userQuestion.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await askFinancialAnalyst(userQuestion, financialContext, companyName);

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        referencedFigures: response.referencedFigures,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `**Analysis Error:** ${err.message || 'Unable to connect to AI analyst backend.'}\n\nPlease check server connection and retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Analyst Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Ask FinSight AI Financial Analyst</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Ground Truth Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounded strictly in verified mathematical aggregates — no hallucinated financial figures.
            </p>
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>{transactions.length} Records In-Memory</span>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Deterministic Math</span>
          </div>
        </div>
      </div>

      {/* Suggested Questions Grid */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Suggested Analytical Queries
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 text-xs font-medium text-slate-800 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
            >
              <span className="group-hover:text-teal-900">{q}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[520px]">
        {/* Messages Container */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/50">
          {messages.map(msg => {
            const isAI = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAI ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs ${
                    isAI
                      ? 'bg-slate-900 text-teal-400 border border-slate-800'
                      : 'bg-teal-600 text-white'
                  }`}
                >
                  {isAI ? <Sparkles className="w-4 h-4" /> : 'YOU'}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-2xl rounded-2xl px-5 py-3.5 text-xs leading-relaxed shadow-2xs ${
                    isAI
                      ? 'bg-white text-slate-800 border border-slate-200'
                      : 'bg-teal-600 text-white font-medium'
                  }`}
                >
                  <div className="prose prose-xs max-w-none text-xs text-inherit whitespace-pre-line">
                    {msg.text}
                  </div>

                  {msg.referencedFigures && msg.referencedFigures.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Audited Figures:</span>
                      {msg.referencedFigures.map((fig, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]"
                        >
                          {fig}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-2 text-[10px] flex items-center justify-end ${
                      isAI ? 'text-slate-400' : 'text-teal-100'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                <span>Running calculation engines and generating CFO analysis...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about revenue, margins, customer churn, expenses, or runway..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
