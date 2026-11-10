type HtmlNode = {
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HtmlNode[];
};
const textOf = (node: HtmlNode): string =>
  node.value ?? node.children?.map(textOf).join("") ?? "";

/** Assign IDs from the rendered Markdown tree, including setext and inline formatting. */
export function rehypeHeadingIds() {
  return (tree: HtmlNode) => {
    const used = new Set<string>();
    const walk = (node: HtmlNode) => {
      if (/^h[1-6]$/.test(node.tagName ?? "")) {
        const base =
          textOf(node)
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fff]+/g, "-")
            .replace(/^-+|-+$/g, "") || "section";
        let id = base;
        let suffix = 2;
        while (used.has(id)) id = `${base}-${suffix++}`;
        used.add(id);
        node.properties = { ...node.properties, id };
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
