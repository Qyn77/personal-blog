import { expect, it } from "vitest";
import { rehypeHeadingIds } from "../client/src/lib/headingIds";
it("creates deterministic unique anchors for duplicate and formatted headings", () => {
  const tree = {
    children: ["实践", "实践", "实践-2", "***"].map(text => ({
      tagName: "h2",
      properties: {},
      children: [{ tagName: "em", children: [{ value: text }] }],
    })),
  };
  rehypeHeadingIds()(tree);
  expect(tree.children.map(h => (h.properties as any).id)).toEqual([
    "实践",
    "实践-2",
    "实践-2-2",
    "section",
  ]);
});
