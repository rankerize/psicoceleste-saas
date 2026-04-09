import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PsicoCeleste — Batería de Riesgo Psicosocial Colombia",
  description: "Software SaaS profesional para la aplicación, tabulación y análisis de la Batería de Riesgo Psicosocial según la Resolución 2404 de 2019 del Ministerio de Trabajo de Colombia.",
  keywords: ["batería riesgo psicosocial", "SST Colombia", "riesgo psicosocial", "psicología laboral", "Resolución 2404"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
