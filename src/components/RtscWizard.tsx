import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ChevronRight, ChevronLeft, Sparkles, Check, Copy, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import { suggestRoles, suggestTask, generateRtscFinal } from '../services/gemini';
import { cn } from '../lib/utils';

interface RtscWizardProps {
  apiKey: string;
  onRequireApiKey: () => void;
}

const EXAMPLES = [
  "여행 블로그 포스팅 작성 (전문 여행 작가 논)",
  "파이썬 초보자를 위한 리스트 컴프리헨션 튜토리얼 작성",
  "다이어트 식단 계획표 생성 (30대 직장인 남성 기준)",
  "유튜브 쇼츠 대본 작성 (AI 뉴스 주제, 60초)",
  "고객 불만 응대 이메일 작성 (정중하고 공감하는 태도)"
];

export default function RtscWizard({ apiKey, onRequireApiKey }: RtscWizardProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [role, setRole] = useState('');
  const [task, setTask] = useState('');
  const [structure, setStructure] = useState('마크다운 표 형식, 두괄식 작성');
  const [chain, setChain] = useState('단계별로 생각하기, 전문 용어 설명 포함');
  
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  
  const [finalPrompt, setFinalPrompt] = useState('');
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleError = (error: any) => {
    if (error.message === "API_KEY_MISSING") {
      onRequireApiKey();
    } else {
      alert("오류가 발생했습니다: " + error.message);
    }
  };

  const handleNextToRole = async () => {
    if (!goal.trim()) return;
    setStep(2);
    if (roleSuggestions.length === 0) {
      setIsLoadingRoles(true);
      try {
        const suggestions = await suggestRoles(goal, apiKey);
        setRoleSuggestions(suggestions);
      } catch (error) {
        handleError(error);
        setStep(1); // Go back if failed
      } finally {
        setIsLoadingRoles(false);
      }
    }
  };

  const handleNextToTask = async () => {
    if (!role.trim()) return;
    setStep(3);
    if (!task) {
      setIsLoadingTask(true);
      try {
        const suggestedTask = await suggestTask(goal, role, apiKey);
        setTask(suggestedTask);
      } catch (error) {
        handleError(error);
        setStep(2);
      } finally {
        setIsLoadingTask(false);
      }
    }
  };

  const handleGenerateFinal = async () => {
    setStep(5);
    setIsGeneratingFinal(true);
    try {
      const result = await generateRtscFinal({ goal, role, task, structure, chain }, apiKey);
      setFinalPrompt(result);
    } catch (error) {
      handleError(error);
      setStep(4);
    } finally {
      setIsGeneratingFinal(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetWizard = () => {
    setStep(1);
    setGoal('');
    setRole('');
    setTask('');
    setRoleSuggestions([]);
    setFinalPrompt('');
  };

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-teal-400 to-pink-500"
          initial={{ width: '20%' }}
          animate={{ width: `${(step / 5) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: GOAL */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold mb-4 inline-block">Step 1</span>
              <h3 className="text-2xl font-bold text-slate-100">목적 정의 (Goal)</h3>
              <p className="text-slate-400 mt-2">가장 먼저, AI를 통해 무엇을 달성하고 싶은지 명확히 정의해주세요.</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="예: 유튜브 쇼츠 대본 작성 (AI 뉴스 주제, 60초)"
                className="w-full px-5 py-4 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
              />
              
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                <p className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  어떤 작업을 할지 모르겠다면? 예제를 선택해보세요!
                </p>
                <div className="flex flex-col gap-2">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setGoal(ex)}
                      className="text-left px-4 py-3 rounded-xl hover:bg-slate-800 text-sm text-slate-300 transition-colors border border-transparent hover:border-slate-700"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNextToRole}
                disabled={!goal.trim()}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음 단계로 <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: ROLE */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold mb-4 inline-block">Step 2</span>
              <h3 className="text-2xl font-bold text-slate-100">역할 부여 (Role)</h3>
              <p className="text-slate-400 mt-2">목표 달성에 가장 적합한 전문가의 시각을 AI에게 부여합니다.</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="예: 당신은 실리콘밸리 출신의 10년차 카피라이터입니다."
                className="w-full px-5 py-4 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
              />
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  '{goal}' 기반 추천 역할
                </p>
                {isLoadingRoles ? (
                  <div className="flex items-center gap-3 text-slate-500 p-4">
                    <Loader2 className="w-5 h-5 animate-spin" /> AI가 최적의 역할을 분석 중입니다...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {roleSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => setRole(sug)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm transition-all border",
                          role === sug 
                            ? "bg-pink-500/20 border-pink-500/50 text-pink-300" 
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600"
                        )}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-6 py-4 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                <ChevronLeft className="w-5 h-5" /> 이전
              </button>
              <button
                onClick={handleNextToTask}
                disabled={!role.trim() || isLoadingRoles}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-pink-500 text-slate-950 font-bold hover:bg-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음 단계로 <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: TASK */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold mb-4 inline-block">Step 3</span>
              <h3 className="text-2xl font-bold text-slate-100">구체적 작업 (Task)</h3>
              <p className="text-slate-400 mt-2">AI가 수행해야 할 과업을 최대한 구체적으로 설명해주세요.</p>
            </div>
            
            <div className="space-y-2 relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-400">작업 내용</label>
                <span className="text-xs text-purple-400 flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI 자동 작성됨</span>
              </div>
              
              {isLoadingTask ? (
                <div className="w-full min-h-[200px] rounded-2xl bg-slate-950 border border-slate-700 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  <p>목표와 역할을 바탕으로 최적의 과업을 설계 중입니다...</p>
                </div>
              ) : (
                <textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full min-h-[200px] px-5 py-4 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none"
                />
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-4 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                <ChevronLeft className="w-5 h-5" /> 이전
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!task.trim() || isLoadingTask}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-purple-500 text-slate-950 font-bold hover:bg-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음 단계로 <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: STRUCTURE & CHAIN */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold mb-4 inline-block">Step 4</span>
              <h3 className="text-2xl font-bold text-slate-100">구조 및 조건 (Structure & Chain)</h3>
              <p className="text-slate-400 mt-2">결과물의 형식과 지켜야 할 제약 조건을 설정하여 품질을 높입니다.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">구조 / 형식 (Structure)</label>
                <input
                  type="text"
                  value={structure}
                  onChange={(e) => setStructure(e.target.value)}
                  placeholder="예: 마크다운 표 형식, 두괄식 작성"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">조건 / 제약 (Chain)</label>
                <input
                  type="text"
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                  placeholder="예: 단계별로 생각하기, 전문 용어 설명 포함"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(3)} className="flex items-center gap-2 px-6 py-4 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                <ChevronLeft className="w-5 h-5" /> 이전
              </button>
              <button
                onClick={handleGenerateFinal}
                disabled={!structure.trim() || !chain.trim()}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-pink-500 text-slate-950 font-bold hover:opacity-90 transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-5 h-5" /> 프롬프트 생성
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: RESULT */}
        {step === 5 && (
          <motion.div key="step5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-teal-400" />
                생성된 메타 프롬프트 (RTSC)
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={resetWizard}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> 새로 만들기
                </button>
                <button
                  onClick={copyToClipboard}
                  disabled={isGeneratingFinal}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-slate-950 text-sm font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '복사됨!' : '복사하기'}
                </button>
              </div>
            </div>

            <div className="bg-slate-950 rounded-3xl border border-slate-800 p-8 shadow-inner min-h-[300px] relative">
              {isGeneratingFinal ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80 backdrop-blur-sm rounded-3xl z-10">
                  <div className="w-12 h-12 border-4 border-slate-800 border-t-pink-500 rounded-full animate-spin" />
                  <p className="text-sm font-medium text-slate-400 animate-pulse">완벽한 RTSC 프롬프트를 조립하고 있습니다...</p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-teal-400 prose-code:text-pink-400 prose-code:bg-pink-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:border prose-pre:border-slate-800">
                  <Markdown>{finalPrompt}</Markdown>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
