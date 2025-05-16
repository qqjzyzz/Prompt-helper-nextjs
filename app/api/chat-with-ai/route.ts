import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const configuredBaseURL = process.env.OPENAI_BASE_URL;
let effectiveBaseURL = configuredBaseURL;

const chatCompletionsEndpointSuffix = "/chat/completions";
if (configuredBaseURL && configuredBaseURL.endsWith(chatCompletionsEndpointSuffix)) {
  effectiveBaseURL = configuredBaseURL.substring(0, configuredBaseURL.length - chatCompletionsEndpointSuffix.length);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: effectiveBaseURL,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const { prompt, model: requestedModel } = await request.json();
    const modelToUse = requestedModel || 'gpt-4.1';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: 'system',
          content: '请直接针对用户提供的提示词内容进行回应，只输出回应文本本身。不要包含任何引言、标题、解释、确认信息、总结或任何与核心回应无关的额外文字。'
        },
        { role: 'user', content: prompt }
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Error in /api/chat-with-ai:', error);
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // It's good practice to avoid sending detailed internal errors to the client in production
    return NextResponse.json({ error: 'Error processing your request: ' + errorMessage }, { status: 500 });
  }
} 