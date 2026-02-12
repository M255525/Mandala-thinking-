import React, { useState, useEffect } from 'react';
import { MandalaResult, ViewMode } from './types';
import { generateMandalaData } from './services/geminiService';
import { VisualView } from './components/VisualView';
import { ReportView } from './components/ReportView';
import { DashboardView } from './components/DashboardView';
import { ChecklistView } from './components/ChecklistView';
import { BrainCircuit, Grid3x3, FileText, Sparkles, Loader2, LayoutDashboard, KeyRound, ListTodo } from 'lucide-react';

const DEFAULT_TOPIC = "設計一堂 AI 提示語課程";
const EXAMPLE_TOPICS = [
  "規劃日本自助旅行",
  "提升職場溝通能力",
  "舉辦一場產品發表會",
  "學習一門新語言"
];

export default function App() {
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [data, setData] = useState<MandalaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);

  // Check API Key status on mount
  useEffect(() => {
    if (process.env.API_KEY) {
      console.log("API Key Status: ✅ Present");
    } else {
      console.error("API Key Status: ❌ Missing. Please ensure process.env.API_KEY is configured.");
    }
  }, []);

  const handleGenerate = async (overrideTopic?: string) => {
    // If overrideTopic is a string (from example click), use it. Otherwise use state topic.
    // Note: onClick events might pass a synthetic event object, so we strictly check for string type.
    const targetTopic = typeof overrideTopic === 'string' ? overrideTopic : topic;

    if (!targetTopic.trim()) return;
    
    // If we clicked an example, update the input visually too
    if (typeof overrideTopic === 'string') {
      setTopic(targetTopic);
    }
    
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await generateMandalaData(targetTopic);
      setData(result);
    } catch (err: any) {
      setError(err.message || "產生曼陀羅思考圖時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 hidden sm:block">
              曼陀羅思考助手
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Small visual indicator if API key is present could go here, but omitted for cleanliness */}
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Input Section */}
        <section className="flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">您想拆解什麼主題？</h2>
            <p className="text-slate-500">運用曼陀羅思考法 (Mandalart)，將複雜概念轉化為具體可行的行動步驟。</p>
          </div>

          <div className="w-full relative group">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="請輸入主題..."
              className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
              disabled={loading}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !topic.trim()}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span className="hidden sm:inline">開始生成</span>
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <KeyRound className="w-3 h-3" />
            <span>提示：請確保環境變數 (API Key) 已正確設定以啟用 AI 生成功能。</span>
          </div>

          {/* Example Topics */}
          <div className="flex flex-wrap items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
             <span className="text-xs font-medium text-slate-400 mr-1">熱門範例：</span>
             {EXAMPLE_TOPICS.map((t) => (
               <button
                 key={t}
                 onClick={() => handleGenerate(t)}
                 disabled={loading}
                 className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm disabled:opacity-50"
               >
                 {t}
               </button>
             ))}
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Loading State Placeholder */}
        {loading && !data && (
           <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
              <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
              <div className="h-4 bg-slate-200 rounded w-48"></div>
              <div className="grid grid-cols-3 gap-2 w-32 h-32 opacity-20 mt-4">
                 {[...Array(9)].map((_, i) => <div key={i} className="bg-slate-300 rounded"></div>)}
              </div>
           </div>
        )}

        {/* Results Area */}
        {data && (
          <div className="space-y-6">
            {/* View Toggles */}
            <div className="flex justify-center">
              <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex gap-1 overflow-x-auto">
                <button
                  onClick={() => setViewMode(ViewMode.DASHBOARD)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    viewMode === ViewMode.DASHBOARD 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  全景儀表板
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.VISUAL)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    viewMode === ViewMode.VISUAL 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                  互動圖表
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.CHECKLIST)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    viewMode === ViewMode.CHECKLIST
                      ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  任務檢核
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.REPORT)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    viewMode === ViewMode.REPORT
                      ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  詳細報告
                </button>
              </div>
            </div>

            {/* Content Content */}
            <div className="min-h-[600px]">
              {viewMode === ViewMode.VISUAL && <VisualView data={data} topic={topic} />}
              {viewMode === ViewMode.DASHBOARD && <DashboardView data={data} topic={topic} />}
              {viewMode === ViewMode.REPORT && <ReportView data={data} topic={topic} />}
              {viewMode === ViewMode.CHECKLIST && <ChecklistView data={data} topic={topic} />}
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-6 text-center text-slate-400 text-sm">
        由 Google Gemini 2.5 Flash 技術支援
      </footer>
    </div>
  );
}