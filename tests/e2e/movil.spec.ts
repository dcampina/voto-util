import { expect, test } from "@playwright/test";

test.describe("@mobile", () => {
  test("el menú lateral da acceso a todas las secciones", async ({ page, isMobile }) => {
    test.skip(!isMobile);
    await page.goto("/es");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const menu = page.getByRole("dialog");
    await menu.getByRole("link", { name: "Simulador" }).click();
    await expect(page).toHaveURL(/\/es\/simulador$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simulador de escaños");
  });

  test("el comparador usa tarjetas en lugar de la tabla", async ({ page, isMobile }) => {
    test.skip(!isMobile);
    await page.goto("/es/programas");
    await expect(page.getByRole("region", { name: "Comparador de programas" })).toBeHidden();
    await expect(page.getByRole("heading", { level: 3, name: "Regulación del alquiler" })).toBeVisible();
  });

  test("la página no tiene desplazamiento horizontal", async ({ page, isMobile }) => {
    test.skip(!isMobile);
    for (const ruta of ["/es", "/es/simulador", "/es/programas", "/es/metodologia"]) {
      await page.goto(ruta);
      const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(desborde, ruta).toBeLessThanOrEqual(0);
    }
  });
});
