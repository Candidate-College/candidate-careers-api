/**
 * Activity Log Resource Tests
 *
 * Tests for activity log resource serializer following TDD methodology.
 * Tests data filtering, sensitive data handling, and API response formatting.
 */

import { jest } from '@jest/globals';
import { ActivityLogResource } from '../../src/resources/activity-log-resource';
import { ActivityLogData } from '../../src/models/activity-log-model';
import {
  ActivitySeverity,
  ActivityCategory,
  ActivityStatus,
  AUTHENTICATION_ACTIONS,
  RESOURCE_TYPES,
} from '../../src/constants/activity-log-constants';

describe('ActivityLog Resource', () => {
  const sampleActivityData: ActivityLogData = {
    id: 1,
    user_id: 1,
    session_id: 'session-123',
    action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
    resource_type: RESOURCE_TYPES.USER,
    resource_id: 1,
    resource_uuid: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User successfully logged in',
    old_values: null,
    new_values: { loginTime: new Date('2023-01-01T10:00:00Z') },
    metadata: { browser: 'Chrome', version: '91.0', location: 'New York' },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    severity: ActivitySeverity.LOW,
    category: ActivityCategory.AUTHENTICATION,
    status: ActivityStatus.SUCCESS,
    created_at: new Date('2023-01-01T10:00:00Z'),
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed_password_should_be_filtered',
      role: 'user',
      created_at: new Date('2023-01-01T09:00:00Z'),
      updated_at: new Date('2023-01-01T09:30:00Z'),
    },
  };

  describe('Basic Serialization', () => {
    it('should include all non-sensitive fields', () => {
      const resource = new ActivityLogResource();
      const serialized = resource.serialize(sampleActivityData);

      expect(serialized).toEqual(
        expect.objectContaining({
          id: 1,
          action: AUTHENTICATION_ACTIONS.LOGIN_SUCCESS,
          resource_type: RESOURCE_TYPES.USER,
          resource_id: 1,
          resource_uuid: '550e8400-e29b-41d4-a716-446655440000',
          description: 'User successfully logged in',
          severity: ActivitySeverity.LOW,
          category: ActivityCategory.AUTHENTICATION,
          status: ActivityStatus.SUCCESS,
          created_at: '2023-01-01T10:00:00.000Z',
        }),
      );
    });

    it('should format timestamps as ISO strings', () => {
      const resource = new ActivityLogResource();
      const serialized = resource.serialize(sampleActivityData);

      expect(serialized.created_at).toBe('2023-01-01T10:00:00.000Z');
      expect(typeof serialized.created_at).toBe('string');
    });

    it('should include metadata when present', () => {
      const resource = new ActivityLogResource();
      const serialized = resource.serialize(sampleActivityData);

      expect(serialized.metadata).toEqual({
        browser: 'Chrome',
        version: '91.0',
        location: 'New York',
      });
    });

    it('should handle null values correctly', () => {
      const activityWithNulls: ActivityLogData = {
        ...sampleActivityData,
        user_id: null,
        session_id: null,
        resource_id: null,
        resource_uuid: null,
        old_values: null,
        new_values: null,
        metadata: null,
        ip_address: null,
        user_agent: null,
        user: undefined,
      };

      const resource = new ActivityLogResource({
        includeSessionId: true,
        includeIpAddress: true,
      });
      const serialized = resource.serialize(activityWithNulls);

      expect(serialized.user_id).toBeNull();
      expect(serialized.session_id).toBeNull();
      expect(serialized.resource_id).toBeNull();
      expect(serialized.resource_uuid).toBeNull();
      expect(serialized.old_values).toBeNull();
      expect(serialized.new_values).toBeNull();
      expect(serialized.metadata).toBeNull();
      expect(serialized.ip_address).toBeNull();
      expect(serialized.user_agent).toBeNull();
      expect(serialized.user).toBeUndefined();
    });
  });

  describe('Sensitive Data Filtering', () => {
    it('should exclude sensitive IP address for non-admin users', () => {
      const resource = new ActivityLogResource({ includeIpAddress: false });
      const serialized = resource.serialize(sampleActivityData);

      expect(serialized.ip_address).toBeUndefined();
    });

    it('should include IP address for admin users', () => {
      const resource = new ActivityLogResource({ includeIpAddress: true });
      const serialized = resource.serialize(sampleActivityData);

      expect(serialized.ip_address).toBe('192.168.1.1');
    });

    it('should exclude session_id for non-admin users', () => {
      const resource = new ActivityLogResource({ includeSessionId: false });
      const serialized = resource.serialize(sampleActivityData);

      expect(serialized.session_id).toBeUndefined();
    });

    it('should include session_id for admin users', () => {
      const resource = new ActivityLogResource({ includeSessionId: true });
      const serialized = resource.serialize(sampleActivityData);

      expect(serialized.session_id).toBe('session-123');
    });

    it('should filter sensitive data from old_values and new_values', () => {
      const activityWithSensitiveData: ActivityLogData = {
        ...sampleActivityData,
        old_values: {
          email: 'old@example.com',
          password: 'old_password_hash',
          role: 'user',
          sensitive_token: 'secret_token',
        },
        new_values: {
          email: 'new@example.com',
          password: 'new_password_hash',
          role: 'admin',
          sensitive_token: 'new_secret_token',
        },
      };

      const resource = new ActivityLogResource();
      const serialized = resource.serialize(activityWithSensitiveData);

      // Should filter out password and sensitive fields
      expect(serialized.old_values).toEqual({
        email: 'old@example.com',
        role: 'user',
      });
      expect(serialized.new_values).toEqual({
        email: 'new@example.com',
        role: 'admin',
      });
    });

    it('should filter user password from included user data', () => {
      const resource = new ActivityLogResource({ includeUser: true });
      const serialized = resource.serialize(sampleActivityData);

      expect(serialized.user).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        created_at: '2023-01-01T09:00:00.000Z',
        updated_at: '2023-01-01T09:30:00.000Z',
      });
      expect((serialized.user as any)?.password).toBeUndefined();
    });
  });

  describe('User Data Inclusion', () => {
    it('should exclude user data by default', () => {
      const resource = new ActivityLogResource();
      const serialized = resource.serialize(sampleActivityData);

      expect(serialized.user).toBeUndefined();
    });

    it('should include user data when requested', () => {
      const resource = new ActivityLogResource({ includeUser: true });
      const serialized = resource.serialize(sampleActivityData);

      expect(serialized.user).toBeDefined();
      expect(serialized.user?.id).toBe(1);
      expect(serialized.user?.name).toBe('John Doe');
      expect(serialized.user?.email).toBe('john@example.com');
    });

    it('should handle missing user data gracefully', () => {
      const activityWithoutUser: ActivityLogData = {
        ...sampleActivityData,
        user: undefined,
      };

      const resource = new ActivityLogResource({ includeUser: true });
      const serialized = resource.serialize(activityWithoutUser);

      expect(serialized.user).toBeUndefined();
    });
  });

  describe('Batch Serialization', () => {
    it('should serialize multiple activity logs', () => {
      const activities: ActivityLogData[] = [
        sampleActivityData,
        {
          ...sampleActivityData,
          id: 2,
          action: AUTHENTICATION_ACTIONS.LOGOUT,
          description: 'User logged out',
          created_at: new Date('2023-01-01T11:00:00Z'),
        },
      ];

      const resource = new ActivityLogResource();
      const serialized = resource.serializeMany(activities);

      expect(serialized).toHaveLength(2);
      expect(serialized[0].id).toBe(1);
      expect(serialized[1].id).toBe(2);
      expect(serialized[0].action).toBe(AUTHENTICATION_ACTIONS.LOGIN_SUCCESS);
      expect(serialized[1].action).toBe(AUTHENTICATION_ACTIONS.LOGOUT);
    });

    it('should handle empty array', () => {
      const resource = new ActivityLogResource();
      const serialized = resource.serializeMany([]);

      expect(serialized).toEqual([]);
    });
  });

  describe('Options Validation', () => {
    it('should accept valid options', () => {
      expect(
        () =>
          new ActivityLogResource({
            includeUser: true,
            includeIpAddress: true,
            includeSessionId: true,
          }),
      ).not.toThrow();
    });

    it('should use default options when none provided', () => {
      const resource = new ActivityLogResource();

      expect(resource.options.includeUser).toBe(false);
      expect(resource.options.includeIpAddress).toBe(false);
      expect(resource.options.includeSessionId).toBe(false);
    });

    it('should merge provided options with defaults', () => {
      const resource = new ActivityLogResource({
        includeUser: true,
      });

      expect(resource.options.includeUser).toBe(true);
      expect(resource.options.includeIpAddress).toBe(false);
      expect(resource.options.includeSessionId).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON in old_values/new_values', () => {
      const activityWithMalformedJSON: ActivityLogData = {
        ...sampleActivityData,
        old_values: { invalid: '[invalid json' },
        new_values: { invalid: 'not json at all' },
      };

      const resource = new ActivityLogResource();
      const serialized = resource.serialize(activityWithMalformedJSON);

      // Should handle gracefully, possibly converting to string or null
      expect(serialized.old_values).toBeDefined();
      expect(serialized.new_values).toBeDefined();
    });

    it('should handle very large metadata objects', () => {
      const largeMetadata = {
        ...Array.from({ length: 100 }, (_, i) => ({
          [`key${i}`]: `value${i}`,
        })).reduce((acc, obj) => ({ ...acc, ...obj }), {}),
      };

      const activityWithLargeMetadata: ActivityLogData = {
        ...sampleActivityData,
        metadata: largeMetadata,
      };

      const resource = new ActivityLogResource();
      const serialized = resource.serialize(activityWithLargeMetadata);

      expect(serialized.metadata).toBeDefined();
      expect(Object.keys(serialized.metadata)).toHaveLength(100);
    });

    it('should handle unicode characters in description', () => {
      const activityWithUnicode: ActivityLogData = {
        ...sampleActivityData,
        description: '用户成功登录 🎉 émojis and unicode characters',
      };

      const resource = new ActivityLogResource();
      const serialized = resource.serialize(activityWithUnicode);

      expect(serialized.description).toBe('用户成功登录 🎉 émojis and unicode characters');
    });
  });
});
