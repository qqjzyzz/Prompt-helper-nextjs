import { NextResponse } from "next/server";
import OpenAI from "openai";

const configuredBaseURL = process.env.OPENAI_BASE_URL;
let effectiveBaseURL = configuredBaseURL;

// 如果 OPENAI_BASE_URL 被设置为完整的聊天完成端点 (例如，以 "/chat/completions" 结尾),
// 我们需要提供给 SDK一个 *不包含* 此后缀的 baseURL。
// SDK 之后会自行附加 "/chat/completions" , 从而形成正确的、预期的完整URL。
const chatCompletionsEndpointSuffix = "/chat/completions";

// --- BEGINNING OF MODIFICATION TO ENFORCE ENV VAR --- 
if (!configuredBaseURL) {
  const errorMessage = "[Configuration Error] OPENAI_BASE_URL is not set in the environment variables. Please check your .env.local file and ensure the application is restarted.";
  console.error(errorMessage);
  // 我们可以选择在这里直接抛出错误，或者在 POST 函数中检查并返回错误响应
  // 为了让 API 路由能够返回一个标准的 JSON 错误，我们暂时不在这里抛出，而是在 POST 函数入口处检查
  // throw new Error(errorMessage); 
}
// --- END OF MODIFICATION TO ENFORCE ENV VAR ---

if (configuredBaseURL && configuredBaseURL.endsWith(chatCompletionsEndpointSuffix)) {
  effectiveBaseURL = configuredBaseURL.substring(0, configuredBaseURL.length - chatCompletionsEndpointSuffix.length);
}

console.log(`[OpenAI Init] Effective Base URL: ${effectiveBaseURL || 'Default OpenAI URL'}`);
const apiKey = process.env.OPENAI_API_KEY || "";
console.log(`[OpenAI Init] API Key (first 5 chars): ${apiKey.substring(0, 5)}`);

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: effectiveBaseURL, // 使用调整后的 baseURL
});

const getFrameworkPrompt = (framework: string) => {
  const prompts: Record<string, string> = {
    "CO-STAR": `你是一个提示词优化助手，请你将用户输入转化为 'co-star' 框架提示词。请根据每个元素提供尽可能详细的信息，确保每个元素都清晰、具体，并且符合以下格式：

==上下文==
提供一个具体的背景描述，包含任务目标和平台特征，明确内容需要适应的场景和用户需求。

==目标==
指出最终希望实现的具体目标，并分解成几项具体的子任务。

==身份==
说明内容创作者的角色及其对内容的影响，确保风格和语气与平台用户习惯一致。

==语气==
说明语气如何调整，以适应目标受众，突出内容的互动性和吸引力。

==受众==
明确主要目标受众及其特征，确保内容风格和语调符合他们的期望和偏好。

==结果==
说明预期的最终结果，确保生成的内容有明确的目的，符合平台发布要求。`,
    
    "CRISPE": `你是一个生成 CRISPE 框架提示词的助手。请将用户输入转化为符合 CRISPE 框架的提示词，包括以下几个部分：

Capacity and Role（角色）：赋予ChatGPT角色扮演的能力，明确在当前提问中应该以何种身份解答问题。

Insight（洞察）：提供充分的背景信息和上下文，帮助更好地理解问题。

Statement（声明）：明确说明需求或问题，具体指出期望得到什么样的答案或解释。

Personality（个性）：指定输出方式，如JSON结构、轻松幽默的语言等。

Experime（实验）：对于宽泛性问题，提供多个可选答案或建议。`,
    
    "ICIO": `你是一个生成 ICIO 框架提示词的助手。请将用户输入转化为符合 ICIO 框架的提示词，包括：

Input（输入）：明确提供给AI的具体数据或信息。
Context（上下文）：说明任务背景和目的。
Instruction（指令）：详细描述期望AI执行的具体操作。
Output（输出）：指定期望的输出格式和标准。`,
    
    "BROKE": `请将用户输入直接转化为严格以BROKE框架润色后的提示词：

Background（背景）：说明背景，提供充足信息
Role（角色）：指定AI需要扮演的角色
Objectives（目标）：描述需要完成的具体任务
Key Result（关键结果）：指定输出的风格、格式和内容要求
Evolve（进化）：提供三种可能的改进方向`,
    
    "Midjourney": `将用户输入的画面描述拆解为以下六个要素，并进行补充和完善：

1. 镜头：视角、构图、景深等
2. 光线：光源、明暗、氛围光等
3. 主体：核心对象的细节描述
4. 背景：环境、场景细节
5. 风格：艺术风格、渲染方式
6. 氛围：整体情绪和感觉`
  };

  return prompts[framework] || "";
};

export async function POST(req: Request) {
  // --- BEGINNING OF CHECK FOR OPENAI_BASE_URL IN POST --- 
  if (!process.env.OPENAI_BASE_URL) {
    // 此处重复检查，确保如果全局检查被注释掉或移除，这里仍然能捕获问题
    const errorMessage = "[Configuration Error] OPENAI_BASE_URL is not set. API call aborted.";
    console.error(errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 } // Internal Server Error or Configuration Error
    );
  }
  // --- END OF CHECK FOR OPENAI_BASE_URL IN POST ---

  try {
    // 同时解构出 customPrompt
    const { framework, input, model: requestedModel, customPrompt } = await req.json();
    const modelToUse = requestedModel || 'gpt-4.1';

    // 修改参数校验逻辑
    if (!input || (!customPrompt && !framework)) {
      return NextResponse.json(
        { error: "缺少用户输入，或者既未选择预设框架也未提供自定义框架指令" },
        { status: 400 }
      );
    }

    let systemContent = "";
    if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim() !== "") {
      systemContent = customPrompt; 
    } else if (framework) {
      systemContent = getFrameworkPrompt(framework);
    }

    // 如果到这里 systemContent 仍然是空，或者其内容为空（例如，framework 未定义在 getFrameworkPrompt 中，且无 customPrompt）
    if (systemContent.trim() === "") {
      systemContent = "你是一个提示词优化助手。请基于用户输入，直接输出优化后的提示词文本。";
    }
    
    // 统一追加纯净输出指令
    systemContent += "\n\n请严格遵守以下要求：只输出优化后的提示词文本本身。不要包含任何引言、标题、解释、确认信息、总结或任何与提示词本身无关的额外文字。";

    const userPrompt = `用户输入: \"${input}\"`;

    // Explicitly type messages to match OpenAI.Chat.ChatCompletionMessageParam[]
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent }, // 使用修改后的 systemContent
      { role: "user", content: userPrompt }
    ];

    const requestPayload = {
      model: modelToUse,
      messages: messages, 
    };
    console.log("[OpenAI Request] Payload:", JSON.stringify(requestPayload, null, 2));

    const response = await openai.chat.completions.create(requestPayload);

    console.log("OpenAI response:", JSON.stringify(response, null, 2));

    const output = response.choices?.[0]?.message?.content ?? "OpenAI无返回内容";
    return NextResponse.json({
      output
    });
  } catch (error: any) {
    console.error("[Generate Prompt Error] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // 保持原有的特定错误信息打印，以防 JSON.stringify 丢失某些信息
    console.error("Generate prompt error (legacy log):", error); 
    if (error.response) {
      console.error("OpenAI error response (legacy log):", error.response);
    }
    if (error.message) {
      console.error("OpenAI error message (legacy log):", error.message);
    }
    if (error.cause) {
      console.error("Error Cause (legacy log):", error.cause);
    }

    return NextResponse.json(
      { error: "生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}