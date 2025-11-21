import http from "http";
import next from "next";
import express, { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";

const dev: boolean = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

async function main(): Promise<void> {
  await nextApp.prepare();
  const expressApp = express();
  const server = http.createServer(expressApp);

  // Enable Express API Routing
  expressApp.use(express.json());

  // Example REST Leaderboard Endpoint
  expressApp.get("/api/leaderboard", (_req: Request, res: Response) => {
    res.json([
      { name: "Player1", score: 123 },
      { name: "Player2", score: 98 },
      { name: "Player3", score: 76 }
    ]);
  });

  // Example WebSocket Multiplayer Setup
  const io = new SocketIOServer(server, {
    cors: {
      origin: (process.env.SOCKET_ORIGIN ?? "http://localhost:8080").split(","),
      methods: ["GET", "POST"]
    }
  });
  io.on("connection", (socket) => {
    console.log("client connected", socket.id);
    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId);
      socket.to(roomId).emit("systemMessage", `${socket.id} joined room ${roomId}`);
    });
    socket.on("disconnect", () => {
      console.log("client disconnected", socket.id);
    });
  });

  // Use Next.js to handle all other requests
  expressApp.use((req: express.Request, res: express.Response) => handle(req, res));
  const port: number = Number(process.env.PORT ?? 8080);
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
