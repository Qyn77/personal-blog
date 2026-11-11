import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AI_PROVIDERS, type AIConfig } from "@/type/aiConfig";

interface SavedSettings {
  config: Omit<AIConfig, "apiKey"> & { hasApiKey: boolean };
  revision: string;
}

export default function AdminAIConfig() {
  const utils = trpc.useUtils();
  const query = trpc.ai.getConfig.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return (
    <div className="max-w-5xl space-y-8">
      <header className="space-y-4">
        <p className="font-mono text-xs tracking-widest text-muted-foreground">
          AI / WRITING ASSISTANT
        </p>
        <h1 className="text-3xl font-semibold">网站 AI 助手</h1>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            为后台编辑器连接模型，帮你润色文字、生成标题与摘要。
          </p>
          <Link
            href="/admin/mcp"
            className="text-sm underline underline-offset-4 hover:text-muted-foreground"
          >
            连接本地 Agent →
          </Link>
        </div>
      </header>
      {query.isLoading ? (
        <p
          role="status"
          className="border-y border-border py-12 text-sm text-muted-foreground"
        >
          正在读取已保存的模型设置…
        </p>
      ) : query.isError ? (
        <div role="alert" className="border border-border p-6 space-y-3">
          <p>模型设置读取失败，请重试。</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            重新加载
          </Button>
        </div>
      ) : query.data ? (
        <AISettingsForm
          key={query.data.revision}
          initial={query.data}
          onSaved={async () => {
            await Promise.all([
              utils.ai.getConfig.invalidate(),
              utils.ai.checkEnabled.invalidate(),
            ]);
          }}
          reload={() => void query.refetch()}
        />
      ) : null}
    </div>
  );
}

function AISettingsForm({
  initial,
  onSaved,
  reload,
}: {
  initial: SavedSettings;
  onSaved: () => Promise<void>;
  reload: () => void;
}) {
  const [settings, setSettings] = useState(initial.config);
  const [apiKey, setApiKey] = useState("");
  const [clearApiKey, setClearApiKey] = useState(false);
  const [error, setError] = useState("");
  const save = trpc.ai.saveConfig.useMutation();
  const dirty =
    apiKey.length > 0 ||
    clearApiKey ||
    (["provider", "apiBaseUrl", "model", "enabled"] as const).some(
      key => settings[key] !== initial.config[key]
    );
  const destinationChanged =
    settings.provider !== initial.config.provider ||
    settings.apiBaseUrl.replace(/\/+$/, "") !== initial.config.apiBaseUrl;
  const needsKey = !initial.config.hasApiKey || destinationChanged;
  const changeProvider = (provider: AIConfig["provider"]) => {
    const defaults = AI_PROVIDERS.find(item => item.id === provider);
    if (!defaults) return;
    setSettings(current => ({
      ...current,
      provider,
      apiBaseUrl: defaults.defaultBaseUrl,
      model: defaults.defaultModel,
    }));
    setApiKey("");
    setError("");
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dirty || save.isPending) return;
    if (
      !clearApiKey &&
      !apiKey.trim() &&
      ((settings.enabled && needsKey) ||
        (destinationChanged && initial.config.hasApiKey))
    ) {
      setError(
        destinationChanged
          ? "连接地址已变更，请为这个服务重新输入密钥。"
          : "启用助手前，请先填写 API Key。"
      );
      return;
    }
    setError("");
    try {
      await save.mutateAsync({
        provider: settings.provider,
        apiBaseUrl: settings.apiBaseUrl.trim(),
        model: settings.model.trim(),
        enabled: settings.enabled,
        apiKey: apiKey.trim() || undefined,
        clearApiKey,
        expectedRevision: initial.revision,
      });
      setApiKey("");
      await onSaved();
      toast.success("网站助手设置已保存");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存失败，请重试");
    }
  };
  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset
        disabled={save.isPending}
        className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_16rem]"
      >
        <legend className="sr-only">网站助手设置</legend>
        <div className="min-w-0 border border-border bg-background">
          <section
            aria-labelledby="ai-service"
            className="space-y-5 p-5 sm:p-6"
          >
            <div className="flex items-baseline gap-3">
              <span
                className="font-mono text-xs text-muted-foreground"
                aria-hidden="true"
              >
                01
              </span>
              <h2 id="ai-service" className="text-base font-semibold">
                模型服务
              </h2>
            </div>
            <ProviderChoices
              provider={settings.provider}
              onChange={changeProvider}
            />
            <div className="space-y-2">
              <Label htmlFor="api-base-url">API 地址</Label>
              <Input
                id="api-base-url"
                type="url"
                required
                value={settings.apiBaseUrl}
                onChange={event =>
                  setSettings({ ...settings, apiBaseUrl: event.target.value })
                }
                className="h-11 font-mono text-sm"
                spellCheck={false}
                aria-describedby="ai-url-help"
              />
              <p
                id="ai-url-help"
                className="text-xs leading-relaxed text-muted-foreground"
              >
                {settings.provider === "custom"
                  ? "填写兼容接口的根地址，例如 https://provider.example/v1。"
                  : "已填入官方地址，使用代理服务时可替换。"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">模型名称</Label>
              <Input
                id="model"
                required={settings.enabled}
                value={settings.model}
                onChange={event =>
                  setSettings({ ...settings, model: event.target.value })
                }
                placeholder="填写服务商提供的模型 ID"
                className="h-11 font-mono text-sm"
                spellCheck={false}
              />
            </div>
          </section>
          <section
            aria-labelledby="ai-credentials"
            className="space-y-4 border-t border-border p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-baseline gap-3">
                <span
                  className="font-mono text-xs text-muted-foreground"
                  aria-hidden="true"
                >
                  02
                </span>
                <h2 id="ai-credentials" className="text-base font-semibold">
                  连接凭证
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {clearApiKey
                  ? "保存时清除"
                  : initial.config.hasApiKey
                    ? "已有密钥"
                    : "尚未设置"}
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                autoComplete="new-password"
                disabled={clearApiKey}
                value={apiKey}
                onChange={event => setApiKey(event.target.value)}
                placeholder={
                  needsKey ? "输入这个服务的 API Key" : "留空可保留已保存的密钥"
                }
                className="h-11 font-mono text-sm"
                aria-describedby="ai-key-help"
              />
              <p
                id="ai-key-help"
                className="text-xs leading-relaxed text-muted-foreground"
              >
                {destinationChanged && initial.config.hasApiKey
                  ? "服务商或地址已改变，需要重新填写密钥。"
                  : "密钥保存后不会回显，重启网站后仍然有效。"}
              </p>
            </div>
            {initial.config.hasApiKey && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer py-2 focus-visible:outline focus-visible:outline-ring">
                  移除已保存的密钥
                </summary>
                <label className="flex min-h-11 cursor-pointer items-start gap-2 pt-2 leading-relaxed">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-foreground"
                    checked={clearApiKey}
                    onChange={event => {
                      setClearApiKey(event.target.checked);
                      if (event.target.checked) {
                        setSettings({ ...settings, enabled: false });
                        setApiKey("");
                      }
                    }}
                  />
                  保存时清除密钥，并关闭网站助手。
                </label>
              </details>
            )}
          </section>
        </div>
        <AssistantStatus
          savedEnabled={initial.config.enabled}
          enabled={settings.enabled}
          disabled={clearApiKey || save.isPending}
          onChange={enabled => setSettings({ ...settings, enabled })}
        />
      </fieldset>
      {error && (
        <div
          role="alert"
          className="border-l-2 border-destructive bg-muted/30 p-4 text-sm"
        >
          <p>{error}</p>
          {error.includes("版本冲突") && (
            <Button
              type="button"
              variant="link"
              className="mt-2 h-auto p-0"
              onClick={reload}
            >
              重新读取服务器配置（放弃当前修改）
            </Button>
          )}
        </div>
      )}
      <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background py-4">
        <p role="status" className="text-xs text-muted-foreground">
          {save.isPending
            ? "正在保存…"
            : dirty
              ? "有未保存的修改"
              : "设置已与服务器同步"}
        </p>
        <Button
          type="submit"
          disabled={!dirty || save.isPending}
          className="h-11 px-6"
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          保存设置
        </Button>
      </footer>
    </form>
  );
}

function AssistantStatus({
  savedEnabled,
  enabled,
  disabled,
  onChange,
}: {
  savedEnabled: boolean;
  enabled: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <aside className="min-w-0 space-y-6 xl:sticky xl:top-0 xl:self-start">
      <section
        aria-labelledby="ai-status"
        className="border border-border bg-muted/30 p-5"
      >
        <p id="ai-status" className="text-xs text-muted-foreground">
          服务器当前状态
        </p>
        <p className="mt-2 text-2xl font-semibold">
          {savedEnabled ? "已启用" : "未启用"}
        </p>
        <p className="mt-2 break-words text-xs leading-relaxed text-muted-foreground">
          {savedEnabled
            ? "编辑文章时可调用已配置的模型。"
            : "开启后，在后台编辑器中使用 AI 辅助写作。"}
        </p>
        <div className="mt-5 flex min-h-11 items-center justify-between gap-3 border-t border-border pt-4">
          <Label htmlFor="ai-enabled" className="cursor-pointer text-sm">
            启用网站助手
          </Label>
          <Switch
            id="ai-enabled"
            checked={enabled}
            disabled={disabled}
            onCheckedChange={onChange}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          开关调整后，保存设置即可生效。
        </p>
      </section>
      <section className="space-y-4 px-1 text-sm" aria-label="助手用途">
        <h2 className="font-semibold">写作时，搭把手</h2>
        <dl className="space-y-4 text-xs leading-relaxed">
          <div>
            <dt className="font-medium">润色正文</dt>
            <dd className="mt-1 text-muted-foreground">
              改善表达，让内容更清晰流畅。
            </dd>
          </div>
          <div>
            <dt className="font-medium">补齐文章信息</dt>
            <dd className="mt-1 text-muted-foreground">
              从正文生成标题、摘要和标签。
            </dd>
          </div>
        </dl>
        <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          调用会使用你的模型账户额度。保存配置不会发送模型请求。
        </p>
      </section>
    </aside>
  );
}
function ProviderChoices({
  provider,
  onChange,
}: {
  provider: AIConfig["provider"];
  onChange: (value: AIConfig["provider"]) => void;
}) {
  return (
    <fieldset className="grid grid-cols-2 gap-2">
      <legend className="sr-only">选择服务商</legend>
      {AI_PROVIDERS.map(item => (
        <label
          key={item.id}
          className={`min-w-0 cursor-pointer border p-3 sm:p-4 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring ${provider === item.id ? "border-foreground bg-muted/50" : "border-border hover:bg-muted/30"}`}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{item.name}</span>
            <input
              type="radio"
              name="provider"
              value={item.id}
              checked={provider === item.id}
              onChange={() => onChange(item.id as AIConfig["provider"])}
              className="size-4 shrink-0 accent-foreground"
            />
          </span>
          <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
            {item.id === "custom"
              ? "兼容 OpenAI"
              : item.id === "claude"
                ? "Anthropic API"
                : `${item.name} API`}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
