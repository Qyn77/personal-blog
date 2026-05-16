/**
 * AI 配置类型定义
 */

export interface AIConfig {
  provider: "deepseek" | "openai" | "claude" | "custom";
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  enabled: boolean;
}

export interface AIProviderInfo {
  id: string;
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  description: string;
}

export const AI_PROVIDERS: AIProviderInfo[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    description: "深度求索，支持中英文对话和代码生成",
  },
  {
    id: "openai",
    name: "OpenAI",
    defaultBaseUrl: "https://api.openai.com",
    defaultModel: "gpt-3.5-turbo",
    description: "GPT 系列模型，功能强大",
  },
  {
    id: "claude",
    name: "Claude",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-3-sonnet-20240229",
    description: "Anthropic Claude，长上下文支持",
  },
  {
    id: "custom",
    name: "自定义",
    defaultBaseUrl: "https://api.example.com",
    defaultModel: "",
    description: "自定义 API 地址和模型",
  },
];
