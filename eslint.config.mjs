import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier/flat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Repo-wide bans — this project starts clean, so these are blocking from
  // day one (unlike backyard-pos, which has pre-existing debt and runs
  // these non-blocking). See CI: no continue-on-error carve-out here.
  {
    files: ["**/*.{ts,tsx,mjs}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "react/no-danger": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  {
    files: ["*.mjs", "*.ts"],
    rules: {
      "import/no-anonymous-default-export": "off",
    },
  },

  // Prettier owns formatting; disable stylistic conflicts. Must stay last.
  prettier,

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
