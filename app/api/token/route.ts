// app/api/token/route.ts
import { auth } from "@/server/auth-express";
import { signInternalToken } from "@/server/auth-internals";

/**
 * GET /api/token
 * Requires a valid NextAuth session.
 * Returns an internal JWT to use with Express / Colyseus, etc.
 */
export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = session.user as any;

  if (!user.id) {
    return new Response("User id missing on session", { status: 500 });
  }

  const token = await signInternalToken({
    sub: String(user.id),
    role: user.role ?? "user",
    email: user.email ?? undefined,
    name: user.name ?? undefined,
  });

  return Response.json({ token });
}
