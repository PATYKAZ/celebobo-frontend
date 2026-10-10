import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // propriétés écartées volontairement par déstructuration : `{ isDefault: _d, ...rest }`
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
      // Dette connue (31 cas, antérieurs à la règle) : setState dans un effet pour réinitialiser un formulaire
      // à l'ouverture ou se synchroniser avec le navigateur. À traiter au cas par cas (clé de remontage,
      // useSyncExternalStore…) ; en avertissement d'ici là pour que `npm run lint` signale les nouveaux cas sans bloquer.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
