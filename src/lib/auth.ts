import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/db/prisma"
import * as bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Existing Credentials Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const sanitizedEmail = (credentials.email as string).toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: sanitizedEmail }
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth sign-in: auto-create or link user
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;

        try {
          const existingUser = await prisma.user.findUnique({
            where: { email }
          });

          if (existingUser) {
            // Auto-link: update provider info and image if not set
            if (!existingUser.provider || existingUser.provider === "credentials") {
              await prisma.user.update({
                where: { email },
                data: {
                  provider: "google",
                  image: user.image || existingUser.image,
                }
              });
            }
          } else {
            // Create new user from Google profile
            await prisma.user.create({
              data: {
                name: user.name || "User",
                email,
                provider: "google",
                image: user.image || null,
                role: "USER",
              }
            });
          }
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        }
      }
      // Dispatch welcome WhatsApp notification upon sign-in if phone exists and not yet greeted
      if (user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase().trim() },
            select: { phone: true, name: true, whatsappOptIn: true },
          });
          if (dbUser?.phone && dbUser.whatsappOptIn) {
            const welcomeCount = await prisma.whatsAppLog.count({
              where: { phone: dbUser.phone, type: "WELCOME" },
            });
            if (welcomeCount === 0) {
              const { sendWhatsAppMessage } = await import("@/lib/whatsapp");
              await sendWhatsAppMessage({
                to: dbUser.phone,
                type: "WELCOME",
                message: `🎉 *WELCOME TO SPICY NUTS* 🎉

Namaste ${dbUser.name}! You have successfully signed in.

🎁 *Here is your Welcome Gift:*
Use coupon code *ROYAL10* at checkout for *10% OFF* on your next purchase!

🛍️ Explore our harvests: https://spicynuts.in/shop`,
              });
            }
          }
        } catch (e) {
          console.warn("Sign-in WhatsApp trigger notice:", e);
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      // For Google sign-in, fetch the user's role and id from DB
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
})
