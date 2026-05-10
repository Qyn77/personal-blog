/**
 * 邮件发送模块
 * 使用 nodemailer 通过 SMTP 发送邮件
 */

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.EMAIL_SERVICE_HOST || "";
const SMTP_PORT = parseInt(process.env.EMAIL_SERVICE_PORT || "465");
const SMTP_USER = process.env.EMAIL_SERVICE_USER || "";
const SMTP_PASS = process.env.EMAIL_SERVICE_PASSWORD || "";

const SITE_NAME = "墨迹";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // QQ 邮箱 465 端口用 SSL
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

function isConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/**
 * 发送验证邮件
 */
export async function sendVerifyEmail(
  to: string,
  token: string,
  baseUrl: string
): Promise<boolean> {
  if (!isConfigured()) {
    console.error("[Email] SMTP not configured");
    return false;
  }

  const verifyUrl = `${baseUrl}/api/subscribe/verify?token=${token}`;

  try {
    await getTransporter().sendMail({
      from: `"${SITE_NAME}" <${SMTP_USER}>`,
      to,
      subject: `${SITE_NAME} · 邮箱验证`,
      html: `
        <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
          <h2 style="font-size: 20px; margin-bottom: 24px;">邮箱验证</h2>
          <p style="font-size: 15px; line-height: 1.7; color: #333; margin-bottom: 32px;">
            你好，你正在订阅「${SITE_NAME}」博客。请点击下方按钮完成验证，此链接将在 <strong>1 小时</strong> 后失效。
          </p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background: #1a1a1a; color: #fff; text-decoration: none; font-size: 14px; letter-spacing: 0.05em;">
            验证邮箱
          </a>
          <p style="font-size: 13px; color: #999; margin-top: 32px; line-height: 1.6;">
            如果按钮无法点击，请复制以下链接到浏览器打开：<br/>
            <a href="${verifyUrl}" style="color: #666; word-break: break-all;">${verifyUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="font-size: 12px; color: #bbb;">${SITE_NAME} · 以文字对抗遗忘</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send verify email:", error);
    return false;
  }
}

/**
 * 发送新文章通知
 */
export async function sendArticleNotify(
  to: string[],
  article: { title: string; excerpt: string; slug: string },
  baseUrl: string
): Promise<boolean> {
  if (!isConfigured() || to.length === 0) return false;

  const articleUrl = `${baseUrl}/blog/${article.slug}`;

  try {
    // 逐个发送，每封邮件包含个性化的取消订阅链接
    const promises = to.map(email => {
      // 生成取消订阅链接（使用 email 的 base64 编码作为简易 token）
      const unsubToken = Buffer.from(email).toString("base64url");
      const unsubUrl = `${baseUrl}/api/subscribe/unsubscribe?token=${unsubToken}`;

      return getTransporter().sendMail({
        from: `"${SITE_NAME}" <${SMTP_USER}>`,
        to: email,
        subject: `${SITE_NAME} · 新文章：${article.title}`,
        html: `
          <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
            <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">新文章发布</p>
            <h2 style="font-size: 20px; margin-bottom: 16px; line-height: 1.4;">${article.title}</h2>
            <p style="font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 32px;">
              ${article.excerpt}
            </p>
            <a href="${articleUrl}" style="display: inline-block; padding: 12px 32px; background: #1a1a1a; color: #fff; text-decoration: none; font-size: 14px; letter-spacing: 0.05em;">
              阅读全文
            </a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="font-size: 12px; color: #bbb; line-height: 1.6;">
              ${SITE_NAME} · 以文字对抗遗忘<br/>
              <a href="${unsubUrl}" style="color: #999;">不再接收此类邮件</a>
            </p>
          </div>
        `,
      });
    });

    await Promise.allSettled(promises);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send article notifications:", error);
    return false;
  }
}

/**
 * 发送测试邮件
 */
export async function sendTestEmail(to: string): Promise<boolean> {
  if (!isConfigured()) {
    console.error("[Email] SMTP not configured");
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: `"${SITE_NAME}" <${SMTP_USER}>`,
      to,
      subject: `${SITE_NAME} · SMTP 测试邮件`,
      html: `
        <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
          <h2 style="font-size: 20px; margin-bottom: 16px;">SMTP 配置测试</h2>
          <p style="font-size: 15px; line-height: 1.7; color: #333;">
            恭喜！你的 SMTP 邮件服务配置正确，这封测试邮件已成功发送。
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="font-size: 12px; color: #bbb;">${SITE_NAME} · 邮件系统</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send test email:", error);
    return false;
  }
}
