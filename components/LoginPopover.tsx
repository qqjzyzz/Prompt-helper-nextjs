"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { LogOut, Loader2, UserCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LoginPopover() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    setVerificationCode("");
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
          action: "sendCode",
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

  const handleSubmit = async (actionType: 'login' | 'signup') => {
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
        throw new Error(data.error || (actionType === 'login' ? "登录失败" : "注册失败"));
      }

      setIsLoggedIn(true);
      toast({
        title: actionType === 'login' ? "登录成功" : "注册成功",
        description: `欢迎您, ${phoneNumber}`,
      });
    } catch (error) {
      toast({
        title: actionType === 'login' ? "登录失败" : "注册失败",
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
    setActiveTab("login");
    toast({
      title: "已退出登录",
    });
  };

  const commonFormFields = (
    <div className="grid gap-2">
      <Input
        id={`phoneNumber-${activeTab}`}
        placeholder="手机号"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        disabled={isLoading || isSending}
        type="tel"
      />
      <div className="flex gap-2">
        <Input
          id={`verificationCode-${activeTab}`}
          placeholder="验证码"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          disabled={isLoading || isSending}
          type="number"
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
    </div>
  );

  return (
    <Popover>
      <div className="flex gap-2">
        {!isLoggedIn && (
          <>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('login')}>登录</Button>
            </PopoverTrigger>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('signup')}>注册</Button>
            </PopoverTrigger>
          </>
        )}
        {isLoggedIn && (
          <Button variant="outline" size="sm" onClick={handleLogout}>退出登录</Button>
        )}
      </div>
      <PopoverContent className="w-80">
        {isLoggedIn ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              当前用户: {phoneNumber}
            </p>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="signup">注册</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <h4 className="font-medium leading-none">用户登录</h4>
                  <p className="text-sm text-muted-foreground">
                    请输入手机号和验证码进行登录。
                  </p>
                </div>
                {commonFormFields}
                <Button
                  className="w-full"
                  onClick={() => handleSubmit('login')}
                  disabled={isLoading || isSending}
                >
                  {isLoading && activeTab === 'login' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  登录
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="signup">
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <h4 className="font-medium leading-none">新用户注册</h4>
                  <p className="text-sm text-muted-foreground">
                    通过手机验证码快速注册。
                  </p>
                </div>
                {commonFormFields}
                <Button
                  className="w-full"
                  onClick={() => handleSubmit('signup')}
                  disabled={isLoading || isSending}
                >
                  {isLoading && activeTab === 'signup' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  注册
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  );
} 