import { expect, test } from "@playwright/test";

// Jeu de données e2e du backend (`manage.py seed_demo --e2e`) : client avec adresse par défaut,
// Galaxy A55 en promotion 300 → 250 $.
const CLIENT = {
  email: "client@e2e.celebobo.test",
  password: process.env.E2E_PASSWORD ?? "Boutique-Kin#2026",
};

// Chaque passage crée une commande en attente et le backend en plafonne le nombre par client :
// recharger le jeu fixe (`./deploy/local.sh e2e`) avant de relancer en local.
test("un client connecté commande un produit en promotion", async ({
  page,
}) => {
  await page.goto("/connexion");
  // Le pied de page a aussi un champ e-mail (newsletter) : on cible le formulaire de connexion.
  const form = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Se connecter" }) });
  await form.getByLabel(/^E-mail/).fill(CLIENT.email);
  await form.getByLabel(/^Mot de passe/).fill(CLIENT.password);
  await form.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).not.toHaveURL(/\/connexion/);

  await page.goto("/produits/galaxy-a55");
  await page.getByRole("button", { name: "Ajouter au panier" }).first().click();

  await page.goto("/commande");
  await expect(
    page.getByRole("heading", { name: "Finaliser la commande" }),
  ).toBeVisible();
  // livraison : l'adresse par défaut du carnet est déjà choisie
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(
    page.getByRole("heading", { name: "Comment souhaitez-vous payer ?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(
    page.getByRole("heading", { name: "Vérifiez votre commande" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Envoyer la commande" }).click();

  const confirmation = page.getByRole("heading", {
    name: /^Commande .+ envoyée !$/,
  });
  await expect(confirmation).toBeVisible();
  const number = (await confirmation.textContent())?.match(
    /^Commande (.+) envoyée !$/,
  )?.[1];
  expect(number).toBeTruthy();

  await page.getByRole("link", { name: "Voir ma commande" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/compte/commandes/${encodeURIComponent(number!)}`),
  );
  await expect(page.getByText("Galaxy A55").first()).toBeVisible();
});
