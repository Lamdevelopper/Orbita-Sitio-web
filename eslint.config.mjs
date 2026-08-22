import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Accesibilidad: eslint-config-next ya registra el plugin jsx-a11y con un
  // subconjunto básico; aquí se añaden las reglas restantes del preset
  // recommended (solo rules, redefinir el plugin provocaría un conflicto).
  {
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  {
    rules: {
      // Interacción con puntero en warn: el panel /admin heredó patrones
      // div-clickeable documentados como deuda en docs/accessibility.md.
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/mouse-events-have-key-events": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local one-off generators are not application source.
    "write_rss.js",
    "write_rss.cjs",
  ]),
]);

export default eslintConfig;
