#!/usr/bin/env node
/**
 * Génère src/shared/ui/icons/ à partir d'iconsax-reactjs, en ne gardant que les variantes utilisées par le site
 * (Linear, Bold, Bulk). Chaque icône du paquet embarque 6 dessins (Outline, Broken, TwoTone en plus) : ~6,8 Ko
 * par icône, dont la moitié jamais affichée.
 *
 * Usage : node scripts/generate-icons.mjs   (à relancer après l'ajout d'une icône ; le script lit les imports
 * de `@/shared/ui/icons` dans src/ et échoue si une icône demandée n'existe pas dans le paquet).
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const OUT = join(SRC, "shared/ui/icons");
const PKG = join(ROOT, "node_modules/iconsax-reactjs/dist/esm");
const VARIANTS = ["Linear", "Bold", "Bulk"];

// 1. icônes importées dans le code (depuis le module local ou, avant migration, depuis le paquet)
const names = new Set();
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (p.startsWith(OUT)) continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(f)) {
      const code = readFileSync(p, "utf8");
      for (const m of code.matchAll(/import\s*\{([^}]+)\}\s*from\s*["'](?:@\/shared\/ui\/icons|iconsax-reactjs)["']/g)) {
        for (const part of m[1].split(",")) {
          const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
          if (name && name !== "Icon" && name !== "IconProps" && !part.trim().startsWith("type ")) names.add(name);
        }
      }
    }
  }
};
walk(SRC);

// 2. extraction des variantes utiles de chaque icône
const variantBody = (code, variant, file) => {
  const re = new RegExp(`var ${variant} = function ${variant}\\(_ref\\d*\\) \\{\\n\\s*var color = _ref\\d*\\.color;\\n\\s*return ([\\s\\S]*?);\\n\\};`);
  const m = code.match(re);
  if (!m) throw new Error(`${file} : variante ${variant} introuvable`);
  return m[1].replaceAll("/*#__PURE__*/", "").replaceAll("React.createElement", "h").replaceAll("React.Fragment", "Fragment");
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "svg"), { recursive: true });
const sorted = [...names].sort();
for (const name of sorted) {
  const file = join(PKG, `${name}.js`);
  let code;
  try {
    code = readFileSync(file, "utf8");
  } catch {
    throw new Error(`Icône inconnue dans iconsax-reactjs : ${name}`);
  }
  const body = VARIANTS.map((v) => `  ${v}: (color) =>\n    ${variantBody(code, v, name).replace(/\n/g, "\n    ")},`).join("\n");
  writeFileSync(
    join(OUT, "svg", `${name}.ts`),
    `// Généré par scripts/generate-icons.mjs depuis iconsax-reactjs — ne pas modifier.\nimport { Fragment, createElement as h } from "react";\nimport { icon } from "../icon";\n\nexport const ${name} = /*#__PURE__*/ icon("${name}", {\n${body}\n});\n`,
  );
}
writeFileSync(
  join(OUT, "index.ts"),
  `// Généré par scripts/generate-icons.mjs — ne pas modifier. ${sorted.length} icônes, variantes ${VARIANTS.join(" / ")}.\nexport type { Icon, IconProps, IconVariant } from "./icon";\n${sorted.map((n) => `export { ${n} } from "./svg/${n}";`).join("\n")}\n`,
);
// déclare le dossier sans effet de bord : le build ne garde que les icônes importées
writeFileSync(join(OUT, "package.json"), `${JSON.stringify({ sideEffects: false }, null, 2)}\n`);
writeFileSync(
  join(OUT, "icon.ts"),
  `// Généré par scripts/generate-icons.mjs — ne pas modifier.
import { createElement, forwardRef, type ReactNode, type SVGAttributes } from "react";

export type IconVariant = ${VARIANTS.map((v) => `"${v}"`).join(" | ")};

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  variant?: IconVariant;
  color?: string;
  size?: string | number;
}

export type Icon = ReturnType<typeof icon>;

/** Composant d'icône Iconsax (mêmes props que iconsax-reactjs), limité aux variantes utilisées par le site. */
export function icon(name: string, variants: Record<IconVariant, (color: string) => ReactNode>) {
  const Component = forwardRef<SVGSVGElement, IconProps>(function Icon({ variant = "Linear", color = "currentColor", size = 24, ...rest }, ref) {
    return createElement("svg", { ...rest, ref, xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none" }, (variants[variant] ?? variants.Linear)(color));
  });
  Component.displayName = name;
  return Component;
}
`,
);
console.log(`${sorted.length} icônes générées dans ${relative(ROOT, OUT)}`);
