import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, 
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
import { elaborateVertexRequest, suggestVertexContext, generateVertexPrompt, refineVertexPrompt, VertexPromptResult } from '../services/gemini';

interface VertexWizardProps {
  apiKey: string;
  onRequireApiKey: () => void;
}

const EXAMPLES = [
  "고객 리뷰 감정 분석 (XML 태그로 긍정/부정/중립 분류)",
  "뉴스 기사에서 핵심 엔티티(인물, 장소, 조직) 추출 (<ENTITIES> 태그)",
  "상품 설명서를 기반으로 Q&A 세트 생성 (XML 포맷 출력)",
  "긴 회의록을 요약하고 액션 아이템 추출 (<SUMMARY>, <ACTION_ITEMS>)",
  "의학 논문 초록을 알기 쉬운 말로 번역 및 요약",
  "입력된 텍스트의 문법 오류 수정 및 교정 (<CORRECTIONS>)",
  "사용자 질의 의도 분류 (구매/문의/환불 등)",
  "채용 공고에서 필수 자격 요건 구조화하여 추출",
  "다국어 뉴스 헤드라인 번역 및 카테고리 분류",
  "대화 기록을 바탕으로 CRM 데이터 입력 포맷 생성"
];

const EXCLUSION_OPTIONS = [
  { id: 'web', label: '웹 검색 (Web Browsing)' },
  { id: 'code', label: '코드 실행 (Code Interpreter)' },
  { id: 'image', label: '이미지 생성 (Image Generation)' },
  { id: 'pure', label: 'AI 미적용 (순수 텍스트/논리)' }
];

export default function VertexWizard({ apiKey, onRequireApiKey }: VertexWizardProps) {
  const [step, setStep] = useState(0);
  const [request, setRequest] = useState('');
  const [context, setContext] = useState('');
  const [exclusions, setExclusions] = useState<string[]>([]);
  
  const [isElaborating, setIsElaborating] = useState(false);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  
  const [result, setResult] = useState<VertexPromptResult | null>(null);
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
      const elaborated = await elaborateVertexRequest(request, apiKey);
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
      const suggestedContext = await suggestVertexContext(request, apiKey);
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
      const finalResult = await generateVertexPrompt(request, context, selectedExclusions, apiKey);
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
      const refinedResult = await refineVertexPrompt(result.prompt, refineText, apiKey);
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
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500"
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
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <Code2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">Vertex AI XML 모드</h2>
                  <p className="text-slate-400 mt-1">
                    Google Cloud 문서에서 권장하는 XML 태그 구조(&lt;INSTRUCTIONS&gt;, &lt;CONTEXT&gt; 등)를 적용하여 기업용 데이터 처리에 최적화된 프롬프트를 생성합니다.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>XML 구조화</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>Few-Shot 예시 생성</span>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
              >
                VERTEX 모드로 시작하기
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
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                  Step 1
                </span>
                <h2 className="text-xl font-bold text-slate-100">목적 정의 (Goal)</h2>
              </div>
              <p className="text-slate-400">Google Cloud Vertex AI가 수행해야 할 핵심 목표를 입력하세요.</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Lightbulb className="w-4 h-4 text-indigo-400" />
                    예제 선택하여 자동 입력
                  </label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all appearance-none"
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
                      placeholder="예: 채용 공고에서 필수 자격 요건 구조화하여 추출"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pr-32 text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      onClick={handleElaborateRequest}
                      disabled={!request.trim() || isElaborating}
                      className="absolute right-2 top-2 bottom-2 px-3 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-2 rounded-xl font-medium transition-all"
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
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
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
                      className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
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
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none"
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
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-2 rounded-xl font-medium transition-all"
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
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">생성된 메타 프롬프트 (Vertex XML)</h2>
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
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-slate-950 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? '복사됨!' : '복사하기'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative group">
                <div className="absolute top-4 right-4 px-2.5 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded-md">
                  Vertex AI Mode
                </div>
                <div className="prose prose-invert max-w-none prose-blue">
                  <Markdown>{result.prompt}</Markdown>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-indigo-400">
                    <Lightbulb className="w-5 h-5" />
                    <h3 className="font-bold">생성 논리 (Why this works)</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {result.strategy}
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-blue-400">
                    <RefreshCw className="w-5 h-5" />
                    <h3 className="font-bold">개선 팁 (Fine-tuning)</h3>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-2">
                    {result.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
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
