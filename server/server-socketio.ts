// server.ts
import http from "http";
import next from "next";
import express, { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { verifyInternalToken } from "./auth-internals";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

const dev: boolean = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

/**
 * Express middleware to require a valid internal JWT
 * sent as: Authorization: Bearer <token>
 */
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

/**
 * Express main server function
 */
async function main(): Promise<void> {
  await nextApp.prepare();
  const expressApp = express();
  const server = http.createServer(expressApp);
  expressApp.use(express.json());

  // PUBLIC REST ENDPOINT (no auth)
  expressApp.get("/api/leaderboard", (_req: Request, res: Response) => {
    res.json([
      { name: "Player1", score: 123 },
      { name: "Player2", score: 98 },
      { name: "Player3", score: 76 },
    ]);
  });

  // SECURE REST ENDPOINT (requires internal JWT)
  expressApp.get("/api/admin/leaderboard", requireInternalAuth, (req: Request, res: Response) => {
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

  // WEBSOCKET Multiplayer Setup (Socket.IO) with internal token auth
  const io = new SocketIOServer(server, {
    cors: {
      origin: (process.env.SOCKET_ORIGIN ?? "http://localhost:8080").split(","),
      methods: ["GET", "POST"],
    },
  });

  // Auth middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error("Unauthorized: missing token"));
      }

      const user = await verifyInternalToken(token);
      // attach user info to socket.data
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as
      | {
          sub: string;
          role: string;
          email?: string;
          name?: string;
        }
      | undefined;

    console.log("client connected", socket.id, "user:", user);

    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId);
      socket.to(roomId).emit(
        "systemMessage",
        `${socket.id} (${user?.sub ?? "anonymous"}) joined room ${roomId}`
      );
    });

    socket.on("disconnect", () => {
      console.log("client disconnected", socket.id);
    });
  });

  // Let Next.js handle all other routes (pages, app router, /api/auth/*, etc.)
  expressApp.use((req: express.Request, res: express.Response) => {
    return handle(req, res);
  });

  const port: number = Number(process.env.PORT ?? 8080);
  server.listen(port, () => {
    console.log(`> Sockets ready on http://localhost:${port}`);
  });
}

/**
 * Start express application server
 */
main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
