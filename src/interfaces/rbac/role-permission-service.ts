/**
 * RolePermissionService interfaces
 *
 * Provides TypeScript interfaces used by RolePermissionService. Keeping them in
 * a dedicated file helps prevent circular dependencies and enforces strict
 * typing across the service layer.
 *
 * @module src/interfaces/rbac/role-permission-service
 */

export interface AssignRoleResult {
  success: boolean;
  message?: string;
}

export interface RevokeRoleResult extends AssignRoleResult {}
