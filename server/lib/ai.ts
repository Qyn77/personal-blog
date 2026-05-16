/**
 * AI 服务模块
 * 支持多种 AI 服务商，提供统一的接口
 * 支持动态配置（从数据库读取）
 */

import { z } from "zod";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerateMetadataResult {
  title: string;
  subtitle?: string;
  excerpt: string;
  tags: string[];
  category: string;
}

export interface PolishContentResult {
  content: string;
  originalLength: number;
  polishedLength: number;
}

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

export abstract class AIProvider {
  abstract chat(messages: AIMessage[]): Promise<AIResponse>;
  abstract name: string;
  abstract model: string;
}

class DeepSeekProvider extends AIProvider {
  name = "deepseek";
  model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      usage: data.usage,
    };
  }
}

class OpenAIProvider extends AIProvider {
  name = "openai";
  model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      usage: data.usage,
    };
  }
}

class ClaudeProvider extends AIProvider {
  name = "claude";
  model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: messages
              .map(m => `${m.role === "system" ? "System: " : ""}${m.content}`)
              .join("\n\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || "",
    };
  }
}

let aiProvider: AIProvider | null = null;
let currentConfig: AIConfig | null = null;

function createProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config.apiKey, config.apiBaseUrl, config.model);
    case "claude":
      return new ClaudeProvider(config.apiKey, config.apiBaseUrl, config.model);
    case "custom":
    case "deepseek":
    default:
      return new DeepSeekProvider(
        config.apiKey,
        config.apiBaseUrl,
        config.model
      );
  }
}

export function setAIConfig(config: AIConfig): void {
  currentConfig = config;
  aiProvider = null;
  console.log(
    `[AI] Config updated: ${config.provider} (model: ${config.model})`
  );
}

export function getAIConfig(): AIConfig | null {
  return currentConfig;
}

function getAIProvider(): AIProvider | null {
  if (!currentConfig || !currentConfig.enabled) {
    return null;
  }

  if (!currentConfig.apiKey) {
    console.warn("[AI] API Key is not set.");
    return null;
  }

  if (!aiProvider) {
    aiProvider = createProvider(currentConfig);
    console.log(
      `[AI] Initialized with ${aiProvider.name} (model: ${aiProvider.model})`
    );
  }

  return aiProvider;
}

const METADATA_PROMPT = `你是一个专业的博客内容策划助手。请根据提供的文章内容，生成合适的元数据。

请从文章内容中提取或生成以下信息：
1. **title**: 文章标题（如果原文有标题则提取，否则根据内容生成一个吸引人的标题）
2. **subtitle**: 副标题/小标题（可选，如果内容有明显的副标题或分主题则提取）
3. **excerpt**: 文章摘要（100-200字，概括文章核心内容，吸引读者）
4. **tags**: 标签数组（3-5个相关标签，用中文）
5. **category**: 分类（选择一个最合适的分类，如：技术、生活、读书、旅行、随想等）

请直接返回 JSON 格式，不要包含任何其他内容：
{
  "title": "标题",
  "subtitle": "副标题或null",
  "excerpt": "摘要内容...",
  "tags": ["标签1", "标签2", "标签3"],
  "category": "分类"
}

以下是文章内容：
`;

const POLISH_PROMPT = `你是一个专业的文案编辑。请对提供的文章内容进行润色。

润色要求：
1. 保持原文的核心观点和风格
2. 改善句子结构，使其更流畅
3. 优化用词，使表达更精准
4. 修正可能的语法错误
5. 保持文章长度适中，不要过度扩展
6. 如果是技术文章，保持专业术语准确

请直接返回润色后的文章内容，不要包含任何解释或说明。

以下是原文内容：
`;

export async function generateMetadata(
  content: string
): Promise<GenerateMetadataResult | null> {
  const provider = getAIProvider();
  if (!provider) {
    return null;
  }

  const messages: AIMessage[] = [
    { role: "system", content: METADATA_PROMPT },
    { role: "user", content: content.substring(0, 5000) },
  ];

  try {
    const response = await provider.chat(messages);

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI] Failed to parse metadata response");
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);

    const schema = z.object({
      title: z.string(),
      subtitle: z.string().nullable(),
      excerpt: z.string(),
      tags: z.array(z.string()),
      category: z.string(),
    });

    const parsed = schema.safeParse(result);
    if (!parsed.success) {
      console.error("[AI] Invalid metadata schema:", parsed.error);
      return null;
    }

    return {
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || undefined,
      excerpt: parsed.data.excerpt,
      tags: parsed.data.tags,
      category: parsed.data.category,
    };
  } catch (error) {
    console.error("[AI] generateMetadata error:", error);
    return null;
  }
}

export async function polishContent(
  content: string
): Promise<PolishContentResult | null> {
  const provider = getAIProvider();
  if (!provider) {
    return null;
  }

  const messages: AIMessage[] = [
    { role: "system", content: POLISH_PROMPT },
    { role: "user", content: content },
  ];

  try {
    const response = await provider.chat(messages);

    return {
      content: response.content,
      originalLength: content.length,
      polishedLength: response.content.length,
    };
  } catch (error) {
    console.error("[AI] polishContent error:", error);
    return null;
  }
}

export function isAIEnabled(): boolean {
  return !!currentConfig?.enabled && !!currentConfig?.apiKey;
}
