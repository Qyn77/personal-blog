/**
 * AI tRPC 路由
 * 提供 AI 生成元数据和润色文章的功能
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { generateMetadata, polishContent, isAIEnabled } from "../lib/ai";

export const aiRouter = router({
  /** 检查 AI 功能是否启用 */
  checkEnabled: protectedProcedure.query(() => {
    return { enabled: isAIEnabled() };
  }),

  /** 根据文章内容生成元数据 */
  generateMetadata: protectedProcedure
    .input(
      z.object({
        content: z
          .string()
          .min(1, "内容不能为空")
          .max(10000, "内容过长，请控制在10000字以内"),
      })
    )
    .mutation(async ({ input }) => {
      if (!isAIEnabled()) {
        return { success: false, error: "AI 功能未启用，请检查环境配置" };
      }

      try {
        const result = await generateMetadata(input.content);
        if (!result) {
          return { success: false, error: "AI 生成失败，请重试" };
        }
        return { success: true, data: result };
      } catch (error) {
        console.error("[AI] generateMetadata error:", error);
        return { success: false, error: "AI 生成失败，请重试" };
      }
    }),

  /** 润色文章内容 */
  polishContent: protectedProcedure
    .input(
      z.object({
        content: z
          .string()
          .min(1, "内容不能为空")
          .max(8000, "内容过长，请控制在8000字以内"),
      })
    )
    .mutation(async ({ input }) => {
      if (!isAIEnabled()) {
        return { success: false, error: "AI 功能未启用，请检查环境配置" };
      }

      try {
        const result = await polishContent(input.content);
        if (!result) {
          return { success: false, error: "AI 润色失败，请重试" };
        }
        return { success: true, data: result };
      } catch (error) {
        console.error("[AI] polishContent error:", error);
        return { success: false, error: "AI 润色失败，请重试" };
      }
    }),
});
