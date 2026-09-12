import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repo already has its own multi-agent AGENTS.md/CLAUDE.md convention
  // (see root AGENTS.md) — don't let `next dev` overwrite it every run.
  agentRules: false,
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
