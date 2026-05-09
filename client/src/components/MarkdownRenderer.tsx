/*
 * Markdown 渲染器组件
 * 使用 react-markdown 和相关插件渲染 Markdown 内容
 * 支持：GFM（GitHub Flavored Markdown）、数学公式、代码高亮
 */

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// 代码块复制按钮组件
function CodeBlockCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-2 rounded bg-foreground/10 hover:bg-foreground/20 transition-colors z-10"
      title="复制代码"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-foreground/60" />
      )}
    </button>
  );
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          // 标题
          h1: ({ children }) => (
            <h1
              className="text-foreground text-3xl md:text-4xl font-bold mt-12 mb-6 leading-tight scroll-mt-20"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="text-foreground text-2xl font-semibold mt-10 mb-4 pb-2 border-b border-border/50 scroll-mt-20"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="text-foreground text-xl font-semibold mt-8 mb-3 scroll-mt-20"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className="text-foreground text-lg font-semibold mt-6 mb-2 scroll-mt-20"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5
              className="text-foreground font-semibold mt-4 mb-2 scroll-mt-20"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6
              className="text-foreground font-semibold mt-4 mb-2 scroll-mt-20"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              {children}
            </h6>
          ),
          // 段落
          p: ({ children }) => (
            <p
              className="text-foreground/85 text-[1.0625rem] leading-[1.85] mb-6"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </p>
          ),
          // 链接
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 underline hover:opacity-70 transition-opacity"
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
            <em className="italic text-foreground/75" style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}>
              {children}
            </em>
          ),
          // 代码块和内联代码
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            
            // 代码块：不是内联 && 有语言标识
            if (!inline && match) {
              return (
                <div className="relative my-6">
                  <pre
                    className="bg-[#0d1117] p-4 rounded-lg overflow-x-auto border border-border/50 shadow-sm"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                  <CodeBlockCopyButton code={codeString} />
                </div>
              );
            }
            
            // 内联代码
            return (
              <code
                className="bg-card text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-sm font-medium"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                {...props}
              >
                {children}
              </code>
            );
          },
          // 引用块
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-4 border-foreground/30 pl-6 py-2 my-6 text-foreground/75 italic bg-card/50 rounded-r-lg pr-4"
              style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
            >
              {children}
            </blockquote>
          ),
          // 列表
          ul: ({ children }) => (
            <ul 
              className="list-disc text-foreground/85 mb-6 space-y-2 pl-6" 
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol 
              className="list-decimal text-foreground/85 mb-6 space-y-2 pl-6" 
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          // 分割线
          hr: () => (
            <hr className="my-8 border-t border-border/50" />
          ),
          // 表格
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-border/50">
              <table className="w-full border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-card/80 border-b border-border/50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border/30 hover:bg-card/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th
              className="px-4 py-3 text-left font-semibold text-foreground"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="px-4 py-3 text-foreground/80"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </td>
          ),
          // 图片
          img: ({ src, alt }) => {
            // 处理相对路径：如果是 images/ 开头的相对路径，转换为绝对路径
            let imageSrc = src || '';
            if (imageSrc.startsWith('images/')) {
              imageSrc = `/books/${imageSrc}`;
            }
            return (
              <figure className="my-8">
                <img
                  src={imageSrc}
                  alt={alt}
                  className="w-full h-auto rounded-lg shadow-md border border-border/50 hover:shadow-lg transition-shadow"
                />
                {alt && (
                  <figcaption 
                    className="text-center text-sm text-foreground/60 mt-3"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    {alt}
                  </figcaption>
                )}
              </figure>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
