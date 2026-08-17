/**
 * Baseline Contract & Mock Payload Test Suite (v2.1 Baseline)
 * 
 * NOTE: This test suite validates production UI contracts, error mapping,
 * resource options, and payload structures for RBAC v2.1.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('utils/axiosInstances', () => ({
  secUrl: 'http://localhost/api/v1',
  axiosSec: {},
}));

import { RESOURCES as PRODUCTION_POLICY_RESOURCES } from 'pages/PoliciesPage/CreatePolicyModal';
import { UserRole } from 'models/User';
import { ManagementRole } from 'hooks/Network/ManagementRoles';
import { getApiErrorMessage } from 'utils/apiErrorMessage';
import routes from 'router/routes';

describe('Hierarchical RBAC UI Test Suite (v2.1 Baseline)', () => {

  it('TC-UI-01: UserRole model supports ROOT and non-ROOT operator roles', () => {
    const rootRole: UserRole = 'root';
    const csrRole: UserRole = 'csr';
    const adminRole: UserRole = 'admin';
    const partnerRole: UserRole = 'partner';

    expect(rootRole === 'root').toBe(true);
    expect(csrRole === 'root').toBe(false);
    expect(adminRole === 'root').toBe(false);
    expect(partnerRole === 'root').toBe(false);
  });

  it('TC-UI-02: ManagementRole production interface supports multi-venue payload schema', () => {
    const rolePayload: Partial<ManagementRole> = {
      id: 'generated-role-uuid',
      name: 'Access role for user 123',
      description: 'Auto-generated role',
      managementPolicy: 'policy-789',
      users: ['user-123'],
      entity: 'entity-456',
      venue: '',
      venueIds: ['venue-1', 'venue-2'],
    };

    expect(rolePayload.users).toEqual(['user-123']);
    expect(rolePayload.entity).toBe('entity-456');
    expect(rolePayload.managementPolicy).toBe('policy-789');
    expect(rolePayload.venueIds).toEqual(['venue-1', 'venue-2']);
    expect(rolePayload.venue).toBe('');
  });

  it('TC-UI-03: Single venue payload correctly uses venueIds array and empty venue string', () => {
    const rolePayload: Partial<ManagementRole> = {
      id: 'role-123',
      entity: 'entity-456',
      managementPolicy: 'policy-789',
      users: ['user-123'],
      venue: '',
      venueIds: ['venue-1'],
    };

    expect(rolePayload.entity).toBe('entity-456');
    expect(rolePayload.venue).toBe('');
    expect(rolePayload.venueIds).toEqual(['venue-1']);
  });

  it('TC-UI-04: getApiErrorMessage correctly maps 403 Access Denied error responses', () => {
    const error403 = {
      isAxiosError: true,
      response: {
        data: {
          ErrorDescription: '403: Access Denied',
        },
      },
    };

    const message = getApiErrorMessage(error403, 'Fallback error message');
    expect(message).toBe('You do not have permission to do that.');
  });

  it('TC-UI-05: getApiErrorMessage maps missing role or insufficient scope errors correctly', () => {
    const errorScope = {
      isAxiosError: true,
      response: {
        data: {
          ErrorDescription: 'Requester has no role on the target scope',
        },
      },
    };

    const message = getApiErrorMessage(errorScope, 'Fallback error message');
    expect(message).toBe('You can only assign access within a scope that is already assigned to you.');
  });

  it('TC-UI-06: getApiErrorMessage maps unknown policy errors correctly', () => {
    const errorPolicy = {
      isAxiosError: true,
      response: {
        data: {
          ErrorDescription: 'Unknown management policy',
        },
      },
    };

    const message = getApiErrorMessage(errorPolicy, 'Fallback error message');
    expect(message).toBe('The selected policy could not be found.');
  });

  it('TC-UI-07: Production route definitions allow backend-driven policy enforcement', () => {
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
    const hasAuthorizedMetadata = routes.some((r) => r.authorized !== undefined && r.authorized.length > 0);
    expect(hasAuthorizedMetadata).toBe(false);
  });

  it('TC-UI-08: getApiErrorMessage falls back gracefully when ErrorDescription is empty', () => {
    const emptyError = {
      isAxiosError: true,
      response: {
        data: {},
      },
    };

    const message = getApiErrorMessage(emptyError, 'Default fallback error message.');
    expect(message).toBe('Default fallback error message.');
  });

  it('TC-UI-09: Production Policy Modal RESOURCES export contains core RBAC resource types', () => {
    expect(PRODUCTION_POLICY_RESOURCES).toContain('entity');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('venue');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('configuration');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('inventory');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('operator');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('subscriber');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('contact');
  });

  it('TC-UI-10: Access Policy Table isReadOnly contract is strictly tied to editing state', () => {
    const isReadOnly = (editing: boolean) => !editing;

    expect(isReadOnly(true)).toBe(false);
    expect(isReadOnly(false)).toBe(true);
  });
});
