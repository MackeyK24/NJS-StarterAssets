// types/express.d.ts
import type { InternalJwtPayload } from "./auth-internals";

declare global {
  namespace Express {
    interface Request {
      authUser?: InternalJwtPayload;
    }
  }
}

export {};
