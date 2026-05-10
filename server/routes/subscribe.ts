/**
 * 订阅验证路由
 * 处理邮箱验证和取消订阅的 GET 请求
 */

import { Router } from "express";
import * as db from "../db";

export const subscribeRouter = Router();

/** 验证邮箱 */
subscribeRouter.get("/subscribe/verify", async (req, res) => {
  const token = req.query.token as string;

  if (!token) {
    res.status(400).send(renderPage("验证失败", "缺少验证参数。"));
    return;
  }

  try {
    const subscriber = await db.getSubscriberByToken(token);

    if (!subscriber) {
      res.status(404).send(renderPage("验证失败", "无效的验证链接。"));
      return;
    }

    if (subscriber.status === "confirmed") {
      res.send(renderPage("已验证", "你的邮箱已经验证过了，无需重复操作。"));
      return;
    }

    // 检查 token 是否过期
    if (subscriber.tokenExpiresAt && Date.now() > subscriber.tokenExpiresAt) {
      res
        .status(410)
        .send(
          renderPage(
            "链接已过期",
            "验证链接已超过 1 小时，请重新订阅获取新的验证邮件。"
          )
        );
      return;
    }

    // 更新状态
    await db.updateSubscriber(subscriber.id, {
      status: "confirmed",
      confirmedAt: Date.now(),
      verifyToken: null,
      tokenExpiresAt: null,
    });

    res.send(renderPage("验证成功", "邮箱验证完成！你将收到新文章推送通知。"));
  } catch (error) {
    console.error("[Subscribe] Verify error:", error);
    res.status(500).send(renderPage("验证失败", "服务器错误，请稍后重试。"));
  }
});

/** 取消订阅 */
subscribeRouter.get("/subscribe/unsubscribe", async (req, res) => {
  const token = req.query.token as string;

  if (!token) {
    res.status(400).send(renderPage("操作失败", "缺少参数。"));
    return;
  }

  try {
    const subscriber = await db.getSubscriberByUnsubscribeToken(token);

    if (!subscriber) {
      res.status(404).send(renderPage("操作失败", "未找到该订阅记录。"));
      return;
    }

    if (subscriber.status === "unsubscribed") {
      res.send(renderPage("已取消", "你已经取消了订阅。"));
      return;
    }

    await db.updateSubscriber(subscriber.id, { status: "unsubscribed" });

    res.send(
      renderPage("已取消订阅", "你已成功取消订阅，后续将不再收到推送邮件。")
    );
  } catch (error) {
    console.error("[Subscribe] Unsubscribe error:", error);
    res.status(500).send(renderPage("操作失败", "服务器错误，请稍后重试。"));
  }
});

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} · 墨迹</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fafaf8; color: #1a1a1a; }
    .card { max-width: 420px; padding: 48px 32px; text-align: center; }
    h1 { font-size: 20px; margin-bottom: 12px; }
    p { font-size: 15px; color: #555; line-height: 1.7; }
    a { color: #1a1a1a; text-decoration: underline; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p style="margin-top: 24px;"><a href="/">返回博客</a></p>
  </div>
</body>
</html>`;
}
