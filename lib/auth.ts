import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

async function persistAccessToken(
  userId: string | undefined,
  accessToken: string | null | undefined,
): Promise<void> {
  if (!userId || !accessToken) return;
  try {
    await prisma.user.updateMany({
      where: { id: userId },
      data: { accessToken },
    });
  } catch (error) {
    console.error('Failed to persist GitHub access token:', error);
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        if (user?.id) {
          token.userId = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  // Persist the token in events, not the signIn callback: events fire after the
  // adapter creates the User row; in signIn it doesn't exist yet (P2025 on first sign-in).
  events: {
    async linkAccount({ user, account }) {
      await persistAccessToken(user.id, account.access_token);
    },
    async signIn({ user, account }) {
      await persistAccessToken(user.id, account?.access_token);
    },
  },
  pages: {
    signIn: '/',
  },
});
