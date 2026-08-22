import type { Metadata, Viewport } from "next"
import { Archivo, Instrument_Sans, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import "./globals.css"

// Font variables must live on <html>: Tailwind's preflight sets font-family there,
// and an undefined var() invalidates the whole declaration (serif fallback bug).
const display = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
})

const ui = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
})

const SITE_URL = "https://recall-dsa.vercel.app"
const TITLE = "RecallDSA - Reconstruct, don't just remember"
const DESCRIPTION = "Syncs solved DSA problems from GitHub and trains you to reconstruct them: pattern recognition, active recall sessions, and true spaced repetition"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "DSA revision",
    "spaced repetition",
    "leetcode practice",
    "coding interview prep",
    "algorithm patterns",
    "active recall",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RecallDSA",
  },
  verification: {
    google: "91MxErQehrOqzvYAE8G4JIW62gi7KdBFUn4oDyKVB18",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "RecallDSA",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0c10",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${ui.variable} ${mono.variable}`}>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
