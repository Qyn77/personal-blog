/**
 * AI 配置管理页面
 * 允许用户在后台配置 AI 服务商、API Key、模型等
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AI_PROVIDERS } from "@/type/aiConfig";

export default function AdminAIConfig() {
  const [provider, setProvider] = useState<string>("deepseek");
  const [apiKey, setApiKey] = useState<string>("");
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(
    "https://api.deepseek.com"
  );
  const [model, setModel] = useState<string>("deepseek-chat");
  const [enabled, setEnabled] = useState<boolean>(false);

  const { data: configData } = trpc.ai.getConfig.useQuery();
  const saveConfigMutation = trpc.ai.saveConfig.useMutation();

  useEffect(() => {
    if (configData?.config) {
      setProvider(configData.config.provider);
      setApiKey(configData.config.apiKey);
      setApiBaseUrl(configData.config.apiBaseUrl);
      setModel(configData.config.model);
      setEnabled(configData.config.enabled);
    }
  }, [configData]);

  const handleProviderChange = (value: string) => {
    setProvider(value);
    const providerInfo = AI_PROVIDERS.find(p => p.id === value);
    if (providerInfo) {
      setApiBaseUrl(providerInfo.defaultBaseUrl);
      setModel(providerInfo.defaultModel);
    }
  };

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      toast.error("请输入 API Key");
      return;
    }
    if (!apiBaseUrl.trim()) {
      toast.error("请输入 API 地址");
      return;
    }
    if (!model.trim()) {
      toast.error("请输入模型名称");
      return;
    }

    try {
      await saveConfigMutation.mutateAsync({
        provider: provider as "deepseek" | "openai" | "claude" | "custom",
        apiKey,
        apiBaseUrl,
        model,
        enabled,
      });
      toast.success("配置保存成功");
    } catch {
      toast.error("保存失败，请重试");
    }
  };

  const currentProvider = AI_PROVIDERS.find(p => p.id === provider);

  return (
    <div className="max-w-2xl">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
      >
        AI 配置
      </h1>

      <div className="space-y-6">
        {/* 启用开关 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">AI 功能</h2>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <Label htmlFor="ai-enabled" className="text-sm font-medium">
                启用 AI 辅助功能
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                开启后可以在编辑文章时使用 AI 生成元数据和润色文章
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>

        <Separator />

        {/* 服务商选择 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">AI 服务商</h2>
          <p className="text-sm text-muted-foreground mb-4">
            选择要使用的 AI 服务商，不同服务商的 API 格式可能不同
          </p>
          <div className="grid grid-cols-2 gap-3">
            {AI_PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  provider === p.id
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {p.id === "openai" && (
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                      O
                    </span>
                  )}
                  {p.id === "claude" && (
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      C
                    </span>
                  )}
                  {p.id === "deepseek" && (
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                      D
                    </span>
                  )}
                  {p.id === "custom" && (
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  )}
                  <p className="font-medium text-sm">{p.name}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {p.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* API Key */}
        <div>
          <h2 className="text-lg font-semibold mb-4">API Key</h2>
          <Label htmlFor="api-key" className="text-sm font-medium mb-2 block">
            密钥
          </Label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            在服务商官网获取的 API 密钥，仅存储在内存中，重启后需要重新配置
          </p>
        </div>

        {/* API Base URL */}
        <div>
          <h2 className="text-lg font-semibold mb-4">API 地址</h2>
          <Label
            htmlFor="api-base-url"
            className="text-sm font-medium mb-2 block"
          >
            接口地址
          </Label>
          <Input
            id="api-base-url"
            type="url"
            placeholder="https://api.example.com"
            value={apiBaseUrl}
            onChange={e => setApiBaseUrl(e.target.value)}
            className="font-mono text-sm"
          />
          {currentProvider && currentProvider.id !== "custom" && (
            <p className="text-xs text-muted-foreground mt-2">
              默认地址: {currentProvider.defaultBaseUrl}
            </p>
          )}
        </div>

        {/* Model */}
        <div>
          <h2 className="text-lg font-semibold mb-4">模型</h2>
          <Label htmlFor="model" className="text-sm font-medium mb-2 block">
            模型名称
          </Label>
          <Input
            id="model"
            placeholder="如: deepseek-chat, gpt-3.5-turbo"
            value={model}
            onChange={e => setModel(e.target.value)}
            className="font-mono text-sm"
          />
          {currentProvider && currentProvider.id !== "custom" && (
            <p className="text-xs text-muted-foreground mt-2">
              默认模型: {currentProvider.defaultModel}
            </p>
          )}
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={saveConfigMutation.isPending}
          >
            {saveConfigMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "保存配置"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
