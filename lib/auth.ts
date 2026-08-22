import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import authConfig from './auth.config';

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
  ...authConfig,
  adapter: PrismaAdapter(prisma),
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
});
