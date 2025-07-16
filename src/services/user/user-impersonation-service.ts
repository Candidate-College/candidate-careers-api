/**
 * UserImpersonationService
 *
 * Provides user impersonation capabilities for super administrators.
 * Allows temporary access to other user accounts for debugging and support.
 *
 * @module src/services/user/user-impersonation-service
 */

import { UserRepository } from '@/repositories/user-repository';
import { ActivityLogService } from '@/services/audit/activity-log-service';
const jwt = require('jsonwebtoken');
import { v4 as uuidv4 } from 'uuid';

export interface ImpersonationToken {
  token: string;
  expiresAt: Date;
  adminId: number;
  targetUserId: number;
  targetUserUuid: string;
  reason?: string;
}

export interface ImpersonationSession {
  sessionId: string;
  adminId: number;
  targetUserId: number;
  targetUserUuid: string;
  startedAt: Date;
  expiresAt: Date;
  reason?: string;
  isActive: boolean;
}

export class UserImpersonationService {
  private static readonly IMPERSONATION_SECRET =
    process.env.IMPERSONATION_JWT_SECRET || 'impersonation-secret';
  private static readonly DEFAULT_DURATION_MINUTES = 60;
  private static readonly MAX_DURATION_MINUTES = 480; // 8 hours

  /**
   * Create impersonation token for a user
   */
  static async createImpersonationToken(
    adminId: number,
    targetUserUuid: string,
    options: {
      duration_minutes?: number;
      reason?: string;
      notify_user?: boolean;
    } = {},
  ): Promise<ImpersonationToken> {
    // Validate admin permissions
    const admin = await UserRepository.findDetailedByUuid(adminId.toString());
    if (!admin || (admin.role as any)?.name !== 'super_admin') {
      throw new Error('Only super administrators can impersonate users');
    }

    // Get target user
    const targetUser = await UserRepository.findDetailedByUuid(targetUserUuid);
    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Prevent impersonating other super admins
    if ((targetUser.role as any)?.name === 'super_admin') {
      throw new Error('Cannot impersonate other super administrators');
    }

    // Prevent self-impersonation
    if (adminId === targetUser.id) {
      throw new Error('Cannot impersonate yourself');
    }

    // Validate duration
    const durationMinutes = Math.min(
      options.duration_minutes || this.DEFAULT_DURATION_MINUTES,
      this.MAX_DURATION_MINUTES,
    );

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Create impersonation token
    const tokenPayload = {
      type: 'impersonation',
      adminId,
      targetUserId: targetUser.id,
      targetUserUuid,
      sessionId: uuidv4(),
      reason: options.reason,
      exp: Math.floor(expiresAt.getTime() / 1000),
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(tokenPayload, this.IMPERSONATION_SECRET);

    // Log impersonation activity
    await ActivityLogService.logUserAction(
      { id: adminId } as any,
      'user_impersonation_started',
      'user',
      `Started impersonating user ${targetUser.name} (${targetUser.email})`,
      {
        resourceId: targetUser.id,
        resourceUuid: targetUserUuid,
        metadata: {
          reason: options.reason,
          duration_minutes: durationMinutes,
          expires_at: expiresAt.toISOString(),
        },
      },
    );

    // Send notification to target user if requested
    if (options.notify_user) {
      await this.sendImpersonationNotification(targetUser, admin, options.reason);
    }

    return {
      token,
      expiresAt,
      adminId,
      targetUserId: targetUser.id,
      targetUserUuid,
      reason: options.reason,
    };
  }

  /**
   * Validate impersonation token and return session info
   */
  static async validateImpersonationToken(token: string): Promise<ImpersonationSession> {
    try {
      const decoded = jwt.verify(token, this.IMPERSONATION_SECRET) as any;

      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        throw new Error('Impersonation token has expired');
      }

      // Verify admin still exists and has super admin role
      const admin = await UserRepository.findDetailedByUuid(decoded.adminId.toString());
      if (!admin || (admin.role as any)?.name !== 'super_admin') {
        throw new Error('Admin user no longer has super admin privileges');
      }

      // Verify target user still exists
      const targetUser = await UserRepository.findDetailedByUuid(decoded.targetUserUuid);
      if (!targetUser) {
        throw new Error('Target user no longer exists');
      }

      return {
        sessionId: decoded.sessionId,
        adminId: decoded.adminId,
        targetUserId: decoded.targetUserId,
        targetUserUuid: decoded.targetUserUuid,
        startedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000),
        reason: decoded.reason,
        isActive: true,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid impersonation token');
      }
      throw error;
    }
  }

  /**
   * End impersonation session
   */
  static async endImpersonation(
    sessionId: string,
    adminId: number,
    reason?: string,
  ): Promise<void> {
    // Log impersonation end
    await ActivityLogService.logUserAction(
      { id: adminId } as any,
      'user_impersonation_ended',
      'user',
      'Ended user impersonation session',
      {
        metadata: {
          session_id: sessionId,
          reason,
          ended_at: new Date().toISOString(),
        },
      },
    );
  }

  /**
   * Get active impersonation sessions for an admin
   */
  static async getActiveImpersonationSessions(adminId: number): Promise<ImpersonationSession[]> {
    // This would typically query a database table for active sessions
    // For now, we'll return an empty array as sessions are stateless
    return [];
  }

  /**
   * Get impersonation history for a user
   */
  static async getImpersonationHistory(userUuid: string): Promise<any> {
    // This would query activity logs for impersonation events
    const { ActivityRetrievalService } = await import(
      '@/services/audit/activity-retrieval-service'
    );

    return ActivityRetrievalService.getActivityLogs({
      resourceUuid: userUuid,
      action: 'user_impersonation_started',
      page: 1,
      limit: 50,
    });
  }

  /**
   * Check if user is currently being impersonated
   */
  static async isUserBeingImpersonated(userUuid: string): Promise<boolean> {
    // This would check for active impersonation sessions
    // For now, return false as sessions are stateless
    return false;
  }

  /**
   * Send notification to user about impersonation
   */
  private static async sendImpersonationNotification(
    targetUser: any,
    admin: any,
    reason?: string,
  ): Promise<void> {
    try {
      const { emailService } = await import('@/services/email/email-service');

      const html = `
        <p>Hello ${targetUser.name},</p>
        <p>Your account is being accessed by a system administrator (${
          admin.name
        }) for support purposes.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ''}
        <p>If you believe this is unauthorized, please contact support immediately.</p>
      `;

      await emailService.sendAccountStatusNotification(
        targetUser.email,
        targetUser.name,
        'accessed',
      );
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to send impersonation notification:', error);
    }
  }

  /**
   * Generate impersonation access token for API access
   */
  static generateImpersonationAccessToken(targetUser: any): string {
    const jwt = require('@/utilities/jwt');

    // Create a temporary access token for the target user
    const userData = {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      impersonated: true,
    };

    return jwt.access.sign(userData);
  }

  /**
   * Validate impersonation access token
   */
  static validateImpersonationAccessToken(token: string): any {
    try {
      const jwt = require('@/utilities/jwt');
      const decoded = jwt.access.verify(token);

      if (!decoded.impersonated) {
        throw new Error('Token is not an impersonation token');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid impersonation access token');
    }
  }
}
