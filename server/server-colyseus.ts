// colyseus.ts
import http from "http";
import next from "next";
import express, { Request, Response, NextFunction } from "express";
import { Server as ColyseusServer } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { verifyInternalToken } from "./auth-internals";

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

  /**
   * COLYSEUS MONITOR (ADMIN ONLY)
   *
   * The monitor UI will be served at:
   *   http://localhost:PORT/colyseus/monitor
   *
   * We protect it with:
   *   - requireInternalAuth  -> verifies internal JWT
   *   - adminRoleOnly        -> ensures user.role === "admin"
   */
  const adminRoleOnly = (req: Request, res: Response, next: NextFunction) => {
    const user = req.authUser;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: admin only" });
    }
    next();
  };

  expressApp.use(
    "/colyseus/monitor",
    requireInternalAuth,
    adminRoleOnly,
    monitor()
  );

  /**
   * Create a single HTTP server shared between:
   *   - Express (REST + monitor + Next handler)
   *   - Colyseus (WebSocket game server)
   */
  const server = http.createServer(expressApp);

  /**
   * Initialize Colyseus server using the shared HTTP server.
   * You can define your rooms on this instance.
   */
  const gameServer = new ColyseusServer({
    server, // reuse the same HTTP server as Express + Next
  });

  // EXAMPLE: define your rooms here (implement MyRoom in another file)
  // import { MyRoom } from "./rooms/MyRoom";
  // gameServer.define("my_room", MyRoom);

  // Let Next.js handle all other routes (pages, app router, /api/auth/*, etc.)
  expressApp.use((req: express.Request, res: express.Response) => {
    return handle(req, res);
  });

  const port: number = Number(process.env.PORT ?? 8080);

  // Let Colyseus start listening; it will use the shared `server` internally
  gameServer.listen(port);
  console.log(`> Colyseus ready on http://localhost:${port}`);
}

/**
 * Start express + Colyseus + Next application server
 */
main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
