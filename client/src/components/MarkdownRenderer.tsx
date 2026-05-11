/*
 * Markdown 渲染器组件
 * 使用 react-markdown 和相关插件渲染 Markdown 内容
 * 支持：GFM（GitHub Flavored Markdown）、数学公式、代码高亮、任务列表
 */

import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { Copy, Check, Link } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// 代码块复制按钮组件
function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button onClick={handleCopy} className="code-copy-btn" title="复制代码">
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-white/50" />
      )}
    </button>
  );
}

// 语言标签映射：简写 → 可读名称
const LANG_LABELS: Record<string, string> = {
  js: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  tsx: "TSX",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  go: "Go",
  rs: "Rust",
  java: "Java",
  c: "C",
  cpp: "C++",
  cs: "C#",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  dart: "Dart",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  xml: "XML",
  sql: "SQL",
  sh: "Shell",
  bash: "Bash",
  zsh: "Zsh",
  powershell: "PowerShell",
  ps1: "PowerShell",
  bat: "Batch",
  cmd: "Batch",
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  makefile: "Makefile",
  make: "Makefile",
  toml: "TOML",
  ini: "INI",
  env: "ENV",
  graphql: "GraphQL",
  gql: "GraphQL",
  md: "Markdown",
  markdown: "Markdown",
  tex: "LaTeX",
  latex: "LaTeX",
  r: "R",
  lua: "Lua",
  vim: "Vim",
  nginx: "Nginx",
  apache: "Apache",
  terraform: "Terraform",
  tf: "Terraform",
  vue: "Vue",
  svelte: "Svelte",
};

// 标题锚点生成
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 提取纯文本（用于生成 slug）
function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (React.isValidElement(children) && (children.props as any).children) {
    return extractText((children.props as any).children);
  }
  return "";
}

// 带锚点的标题组件
function H1({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h1
      id={id}
      className="heading-anchor text-foreground text-3xl md:text-4xl font-bold mt-12 mb-6 leading-tight scroll-mt-20"
      style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
    >
      <a
        href={`#${id}`}
        className="anchor-link opacity-0 -ml-6 pr-1 text-foreground/30 hover:text-foreground/60 transition-opacity"
        aria-label={`链接到 ${extractText(children)}`}
      >
        <Link className="w-4 h-4 inline" />
      </a>
      {children}
    </h1>
  );
}
function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="heading-anchor text-foreground text-2xl font-semibold mt-10 mb-4 pb-2 border-b border-border/50 scroll-mt-20"
      style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
    >
      <a
        href={`#${id}`}
        className="anchor-link opacity-0 -ml-6 pr-1 text-foreground/30 hover:text-foreground/60 transition-opacity"
        aria-label={`链接到 ${extractText(children)}`}
      >
        <Link className="w-4 h-4 inline" />
      </a>
      {children}
    </h2>
  );
}
function H3({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="heading-anchor text-foreground text-xl font-semibold mt-8 mb-3 scroll-mt-20"
      style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
    >
      <a
        href={`#${id}`}
        className="anchor-link opacity-0 -ml-6 pr-1 text-foreground/30 hover:text-foreground/60 transition-opacity"
        aria-label={`链接到 ${extractText(children)}`}
      >
        <Link className="w-4 h-4 inline" />
      </a>
      {children}
    </h3>
  );
}
function H4({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h4
      id={id}
      className="heading-anchor text-foreground text-lg font-semibold mt-6 mb-2 scroll-mt-20"
      style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
    >
      <a
        href={`#${id}`}
        className="anchor-link opacity-0 -ml-6 pr-1 text-foreground/30 hover:text-foreground/60 transition-opacity"
        aria-label={`链接到 ${extractText(children)}`}
      >
        <Link className="w-4 h-4 inline" />
      </a>
      {children}
    </h4>
  );
}
function H5({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h5
      id={id}
      className="heading-anchor text-foreground font-semibold mt-4 mb-2 scroll-mt-20"
      style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
    >
      <a
        href={`#${id}`}
        className="anchor-link opacity-0 -ml-6 pr-1 text-foreground/30 hover:text-foreground/60 transition-opacity"
        aria-label={`链接到 ${extractText(children)}`}
      >
        <Link className="w-4 h-4 inline" />
      </a>
      {children}
    </h5>
  );
}
function H6({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h6
      id={id}
      className="heading-anchor text-foreground font-semibold mt-4 mb-2 scroll-mt-20"
      style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
    >
      <a
        href={`#${id}`}
        className="anchor-link opacity-0 -ml-6 pr-1 text-foreground/30 hover:text-foreground/60 transition-opacity"
        aria-label={`链接到 ${extractText(children)}`}
      >
        <Link className="w-4 h-4 inline" />
      </a>
      {children}
    </h6>
  );
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div
      className={`markdown-content prose dark:prose-invert max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          // 标题（带锚点）
          h1: ({ children }) => (
            <H1 id={slugify(extractText(children))}>{children}</H1>
          ),
          h2: ({ children }) => (
            <H2 id={slugify(extractText(children))}>{children}</H2>
          ),
          h3: ({ children }) => (
            <H3 id={slugify(extractText(children))}>{children}</H3>
          ),
          h4: ({ children }) => (
            <H4 id={slugify(extractText(children))}>{children}</H4>
          ),
          h5: ({ children }) => (
            <H5 id={slugify(extractText(children))}>{children}</H5>
          ),
          h6: ({ children }) => (
            <H6 id={slugify(extractText(children))}>{children}</H6>
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
              className="text-blue-600 dark:text-blue-400 underline underline-offset-2 decoration-blue-600/40 dark:decoration-blue-400/40 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-colors"
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
            <em
              className="italic text-foreground/75"
              style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
            >
              {children}
            </em>
          ),
          // 删除线
          del: ({ children }) => (
            <del className="text-foreground/50 line-through">{children}</del>
          ),
          // 代码块和内联代码
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            const isBlock =
              codeString.includes("\n") ||
              props.node?.position?.start?.line !==
                props.node?.position?.end?.line;

            // 代码块：有语言标识 OR 多行代码
            if (match || isBlock) {
              const lang = match ? match[1] : "";
              const label = LANG_LABELS[lang] || lang;

              return (
                <div className="code-block-wrapper my-6">
                  {label && <div className="code-lang-label">{label}</div>}
                  <pre
                    className="bg-[#0d1117] rounded-lg overflow-x-auto border border-white/5 shadow-sm"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                  <CodeCopyButton code={codeString} />
                </div>
              );
            }

            // 内联代码
            return (
              <code
                className="bg-card text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded text-[0.875rem] font-medium border border-border/30"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                {...props}
              >
                {children}
              </code>
            );
          },
          // 引用块
          blockquote: ({ children }) => (
            <blockquote className="blockquote-elegant">{children}</blockquote>
          ),
          // 列表
          ul: ({ children, className: cls }) => {
            // GFM 任务列表（包含 checkbox 的 ul）
            if (cls?.includes("contains-task-list")) {
              return (
                <ul className="task-list text-foreground/85 mb-6 space-y-1.5 pl-0 list-none">
                  {children}
                </ul>
              );
            }
            return (
              <ul
                className="list-disc text-foreground/85 mb-6 space-y-2 pl-6"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                {children}
              </ul>
            );
          },
          ol: ({ children }) => (
            <ol
              className="list-decimal text-foreground/85 mb-6 space-y-2 pl-6"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {children}
            </ol>
          ),
          li: ({ children, className: cls, ...props }) => {
            // GFM 任务列表项
            if (cls?.includes("task-list-item")) {
              return (
                <li className="task-list-item leading-relaxed flex items-start gap-2">
                  {children}
                </li>
              );
            }
            return (
              <li className="leading-relaxed" {...props}>
                {children}
              </li>
            );
          },
          // GFM checkbox input
          input: ({ checked, type, ...props }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="task-checkbox mt-1.5"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
          // 分割线
          hr: () => <hr className="my-8 border-t border-border/50" />,
          // 表格
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-border/50">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-card/80 border-b border-border/50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
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
            let imageSrc = src || "";
            if (imageSrc.startsWith("images/")) {
              imageSrc = `/books/${imageSrc}`;
            }
            return (
              <figure className="my-8">
                <img
                  src={imageSrc}
                  alt={alt}
                  loading="lazy"
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
          // 数学公式块（display math）
          div: ({ className, children, ...props }) => {
            if (className?.includes("math-display")) {
              return (
                <div
                  className="math-display my-8 overflow-x-auto py-4"
                  {...props}
                >
                  {children}
                </div>
              );
            }
            return (
              <div className={className} {...props}>
                {children}
              </div>
            );
          },
          // 内联数学公式
          span: ({ className, children, ...props }) => {
            if (className?.includes("math-inline")) {
              return (
                <span className="math-inline" {...props}>
                  {children}
                </span>
              );
            }
            return (
              <span className={className} {...props}>
                {children}
              </span>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
