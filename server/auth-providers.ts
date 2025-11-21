// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    // GitHub OAuth – optional, keep if you want it
    GitHub,

    // Google OAuth
    Google,

    // Facebook OAuth
    Facebook,
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // When the user logs in for the first time, we can capture info
      if (user) {
        // Use provider account id as base user id if needed
        const providerAccountId = (account as any)?.providerAccountId;

        token.userId =
          (user as any).id ??
          providerAccountId ??
          token.sub; // fallback to default sub

        (token as any).role = (user as any).role ?? "user";

        // optional: keep track of provider
        (token as any).provider = account?.provider;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.userId as string;
        (session.user as any).role = (token as any).role as string;
        (session.user as any).provider = (token as any).provider;
      }
      return session;
    },
  },
});
