import { expect, type Page, test } from "@playwright/test";

const escanosDe = (page: Page, siglas: string) =>
  page
    .getByRole("region", { name: "Reparto de escaños" })
    .getByRole("row")
    .filter({ has: page.getByText(siglas, { exact: true }) })
    .getByRole("cell")
    .nth(3);

test.beforeEach(async ({ page }) => {
  await page.goto("/es/simulador");
});

test("parte del resultado oficial de Madrid", async ({ page }) => {
  await expect(page.getByRole("combobox", { name: "Circunscripción" })).toContainText("Madrid");
  await expect(page.getByText("Resultado oficial", { exact: true })).toBeVisible();
  await expect(escanosDe(page, "PP")).toHaveText("16");
  await expect(escanosDe(page, "PSOE")).toHaveText("10");
});

test("editar votos recalcula, se guarda en la URL y se puede restaurar", async ({ page }) => {
  const psoe = page.getByRole("textbox", { name: "Votos de PSOE" });
  await psoe.fill("2000000");
  await psoe.blur();

  await expect(page.getByText("Escenario modificado")).toBeVisible();
  await expect(escanosDe(page, "PSOE")).not.toHaveText("10");
  await expect(page).toHaveURL(/[?&]c=28/);
  await expect(page).toHaveURL(/[?&]v=2:2000000/);

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Votos de PSOE" })).toHaveValue("2000000");

  await page.getByRole("button", { name: "Restaurar datos oficiales" }).click();
  await expect(page.getByText("Resultado oficial", { exact: true })).toBeVisible();
  await expect(escanosDe(page, "PSOE")).toHaveText("10");
  await expect(page).toHaveURL(/\/es\/simulador$/);
});

test("el control deslizante funciona con teclado", async ({ page }) => {
  const slider = page.getByRole("slider", { name: "Ajustar votos de VOX" });
  await slider.focus();
  await page.keyboard.press("End");
  await expect(page.getByText("Escenario modificado")).toBeVisible();
});

test("cambiar de circunscripción reinicia el escenario", async ({ page }) => {
  await page.getByRole("combobox", { name: "Circunscripción" }).click();
  await page.getByRole("option", { name: /^Ceuta/ }).click();
  await expect(page).toHaveURL(/[?&]c=51/);
  await expect(page.getByText(/lo obtiene la candidatura más votada/)).toBeVisible();
});

test("abrir y cerrar la tabla de cocientes", async ({ page }) => {
  const abrir = page.getByRole("button", { name: "Mostrar tabla de cocientes" });
  await abrir.click();
  const tabla = page.getByRole("region", { name: "Tabla de cocientes D'Hondt" });
  await expect(tabla).toBeVisible();
  await expect(tabla.getByText("frontera", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Ocultar tabla de cocientes" }).click();
  await expect(tabla).toBeHidden();
});

test("un enlace compartido restaura el escenario", async ({ page }) => {
  await page.goto("/es/simulador?c=8&v=47:900000&b=1000");
  await expect(page.getByRole("combobox", { name: "Circunscripción" })).toContainText("Barcelona");
  await expect(page.getByRole("textbox", { name: "Votos de PSC" })).toHaveValue("900000");
  await expect(page.getByRole("textbox", { name: "Votos en blanco" })).toHaveValue("1000");
  await expect(page.getByText("Escenario modificado")).toBeVisible();
});
