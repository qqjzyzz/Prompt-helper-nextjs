import { NextResponse } from "next/server";
import Dysmsapi20170525, * as $Dysmsapi from "@alicloud/dysmsapi20170525";
import * as $OpenApi from "@alicloud/openapi-client";
import * as $Util from "@alicloud/tea-util";
import { ApiError, handleApiError } from "@/lib/api-utils";

// Store verification codes in memory (in production, use Redis or a database)
const verificationCodes = new Map();

const createClient = () => {
  // 在这里添加调试日志
  console.log("--- DEBUGGING ENVIRONMENT VARIABLES ---");
  console.log("Attempting to read Aliyun credentials from env at:", new Date().toISOString());
  console.log("ALIYUN_ACCESS_KEY_ID from process.env:", process.env.ALIYUN_ACCESS_KEY_ID);
  console.log("ALIYUN_ACCESS_KEY_SECRET from process.env:", process.env.ALIYUN_ACCESS_KEY_SECRET);
  console.log("ALIYUN_SIGN_NAME from process.env:", process.env.ALIYUN_SIGN_NAME);
  console.log("ALIYUN_TEMPLATE_CODE from process.env:", process.env.ALIYUN_TEMPLATE_CODE);
  console.log("--- END DEBUGGING ---");

  try {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;

    if (!accessKeyId || !accessKeySecret) {
      // 为了调试，暂时更详细地记录哪个缺失了
      if (!accessKeyId) console.error("DEBUG: ALIYUN_ACCESS_KEY_ID is missing or undefined in createClient!");
      if (!accessKeySecret) console.error("DEBUG: ALIYUN_ACCESS_KEY_SECRET is missing or undefined in createClient!");
      throw new ApiError("Missing Aliyun credentials", 500);
    }

    const config = new $OpenApi.Config({
      accessKeyId,
      accessKeySecret,
      endpoint: "dysmsapi.aliyuncs.com",
      regionId: "cn-hangzhou"
    });

    return new Dysmsapi20170525(config);
  } catch (error) {
    console.error("Failed to create Aliyun client:", error);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    const { phoneNumber, action, verificationCode } = await req.json();

    if (!phoneNumber || !action) {
      throw new ApiError("缺少必要参数");
    }

    if (action === "sendCode") {
      try {
        const client = createClient();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        const sendSmsRequest = new $Dysmsapi.SendSmsRequest({
          phoneNumbers: phoneNumber,
          signName: process.env.ALIYUN_SIGN_NAME,
          templateCode: process.env.ALIYUN_TEMPLATE_CODE,
          templateParam: JSON.stringify({ code }),
        });

        const runtime = new $Util.RuntimeOptions({});
        const result = await client.sendSmsWithOptions(sendSmsRequest, runtime);

        if (result.body.code !== "OK") {
          console.error("SMS send error:", result.body);
          throw new ApiError(result.body.message || "短信发送失败");
        }

        // Store the verification code with 5 minutes expiration
        verificationCodes.set(phoneNumber, {
          code,
          expires: Date.now() + 5 * 60 * 1000
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("SMS send error:", error);
        throw new ApiError("短信发送失败，请稍后重试");
      }
    }

    if (action === "verify") {
      if (!verificationCode) {
        throw new ApiError("请输入验证码");
      }

      const storedData = verificationCodes.get(phoneNumber);
      
      if (!storedData) {
        throw new ApiError("请先获取验证码");
      }

      if (Date.now() > storedData.expires) {
        verificationCodes.delete(phoneNumber);
        throw new ApiError("验证码已过期，请重新获取");
      }

      if (storedData.code !== verificationCode) {
        throw new ApiError("验证码错误");
      }

      // Clear the used verification code
      verificationCodes.delete(phoneNumber);

      return NextResponse.json({
        success: true,
        user: { phoneNumber }
      });
    }

    throw new ApiError("无效的操作");
  } catch (error) {
    return handleApiError(error);
  }
}