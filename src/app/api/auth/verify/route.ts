import { NextRequest, NextResponse } from "next/server"
import { encode } from "next-auth/jwt"
import { verifyEmailToken } from "@/app/actions/auth"
import { findUserById } from "@/lib/repositories/user.repository"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url))
  }

  const result = await verifyEmailToken(token)

  if (result.error || !result.success) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url))
  }

  const user = await findUserById(result.userId)
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=user_not_found", request.url))
  }

  const sessionToken = await encode({
    token: {
      id: user.id,
      email: user.email || "",
      name: user.name || "",
      picture: user.imageUrl || "",
      image: user.imageUrl || undefined,
    },
    secret: process.env.AUTH_SECRET!,
  })

  const isSecure = process.env.NODE_ENV === "production"
  const cookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token"

  const response = NextResponse.redirect(new URL("/profile", request.url))

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })

  return response
}
