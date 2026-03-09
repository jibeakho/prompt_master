import { GoogleGenAI } from "@google/genai";

export type PromptMode = 'QUICK' | 'RTSC' | 'FRAMEWORK' | 'ARCHITECT' | 'VERTEX' | 'COT';

export interface GenerateParams {
  mode: PromptMode;
  input: string;
  subOption?: string;
  apiKey?: string;
}

function getAiInstance(apiKey?: string) {
  let envKey = "";
  try {
    envKey = process.env.GEMINI_API_KEY || "";
  } catch (e) {
    // Ignore ReferenceError if process is not defined in browser
  }
  
  const finalApiKey = apiKey || envKey;
  
  if (!finalApiKey) {
    throw new Error("API_KEY_MISSING");
  }

  return new GoogleGenAI({ apiKey: finalApiKey });
}

export async function generatePrompt({ mode, input, subOption, apiKey }: GenerateParams) {
  const ai = getAiInstance(apiKey);
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ parts: [{ text: getSystemPrompt(mode, subOption) + "\n\nUser Input: " + input }] }],
    config: {
      temperature: 0.7,
    }
  });

  const response = await model;
  return response.text;
}

// --- RTSC Wizard Helper Functions ---

export async function suggestRoles(goal: string, apiKey?: string): Promise<string[]> {
  const ai = getAiInstance(apiKey);
  const prompt = `목표: "${goal}"\n이 목표를 달성하기 위해 가장 적합한 전문가 페르소나(역할) 4가지를 추천해주세요. 각 역할은 20자 이내로 짧고 명확하게 작성하세요. 반드시 배열 형태의 JSON으로만 응답하세요. 예: ["10년차 실리콘밸리 카피라이터", "IT 전문 뉴스 앵커", "숏폼 바이럴 마케팅 디렉터"]`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  
  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return ["콘텐츠 기획자", "전문 카피라이터", "데이터 분석가", "마케팅 전문가"];
  }
}

export async function suggestTask(goal: string, role: string, apiKey?: string): Promise<string> {
  const ai = getAiInstance(apiKey);
  const prompt = `목표: "${goal}"\n역할: "${role}"\n위 목표와 역할을 바탕으로, AI가 수행해야 할 구체적인 과업(Task)을 2~3문장으로 상세하고 전문적으로 작성해주세요.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });
  
  return response.text || "";
}

export async function generateRtscFinal(data: {goal: string, role: string, task: string, structure: string, chain: string}, apiKey?: string): Promise<string> {
  const ai = getAiInstance(apiKey);
  const prompt = `다음 정보를 바탕으로 완벽한 RTSC 메타 프롬프트를 작성해주세요.
  
[Role] ${data.role}
[Task] ${data.task}
[Structure] ${data.structure}
[Constraints & Chain] ${data.chain}

출력 형식은 마크다운으로, ### [Role], ### [Task], ### [Structure], ### [Constraints & Chain] 섹션을 나누어 명확히 작성하고, 마지막에 ### [Variable] (변수 설정 가이드)와 ### 생성 논리 및 팁을 추가해주세요.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });
  
  return response.text || "";
}

// --- Framework Wizard Helper Functions ---

export async function suggestFrameworkContext(goal: string, apiKey?: string): Promise<string> {
  const ai = getAiInstance(apiKey);
  const prompt = `사용자가 비즈니스 프레임워크 기반의 프롬프트를 작성하려고 합니다.
목표: "${goal}"

이 목표를 달성하기 위해 AI에게 제공할 '상세 지시사항 및 문맥(Context)'을 전문적이고 구체적으로 작성해주세요.
사용자가 어떤 역할을 수행해야 하는지, 어떤 분석이나 기획이 필요한지, 어떤 톤앤매너로 작성해야 하는지 등을 포함하여 3~4문장으로 작성해주세요.

출력 형식: 순수 텍스트 (마크다운 없이)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt
  });
  
  return response.text?.trim() || "";
}

export interface FrameworkPromptResult {
  prompt: string;
  reasoning: string;
  tips: string[];
}

export async function generateFrameworkPrompt(goal: string, context: string, apiKey?: string): Promise<FrameworkPromptResult> {
  const ai = getAiInstance(apiKey);
  const prompt = `당신은 세계 최고의 비즈니스 프레임워크 전문가이자 프롬프트 엔지니어입니다.
사용자의 목표와 문맥을 분석하여, 가장 적합한 비즈니스 프레임워크(예: SWOT, CO-STAR, RICE, PREP, 4P, OKR 등)를 선택하고, 이를 바탕으로 완벽하게 구조화된 메타 프롬프트를 작성해주세요.

[사용자 입력]
목표: ${goal}
상세 문맥: ${context}

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요. 다른 설명은 포함하지 마세요.
{
  "prompt": "# [프롬프트 제목]\\n\\n## 1. 역할 (Role)\\n...\\n\\n## 2. 배경 및 목적 (Context & Objective)\\n...\\n\\n## 3. 상세 지시사항 (Instructions)\\n...\\n\\n## 4. 제약 및 출력 형식 (Constraints & Format)\\n...",
  "reasoning": "이 프롬프트가 왜 효과적인지, 어떤 프레임워크를 왜 선택했는지 설명 (3~4줄)",
  "tips": [
    "프롬프트를 더 발전시키기 위한 팁 1",
    "프롬프트를 더 발전시키기 위한 팁 2"
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  try {
    return JSON.parse(response.text || "{}") as FrameworkPromptResult;
  } catch (e) {
    console.error("Failed to parse framework prompt JSON", response.text);
    throw new Error("결과를 파싱하는 데 실패했습니다.");
  }
}

// --- Architect Wizard Helper Functions ---

export async function elaborateArchitectRequest(request: string, apiKey?: string): Promise<string> {
  const ai = getAiInstance(apiKey);
  const prompt = `사용자가 작성한 짧은 요청사항을 더 구체적이고 명확하게 다듬어주세요.
[원본 요청]
"${request}"

[지시사항]
- 원본의 의도를 유지하면서, AI가 더 잘 이해할 수 있도록 구체적인 목적, 대상, 기대 효과 등을 덧붙여 1~2문장으로 완성해주세요.
- 출력 형식: 순수 텍스트 (마크다운 없이)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt
  });
  
  return response.text?.trim() || "";
}

export async function suggestArchitectContext(request: string, apiKey?: string): Promise<string> {
  const ai = getAiInstance(apiKey);
  const prompt = `사용자가 다음 요청에 대한 프롬프트를 설계하려고 합니다.
요청: "${request}"

이 요청을 완벽하게 수행하기 위해 AI에게 제공해야 할 '상세 지시사항 및 문맥(Context)'을 작성해주세요.
어떤 페르소나를 가져야 하는지, 어떤 제약 조건이 있는지, 어떤 톤앤매너로 답변해야 하는지 등을 포함하여 3~4문장으로 구체적으로 작성해주세요.

출력 형식: 순수 텍스트 (마크다운 없이)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt
  });
  
  return response.text?.trim() || "";
}

export interface ArchitectPromptResult {
  prompt: string;
  strategy: string;
  tips: string[];
}

export async function generateArchitectPrompt(request: string, context: string, exclusions: string[], apiKey?: string): Promise<ArchitectPromptResult> {
  const ai = getAiInstance(apiKey);
  const exclusionsText = exclusions.length > 0 ? `\n[제외할 기능/조건]\n${exclusions.join(', ')} 기능은 사용하지 마세요.` : '';
  
  const prompt = `당신은 세계 최고의 프롬프트 아키텍트입니다.
사용자의 요청과 문맥을 분석하여, 단 한 번의 입력으로 완벽한 결과를 도출할 수 있는(Zero-Question) 최적화된 메타 프롬프트를 설계해주세요.

[사용자 입력]
요청: ${request}
상세 문맥: ${context}${exclusionsText}

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요. 다른 설명은 포함하지 마세요.
{
  "prompt": "### [✨ 최적화된 프롬프트]\\n\\n**[역할]**\\n...\\n\\n**[목표]**\\n...\\n\\n**[분석 및 출력 가이드라인]**\\n...\\n\\n**[제약 사항]**\\n...\\n\\n**[입력 데이터]**\\n(여기에 데이터를 입력하세요)",
  "strategy": "이 프롬프트의 설계 핵심(Key Strategy)을 설명 (3~4줄)",
  "tips": [
    "프롬프트를 더 발전시키기 위한 팁 1",
    "프롬프트를 더 발전시키기 위한 팁 2"
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  try {
    return JSON.parse(response.text || "{}") as ArchitectPromptResult;
  } catch (e) {
    console.error("Failed to parse architect prompt JSON", response.text);
    throw new Error("결과를 파싱하는 데 실패했습니다.");
  }
}

// --- Vertex Wizard Helper Functions ---

export async function elaborateVertexRequest(request: string, apiKey?: string): Promise<string> {
  const ai = getAiInstance(apiKey);
  const prompt = `사용자가 작성한 짧은 목표를 더 구체적이고 명확하게 다듬어주세요.
[원본 목표]
"${request}"

[지시사항]
- 원본의 의도를 유지하면서, 기업용 데이터 처리 및 Vertex AI가 더 잘 이해할 수 있도록 구체적인 목적, 대상, 기대 효과 등을 덧붙여 1~2문장으로 완성해주세요.
- 출력 형식: 순수 텍스트 (마크다운 없이)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt
  });
  
  return response.text?.trim() || "";
}

export async function suggestVertexContext(request: string, apiKey?: string): Promise<string> {
  const ai = getAiInstance(apiKey);
  const prompt = `사용자가 다음 목표에 대한 Vertex AI 프롬프트를 설계하려고 합니다.
목표: "${request}"

이 작업을 완벽하게 수행하기 위해 AI에게 제공해야 할 '상세 지시사항 및 문맥(Context)'을 작성해주세요.
어떤 페르소나를 가져야 하는지, 어떤 제약 조건이 있는지, 데이터 처리 시 주의할 점 등을 포함하여 3~4문장으로 구체적으로 작성해주세요.

출력 형식: 순수 텍스트 (마크다운 없이)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt
  });
  
  return response.text?.trim() || "";
}

export interface VertexPromptResult {
  prompt: string;
  strategy: string;
  tips: string[];
}

export async function generateVertexPrompt(request: string, context: string, exclusions: string[], apiKey?: string): Promise<VertexPromptResult> {
  const ai = getAiInstance(apiKey);
  const exclusionsText = exclusions.length > 0 ? `\n[제외할 기능/조건]\n${exclusions.join(', ')} 기능은 사용하지 마세요.` : '';
  
  const prompt = `당신은 Google Cloud Vertex AI 프롬프트 엔지니어링 전문가입니다.
사용자의 요청과 문맥을 분석하여, Vertex AI에서 권장하는 XML 태그 구조(<OBJECTIVE_AND_PERSONA>, <INSTRUCTIONS>, <CONSTRAINTS>, <CONTEXT>, <OUTPUT_FORMAT>, <FEW_SHOT_EXAMPLES>, <RECAP> 등)를 완벽하게 적용한 프롬프트를 설계해주세요.

[사용자 입력]
목표: ${request}
상세 문맥: ${context}${exclusionsText}

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요. 다른 설명은 포함하지 마세요.
{
  "prompt": "<OBJECTIVE_AND_PERSONA>\\n...\\n</OBJECTIVE_AND_PERSONA>\\n\\n<INSTRUCTIONS>\\n...\\n</INSTRUCTIONS>\\n\\n<CONSTRAINTS>\\n...\\n</CONSTRAINTS>\\n\\n<CONTEXT>\\n...\\n</CONTEXT>\\n\\n<OUTPUT_FORMAT>\\n...\\n</OUTPUT_FORMAT>\\n\\n<FEW_SHOT_EXAMPLES>\\n...\\n</FEW_SHOT_EXAMPLES>\\n\\n<RECAP>\\n...\\n</RECAP>",
  "strategy": "이 프롬프트의 생성 논리(Why this works)를 설명 (3~4줄)",
  "tips": [
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 1",
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 2",
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 3"
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  try {
    return JSON.parse(response.text || "{}") as VertexPromptResult;
  } catch (e) {
    console.error("Failed to parse vertex prompt JSON", response.text);
    throw new Error("결과를 파싱하는 데 실패했습니다.");
  }
}

export async function refineVertexPrompt(originalPrompt: string, refinementRequest: string, apiKey?: string): Promise<VertexPromptResult> {
  const ai = getAiInstance(apiKey);
  
  const prompt = `당신은 Google Cloud Vertex AI 프롬프트 엔지니어링 전문가입니다.
기존에 생성된 XML 구조의 프롬프트를 사용자의 수정 요청에 맞게 개선해주세요.

[기존 프롬프트]
${originalPrompt}

[수정 요청]
${refinementRequest}

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요. 다른 설명은 포함하지 마세요.
{
  "prompt": "<OBJECTIVE_AND_PERSONA>\\n...\\n</OBJECTIVE_AND_PERSONA>\\n\\n<INSTRUCTIONS>\\n...\\n</INSTRUCTIONS>\\n\\n<CONSTRAINTS>\\n...\\n</CONSTRAINTS>\\n\\n<CONTEXT>\\n...\\n</CONTEXT>\\n\\n<OUTPUT_FORMAT>\\n...\\n</OUTPUT_FORMAT>\\n\\n<FEW_SHOT_EXAMPLES>\\n...\\n</FEW_SHOT_EXAMPLES>\\n\\n<RECAP>\\n...\\n</RECAP>",
  "strategy": "수정된 프롬프트의 생성 논리(Why this works)를 설명 (3~4줄)",
  "tips": [
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 1",
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 2",
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 3"
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  try {
    return JSON.parse(response.text || "{}") as VertexPromptResult;
  } catch (e) {
    console.error("Failed to parse refined vertex prompt JSON", response.text);
    throw new Error("결과를 파싱하는 데 실패했습니다.");
  }
}

// --- CoT Wizard Helper Functions ---

export async function elaborateCotRequest(request: string, apiKey?: string): Promise<string> {
  const ai = getAiInstance(apiKey);
  const prompt = `사용자가 작성한 짧은 목표를 더 구체적이고 명확하게 다듬어주세요.
[원본 목표]
"${request}"

[지시사항]
- 원본의 의도를 유지하면서, 논리적 추론(Chain of Thought)이 필요한 복잡한 문제 해결이나 분석 과제로 구체화하여 1~2문장으로 완성해주세요.
- 출력 형식: 순수 텍스트 (마크다운 없이)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt
  });
  
  return response.text?.trim() || "";
}

export async function suggestCotContext(request: string, apiKey?: string): Promise<string> {
  const ai = getAiInstance(apiKey);
  const prompt = `사용자가 다음 목표에 대한 논리적 추론(CoT) 프롬프트를 설계하려고 합니다.
목표: "${request}"

이 작업을 완벽하게 수행하기 위해 AI에게 제공해야 할 '상세 지시사항 및 문맥(Context)'을 작성해주세요.
어떤 페르소나를 가져야 하는지, 어떤 제약 조건이 있는지, 논리 전개 시 주의할 점 등을 포함하여 3~4문장으로 구체적으로 작성해주세요.

출력 형식: 순수 텍스트 (마크다운 없이)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt
  });
  
  return response.text?.trim() || "";
}

export interface CotPromptResult {
  prompt: string;
  strategy: string;
  tips: string[];
}

export async function generateCotPrompt(request: string, context: string, exclusions: string[], apiKey?: string): Promise<CotPromptResult> {
  const ai = getAiInstance(apiKey);
  const exclusionsText = exclusions.length > 0 ? `\n[제외할 기능/조건]\n${exclusions.join(', ')} 기능은 사용하지 마세요.` : '';
  
  const prompt = `당신은 프롬프트 엔지니어링 전문가입니다.
사용자의 요청과 문맥을 분석하여, AI가 '생각하는 과정'을 거치도록 유도하는 완벽한 논리적 추론(Chain of Thought) 프롬프트를 설계해주세요.

[사용자 입력]
목표: ${request}
상세 문맥: ${context}${exclusionsText}

[지시사항]
- 프롬프트 내에 [단계별 사고], [이유 설명], [작업 분해], [내부 독백 및 검토] 등의 명시적인 단계를 포함하여 AI가 논리적 비약 없이 결론에 도달하도록 유도하세요.
- 사용자가 바로 복사해서 사용할 수 있는 완성된 프롬프트 텍스트를 작성하세요.

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요. 다른 설명은 포함하지 마세요.
{
  "prompt": "생성된 CoT 프롬프트 내용 (마크다운 포맷 가능)",
  "strategy": "이 프롬프트의 생성 논리(Why this works)를 설명 (3~4줄)",
  "tips": [
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 1",
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 2",
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 3"
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  try {
    return JSON.parse(response.text || "{}") as CotPromptResult;
  } catch (e) {
    console.error("Failed to parse CoT prompt JSON", response.text);
    throw new Error("결과를 파싱하는 데 실패했습니다.");
  }
}

export async function refineCotPrompt(originalPrompt: string, refinementRequest: string, apiKey?: string): Promise<CotPromptResult> {
  const ai = getAiInstance(apiKey);
  
  const prompt = `당신은 프롬프트 엔지니어링 전문가입니다.
기존에 생성된 논리적 추론(CoT) 프롬프트를 사용자의 수정 요청에 맞게 개선해주세요.

[기존 프롬프트]
${originalPrompt}

[수정 요청]
${refinementRequest}

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요. 다른 설명은 포함하지 마세요.
{
  "prompt": "수정된 CoT 프롬프트 내용 (마크다운 포맷 가능)",
  "strategy": "수정된 프롬프트의 생성 논리(Why this works)를 설명 (3~4줄)",
  "tips": [
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 1",
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 2",
    "프롬프트를 더 발전시키기 위한 개선 팁(Fine-tuning) 3"
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  try {
    return JSON.parse(response.text || "{}") as CotPromptResult;
  } catch (e) {
    console.error("Failed to parse refined CoT prompt JSON", response.text);
    throw new Error("결과를 파싱하는 데 실패했습니다.");
  }
}

function getSystemPrompt(mode: PromptMode, subOption?: string): string {
  switch (mode) {
    case 'QUICK':
      if (subOption === 'REVERSE') {
        return "당신은 프롬프트 엔지니어입니다. 사용자의 요청을 분석하여, 더 완성도 높은 결과를 내기 위해 AI가 사용자에게 되물어야 할 '역질문' 리스트를 작성하세요. 질문은 구체적이고 논리적이어야 합니다.";
      }
      if (subOption === 'PERSONA') {
        return "당신은 프롬프트 엔지니어입니다. 사용자의 요청에 가장 적합한 '전문가 페르소나'를 설정하고, 그 페르소나가 작업을 수행하기 위한 최적의 프롬프트를 작성하세요.";
      }
      if (subOption === 'CRITICAL') {
        return "당신은 비판적 프롬프트 리뷰어입니다. 사용자의 요청에서 부족한 점, 모호한 점을 꼬집고 이를 즉시 수정한 개선된 프롬프트를 제안하세요.";
      }
      return "사용자의 요청을 바탕으로 전문적인 프롬프트를 생성하세요.";

    case 'RTSC':
      return "당신은 RTSC(Role, Task, Structure, Chain) 메타 프롬프트 전문가입니다. 사용자의 요청을 [역할(Role)], [작업(Task)], [구조(Structure)], [제약/체인(Chain)]의 4단계로 설계하여 가장 완벽한 프롬프트를 생성하세요. 결과는 구조화된 마크다운 형식으로 제공하세요.";

    case 'FRAMEWORK':
      return "당신은 비즈니스 프롬프트 프레임워크 전문가입니다. 상황에 맞게 CO-STAR, RICE, RTF 등의 프레임워크 중 하나를 선택하여 논리적이고 체계적인 프롬프트를 작성하세요. 어떤 프레임워크를 사용했는지 명시하세요.";

    case 'ARCHITECT':
      return "당신은 프롬프트 아키텍트입니다. 단 한 줄의 입력만으로도 실행 가능한 고품질의 한국어/영어 혼용 프롬프트를 즉시 설계하세요. Zero-Question 원칙을 준수하여 사용자가 추가 질문을 하지 않아도 되게 만드세요.";

    case 'VERTEX':
      return "당신은 Google Vertex AI 최적화 전문가입니다. Google Cloud 문서에서 권장하는 XML 태그 구조(<INSTRUCTIONS>, <CONTEXT>, <EXAMPLES> 등)를 적용하여 Vertex AI에 최적화된 프롬프트를 생성하세요.";

    case 'COT':
      return "당신은 논리적 추론(Chain of Thought) 전문가입니다. 복잡한 문제를 단계별로 분해하고, AI가 '생각하는 과정(Internal Monologue)'을 거치도록 유도하는 정밀한 프롬프트를 작성하세요.";

    default:
      return "전문적인 프롬프트 엔지니어로서 답변하세요.";
  }
}

