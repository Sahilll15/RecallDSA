import type { Metadata } from "next"
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

// Font variables must live on <html>: Tailwind's preflight sets font-family there,
// and an undefined var() invalidates the whole declaration (serif fallback bug).
const sans = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "RecallDSA - Reconstruct, don't just remember",
  description: "Syncs solved DSA problems from GitHub and trains you to reconstruct them: pattern recognition, active recall sessions, and true spaced repetition",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
