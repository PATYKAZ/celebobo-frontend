/** Slug d'URL (même règle que le backend : minuscules, sans accents, tirets). */
export const slugify = (text: string) =>
  text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
