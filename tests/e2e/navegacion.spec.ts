import { expect, test } from "@playwright/test";

test.describe("idioma", () => {
  test.use({ locale: "ca-ES" });

  test("la raíz redirige al idioma del navegador", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ca$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ca");
  });
});

test("la raíz usa castellano si el idioma del navegador no está disponible", async ({ browser }) => {
  const context = await browser.newContext({ locale: "fr-FR" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/es$/);
  await context.close();
});

test("cambiar de idioma conserva la página y el escenario", async ({ page }) => {
  await page.goto("/es/simulador?c=8");
  await expect(page.getByRole("combobox", { name: "Circunscripción" })).toContainText("Barcelona");

  await page.getByRole("combobox", { name: "Idioma" }).click();
  await page.getByRole("option", { name: "Euskara" }).click();

  await expect(page).toHaveURL(/\/eu\/simulador\?c=0?8$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "eu");
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Simulador de escaños");
  await expect(page.getByRole("combobox", { name: "Barrutia" })).toContainText("Barcelona");
});

test("navegación principal y página activa", async ({ page }) => {
  await page.goto("/es");
  const nav = page.getByRole("navigation", { name: "Navegación principal" });
  await nav.getByRole("link", { name: "Programas" }).click();
  await expect(page).toHaveURL(/\/es\/programas$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Comparador de programas");
  await expect(nav.getByRole("link", { name: "Programas" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Metodología" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Metodología y fuentes");
});

test("el enlace para saltar al contenido es lo primero accesible con teclado", async ({ page }) => {
  await page.goto("/es/simulador");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contenido$/);
});

test("ninguna petición sale del propio sitio", async ({ page }) => {
  const externas: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).hostname !== "localhost") externas.push(r.url());
  });
  for (const ruta of ["/es", "/es/simulador", "/es/programas", "/es/metodologia"]) {
    await page.goto(ruta);
    await page.waitForLoadState("networkidle");
  }
  expect(externas).toEqual([]);
  expect(await page.context().cookies()).toEqual([]);
});

test("una ruta inexistente devuelve 404", async ({ page }) => {
  const res = await page.goto("/es/no-existe");
  expect(res?.status()).toBe(404);
});
