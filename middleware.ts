import NextAuth from "next-auth"
import authConfig from "@/lib/auth.config"

// Edge-safe config only: lib/auth.ts pulls in the Prisma adapter, which
// can't run in the Edge middleware runtime and was the likely cause of
// intermittent JWT decrypt failures scoped to this route.
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: ["/dashboard/:path*", "/problems/:path*", "/revision/:path*", "/settings/:path*"],
}

