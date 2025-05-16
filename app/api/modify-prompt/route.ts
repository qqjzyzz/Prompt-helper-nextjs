import { NextResponse } from "next/server";
import OpenAI from "openai";

const configuredBaseURL = process.env.OPENAI_BASE_URL;
let effectiveBaseURL = configuredBaseURL;

// 如果 OPENAI_BASE_URL 被设置为完整的聊天完成端点 (例如，以 "/chat/completions" 结尾),
// 我们需要提供给 SDK一个 *不包含* 此后缀的 baseURL。
// SDK 之后会自行附加 "/chat/completions" , 从而形成正确的、预期的完整URL。
const chatCompletionsEndpointSuffix = "/chat/completions";
if (configuredBaseURL && configuredBaseURL.endsWith(chatCompletionsEndpointSuffix)) {
  effectiveBaseURL = configuredBaseURL.substring(0, configuredBaseURL.length - chatCompletionsEndpointSuffix.length);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: effectiveBaseURL, // 使用调整后的 baseURL
});

export async function POST(req: Request) {
  try {
    const { framework, originalOutput, modificationInput, model: requestedModel, customPrompt } = await req.json();
    const modelToUse = requestedModel || 'gpt-4.1';

    if (!originalOutput || !modificationInput || (!customPrompt && !framework)) {
      return NextResponse.json(
        { error: "缺少原始输出、修改建议，或既未选择预设框架也未提供自定义框架上下文" },
        { status: 400 }
      );
    }

    let systemMessageContent = "";
    let guidanceContext = "";

    if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim() !== "") {
      systemMessageContent = customPrompt;
      guidanceContext = "用户提供的自定义指令";
    } else if (framework) {
      systemMessageContent = `你是 ${framework} 框架的提示词优化专家。`;
      guidanceContext = `${framework} 框架`;
    } else {
      systemMessageContent = "你是一个提示词修改助手。";
      guidanceContext = "通用指南";
    }
    
    systemMessageContent += "\n\n请严格遵守以下要求：只输出修改后的提示词文本本身。不要包含任何引言、标题、解释、确认信息、总结或任何与提示词本身无关的额外文字。";

    const userMessageContent = `原始提示词是：\n${originalOutput}\n\n用户的修改意见是：${modificationInput}\n\n请根据用户的意见，并结合之前定义的 ${guidanceContext}，重新生成修改后的提示词。`;

    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: systemMessageContent },
        { role: "user", content: userMessageContent }
      ]
    });

    return NextResponse.json({
      output: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Modify prompt error:", error);
    return NextResponse.json(
      { error: "修改失败，请稍后重试" },
      { status: 500 }
    );
  }
}