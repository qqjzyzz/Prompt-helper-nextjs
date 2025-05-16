import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Here you would implement your database query to fetch chat history
    // For now, returning mock data
    const mockHistory = [
      {
        id: "1",
        framework: "CO-STAR",
        input: "写一篇宣传AI的小红书",
        timestamp: new Date().toISOString(),
      },
      {
        id: "2",
        framework: "BROKE",
        input: "生成一个产品介绍",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    return NextResponse.json(mockHistory);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}