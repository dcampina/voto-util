import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/es/programas");
});

test("enlaza la metodología en lugar de repetir las fuentes", async ({ page }) => {
  await expect(page.getByText("Datos de ejemplo")).toHaveCount(0);
  await expect(page.getByText("Fuentes", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Metodología y fuentes" }).click();
  await expect(page).toHaveURL(/\/es\/metodologia$/);
  await expect(page.getByText("Fuentes", { exact: true })).toBeVisible();
  await expect(page.getByText("votaabascal.es").first()).toBeVisible();
  await expect(page.getByText("El Nacional").first()).toBeVisible();
});

test("abrir una cita muestra el texto y se cierra con Escape", async ({ page }) => {
  const boton = page.getByRole("button", { name: "Ver cita y fuente" }).first();
  await boton.click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await expect(dialogo.locator("blockquote")).not.toBeEmpty();

  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(boton).toBeFocused();
});

test("una medida sin gasto no puntúa la financiación", async ({ page }) => {
  const medida = page.getByRole("article").filter({
    hasText: "Que las comunidades con competencia puedan regular los contratos de alquiler",
  });
  await expect(medida.getByText("No requiere financiación")).toBeVisible();
  await expect(medida.getByRole("group", { name: /de 4,/ })).toBeVisible();
  await expect(medida.getByLabel("Financiación: no")).toHaveCount(0);
});

test("el índice de concreción no depende solo del color", async ({ page }) => {
  await expect(page.getByRole("group", { name: /Índice de concreción: \d de \d/ }).first()).toBeVisible();
  await expect(page.getByLabel(/: (sí|no)$/).first()).toBeAttached();
});

test("la fila de partidos sigue visible al desplazar", async ({ page }) => {
  const fila = page.locator("[data-party-row]");
  const cuerpo = page.locator("[data-party-body]");
  await expect(fila.locator("..")).toHaveCSS("position", "sticky");

  const inicio = await fila.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), inicio + 700);

  const pegada = await fila.boundingBox();
  expect(pegada).not.toBeNull();
  expect(pegada!.y).toBeGreaterThanOrEqual(56);
  expect(pegada!.y).toBeLessThan(80);

  await cuerpo.evaluate((el) => {
    el.scrollLeft = 208;
  });
  await expect.poll(() => fila.evaluate((el) => el.scrollLeft)).toBe(208);

  const encabezados = await fila.locator("th").evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
  const celdas = await cuerpo
    .locator("tbody tr")
    .first()
    .locator("th, td")
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
  expect(celdas).toEqual(encabezados);
});

test("cambiar de tema muestra otros subtemas", async ({ page }) => {
  await page.getByRole("tab", { name: "Sanidad" }).click();
  await expect(page.getByRole("tab", { name: "Sanidad" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Atención primaria").first()).toBeVisible();
});
