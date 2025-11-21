// auth-internal-jwt.ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.INTERNAL_JWT_SECRET!);
const alg = "HS256";

export type InternalJwtPayload = {
  sub: string;   // user id
  role: string;  // e.g. "user" | "admin"
  email?: string;
  name?: string;
};

/**
 * Issue a short-lived internal token for your own services.
 * Default: 15 minutes.
 */
export async function signInternalToken(
  payload: InternalJwtPayload,
  expiresInSeconds = 15 * 60
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;

  return new SignJWT(payload)
    .setProtectedHeader({ alg, typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setSubject(payload.sub)
    .sign(secret);
}

/**
 * Verify an internal token created by `signInternalToken`.
 */
export async function verifyInternalToken(token: string): Promise<InternalJwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as InternalJwtPayload;
}
