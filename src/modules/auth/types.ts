import type { Request } from "express";

export interface AuthPrincipal {
  subject: string;
  scopes: string[];
  provider: string;
}

export interface AuthStrategy {
  name: string;
  authenticate(req: Request): Promise<AuthPrincipal | null>;
}
