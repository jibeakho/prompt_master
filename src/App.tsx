/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { 
  Wand2, 
  MessageSquareQuote, 
  UserPlus, 
  ShieldAlert, 
  Layers, 
  Briefcase, 
  Zap, 
  Code2, 
  GitBranch,
  HelpCircle,
  Settings,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { generatePrompt, PromptMode } from './services/gemini';
import RtscWizard from './components/RtscWizard';
import FrameworkWizard from './components/FrameworkWizard';
import ArchitectWizard from './components/ArchitectWizard';
import VertexWizard from './components/VertexWizard';
import CotWizard from './components/CotWizard';

type SubOption = 'REVERSE' | 'PERSONA' | 'CRITICAL' | null;

export default function App() {
  const [activeTab, setActiveTab] = useState<PromptMode>('QUICK');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subOption, setSubOption] = useState<SubOption>(null);
  const [copied, setCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');

  const handleGenerate = useCallback(async (mode: PromptMode, opt: SubOption = null) => {
    if (!input.trim()) return;
    setIsLoading(true);
    setOutput('');
    try {
      const result = await generatePrompt({ 
        mode, 
        input, 
        subOption: opt || undefined,
        apiKey: userApiKey 
      });
      setOutput(result || '결과를 생성하지 못했습니다.');
    } catch (error: any) {
      console.error(error);
      if (error.message === "API_KEY_MISSING") {
        setOutput('API 키가 설정되지 않았습니다. 설정 메뉴에서 API 키를 입력해주세요.');
        setIsSettingsOpen(true);
      } else {
        setOutput(error.message || '오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, userApiKey]);

  const saveApiKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('GEMINI_API_KEY', key);
    setIsSettingsOpen(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'RTSC', label: 'RTSC 마스터', icon: Layers, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
    { id: 'FRAMEWORK', label: '프레임워크 전문가', icon: Briefcase, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
    { id: 'ARCHITECT', label: '프롬프트 아키텍트', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    { id: 'VERTEX', label: 'Vertex AI XML', icon: Code2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    { id: 'COT', label: '논리적 추론(CoT)', icon: GitBranch, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Bot className="text-slate-950 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-pink-500">Prompt Master</h1>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Professional Prompt Engineering Tools</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-teal-400 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-teal-400 transition-colors relative"
            >
              <Settings className="w-5 h-5" />
              {!userApiKey && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full border-2 border-slate-950" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Quick Prompt Section */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 md:p-12 shadow-2xl shadow-teal-500/10">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">PRO 전용</span>
              <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                <Wand2 className="w-8 h-8 text-teal-400" />
                빠른 프롬프트 만들기
              </h2>
            </div>

            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="무엇을 도와드릴까요? (예: 블로그 글 써줘, 영어 공부 계획 짜줘)"
                className="w-full min-h-[160px] bg-slate-950/50 border border-slate-700 rounded-2xl p-6 text-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all resize-none backdrop-blur-md"
              />
              <div className="absolute bottom-4 right-4 text-slate-500 text-sm font-mono">
                {input.length} characters
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'REVERSE', label: '역질문 유도', icon: MessageSquareQuote, desc: 'AI가 부족한 정보를 되물어 완성도를 높입니다.' },
                { id: 'PERSONA', label: '페르소나 부여', icon: UserPlus, desc: '최적의 전문가 역할을 AI가 스스로 설정합니다.' },
                { id: 'CRITICAL', label: '비판적 개선', icon: ShieldAlert, desc: '프롬프트의 문제점을 꼬집고 즉시 수정합니다.' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleGenerate('QUICK', opt.id as SubOption)}
                  disabled={isLoading || !input.trim()}
                  className="group flex flex-col items-start p-5 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-teal-500/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 rounded-lg bg-slate-950 group-hover:bg-teal-500/20 mb-3 transition-colors">
                    <opt.icon className="w-5 h-5 text-teal-400" />
                  </div>
                  <h3 className="font-bold text-slate-200 mb-1">{opt.label}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Advanced Modes Tabs */}
        <section className="mt-12">
          {/* Tabs Header - Unified with content */}
          <div className="flex flex-wrap border-b border-slate-800 px-4 pt-4 bg-slate-900/50 rounded-t-3xl relative z-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PromptMode)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative rounded-t-2xl",
                  activeTab === tab.id 
                    ? "text-teal-400 bg-slate-900 border border-slate-800 border-b-0" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border border-transparent border-b-0"
                )}
              >
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? tab.color : "text-slate-500")} />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-slate-900" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-slate-900 border border-slate-800 border-t-0 rounded-b-3xl p-8 shadow-2xl shadow-teal-500/5 relative">
            <div className="absolute top-4 right-4 z-20">
              <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[9px] font-bold uppercase tracking-widest">PRO 전용</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative"
              >
                {activeTab === 'RTSC' ? (
                  <RtscWizard apiKey={userApiKey} onRequireApiKey={() => setIsSettingsOpen(true)} />
                ) : activeTab === 'FRAMEWORK' ? (
                  <FrameworkWizard apiKey={userApiKey} onRequireApiKey={() => setIsSettingsOpen(true)} />
                ) : activeTab === 'ARCHITECT' ? (
                  <ArchitectWizard apiKey={userApiKey} onRequireApiKey={() => setIsSettingsOpen(true)} />
                ) : activeTab === 'VERTEX' ? (
                  <VertexWizard apiKey={userApiKey} onRequireApiKey={() => setIsSettingsOpen(true)} />
                ) : activeTab === 'COT' ? (
                  <CotWizard apiKey={userApiKey} onRequireApiKey={() => setIsSettingsOpen(true)} />
                ) : (
                  <div className="flex flex-col md:flex-row gap-10 items-center">
                    <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {React.createElement(tabs.find(t => t.id === activeTab)?.icon || Layers, { 
                            className: cn("w-8 h-8", tabs.find(t => t.id === activeTab)?.color) 
                          })}
                          <h2 className="text-2xl font-bold text-slate-100">
                          </h2>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                        </p>
                      </div>

                      <ul className="grid grid-cols-2 gap-3">
                        {[
                        ].flat().filter(Boolean).map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                            <div className={cn("w-1.5 h-1.5 rounded-full", tabs.find(t => t.id === activeTab)?.color?.replace('text', 'bg'))} />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleGenerate(activeTab)}
                        disabled={isLoading || !input.trim()}
                        className={cn(
                          "flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-slate-950 transition-all shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                          activeTab === 'FRAMEWORK' && 'bg-teal-400 shadow-teal-500/20 hover:bg-teal-300',
                          activeTab === 'ARCHITECT' && 'bg-purple-400 shadow-purple-500/20 hover:bg-purple-300',
                          activeTab === 'VERTEX' && 'bg-cyan-400 shadow-cyan-500/20 hover:bg-cyan-300',
                          activeTab === 'COT' && 'bg-rose-400 shadow-rose-500/20 hover:bg-rose-300',
                        )}
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : activeTab + ' 모드로 시작하기'}
                        {!isLoading && <Wand2 className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="hidden md:flex w-64 h-64 items-center justify-center relative">
                      <div className={cn("absolute inset-0 rounded-full blur-3xl opacity-20", tabs.find(t => t.id === activeTab)?.bg)} />
                      <div className={cn("w-full h-full rounded-full border-2 border-dashed animate-[spin_20s_linear_infinite]", tabs.find(t => t.id === activeTab)?.border)} />
                      <div className={cn("absolute inset-4 rounded-full flex items-center justify-center", tabs.find(t => t.id === activeTab)?.bg)}>
                        {React.createElement(tabs.find(t => t.id === activeTab)?.icon || Layers, { 
                          className: cn("w-20 h-20", tabs.find(t => t.id === activeTab)?.color) 
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Result Area */}
        <AnimatePresence>
          {(output || isLoading) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-teal-400" />
                  생성된 프롬프트 결과
                </h3>
                {output && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? '복사됨!' : '프롬프트 복사'}
                  </button>
                )}
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-sm min-h-[200px] relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                    <div className="w-12 h-12 border-4 border-slate-800 border-t-teal-400 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse">최적의 프롬프트를 설계하는 중입니다...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-teal-400 prose-code:text-pink-400 prose-code:bg-pink-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-pre:border prose-pre:border-slate-800">
                    <Markdown>{output}</Markdown>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800 mt-12">
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-teal-400 transition-colors">이용약관</a>
            <a href="#" className="hover:text-teal-400 transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-teal-400 transition-colors">공지사항</a>
          </div>
          <div className="text-center space-y-6">
            <p className="text-sm font-bold text-slate-400 tracking-[0.2em]">CREATED by Jibeakho</p>
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs font-medium text-slate-500">어쩌다Ai 당근 모임 가입하기</p>
              <div className="p-2 bg-white rounded-2xl shadow-lg shadow-teal-500/10 border border-slate-800">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://daangn.com/kr/share/community/ref/invite-group/8oDHVdtpUf" 
                  alt="어쩌다Ai 당근 모임 가입 QR코드" 
                  className="w-32 h-32 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-800">
                    <Settings className="w-6 h-6 text-slate-300" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">설정</h2>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Gemini API Key</label>
                  <input
                    type="password"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    placeholder="AI Studio에서 발급받은 API 키를 입력하세요"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 leading-relaxed ml-1">
                    입력하신 API 키는 브라우저의 로컬 저장소에만 안전하게 보관되며, 서버로 전송되지 않습니다.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => saveApiKey(userApiKey)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-pink-500 text-slate-950 font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all active:scale-95"
                  >
                    설정 저장하기
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
                  <ExternalLink className="w-3 h-3" />
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-teal-400 underline underline-offset-2"
                  >
                    API 키 발급받으러 가기
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
