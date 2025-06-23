import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { UserData } from '@/models/user-model';

/**
 * Interface for accessing authenticated user request
 */
export interface IssuedUserSession {
  id: string;
  exp: number;
  iat: number;
}

export type AuthenticatedRequest = ExpressRequest & {
  user?: Partial<UserData> & { session: IssuedUserSession };
};

/**
 * Interface for custom express response invocation
 */
export type JsonResponse = ExpressResponse & {
  success: (
    message: string,
    data?: any,
  ) => ExpressResponse;

  error: (
    statusCode?: number,
    message?: string,
    errors?: Record<string, string[]> | any[],
  ) => ExpressResponse;

  setCookie: (
    key: string,
    value: string,
  ) => ExpressResponse;
};
