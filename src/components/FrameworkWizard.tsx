import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  ChevronRight, 
  ChevronLeft, 
  Wand2, 
  Loader2, 
  Copy, 
  Check,
  Lightbulb,
  FileText,
  RefreshCw
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { suggestFrameworkContext, generateFrameworkPrompt, FrameworkPromptResult } from '../services/gemini';

interface FrameworkWizardProps {
  apiKey: string;
  onRequireApiKey: () => void;
}

const EXAMPLES = [
  "신규 모바일 앱 런칭을 위한 CO-STAR 기획안 작성",
  "경쟁사 분석 보고서 (SWOT 분석 활용)",
  "팀 성과 목표 설정을 위한 OKR 수립",
  "투자 유치를 위한 엘리베이터 피치 작성 (PREP 구조)",
  "사내 워크샵 기획안 (RICE 우선순위 모델 적용)",
  "마케팅 전략 제안서 (4P 믹스 기반)",
  "프로젝트 회고록 작성 (KPT 회고 방식)",
  "신입 사원 온보딩 가이드라인 (체크리스트 포함)",
  "비즈니스 파트너십 제안 이메일 (PAS 프레임워크)",
  "분기별 영업 실적 발표 스크립트"
];

export default function FrameworkWizard({ apiKey, onRequireApiKey }: FrameworkWizardProps) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  const [result, setResult] = useState<FrameworkPromptResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleNextToContext = () => {
    if (!goal.trim()) return;
    setStep(2);
  };

  const handleAutoContext = async () => {
    if (!goal.trim()) return;
    setIsGeneratingContext(true);
    setError('');
    try {
      const suggestedContext = await suggestFrameworkContext(goal, apiKey);
      setContext(suggestedContext);
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        onRequireApiKey();
      } else {
        setError(err.message || '문맥을 생성하는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsGeneratingContext(false);
    }
  };

  const handleGenerateFinal = async () => {
    if (!goal.trim() || !context.trim()) return;
    setIsGeneratingFinal(true);
    setError('');
    try {
      const finalResult = await generateFrameworkPrompt(goal, context, apiKey);
      setResult(finalResult);
      setStep(3);
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        onRequireApiKey();
      } else {
        setError(err.message || '프롬프트를 생성하는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsGeneratingFinal(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetWizard = () => {
    setStep(0);
    setGoal('');
    setContext('');
    setResult(null);
    setError('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Progress Bar */}
      {step > 0 && step < 3 && (
        <div className="h-1 bg-slate-800 w-full">
          <motion.div 
            className="h-full bg-gradient-to-r from-teal-400 to-pink-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 2) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="p-6 md:p-8">
        <AnimatePresence mode="wait">
          {/* Step 0: Intro */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/30">
                  <Briefcase className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">프레임워크 기반 프롬프트</h2>
                  <p className="text-slate-400 mt-1">
                    CO-STAR, RICE, RTF 등 검증된 비즈니스 프레임워크를 상황에 맞게 자동 선택하여 논리적인 기획안을 완성합니다.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>Pro Frameworks</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                  <span>Standardized Formats</span>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20"
              >
                BUSINESS 모드로 시작하기
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Step 1: Goal */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm font-medium border border-teal-500/30">
                  Step 1
                </span>
                <h2 className="text-xl font-bold text-slate-100">목적 정의 (Goal)</h2>
              </div>
              <p className="text-slate-400">작성하고자 하는 문서, 기획안, 또는 해결하고 싶은 과제를 입력해주세요.</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Lightbulb className="w-4 h-4 text-pink-400" />
                    예제 선택하여 자동 입력
                  </label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all appearance-none"
                    onChange={(e) => {
                      if (e.target.value) setGoal(e.target.value);
                    }}
                    value={EXAMPLES.includes(goal) ? goal : ""}
                  >
                    <option value="" disabled>어떤 작업을 할지 모르겠다면? 예제를 선택해보세요!</option>
                    {EXAMPLES.map((ex, i) => (
                      <option key={i} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">핵심 내용 직접 입력</label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="예: 경쟁사 분석 보고서 (SWOT 분석 활용)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </button>
                <button
                  onClick={handleNextToContext}
                  disabled={!goal.trim()}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-2 rounded-xl font-medium transition-all"
                >
                  다음
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Context */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm font-medium border border-teal-500/30">
                  Step 2
                </span>
                <h2 className="text-xl font-bold text-slate-100">상세 정보 및 파일</h2>
              </div>
              <p className="text-slate-400">더 나은 결과를 위해 추가적인 정보나 문맥을 제공할 수 있습니다.</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">추가 지시사항 / 문맥 (선택)</label>
                    <button
                      onClick={handleAutoContext}
                      disabled={isGeneratingContext}
                      className="flex items-center gap-1.5 text-xs font-medium text-pink-400 hover:text-pink-300 transition-colors disabled:opacity-50"
                    >
                      {isGeneratingContext ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      AI 자동 작성
                    </button>
                  </div>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="예: 독자는 20대 대학생이고, 친근한 톤으로 작성해주세요."
                    className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all resize-none"
                  />
                </div>
                
                {/* Mock File Upload Area */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">레퍼런스 문서/미디어 (선택사항)</label>
                  <div className="w-full border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800/50 hover:border-slate-600 transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="font-medium text-slate-300">클릭하여 파일 업로드</p>
                    <p className="text-xs mt-1">또는 파일을 여기로 드래그하세요 (현재 UI 데모)</p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </button>
                <button
                  onClick={handleGenerateFinal}
                  disabled={!context.trim() || isGeneratingFinal}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-2 rounded-xl font-medium transition-all"
                >
                  {isGeneratingFinal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      생성하기
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Result */}
          {step === 3 && result && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">생성된 메타 프롬프트 (BUSINESS)</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetWizard}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    새로 만들기
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? '복사됨!' : '복사하기'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative group">
                <div className="absolute top-4 right-4 px-2.5 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded-md">
                  Gov/Biz Standard
                </div>
                <div className="prose prose-invert max-w-none prose-teal">
                  <Markdown>{result.prompt}</Markdown>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-pink-400">
                    <Lightbulb className="w-5 h-5" />
                    <h3 className="font-bold">생성 논리 (Why this works)</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-teal-400">
                    <RefreshCw className="w-5 h-5" />
                    <h3 className="font-bold">개선 팁 (Fine-tuning)</h3>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-2">
                    {result.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
