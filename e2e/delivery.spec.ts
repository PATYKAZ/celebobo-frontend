import { expect, test, type Page } from "@playwright/test";

// Jeu de données e2e du backend : zones Bukavu et Goma à tarif fixe, « Reste du pays » sur devis,
// retrait sur place avenue Mwanga. Chaque test annule sa commande : le client reste sous le plafond
// de commandes en attente.
const CLIENT = {
  email: "client@e2e.celebobo.test",
  password: process.env.E2E_PASSWORD ?? "Boutique-Kin#2026",
};
const PICKUP_ADDRESS = "Avenue Mwanga n° 21, Nyalukemba, Bukavu";

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

async function startCheckout(page: Page) {
  await page.goto("/produits/galaxy-a55");
  await page.getByRole("button", { name: "Ajouter au panier" }).first().click();
  await page.goto("/commande");
  await expect(
    page.getByRole("heading", { name: "Finaliser la commande" }),
  ).toBeVisible();
}

/** Étapes paiement et confirmation, puis la fiche de la commande envoyée. */
async function sendAndOpen(page: Page) {
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(
    page.getByRole("heading", { name: "Vérifiez votre commande" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Envoyer la commande" }).click();
  await expect(
    page.getByRole("heading", { name: /^Commande .+ envoyée !$/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voir ma commande" }).click();
  await expect(page).toHaveURL(/\/compte\/commandes\//);
}

async function cancel(page: Page) {
  await page.getByRole("button", { name: "Annuler la commande" }).click();
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByText("Motif d'annulation")).toBeVisible();
}

test("le client retire sa commande en boutique, sans frais", async ({
  page,
}) => {
  await signIn(page);
  await startCheckout(page);

  await page.getByRole("radio", { name: /Retrait sur place/ }).click();
  await expect(page.getByText(PICKUP_ADDRESS).first()).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText("Retrait sur place").first()).toBeVisible();
  await page.getByRole("button", { name: "Envoyer la commande" }).click();
  await page.getByRole("link", { name: "Voir ma commande" }).click();

  await expect(page.getByText(PICKUP_ADDRESS).first()).toBeVisible();
  await expect(page.getByText("Gratuit (retrait)")).toBeVisible();
  await cancel(page);
});

test("une ville hors zone est livrée sur devis, annulable sans frais", async ({
  page,
}) => {
  await signIn(page);
  await startCheckout(page);

  await page.getByRole("radio", { name: "Nouvelle adresse" }).click();
  // le pied de page a un champ « Adresse e-mail » : nom exact du champ d'adresse
  await page
    .getByRole("textbox", { name: /^Adresse\*?$/ })
    .fill("Avenue de l'Église n°4");
  await page.getByLabel(/^Quartier/).fill("Makiso");
  await page.getByLabel(/^Ville/).fill("Kisangani");
  await page
    .getByRole("checkbox", { name: /Enregistrer cette adresse/ })
    .uncheck();
  await expect(page.getByText(/livrée\s+sur devis/).first()).toBeVisible();
  await sendAndOpen(page);

  await expect(page.getByText("Sur devis").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Voir la discussion" }),
  ).toBeVisible();
  await cancel(page);
});
