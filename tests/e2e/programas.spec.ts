import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/es/programas");
});

test("señala las fuentes de terceros", async ({ page }) => {
  await expect(page.getByText("Datos de ejemplo")).toHaveCount(0);
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

test("el índice de concreción no depende solo del color", async ({ page }) => {
  await expect(page.getByRole("group", { name: /Índice de concreción: \d de 5/ }).first()).toBeVisible();
  await expect(page.getByLabel(/: (sí|no)$/).first()).toBeAttached();
});

test("cambiar de tema muestra otros subtemas", async ({ page }) => {
  await page.getByRole("tab", { name: "Sanidad" }).click();
  await expect(page.getByRole("tab", { name: "Sanidad" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Atención primaria").first()).toBeVisible();
});
