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
  Bot,
  Lock
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

  // --- [추가] 수강생 전용 문지기 기능 ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // 💡 아래 "원하는비밀번호" 부분을 직접 수정하세요!
  const MASTER_PASSWORD = "bychance"; 

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === MASTER_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("비밀번호가 올바르지 않습니다.");
      setPasswordInput('');
    }
  };
  // ------------------------------------

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

  // 🛡️ 1단계: 인증되지 않은 사용자에게 보여줄 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans text-slate-100">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px]" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Lock className="text-slate-950 w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">수강생 전용 입장</h1>
              <p className="text-sm text-slate-400">
                Prompt Master는 인증된 수강생 전용 도구입니다.<br/>
                제공받으신 입장 코드를 입력해 주세요.
              </p>
            </div>

            <form onSubmit={handleAuth} className="w-full space-y-4">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="입장 코드를 입력하세요"
                className="w-full px-5 py-4 rounded-2xl bg-slate-950 border border-slate-700 text-center text-lg tracking-widest text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-pink-500 text-slate-950 font-bold text-lg shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all active:scale-95"
              >
                마스터 도구 입장하기
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // ✅ 2단계: 인증 완료 시 보여줄 메인 화면 (기존 코드 전체 보존)
  const tabs = [
    { id: 'RTSC', label: 'RTSC 마스터', icon: Layers, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
    { id: 'FRAMEWORK', label: '프레임워크 전문가', icon: Briefcase, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
    { id: 'ARCHITECT', label: '프롬프트 아키텍트', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    { id: 'VERTEX', label: 'Vertex AI XML', icon: Code2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    { id: 'COT', label: '논리적 추론(CoT)', icon: GitBranch, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-200">
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
                placeholder="무엇을 도와드릴까요?"
                className="w-full min-h-[160px] bg-slate-950/50 border border-slate-700 rounded-2xl p-6 text-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all resize-none backdrop-blur-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'REVERSE', label: '역질문 유도', icon: MessageSquareQuote, desc: 'AI가 정보를 되물어 완성도를 높입니다.' },
                { id: 'PERSONA', label: '페르소나 부여', icon: UserPlus, desc: '최적의 전문가 역할을 AI가 설정합니다.' },
                { id: 'CRITICAL', label: '비판적 개선', icon: ShieldAlert, desc: '프롬프트의 문제점을 꼬집고 수정합니다.' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleGenerate('QUICK', opt.id as SubOption)}
                  disabled={isLoading || !input.trim()}
                  className="group flex flex-col items-start p-5 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-teal-500/50 transition-all disabled:opacity-50"
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

        <section className="mt-12">
          <div className="flex flex-wrap border-b border-slate-800 px-4 pt-4 bg-slate-900/50 rounded-t-3xl relative z-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PromptMode)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative rounded-t-2xl",
                  activeTab === tab.id 
                    ? "text-teal-400 bg-slate-900 border border-slate-800 border-b-0" 
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? tab.color : "text-slate-500")} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 border-t-0 rounded-b-3xl p-8 shadow-2xl relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {activeTab === 'RTSC' ? (
                  <RtscWizard apiKey={userApiKey} onRequireApiKey={() => setIsSettingsOpen(true)} />
                ) : activeTab === 'FRAMEWORK' ? (
                  <FrameworkWizard apiKey={userApiKey} onRequireApiKey={() => setIsSettingsOpen(true)} />
                ) : activeTab === 'ARCHITECT' ? (
                  <ArchitectWizard apiKey={userApiKey} onRequireApiKey={() => setIsSettingsOpen(true)} />
                ) : activeTab === 'VERTEX' ? (
                  <VertexWizard apiKey={userApiKey} onRequireApiKey={() => setIsSettingsOpen(true)} />
                ) : (
                  <CotWizard apiKey={userApiKey} onRequireApiKey={() => setIsSettingsOpen(true)} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

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
                  생성된 결과
                </h3>
                {output && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? '복사됨!' : '결과 복사'}
                  </button>
                )}
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-sm min-h-[200px] relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                    <div className="w-12 h-12 border-4 border-slate-800 border-t-teal-400 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse">설계 중...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <Markdown>{output}</Markdown>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800 mt-12 text-center space-y-6">
        <p className="text-sm font-bold text-slate-400 tracking-[0.2em]">CREATED by Jibeakho</p>
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-medium text-slate-500">어쩌다Ai 당근 모임 가입하기</p>
          <div className="p-2 bg-white rounded-2xl border border-slate-800 shadow-lg">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://daangn.com/kr/share/community/ref/invite-group/8oDHVdtpUf" 
              alt="QR코드" 
              className="w-32 h-32 rounded-xl"
            />
          </div>
        </div>
      </footer>

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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100">설정</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-slate-400 hover:text-slate-200">
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Gemini API Key</label>
                  <input
                    type="password"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    placeholder="API 키를 입력하세요"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-500/50 transition-all"
                  />
                </div>
                <button
                  onClick={() => saveApiKey(userApiKey)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-pink-500 text-slate-950 font-bold shadow-lg transition-all active:scale-95"
                >
                  설정 저장하기
                </button>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ExternalLink className="w-3 h-3" />
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 underline">키 발급받기</a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}