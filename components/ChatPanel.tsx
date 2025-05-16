"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface ChatHistoryItem {
  prompt: string;
  response: string;
}

interface ChatPanelProps {
  history: ChatHistoryItem | null;
  isLoading: boolean;
}

export default function ChatPanel({ history, isLoading }: ChatPanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>AI 反馈</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-2 text-muted-foreground">AI 正在思考...</p>
            </div>
          )}
          {!isLoading && !history?.response && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                点击左侧的 "测试" 按钮将提示词发送给 AI，结果将在此显示。
              </p>
            </div>
          )}
          {!isLoading && history?.response && (
            <div className="space-y-2">
              <div className="bg-primary-foreground p-3 rounded-md whitespace-pre-wrap break-words">
                {history.response}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 