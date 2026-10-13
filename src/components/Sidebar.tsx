import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  LineChart,
  MessageSquareText,
  SlidersHorizontal,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'import'
  | 'analysis'
  | 'ask'
  | 'scenario'
  | 'forecast'
  | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  recordCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  recordCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'import', label: 'Import Data', icon: UploadCloud, badge: `${recordCount}` },
    { id: 'analysis', label: 'Financial Analysis', icon: LineChart },
    { id: 'ask', label: 'Ask FinSight', icon: MessageSquareText, badge: 'AI' },
    { id: 'scenario', label: 'Scenario Lab', icon: SlidersHorizontal },
    { id: 'forecast', label: 'Forecasts', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-400 to-sky-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
              <Layers className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white">FinSight</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium text-teal-400/90 tracking-tight">
                Turn financial data into better decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Capabilities
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                        item.badge === 'AI'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Attribution & System Footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/80 space-y-3">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>AI Analytical Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Deterministic calculation engine paired with Gemini CFO reasoning.
          </p>
        </div>

        {/* Mandatory Attribution */}
        <div className="flex items-center justify-between text-[11px] text-slate-300 px-1 pt-1 border-t border-slate-900">
          <span className="font-medium">FinSight v2.5</span>
          <span className="text-teal-400/90 font-medium">Built by The Fintechs</span>
        </div>
      </div>
    </aside>
  );
};
