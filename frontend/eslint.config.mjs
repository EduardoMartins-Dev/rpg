import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Padrão usado em toda a app desde antes da migração: `useEffect(() => { load() })`
      // com um `load` em useCallback que faz fetch e guarda no estado. A regra tem razão
      // (é render em cascata), mas migrar as ~10 telas para outro padrão de data fetching
      // é uma refatoração à parte — como aviso ela continua visível sem travar o CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
