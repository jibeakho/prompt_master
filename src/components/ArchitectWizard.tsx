import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  Wand2, 
  Loader2, 
  Copy, 
  Check,
  Lightbulb,
  FileText,
  RefreshCw,
  Ban
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { elaborateArchitectRequest, suggestArchitectContext, generateArchitectPrompt, ArchitectPromptResult } from '../services/gemini';

interface ArchitectWizardProps {
  apiKey: string;
  onRequireApiKey: () => void;
}

const EXAMPLES = [
  "복잡한 법률 문서를 쉽게 요약해 주는 AI 에이전트 설계해 줘",
  "유튜브 영상 대본을 블로그 포스팅으로 변환해 줘",
  "영문 이메일을 정중한 비즈니스 톤으로 번역하고 교정해 줘",
  "파이썬 코드를 리뷰하고 최적화 방안을 제시해 줘",
  "제품 상세 페이지를 위한 매력적인 카피라이팅 작성해 줘"
];

const EXCLUSION_OPTIONS = [
  { id: 'web', label: '웹 검색 (Web Browsing)' },
  { id: 'code', label: '코드 실행 (Code Interpreter)' },
  { id: 'image', label: '이미지 생성 (Image Generation)' },
  { id: 'pure', label: 'AI 미적용 (순수 텍스트/논리)' }
];

export default function ArchitectWizard({ apiKey, onRequireApiKey }: ArchitectWizardProps) {
  const [step, setStep] = useState(0);
  const [request, setRequest] = useState('');
  const [context, setContext] = useState('');
  const [exclusions, setExclusions] = useState<string[]>([]);
  
  const [isElaborating, setIsElaborating] = useState(false);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  
  const [result, setResult] = useState<ArchitectPromptResult | null>(null);
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
      const elaborated = await elaborateArchitectRequest(request, apiKey);
      setRequest(elaborated);
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        onRequireApiKey();
      } else {
        setError(err.message || '요청을 구체화하는 중 오류가 발생했습니다.');
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
      const suggestedContext = await suggestArchitectContext(request, apiKey);
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
      const finalResult = await generateArchitectPrompt(request, context, selectedExclusions, apiKey);
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
    setError('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Progress Bar */}
      {step > 0 && step < 3 && (
        <div className="h-1 bg-slate-800 w-full">
          <motion.div 
            className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-500"
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
                <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/30">
                  <Zap className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">프롬프트 아키텍트</h2>
                  <p className="text-slate-400 mt-1">
                    복잡한 요구사항 없이, 단 한 줄의 입력만으로 실행 가능한 한국어/영어 프롬프트를 즉시 설계합니다.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span>Zero-Question 원칙</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                  <span>Dual Language (한/영)</span>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-violet-500/20"
              >
                ARCHITECT 모드로 시작하기
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
                <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm font-medium border border-violet-500/30">
                  Step 1
                </span>
                <h2 className="text-xl font-bold text-slate-100">요청 사항 (Request)</h2>
              </div>
              <p className="text-slate-400">AI가 수행해주길 원하는 작업을 자유롭게 적어주세요.</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Lightbulb className="w-4 h-4 text-fuchsia-400" />
                    예제 선택하여 자동 입력
                  </label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all appearance-none"
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
                      placeholder="예: 복잡한 법률 문서를 쉽게 요약해 주는 AI 에이전트 설계해 줘"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pr-32 text-slate-100 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
                    />
                    <button
                      onClick={handleElaborateRequest}
                      disabled={!request.trim() || isElaborating}
                      className="absolute right-2 top-2 bottom-2 px-3 bg-slate-800 hover:bg-slate-700 text-violet-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
                  className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-2 rounded-xl font-medium transition-all"
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
                <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm font-medium border border-violet-500/30">
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
                      className="flex items-center gap-1.5 text-xs font-medium text-fuchsia-400 hover:text-fuchsia-300 transition-colors disabled:opacity-50"
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
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all resize-none"
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
                  className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-2 rounded-xl font-medium transition-all"
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
                  <div className="p-2 bg-violet-500/20 text-violet-400 rounded-lg">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">생성된 메타 프롬프트 (ARCHITECT)</h2>
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
                    className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-slate-950 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? '복사됨!' : '복사하기'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative group">
                <div className="absolute top-4 right-4 px-2.5 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded-md">
                  Architect Mode
                </div>
                <div className="prose prose-invert max-w-none prose-violet">
                  <Markdown>{result.prompt}</Markdown>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-fuchsia-400">
                    <Lightbulb className="w-5 h-5" />
                    <h3 className="font-bold">설계 핵심 (Key Strategy)</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {result.strategy}
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-violet-400">
                    <RefreshCw className="w-5 h-5" />
                    <h3 className="font-bold">개선 팁 (Fine-tuning)</h3>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-2">
                    {result.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
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
