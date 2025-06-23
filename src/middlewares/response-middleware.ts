import { Request, NextFunction } from 'express';
import { JsonResponse } from '@/types/express-extension';

const cookieConfig = require('@/config/cookie');

/**
 * Attach custom response properties to the `res` object.
 */
module.exports = (
  req: Request,
  res: JsonResponse,
  next: NextFunction,
) => {
  /**
   * Success response property
   * 
   * @param message 
   * @param data 
   * @returns 
   */
  res.success = (
    message: string,
    data?: any,
  ): JsonResponse => {
    const payload: any = { statusCode: 200, message };

    if (data) {
      payload.data = data;
    }

    return res.status(200).json(payload);
  };

  /**
   * Error response property
   * 
   * @param statusCode 
   * @param message 
   * @param errors 
   * @returns 
   */
  res.error = (
    statusCode: number = 500,
    message: string = 'Internal server error',
    errors?: Record<string, string[]> | any[],
  ): JsonResponse => {
    const payload: any = { statusCode, message };

    if (errors && Object.keys(errors).length > 0) {
      payload.errors = errors;
    }

    return res.status(statusCode).json(payload);
  };

  /**
   * Cookie header property
   * 
   * @param key 
   * @param value 
   * @returns 
   */
  res.setCookie = (
    key: string,
    value: string,
  ): JsonResponse => {
    return res.cookie(key, value, cookieConfig);
  };

  next();
};
