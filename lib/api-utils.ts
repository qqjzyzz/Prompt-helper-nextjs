import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);
  
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        data: error.data,
      },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    {
      error: "Internal Server Error",
    },
    { status: 500 }
  );
}