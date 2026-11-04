import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "supabase/functions"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Kontekst hook'lari va shadcn yordamchilari komponent bilan birga eksport qilinadi (HMR uchun xavfsiz)
      "react-refresh/only-export-components": ["warn", {
        allowConstantExport: true,
        allowExportNames: ["useAuth", "useLanguage", "useTheme", "buttonVariants", "toast", "DARK", "LIGHT", "SEO_LANDINGS"],
      }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
