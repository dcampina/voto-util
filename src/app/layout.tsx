import "./globals.css";

// El layout raíz real es app/[locale]/layout.tsx; este solo deja pasar a sus hijos
// para que app/page.tsx (redirección por idioma) y app/not-found.tsx tengan su propio <html>.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
