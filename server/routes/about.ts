import { Router } from "express";
import { getAboutConfig } from "../lib/aboutConfig";

export const aboutRouter = Router();
aboutRouter.get("/about-config.json", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    res.json((await getAboutConfig()).config);
  } catch {
    res.status(503).json({ error: "关于页面暂不可用" });
  }
});
