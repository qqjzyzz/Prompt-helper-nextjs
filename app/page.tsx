"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoginPopover } from "@/components/LoginPopover";

const frameworks = {
  "CO-STAR": "写专业报告/市场分析",
  "CRISPE": "让AI扮演特定角色",
  "ICIO": "处理结构化数据/代码任务",
  "BROKE": "优化现有文案/迭代创意",
  "Midjourney": "生成Midjourney绘画提示"
};

interface ChatHistoryItem {
  prompt: string;
  response: string;
}

interface AIChatState {
  history: ChatHistoryItem | null;
  isLoading: boolean;
}

const initialAIChatState: AIChatState = { history: null, isLoading: false };

const aiModels = [
  { id: "gpt-4.1", name: "GPT-4.1" },
  { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet" },
  { id: "gemini-2.5-pro-preview-03-25", name: "Gemini 2.5 Pro" },
  { id: "deepseek-r1", name: "DeepSeek R1" },
  { id: "grok-3-beta", name: "Grok 3 Beta" },
];

export default function Home() {
  const [selectedFramework, setSelectedFramework] = useState("");
  const [userInput, setUserInput] = useState("");
  const [customFrameworkPrompt, setCustomFrameworkPrompt] = useState("");
  const [initialOutput, setInitialOutput] = useState("");
  const [modificationInput, setModificationInput] = useState("");
  const [modifiedOutput, setModifiedOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [initialTaskChatState, setInitialTaskChatState] = useState<AIChatState>(initialAIChatState);
  const [generatedPromptChatState, setGeneratedPromptChatState] = useState<AIChatState>(initialAIChatState);
  const [modifiedPromptChatState, setModifiedPromptChatState] = useState<AIChatState>(initialAIChatState);

  const [selectedAIModel, setSelectedAIModel] = useState<string>(aiModels[0].id);

  const handleFrameworkSelect = (framework: string) => {
    setSelectedFramework(framework);
    setCustomFrameworkPrompt("");
  };

  const handleGeneratePrompt = async () => {
    if (!userInput || (!selectedFramework && !customFrameworkPrompt)) {
      alert("请输入任务描述，并选择一个预设框架或提供自定义框架指令");
      return;
    }
    setIsLoading(true);
    setGeneratedPromptChatState(initialAIChatState);
    setModifiedPromptChatState(initialAIChatState);
    setModifiedOutput("");
    setModificationInput("");

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          framework: selectedFramework,
          input: userInput,
          model: selectedAIModel,
          customPrompt: customFrameworkPrompt,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setInitialOutput(data.output);
    } catch (error) {
      alert(error instanceof Error ? error.message : "生成失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyPrompt = async () => {
    if (!modificationInput || !initialOutput) {
      alert("请输入修改建议");
      return;
    }
    setIsLoading(true);
    setModifiedPromptChatState(initialAIChatState);
    try {
      const response = await fetch("/api/modify-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          framework: selectedFramework,
          originalOutput: initialOutput,
          modificationInput,
          model: selectedAIModel,
          customPrompt: customFrameworkPrompt,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setModifiedOutput(data.output);
    } catch (error) {
      alert(error instanceof Error ? error.message : "修改失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWithAI = async (
    promptContent: string,
    targetPanel: 'initialTask' | 'generatedPrompt' | 'modifiedPrompt'
  ) => {
    if (!promptContent) {
      alert("没有可测试的提示词内容。");
      return;
    }

    const setStateFunction = {
      initialTask: setInitialTaskChatState,
      generatedPrompt: setGeneratedPromptChatState,
      modifiedPrompt: setModifiedPromptChatState,
    }[targetPanel];

    setStateFunction({ history: null, isLoading: true });

    try {
      const response = await fetch("/api/chat-with-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptContent,
          model: selectedAIModel,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "与AI通信失败");
      }
      setStateFunction({ history: { prompt: promptContent, response: data.response }, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      alert(`AI 测试失败: ${errorMessage}`);
      setStateFunction({ history: { prompt: promptContent, response: `错误: ${errorMessage}` }, isLoading: false });
    }
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">多框架提示词助手</h1>
          <div className="flex items-center space-x-4">
            <Select value={selectedAIModel} onValueChange={setSelectedAIModel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                {aiModels.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <LoginPopover />
            <a
              href="https://github.com/qqjzyzz?tab=projects"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(frameworks).map(([framework, description]) => (
            <div key={framework} className="flex flex-col items-center gap-1">
              <Button
                variant={selectedFramework === framework ? "default" : "outline"}
                onClick={() => handleFrameworkSelect(framework)}
                className="w-full text-sm py-2 h-auto"
              >
                {framework}
              </Button>
              <p className="text-xs text-muted-foreground text-center px-1">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-grow">
        <div className="p-6 space-y-6">
          <PanelGroup direction="horizontal" className="w-full h-[300px]">
            <Panel className="p-1">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">1. 输入你的任务</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-grow flex flex-col justify-between">
                  <div className="space-y-1">
                    <label htmlFor="customFramework" className="text-sm font-medium text-gray-700">
                      自定义框架指令 (可选):
                    </label>
                    <Textarea
                      id="customFramework"
                      placeholder="在此输入自定义框架指令 (如果填写，将优先于上方选择的预设框架)"
                      value={customFrameworkPrompt}
                      onChange={(e) => {
                        setCustomFrameworkPrompt(e.target.value);
                        if (e.target.value) {
                          setSelectedFramework("");
                        }
                      }}
                      className="min-h-[80px]"
                    />
                  </div>
                  <Textarea
                    placeholder="例如：写一篇宣传AI的小红书帖子，强调其便捷性和创造力。"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="min-h-[100px] flex-grow"
                  />
                  <div className="flex space-x-3 pt-2">
                    <Button
                      onClick={handleGeneratePrompt}
                      disabled={isLoading || !userInput || (!selectedFramework && !customFrameworkPrompt)}
                      className="w-1/2"
                    >
                      {isLoading ? "优化中..." : "优化提示词"}
                    </Button>
                    <Button
                      onClick={() => handleTestWithAI(userInput, 'initialTask')}
                      disabled={initialTaskChatState.isLoading || !userInput}
                      className="w-1/2"
                      variant="secondary"
                    >
                      {initialTaskChatState.isLoading ? "生成中..." : "生成内容"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Panel>
            <PanelResizeHandle className="w-3 border-x bg-slate-200 hover:bg-slate-300 transition-colors flex items-center justify-center">
              <div className="w-1 h-8 bg-slate-400 rounded-full" />
            </PanelResizeHandle>
            <Panel className="p-1">
              <ChatPanel
                history={initialTaskChatState.history}
                isLoading={initialTaskChatState.isLoading}
              />
            </Panel>
          </PanelGroup>

          {initialOutput && (
            <PanelGroup direction="horizontal" className="w-full h-[450px]">
              <Panel className="p-1">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">2. {selectedFramework} 提示词 (初版) & 修改建议</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow flex flex-col justify-between">
                    <div className="space-y-3 flex-grow flex flex-col">
                      <Textarea
                        value={initialOutput}
                        onChange={(e) => setInitialOutput(e.target.value)}
                        className="min-h-[150px] bg-stone-50 flex-grow"
                      />
                      <Button
                        onClick={() => handleTestWithAI(initialOutput, 'generatedPrompt')}
                        disabled={generatedPromptChatState.isLoading}
                        className="w-full"
                        variant="secondary"
                      >
                        {generatedPromptChatState.isLoading ? "测试中..." : `测试 ${selectedFramework} 初版提示词`}
                      </Button>
                    </div>
                    <div className="pt-2 space-y-2">
                      <h3 className="text-md font-semibold">提出修改建议:</h3>
                      <Input
                        placeholder="例如：请更加注重小红书的口语化风格，多用emoji。"
                        value={modificationInput}
                        onChange={(e) => setModificationInput(e.target.value)}
                      />
                      <Button
                        onClick={handleModifyPrompt}
                        disabled={isLoading || !modificationInput}
                        className="w-full"
                      >
                        {isLoading ? "修改中..." : "修改提示词"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Panel>
              <PanelResizeHandle className="w-3 border-x bg-slate-200 hover:bg-slate-300 transition-colors flex items-center justify-center">
                <div className="w-1 h-8 bg-slate-400 rounded-full" />
              </PanelResizeHandle>
              <Panel className="p-1">
                <ChatPanel
                  history={generatedPromptChatState.history}
                  isLoading={generatedPromptChatState.isLoading}
                />
              </Panel>
            </PanelGroup>
          )}

          {modifiedOutput && (
            <PanelGroup direction="horizontal" className="w-full h-[300px]">
              <Panel className="p-1">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">3. {selectedFramework} 提示词 (修改后)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow flex flex-col justify-between">
                    <Textarea
                      value={modifiedOutput}
                      onChange={(e) => setModifiedOutput(e.target.value)}
                      className="min-h-[150px] bg-stone-50 flex-grow"
                    />
                    <Button
                      onClick={() => handleTestWithAI(modifiedOutput, 'modifiedPrompt')}
                      disabled={modifiedPromptChatState.isLoading}
                      className="w-full"
                      variant="secondary"
                    >
                      {modifiedPromptChatState.isLoading ? "测试中..." : `测试 ${selectedFramework} 修改后提示词`}
                    </Button>
                  </CardContent>
                </Card>
              </Panel>
              <PanelResizeHandle className="w-3 border-x bg-slate-200 hover:bg-slate-300 transition-colors flex items-center justify-center">
                <div className="w-1 h-8 bg-slate-400 rounded-full" />
              </PanelResizeHandle>
              <Panel className="p-1">
                <ChatPanel
                  history={modifiedPromptChatState.history}
                  isLoading={modifiedPromptChatState.isLoading}
                />
              </Panel>
            </PanelGroup>
          )}
        </div>
      </ScrollArea>
    </main>
  );
}