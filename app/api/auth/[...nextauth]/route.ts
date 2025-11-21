// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/server/auth-providers";

/**
 * NextAuth route handler
 * Provides /api/auth/* (sign-in, callback, session, etc.)
 */
export const { GET, POST } = handlers;
