import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Minha Rotina",
    short_name: "Rotina",
    description: "Rotina diária com agenda, progresso, streak, IA e relatórios.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e0e0f",
    theme_color: "#0e0e0f",
    categories: ["productivity", "lifestyle"],
    icons: [
      {
        src: "/minha-rotina-logo-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/minha-rotina-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: "/minha-rotina-preview.jpg",
        sizes: "850x874",
        type: "image/jpeg",
        form_factor: "narrow"
      }
    ]
  };
}
