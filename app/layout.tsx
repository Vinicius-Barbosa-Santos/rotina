import type { Metadata } from "next";
import type React from "react";
import { PwaSetup } from "./components/PwaSetup";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Minha rotina",
  description: "Rotina diária com agenda integrada.",
  applicationName: "Minha Rotina",
  appleWebApp: {
    capable: true,
    title: "Minha Rotina",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: "/minha-rotina-logo-192.png",
    apple: "/minha-rotina-logo-192.png"
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Minha rotina",
    description: "Rotina diária com agenda integrada.",
    images: ["/minha-rotina-logo.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaSetup />
        {children}
      </body>
    </html>
  );
}
