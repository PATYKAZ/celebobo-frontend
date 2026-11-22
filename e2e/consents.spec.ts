import { expect, test, type Page } from "@playwright/test";

// Jeu de données e2e du backend : le client a donné les consentements obligatoires à l'inscription,
// pas celui des offres commerciales.
const CLIENT = {
  email: "client@e2e.celebobo.test",
  password: process.env.E2E_PASSWORD ?? "Boutique-Kin#2026",
};

async function signIn(page: Page) {
  await page.goto("/connexion");
  const form = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Se connecter" }) });
  await form.getByLabel(/^E-mail/).fill(CLIENT.email);
  await form.getByLabel(/^Mot de passe/).fill(CLIENT.password);
  await form.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).not.toHaveURL(/\/connexion/);
}

test("l'inscription exige deux cases distinctes, les offres ne sont jamais précochées", async ({ page }) => {
  await page.goto("/inscription");
  const form = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Créer mon compte" }) });

  await expect(form.getByRole("checkbox")).toHaveCount(3);
  await expect(form.getByRole("checkbox", { name: /offres et nouveautés/ })).not.toBeChecked();
  await form.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(form.getByText(/accepter les conditions générales de vente/)).toBeVisible();
  await expect(form.getByText(/accepter l'hébergement de vos données hors de RDC/)).toBeVisible();
});

test("les offres commerciales se donnent et se retirent en un clic", async ({ page }) => {
  await signIn(page);
  await page.goto("/compte/consentements");
  await expect(page.getByRole("heading", { name: "Mes consentements" })).toBeVisible();
  const marketing = page
    .getByRole("list", { name: "État de mes consentements" })
    .getByRole("listitem")
    .filter({ hasText: "Offres commerciales" });

  await marketing.getByRole("button", { name: "Donner mon accord" }).click();
  await expect(marketing.getByText("Donné", { exact: true })).toBeVisible();

  await marketing.getByRole("button", { name: "Retirer" }).click();
  await expect(marketing.getByText("Non donné")).toBeVisible();
});
