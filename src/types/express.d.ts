import type { AuthPrincipal } from "../modules/auth/types";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      principal: AuthPrincipal | null;
    }
  }
}

export {};
