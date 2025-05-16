"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { LogOut, MessageSquare, Loader2 } from "lucide-react";

interface ChatHistory {
  id: string;
  framework: string;
  input: string;
  timestamp: string;
}

export function Sidebar() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phoneNumber.match(/^1[3-9]\d{9}$/)) {
      toast({
        title: "错误",
        description: "请输入有效的手机号",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber, 
          action: "sendCode" 
        }),
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || "发送失败");
      }

      toast({
        title: "验证码已发送",
        description: "请查看手机短信",
      });
      
      setCountdown(60);
    } catch (error) {
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = async () => {
    if (!phoneNumber || !verificationCode) {
      toast({
        title: "错误",
        description: "请填写完整信息",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          verificationCode,
          action: "verify",
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "登录失败");
      }

      setIsLoggedIn(true);
      toast({
        title: "登录成功",
        description: "欢迎回来",
      });
      fetchChatHistory();
    } catch (error) {
      toast({
        title: "登录失败",
        description: error instanceof Error ? error.message : "请检查验证码是否正确",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPhoneNumber("");
    setVerificationCode("");
    setChatHistory([]);
    toast({
      title: "已退出登录",
    });
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch("/api/chat-history");
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    }
  };

  return (
    <div className="flex h-full w-[300px] flex-col border-r bg-muted/10">
      <div className="p-4 space-y-4">
        {!isLoggedIn ? (
          <div className="space-y-2">
            <Input
              placeholder="手机号"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading || isSending}
            />
            <div className="flex gap-2">
              <Input
                placeholder="验证码"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={isLoading || isSending}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendCode}
                disabled={isLoading || isSending || countdown > 0}
                className="whitespace-nowrap min-w-[100px]"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : countdown > 0 ? (
                  `${countdown}秒`
                ) : (
                  "获取验证码"
                )}
              </Button>
            </div>
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isLoading || isSending}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              登录/注册
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              当前用户: {phoneNumber}
            </p>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        )}
      </div>
      <Separator />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">历史记录</h2>
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className="flex items-start space-x-2 rounded-lg border p-3 text-sm"
            >
              <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">{chat.framework}</p>
                <p className="text-muted-foreground">{chat.input}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(chat.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}