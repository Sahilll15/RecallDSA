export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/problems/:path*", "/revision/:path*", "/settings/:path*"],
}

