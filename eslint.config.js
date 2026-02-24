import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["public/vite/**", "node_modules/**", "dist/**"] },
  {
    files: ["frontend/src/**/*.{ts,tsx}", "vite.config.ts"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    settings: { react: { version: "detect" } },
    rules: {
      // React — new JSX transform, no prop-types (TypeScript handles it)
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",
      "react/self-closing-comp": "error",
      "react/no-unknown-property": "error",
      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      // a11y — warn level so pre-existing issues don't block commits
      ...Object.fromEntries(
        Object.entries(jsxA11y.configs.recommended.rules ?? {}).map(([k, _]) => [k, "warn"])
      ),
    },
  },
  prettierConfig
);
