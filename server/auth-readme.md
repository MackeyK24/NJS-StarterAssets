# Auth Architecture (NextAuth.js + Express + Multiplayer)

This document describes how authentication and authorization are implemented in this project using **NextAuth.js v5 (Auth.js)**, **Next.js 16 (App Router)**, a **custom Express server**, and optional multiplayer backends (**Socket.IO** or **Colyseus**).

The core idea:

- **NextAuth** is the single source of truth for user identity.
- The Next app issues a short-lived **internal JWT** at `/api/token`.
- All non-Next services (Express APIs, Socket.IO, Colyseus, etc.) trust this internal token.

---

## 1. Overview

### Login flow

1. User opens the app at `http://localhost:8080`.
2. User signs in using one of the configured OAuth providers:
   - Google
   - Facebook
   - GitHub
3. NextAuth creates a session (JWT-based) and stores it in cookies.
4. The frontend calls **`GET /api/token`**:
   - This reads the NextAuth session via `auth()` from `server/auth-providers`.
   - It issues a short-lived **internal JWT** via `signInternalToken()` from `server/auth-internals.ts`.
   - The route returns `{ token: "<internal-jwt>" }`.
5. The frontend passes this internal token to:
   - Express REST APIs (via `Authorization: Bearer <token>`)
   - Socket.IO client (as `auth.token`)
   - Colyseus client (in room join options)
6. Backend services verify the token and enforce authorization (e.g. admin-only routes).

---

## 2. Key Files

### 2.1 `server/auth-providers` (NextAuth configuration)

This file configures NextAuth / Auth.js:

- Uses **JWT sessions** (`session.strategy = "jwt"`).
- Registers providers:
  - Google (`Google` provider)
  - Facebook (`Facebook` provider)
  - GitHub (`GitHub` provider)
- Adds custom fields to the token and session via callbacks:
  - `token.userId`
  - `token.role`
  - `token.provider`

Exports:

- `handlers` – used by the App Router auth route.
- `auth` – server-side helper to read session in API routes / server components.
- `signIn`, `signOut` – helpers for server actions (if needed).

Auth route wiring:

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/server/auth";

export const { GET, POST } = handlers;
```

This exposes the standard NextAuth endpoints under `/api/auth/*`:

- `/api/auth/signin`
- `/api/auth/signout`
- `/api/auth/callback/:provider`
- `/api/auth/session`
- etc.

---

### 2.2 `server/auth-internals.ts` (internal token helpers)

Defines a **separate internal JWT** for non-Next services:

- `signInternalToken(payload, expiresInSeconds?)`
  - Signs `{ sub, role, email, name }` with `INTERNAL_JWT_SECRET`.
  - Default expiration: 15 minutes.
- `verifyInternalToken(token)`
  - Verifies the token and returns the payload.

This keeps the internal token format independent from NextAuth’s own session token while still being derived from the authenticated user.

---

### 2.3 `app/api/token/route.ts` (get internal token)

Route: **`GET /api/token`**

Implementation:

1. Calls `auth()` from `@/server/auth` to get the current session.
2. If no session → returns `401 Unauthorized`.
3. If session exists → constructs an internal payload:
   - `sub`: `user.id`
   - `role`: `user.role ?? "user"`
   - `email`: `user.email`
   - `name`: `user.name`
4. Calls `signInternalToken(payload)`.
5. Returns `Response.json({ token })`.

Frontend usage example:

```ts
const tokenRes = await fetch("/api/token", {
  method: "GET",
  credentials: "include",
});

if (!tokenRes.ok) throw new Error("Not authenticated");

const { token } = await tokenRes.json();
```

---

## 3. Express Integration

### 3.1 Type augmentation

File: `server/auth-express.d.ts`

Adds a typed `authUser` field to `Express.Request`:

```ts
import type { InternalJwtPayload } from "./auth-internals";

declare global {
  namespace Express {
    interface Request {
      authUser?: InternalJwtPayload;
    }
  }
}

export {};
```

### 3.2 Auth middleware

Both `server/server.ts` (Socket.IO) and `server/colyseus.ts` (Colyseus) define:

```ts
function requireInternalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice("Bearer ".length).trim();

  verifyInternalToken(token)
    .then((payload) => {
      req.authUser = payload;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: "Invalid or expired token" });
    });
}
```

Usage for a protected admin REST endpoint:

```ts
expressApp.get("/api/admin/leaderboard", requireInternalAuth, (req, res) => {
  const user = req.authUser;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin only" });
  }

  res.json({
    message: "Super secret admin leaderboard data",
    requestedBy: {
      id: user.sub,
      role: user.role,
      email: user.email,
    },
  });
});
```

---

## 4. Multiplayer Integration

### 4.1 Socket.IO (`server/server-socketio.ts`)

- Attach internal token on the client:

  ```ts
  const { token } = await (await fetch("/api/token", { credentials: "include" })).json();

  const socket = io("http://localhost:8080", {
    auth: { token },
  });
  ```

- Server-side auth in `server/server-socketio.ts`:

  ```ts
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error("Unauthorized: missing token"));
      }

      const user = await verifyInternalToken(token);
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Unauthorized: invalid token"));
    }
  });
  ```

Once connected, each socket has a `socket.data.user` derived from the internal JWT.

---

### 4.2 Colyseus (`server/server-colyseus.ts`)

- Colyseus uses the same HTTP server as Express + Next.
- Rooms can verify the internal token in their `onAuth` method (implementation is up to the room class).
- The **Colyseus monitor UI** is mounted at `/colyseus/monitor` and protected by:

  ```ts
  expressApp.use(
    "/colyseus/monitor",
    requireInternalAuth,
    adminRoleOnly,
    monitor()
  );
  ```

  where `adminRoleOnly` ensures `req.authUser?.role === "admin"`.

Only users with an internal token that has `role: "admin"` can open the monitor.

---

## 5. OAuth Providers & Environment Variables

The project supports multiple OAuth providers via Auth.js / NextAuth v5:

- Google
- Facebook
- GitHub

Environment variables (in `.env.local`):

```env
# Auth.js / NextAuth core
AUTH_SECRET=your-long-random-secret
AUTH_URL=http://localhost:8080

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Facebook OAuth
AUTH_FACEBOOK_ID=your-facebook-app-id
AUTH_FACEBOOK_SECRET=your-facebook-app-secret

# GitHub OAuth (optional)
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Internal JWT for Express / multiplayer
INTERNAL_JWT_SECRET=another-long-random-secret
```

OAuth callback URLs (for local dev at `http://localhost:8080`):

- Google: `http://localhost:8080/api/auth/callback/google`
- Facebook: `http://localhost:8080/api/auth/callback/facebook`
- GitHub: `http://localhost:8080/api/auth/callback/github`

---

## 6. Running the Servers

`package.json` exposes both multiplayer stacks:

```jsonc
"scripts": {
    "dev": "npm run kill-port && npm run dev:classic",
    "dev:classic": "PORT=8080 tsx server/server-classic.ts & sleep 3 && open http://localhost:8080",
    "dev:colyseus": "PORT=8080 tsx server/server-colyseus.ts & sleep 3 && open http://localhost:8080",    
    "dev:socketio": "PORT=8080 tsx server/server-socketio.ts & sleep 3 && open http://localhost:8080",

    "build": "next build",

    "start": "npm run kill-port && npm run start:classic",
    "start:classic": "NODE_ENV=production tsx server/server-classic.ts",
    "start:colyseus": "NODE_ENV=production tsx server/server-colyseus.ts",
    "start:socketio": "NODE_ENV=production tsx server/server-socketio.ts",
}
```

- Run Classic server in dev: `npm run dev:classic`
- Run Colyseus server in dev: `npm run dev:colyseus`
- Run Socket.IO server in dev: `npm run dev:socketio`
- Switch which stack is the default by changing the `dev` / `start` aliases.

---

## 7. Frontend Auth UI (Example)

A simple login component using NextAuth client hooks:

```tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (!session) {
    return (
      <div>
        <button onClick={() => signIn("google")}>Sign in with Google</button>
        <button onClick={() => signIn("facebook")}>Sign in with Facebook</button>
        <button onClick={() => signIn("github")}>Sign in with GitHub</button>
      </div>
    );
  }

  return (
    <div>
      <p>Signed in as {session.user?.email}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

Make sure the app is wrapped with `SessionProvider` at a high level (e.g. in `app/layout.tsx` via a `Providers` component).

---

## 8. Summary

- NextAuth handles **user login** and **sessions** with multiple OAuth providers.
- The internal route `/api/token` converts the NextAuth session into a short-lived **internal JWT**.
- Express, Socket.IO, Colyseus, and any other backend service:
  - Read this token from `Authorization: Bearer <token>` or connection params.
  - Use `verifyInternalToken()` to authenticate and authorize the user.
- Admin-only areas (like `/api/admin/leaderboard` or `/colyseus/monitor`) are gated by `user.role === "admin"` from the internal token payload.

This makes NextAuth the single source of identity while keeping backend services decoupled and easy to swap (Socket.IO vs Colyseus, etc.).
