/**
 * User Management Interfaces
 *
 * Provides TypeScript interfaces for user management operations to ensure
 * type safety and prevent the use of 'any' types.
 *
 * @module src/interfaces/user/user-management
 */

import { UserData } from '@/models/user-model';
import { RoleData } from '@/models/role-model';
import { AuthenticatedUser, JsonResponse } from '@/types/express-extension';

// Type aliases for status and action
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type BulkAction = 'activate' | 'deactivate' | 'delete' | 'change_role' | 'suspend';

/**
 * Extended user data with role information
 */
export interface UserWithRole extends Omit<UserData, 'role'> {
  role?: RoleData;
}

/**
 * User with detailed role information for management operations
 */
export interface DetailedUser extends Omit<UserData, 'role'> {
  role: {
    id: number;
    name: string;
    display_name: string;
    description?: string | null;
  };
}

/**
 * User update payload interface
 */
export interface UserUpdatePayload {
  name?: string;
  role_id?: number;
  status?: UserStatus;
  send_notification?: boolean;
  [key: string]: unknown; // Allow additional properties for Record<string, unknown>
}

/**
 * User creation payload interface
 */
export interface UserCreatePayload {
  email: string;
  name: string;
  role_id: number;
  status?: UserStatus;
}

/**
 * User deletion options interface
 */
export interface UserDeleteOptions {
  permanent?: boolean;
  reason?: string;
  confirmation: string;
}

/**
 * Bulk operation payload interface
 */
export interface BulkOperationPayload {
  action: BulkAction;
  user_uuids: string[];
  role_id?: number;
  send_notification?: boolean;
  reason?: string;
}

/**
 * Password reset options interface
 */
export interface PasswordResetOptions {
  generate_temporary?: boolean;
  send_email?: boolean;
  require_change?: boolean;
  new_password?: string;
}

/**
 * User search filters interface
 */
export interface UserSearchFilters {
  query?: string;
  role_id?: number;
  status?: 'active' | 'inactive' | 'suspended';
  created_from?: string;
  created_to?: string;
  limit?: number;
}

/**
 * User search result interface
 */
export interface UserSearchResult {
  users: UserWithRole[];
  total: number;
  suggestions: string[];
}

/**
 * User statistics interface
 */
export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  users_by_role: Record<string, number>;
  recent_registrations: number;
  users_this_month: number;
  users_this_week: number;
}

/**
 * Transaction context interface
 */
export interface TransactionContext {
  trx: any; // Objection.js transaction object
}

/**
 * User action context for audit logging
 */
export interface UserActionContext {
  user: AuthenticatedUser;
  action: string;
  resourceType: string;
  description: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * User management service result interface
 */
export interface UserManagementResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Bulk operation result interface
 */
export interface BulkOperationResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    uuid: string;
    error: string;
  }>;
}

/**
 * Password reset result interface
 */
export interface PasswordResetResult {
  success: boolean;
  temporary_password?: string;
  message: string;
}

/**
 * User impersonation options interface
 */
export interface ImpersonationOptions {
  duration_minutes?: number;
  reason?: string;
  notify_user?: boolean;
}

/**
 * User notification payload interface
 */
export interface UserNotificationPayload {
  user: UserWithRole;
  action: string;
  changes?: Record<string, unknown>;
  reason?: string;
}

/**
 * Extended request interface for user management
 */
export interface UserManagementRequest {
  user?: AuthenticatedUser;
  body: any;
  query: any;
  params: any;
}

/**
 * Extended response interface for user management
 */
export interface UserManagementResponse extends JsonResponse {
  success: <T = any>(message: string, data?: T) => JsonResponse;
  error: (statusCode?: number, message?: string, errors?: any) => JsonResponse;
}

/**
 * User repository transaction interface
 */
export type UserRepositoryTransaction = (callback: (trx: any) => Promise<any>) => Promise<any>;

/**
 * Activity log service interface
 */
export interface ActivityLogServiceInterface {
  logUserAction(
    user: AuthenticatedUser,
    action: string,
    resourceType: string,
    description: string,
    additionalParams?: Partial<{
      resourceId?: number;
      resourceUuid?: string;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }>,
  ): Promise<{
    success: boolean;
    activityId?: number;
    error?: string;
  }>;
}

/**
 * Email service interface for user notifications
 */
export interface UserEmailServiceInterface {
  sendPasswordResetEmail(email: string, name: string, temporaryPassword: string): Promise<void>;
  sendAccountStatusEmail(
    email: string,
    name: string,
    status: string,
    reason?: string,
  ): Promise<void>;
  sendRoleChangeEmail(email: string, name: string, oldRole: string, newRole: string): Promise<void>;
  sendImpersonationNotification(
    email: string,
    name: string,
    adminName: string,
    reason?: string,
  ): Promise<void>;
}
