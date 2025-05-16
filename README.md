# Prompt Helper (Next.js) - 多框架提示词助手

这是一个使用 Next.js、TypeScript 和 Tailwind CSS 构建的 **多框架提示词助手** 应用。

## 项目简介

本项目旨在帮助用户利用不同的提示词工程框架来创建、优化和测试与大语言模型 (LLM) 交互的提示词 (prompts)。用户可以输入原始的任务描述，选择预设的框架（如 CO-STAR, CRISPE, Midjourney 等）或自定义框架指令，应用将辅助生成优化后的提示词。此外，用户还可以对生成的提示词进行进一步修改，并直接与多种集成的大语言模型进行交互测试。

## 主要功能

*   **基于框架生成提示词**:
    *   用户输入任务描述。
    *   可选择多种预设提示词框架 (如 CO-STAR, CRISPE, ICIO, BROKE, Midjourney) 或提供自定义框架指令。
    *   根据用户输入和框架选择，调用 AI 模型生成优化后的提示词。
*   **修改与迭代提示词**:
    *   用户可以对已生成的提示词提供修改建议。
    *   应用将根据建议进一步优化提示词。
*   **AI 模型集成与测试**:
    *   支持多种大语言模型 (如 GPT 系列, Claude 系列, Gemini 系列等)。
    *   用户可以直接将原始任务、生成或修改后的提示词发送给所选 AI 模型进行即时测试并查看响应。
*   **用户友好的交互界面**:
    *   清晰的输入区、输出区和控制面板。
    *   支持主题切换 (例如暗黑模式)。
    *   包含用户登录功能。

## 技术栈

*   **框架:** [Next.js](https://nextjs.org/) (App Router)
*   **语言:** [TypeScript](https://www.typescriptlang.org/)
*   **UI 库/组件:** [shadcn/ui](https://ui.shadcn.com/) (基于 Radix UI 和 Lucide React)
*   **样式:** [Tailwind CSS](https://tailwindcss.com/)
*   **表单处理:** [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
*   **状态管理:** React State, Context (根据 `app/page.tsx` 分析)
*   **AI 集成:** OpenAI API (以及可能的其他 LLM API)
*   **其他:** `cmdk` (命令面板), `recharts` (图表), `date-fns` (日期处理), 阿里云短信服务 (用于登录或通知)
*   **Linting:** [ESLint](https://eslint.org/)

## 环境配置

项目依赖 Node.js 和 npm (或 yarn)。

1.  **克隆仓库**
    ```bash
    git clone <your-repository-url>
    cd Prompt-helper-nextjs-main
    ```

2.  **安装依赖**
    ```bash
    npm install
    # 或者
    # yarn install
    ```

3.  **环境变量**
    复制 `.env.example` (如果存在) 或手动创建一个 `.env.local` 文件，并填入必要的环境变量。
    根据项目分析，您至少需要配置 `OPENAI_API_KEY`。如果使用了其他服务 (如阿里云短信、其他 LLM API)，也请配置相应的 KEY。
    ```
    # .env.local 示例
    OPENAI_API_KEY=your_openai_api_key
    # ALIYUN_ACCESS_KEY_ID=your_aliyun_access_key_id (如果使用阿里云服务)
    # ALIYUN_ACCESS_KEY_SECRET=your_aliyun_access_key_secret (如果使用阿里云服务)
    # ... 其他必要的环境变量
    ```

4.  **运行开发服务器**
    ```bash
    npm run dev
    # 或者
    # yarn dev
    ```
    然后在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看。

## 主要目录结构

*   `app/`: Next.js App Router 目录，包含页面 (`page.tsx`), 布局 (`layout.tsx`) 和 API 路由 (`api/`)。
*   `components/`: 共享的 React 组件 (例如 `ChatPanel.tsx`, `LoginPopover.tsx`)。
*   `components/ui/`: shadcn/ui 生成的 UI 组件。
*   `lib/`: 工具函数或库代码。
*   `hooks/`: 自定义 React Hooks。
*   `public/`: 静态资源文件。
*   `next.config.js`: Next.js 配置文件。
*   `tailwind.config.ts`: Tailwind CSS 配置文件。
*   `tsconfig.json`: TypeScript 配置文件。

## API 端点 (推测)

*   `POST /api/generate-prompt`: 接收任务描述、框架、AI 模型等，返回生成的提示词。
*   `POST /api/modify-prompt`: 接收原始提示词、修改建议、AI 模型等，返回修改后的提示词。
*   `POST /api/chat-with-ai`: 接收提示词和 AI 模型，返回 AI 的响应。
*   (可能存在与用户认证、短信发送相关的 API 端点)

## 构建与部署

1.  **构建项目**
    ```bash
    npm run build
    ```

2.  **启动生产服务器**
    ```bash
    npm run start
    ```
    推荐使用 [Vercel](https://vercel.com/) (Next.js 的创建者) 或其他支持 Node.js 应用的平台进行部署。

![企业微信截图_17473655919204](https://github.com/user-attachments/assets/c6cfce34-072b-4d6c-b58c-9a6fbfc3c38a)
