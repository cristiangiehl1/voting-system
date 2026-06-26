import { NextRequest, NextResponse } from "next/server"
import { encode } from "next-auth/jwt"
import jwt from "jsonwebtoken"
import { findUserByEmail, updateUserVerification } from "@/lib/repositories/user.repository"

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url))
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
    const user = await findUserByEmail(payload.email)
    if (!user || user.verificationToken !== token) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url))
    }

    await updateUserVerification(user.id, null)

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
  } catch {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url))
  }
}
