import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const utils = trpc.useUtils();

  // 推送配置
  const { data: settingsData, isLoading: settingsLoading } = trpc.admin.getNotifySettings.useQuery();
  const [autoNotify, setAutoNotify] = useState(false);

  useEffect(() => {
    if (settingsData) {
      setAutoNotify(settingsData.autoNotify);
    }
  }, [settingsData]);

  const updateSettings = trpc.admin.updateNotifySettings.useMutation({
    onSuccess: () => {
      toast.success("设置已保存");
      utils.admin.getNotifySettings.invalidate();
    },
    onError: () => toast.error("保存失败"),
  });

  // 测试邮件
  const [testEmail, setTestEmail] = useState("");
  const sendTest = trpc.admin.sendTestEmail.useMutation({
    onSuccess: result => {
      if (result.success) {
        toast.success("测试邮件已发送，请查收");
      } else {
        toast.error(result.error || "发送失败");
      }
    },
    onError: () => toast.error("发送失败"),
  });

  const handleSaveSettings = () => {
    updateSettings.mutate({ autoNotify });
  };

  const handleSendTest = () => {
    if (!testEmail.trim()) {
      toast.error("请输入邮箱地址");
      return;
    }
    sendTest.mutate({ email: testEmail.trim() });
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        加载中...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
      >
        系统设置
      </h1>

      {/* 推送配置 */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">邮件推送</h2>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <Label htmlFor="autoNotify" className="text-sm font-medium">
                发布文章时自动推送
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                开启后，文章从草稿发布时会自动给所有已确认的订阅者发送邮件通知
              </p>
            </div>
            <Switch
              id="autoNotify"
              checked={autoNotify}
              onCheckedChange={setAutoNotify}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={handleSaveSettings} disabled={updateSettings.isPending} size="sm">
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存设置"
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* SMTP 测试 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">SMTP 测试</h2>
          <p className="text-sm text-muted-foreground mb-4">
            发送一封测试邮件，验证邮箱服务配置是否正确
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="输入测试邮箱地址"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleSendTest}
              disabled={sendTest.isPending || !testEmail.trim()}
            >
              {sendTest.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  发送测试
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
