import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/es/programas");
});

test("avisa de que los datos son de ejemplo", async ({ page }) => {
  await expect(page.getByText("Datos de ejemplo").first()).toBeVisible();
  await expect(page.getByText("Pendiente de fuente").first()).toBeVisible();
});

test("abrir una cita muestra que la fuente está pendiente y se cierra con Escape", async ({ page }) => {
  const boton = page.getByRole("button", { name: "Ver cita y fuente" }).first();
  await boton.click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await expect(dialogo).toContainText("Todavía no se ha transcrito la cita literal");

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
  await expect(page.getByText("Sin datos todavía").first()).toBeVisible();
});
