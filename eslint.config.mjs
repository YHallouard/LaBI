import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";


export default defineConfig([
  {
    ignores: ["**/__tests__/**"], // Exclude all test files
  },
  { 
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], 
    languageOptions: { globals: globals.browser } 
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react/prop-types": "off", // TypeScript provides better type checking
    },
  },
]);