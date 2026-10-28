import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.credits = user.credits ?? 50;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id || token.sub;
        session.user.credits = token.credits ?? 50;

        // Fetch live up-to-date credits from database
        try {
          if (session.user.id) {
            const dbUser = await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { credits: true },
            });
            if (dbUser) {
              session.user.credits = dbUser.credits;
            }
          }
        } catch (err) {
          console.warn("[AUTH] Failed to refresh live credits:", err.message);
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
