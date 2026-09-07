import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
  vars: {
    AUTH_ALLOWED_DOMAIN: process.env.AUTH_ALLOWED_DOMAIN ?? "vividlabsai.com",
    AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET ?? "",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
    INTERNAL_FULL_ACCESS_DOMAIN: process.env.INTERNAL_FULL_ACCESS_DOMAIN ?? "",
    TEST_FOUNDATION_EMAILS: process.env.TEST_FOUNDATION_EMAILS ?? "",
    TEST_SECOND_SEAT_EMAILS: process.env.TEST_SECOND_SEAT_EMAILS ?? "",
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY ?? "",
    CEREBRAS_MODEL: process.env.CEREBRAS_MODEL ?? "gpt-oss-120b",
    GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
    GROQ_BRAIN_MODEL: process.env.GROQ_BRAIN_MODEL ?? "openai/gpt-oss-120b",
  },
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    resolve: {
      dedupe: ["react", "react-dom", "three", "@react-three/fiber"],
    },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
