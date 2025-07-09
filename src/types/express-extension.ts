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
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  error?: {
    type?: string;
    code?: string;
    details?: ValidationError[] | Record<string, string[]>;
  };
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Interface for custom express response invocation
 */
export type JsonResponse = ExpressResponse & {
  success: <T = any>(message: string, data?: T) => ExpressResponse;

  error: (
    statusCode?: number,
    message?: string,
    errors?: ValidationError[] | Record<string, string[]>
  ) => ExpressResponse;

  setCookie: (key: string, value: string) => ExpressResponse;
};
