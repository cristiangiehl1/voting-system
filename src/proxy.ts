import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function proxy(req) {
    const pathname = req.nextUrl.pathname
    const isLoginRoute = pathname.startsWith("/login") || pathname.startsWith("/register")
    const isLoggedIn = !!req.nextauth.token

    if (isLoginRoute && isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const pathname = req.nextUrl.pathname
        const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register")
        const isPublicRoute = pathname === "/" || pathname.startsWith("/share") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password")

        if (isAuthRoute || isPublicRoute) {
          return true
        }

        return token !== null
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
