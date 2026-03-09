import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitMerge, 
  ChevronRight, 
  ChevronLeft, 
  Wand2, 
  Loader2, 
  Copy, 
  Check,
  Lightbulb,
  FileText,
  RefreshCw,
  Ban,
  MessageSquare
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { elaborateCotRequest, suggestCotContext, generateCotPrompt, refineCotPrompt, CotPromptResult } from '../services/gemini';

interface CotWizardProps {
  apiKey: string;
  onRequireApiKey: () => void;
}

const EXAMPLES = [
  "페르미 추정: 서울 시내의 짜장면 집 개수 추론",
  "복잡한 논리 퍼즐 해결 과정 단계별 설명",
  "주어진 재무 데이터를 바탕으로 다음 분기 수익 예측 (근거 포함)",
  "알고리즘 문제 풀이 (시간 복잡도 분석 포함)",
  "기후 변화가 해수면 상승에 미치는 영향 인과관계 분석",
  "철학적 딜레마(트롤리 문제)에 대한 다양한 관점의 논리적 분석",
  "미스터리 소설의 범인 추론 (단서 기반 논리 전개)",
  "수학 증명 과정 단계별 기술 (피타고라스 정리)",
  "새로운 비즈니스 모델의 수익성 분석 (가설 및 검증 단계)",
  "복잡한 시스템 장애 원인 파악을 위한 근본 원인 분석(RCA)"
];

const EXCLUSION_OPTIONS = [
  { id: 'web', label: '웹 검색 (Web Browsing)' },
  { id: 'code', label: '코드 실행 (Code Interpreter)' },
  { id: 'image', label: '이미지 생성 (Image Generation)' },
  { id: 'pure', label: 'AI 미적용 (순수 텍스트/논리)' }
];

export default function CotWizard({ apiKey, onRequireApiKey }: CotWizardProps) {
  const [step, setStep] = useState(0);
  const [request, setRequest] = useState('');
  const [context, setContext] = useState('');
  const [exclusions, setExclusions] = useState<string[]>([]);
  
  const [isElaborating, setIsElaborating] = useState(false);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  
  const [result, setResult] = useState<CotPromptResult | null>(null);
  const [refineText, setRefineText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleNextToContext = () => {
    if (!request.trim()) return;
    setStep(2);
  };

  const handleElaborateRequest = async () => {
    if (!request.trim()) return;
    setIsElaborating(true);
    setError('');
    try {
      const elaborated = await elaborateCotRequest(request, apiKey);
      setRequest(elaborated);
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        onRequireApiKey();
      } else {
        setError(err.message || '목표를 구체화하는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsElaborating(false);
    }
  };

  const handleAutoContext = async () => {
    if (!request.trim()) return;
    setIsGeneratingContext(true);
    setError('');
    try {
      const suggestedContext = await suggestCotContext(request, apiKey);
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
    if (!request.trim()) return;
    setIsGeneratingFinal(true);
    setError('');
    try {
      const selectedExclusions = EXCLUSION_OPTIONS.filter(opt => exclusions.includes(opt.id)).map(opt => opt.label);
      const finalResult = await generateCotPrompt(request, context, selectedExclusions, apiKey);
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

  const handleRefine = async () => {
    if (!refineText.trim() || !result) return;
    setIsRefining(true);
    setError('');
    try {
      const refinedResult = await refineCotPrompt(result.prompt, refineText, apiKey);
      setResult(refinedResult);
      setRefineText('');
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        onRequireApiKey();
      } else {
        setError(err.message || '프롬프트를 수정하는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsRefining(false);
    }
  };

  const toggleExclusion = (id: string) => {
    setExclusions(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetWizard = () => {
    setStep(0);
    setRequest('');
    setContext('');
    setExclusions([]);
    setResult(null);
    setRefineText('');
    setError('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Progress Bar */}
      {step > 0 && step < 3 && (
        <div className="h-1 bg-slate-800 w-full">
          <motion.div 
            className="h-full bg-gradient-to-r from-rose-400 to-pink-500"
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
                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/30">
                  <GitMerge className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">논리적 추론 (Chain of Thought)</h2>
                  <p className="text-slate-400 mt-1">
                    복잡한 문제를 단계별로 분해하고, AI가 '생각하는 과정'을 거치도록 유도하여 정확도를 높입니다.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>단계별 추론 (CoT)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                  <span>Internal Monologue</span>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-rose-500/20"
              >
                COT_REASONING 모드로 시작하기
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Step 1: Request */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-sm font-medium border border-rose-500/30">
                  Step 1
                </span>
                <h2 className="text-xl font-bold text-slate-100">목적 정의 (Goal)</h2>
              </div>
              <p className="text-slate-400">논리적 해결이 필요한 복잡한 문제나 분석 과제를 입력하세요.</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Lightbulb className="w-4 h-4 text-pink-400" />
                    예제 선택하여 자동 입력
                  </label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all appearance-none"
                    onChange={(e) => {
                      if (e.target.value) setRequest(e.target.value);
                    }}
                    value={EXAMPLES.includes(request) ? request : ""}
                  >
                    <option value="" disabled>어떤 작업을 할지 모르겠다면? 예제를 선택해보세요!</option>
                    {EXAMPLES.map((ex, i) => (
                      <option key={i} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">핵심 내용 직접 입력</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={request}
                      onChange={(e) => setRequest(e.target.value)}
                      placeholder="예: 기후 변화가 해수면 상승에 미치는 영향 인과관계 분석"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pr-32 text-slate-100 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all"
                    />
                    <button
                      onClick={handleElaborateRequest}
                      disabled={!request.trim() || isElaborating}
                      className="absolute right-2 top-2 bottom-2 px-3 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isElaborating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      AI 구체화
                    </button>
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
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </button>
                <button
                  onClick={handleNextToContext}
                  disabled={!request.trim()}
                  className="flex items-center gap-2 bg-rose-500 hover:bg-rose-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-2 rounded-xl font-medium transition-all"
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
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-sm font-medium border border-rose-500/30">
                  Step 2
                </span>
                <h2 className="text-xl font-bold text-slate-100">상세 정보 및 파일</h2>
              </div>
              <p className="text-slate-400">더 나은 결과를 위해 추가적인 정보나 파일을 제공할 수 있습니다.</p>

              <div className="space-y-6">
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
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all resize-none"
                  />
                </div>
                
                {/* Mock File Upload Area */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">레퍼런스 문서/미디어 (선택사항)</label>
                  <div className="w-full border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800/50 hover:border-slate-600 transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="font-medium text-slate-300">클릭하여 파일 업로드</p>
                    <p className="text-xs mt-1">또는 파일을 여기로 드래그하세요</p>
                  </div>
                </div>

                {/* Exclusions */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <Ban className="w-4 h-4" />
                    <h3 className="text-sm font-bold">제외할 모델 기능 선택 (체크시 해당 기능 사용 안함)</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {EXCLUSION_OPTIONS.map(opt => (
                      <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                          exclusions.includes(opt.id) 
                            ? "bg-red-500 border-red-500" 
                            : "border-slate-600 group-hover:border-slate-500 bg-slate-900"
                        )}>
                          {exclusions.includes(opt.id) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={cn(
                          "text-sm transition-colors",
                          exclusions.includes(opt.id) ? "text-slate-200" : "text-slate-400 group-hover:text-slate-300"
                        )}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
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
                  disabled={isGeneratingFinal}
                  className="flex items-center gap-2 bg-rose-500 hover:bg-rose-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-2 rounded-xl font-medium transition-all"
                >
                  {isGeneratingFinal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      프롬프트 생성
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
                  <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                    <GitMerge className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">생성된 메타 프롬프트 (COT_REASONING)</h2>
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
                    className="flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-slate-950 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? '복사됨!' : '복사하기'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative group">
                <div className="absolute top-4 right-4 px-2.5 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded-md">
                  CoT Strategy
                </div>
                <div className="prose prose-invert max-w-none prose-rose">
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
                    {result.strategy}
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-rose-400">
                    <RefreshCw className="w-5 h-5" />
                    <h3 className="font-bold">개선 팁 (Fine-tuning)</h3>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-2">
                    {result.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Refinement Section */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3 text-orange-400">
                  <MessageSquare className="w-5 h-5" />
                  <h3 className="font-bold">결과가 마음에 들지 않으신가요? (Refinement)</h3>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={refineText}
                    onChange={(e) => setRefineText(e.target.value)}
                    placeholder="수정하고 싶은 내용을 구체적으로 적어주세요. (예: 좀 더 정중한 톤으로 바꿔줘, 영어 번역도 추가해줘, 예시를 3개 더 넣어줘)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRefine();
                    }}
                  />
                  <button
                    onClick={handleRefine}
                    disabled={!refineText.trim() || isRefining}
                    className="bg-orange-500 hover:bg-orange-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    {isRefining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        수정 중...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        수정 요청
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
