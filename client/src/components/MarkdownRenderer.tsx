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
              className="text-foreground text-3xl md:text-4xl font-bold mt-12 mb-6 leading-tight"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="text-foreground text-2xl font-semibold mt-10 mb-4"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="text-foreground text-xl font-semibold mt-8 mb-3"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className="text-foreground text-lg font-semibold mt-6 mb-2"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5
              className="text-foreground font-semibold mt-4 mb-2"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6
              className="text-foreground font-semibold mt-4 mb-2"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h6>
          ),
          // 段落
          p: ({ children }) => (
            <p
              className="text-foreground/80 text-[1.0625rem] leading-[1.9] mb-5"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </p>
          ),
          // 链接
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-foreground underline hover:opacity-70 transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // 强调
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/70" style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}>
              {children}
            </em>
          ),
          // 代码块
          code: (props: any) => {
            const { inline, className, children } = props;
            if (inline) {
              return (
                <code
                  className="bg-card text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-sm"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre
                className="bg-card p-4 rounded-lg overflow-x-auto my-6 border border-border"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                <code className={className}>{children}</code>
              </pre>
            );
          },
          // 引用块
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-2 border-foreground/25 pl-5 py-1 my-6 text-foreground/70 italic"
              style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
            >
              {children}
            </blockquote>
          ),
          // 列表
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-foreground/80 mb-5 space-y-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-foreground/80 mb-5 space-y-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="ml-4">{children}</li>
          ),
          // 分割线
          hr: () => (
            <hr className="my-8 border-t border-border" />
          ),
          // 表格
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-card">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th
              className="border border-border px-4 py-2 text-left font-semibold text-foreground"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="border border-border px-4 py-2 text-foreground/80"
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
              className="max-w-full h-auto rounded-lg my-6 border border-border"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
