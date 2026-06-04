import type { Metadata } from "next";
import type React from "react";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Minha rotina",
  description: "Rotina diária com agenda integrada.",
  icons: {
    icon: "/minha-rotina-logo.png",
    apple: "/minha-rotina-logo.png"
  },
  openGraph: {
    title: "Minha rotina",
    description: "Rotina diária com agenda integrada.",
    images: ["/minha-rotina-logo.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
