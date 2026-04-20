import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/.next/**",
      "**/.turbo/**",
      "**/.tools/**",
      "**/.pnpm-store/**",
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals,
  {
    settings: {
      next: {
        rootDir: "apps/web/"
      }
    }
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-undef": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          "prefer": "type-imports"
        }
      ]
    }
  }
);
