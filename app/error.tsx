"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-bold">出错了</h2>
      <p className="text-muted-foreground">抱歉，发生了一些错误</p>
      <Button
        variant="outline"
        onClick={() => reset()}
      >
        重试
      </Button>
    </div>
  );
}