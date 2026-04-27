/*
 * Markdown 渲染器组件
 * 使用 react-markdown 和相关插件渲染 Markdown 内容
 * 支持：GFM（GitHub Flavored Markdown）、数学公式、代码高亮
 */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
// 代码高亮样式通过 Tailwind 类名处理

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          // 标题
          h1: ({ children }) => (
            <h1
              className="text-[#1A1A1A] dark:text-[#F5F5F5] text-3xl md:text-4xl font-bold mt-12 mb-6 leading-tight"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="text-[#1A1A1A] dark:text-[#F5F5F5] text-2xl font-semibold mt-10 mb-4"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="text-[#1A1A1A] dark:text-[#F5F5F5] text-xl font-semibold mt-8 mb-3"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className="text-[#1A1A1A] dark:text-[#F5F5F5] text-lg font-semibold mt-6 mb-2"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5
              className="text-[#1A1A1A] dark:text-[#F5F5F5] font-semibold mt-4 mb-2"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6
              className="text-[#1A1A1A] dark:text-[#F5F5F5] font-semibold mt-4 mb-2"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h6>
          ),
          // 段落
          p: ({ children }) => (
            <p
              className="text-[#2A2A2A] dark:text-[#D0D0D0] text-[1.0625rem] leading-[1.9] mb-5"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </p>
          ),
          // 链接
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[#1A1A1A] dark:text-[#F5F5F5] underline hover:opacity-70 transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // 强调
          strong: ({ children }) => (
            <strong className="font-semibold text-[#1A1A1A] dark:text-[#F5F5F5]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#4A4A4A] dark:text-[#D0D0D0]" style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}>
              {children}
            </em>
          ),
          // 代码块
          code: (props: any) => {
            const { inline, className, children } = props;
            if (inline) {
              return (
                <code
                  className="bg-[#F0F0EE] dark:bg-[#22222A] text-[#C41E3A] dark:text-[#FF6B6B] px-2 py-0.5 rounded text-sm"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre
                className="bg-[#F0F0EE] dark:bg-[#22222A] p-4 rounded-lg overflow-x-auto my-6 border border-[#E0E0DC] dark:border-[#333333]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                <code className={className}>{children}</code>
              </pre>
            );
          },
          // 引用块
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-2 border-[#1A1A1A]/25 dark:border-[#F5F5F5]/25 pl-5 py-1 my-6 text-[#4A4A4A] dark:text-[#D0D0D0] italic"
              style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
            >
              {children}
            </blockquote>
          ),
          // 列表
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-[#2A2A2A] dark:text-[#D0D0D0] mb-5 space-y-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-[#2A2A2A] dark:text-[#D0D0D0] mb-5 space-y-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="ml-4">{children}</li>
          ),
          // 分割线
          hr: () => (
            <hr className="my-8 border-t border-[#1A1A1A]/10 dark:border-[#F5F5F5]/10" />
          ),
          // 表格
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse border border-[#D4D4D0] dark:border-[#333333]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F0F0EE] dark:bg-[#22222A]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-[#D4D4D0] dark:border-[#333333]">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th
              className="border border-[#D4D4D0] dark:border-[#333333] px-4 py-2 text-left font-semibold text-[#1A1A1A] dark:text-[#F5F5F5]"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="border border-[#D4D4D0] dark:border-[#333333] px-4 py-2 text-[#2A2A2A] dark:text-[#D0D0D0]"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </td>
          ),
          // 图片
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg my-6 border border-[#E0E0DC] dark:border-[#333333]"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
