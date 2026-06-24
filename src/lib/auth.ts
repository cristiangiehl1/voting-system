import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getServerSession } from "next-auth/next"
import { compare } from "bcryptjs"
import { findUserByEmail } from "@/lib/repositories/user.repository"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const user = await findUserByEmail(email)
        if (!user || !user.passwordHash) return null

        if (!user.emailVerified) return null

        const valid = await compare(password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.imageUrl }
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.image = user.image
      } else if (token.id) {
        const dbUser = await findUserByEmail(token.email ?? "")
        if (dbUser) {
          token.image = dbUser.imageUrl
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.image = token.image as string | undefined
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

export async function auth() {
  return getServerSession(authOptions)
}
