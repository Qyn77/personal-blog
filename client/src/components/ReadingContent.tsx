import { useEffect, useRef, useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

type Heading = { id: string; title: string; level: number };
export default function ReadingContent({ content }: { content: string }) {
  const body = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState("");
  useEffect(() => {
    const nodes = Array.from(
      body.current?.querySelectorAll<HTMLElement>(
        "h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]"
      ) ?? []
    );
    setHeadings(
      nodes.map(node => ({
        id: node.id,
        title: node.textContent ?? "",
        level: Number(node.tagName[1]),
      }))
    );
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = nodes[0];
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= 160) current = node;
        else break;
      }
      setActive(current?.id ?? "");
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    if (location.hash) {
      try {
        nodes
          .find(node => node.id === decodeURIComponent(location.hash.slice(1)))
          ?.scrollIntoView();
      } catch {
        /* Invalid URL fragment. */
      }
    }
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", scroll);
      cancelAnimationFrame(frame);
    };
  }, [content]);
  const links = (
    <ol className="space-y-2 text-sm">
      {headings.map(heading => (
        <li key={heading.id} className={heading.level > 2 ? "pl-3" : ""}>
          <a
            href={`#${encodeURIComponent(heading.id)}`}
            aria-current={active === heading.id ? "location" : undefined}
            className={`block py-1 break-words hover:text-foreground focus-visible:outline focus-visible:outline-ring ${active === heading.id ? "text-foreground font-semibold" : "text-muted-foreground"}`}
          >
            {heading.title}
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <div
      className={
        headings.length > 1
          ? "lg:grid lg:grid-cols-[minmax(0,1fr)_12rem] lg:gap-10"
          : ""
      }
    >
      {headings.length > 1 && (
        <details className="lg:hidden mb-8 border-y border-border py-4">
          <summary className="cursor-pointer text-sm font-semibold">
            文章目录 · {headings.length} 节
          </summary>
          <nav aria-label="文章目录" className="pt-4">
            {links}
          </nav>
        </details>
      )}
      <div ref={body} className="min-w-0">
        <MarkdownRenderer content={content} />
      </div>
      {headings.length > 1 && (
        <aside className="hidden lg:block">
          <nav
            aria-label="文章目录"
            className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto border-l border-border pl-5"
          >
            <p className="text-sm font-semibold mb-4">本文目录</p>
            {links}
          </nav>
        </aside>
      )}
    </div>
  );
}
