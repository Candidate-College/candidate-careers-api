import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { UserData } from "@/models/user-model";

/**
 * Interface for accessing authenticated user request
 */
export interface IssuedUserSession {
  id: string;
  exp: number;
  iat: number;
  expired?: boolean; // Allow expired flag for session expiry handling
}

/**
 * Extended user context for authenticated requests
 */
export interface AuthenticatedUser extends Partial<UserData> {
  session?: IssuedUserSession;
  sessionId?: string; // Allow sessionId for refresh token handling
  exp?: number;
  iat?: number;
}

export type AuthenticatedRequest = ExpressRequest & {
  user?: AuthenticatedUser;
};

/**
 * Interface for custom express response invocation
 */
export type JsonResponse = ExpressResponse & {
  success: (message: string, data?: any) => ExpressResponse;

  error: (
    statusCode?: number,
    message?: string,
    errors?: Record<string, string[]> | any[]
  ) => ExpressResponse;

  setCookie: (key: string, value: string) => ExpressResponse;
};
