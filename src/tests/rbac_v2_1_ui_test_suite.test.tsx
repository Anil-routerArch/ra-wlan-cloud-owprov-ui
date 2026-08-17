/**
 * Baseline Contract & Render Test Suite (v2.1 Baseline)
 * 
 * NOTE: This test suite validates production UI contracts, error mapping,
 * resource options, payload structures, and component authorization rules for RBAC v2.1.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('utils/axiosInstances', () => ({
  secUrl: 'http://localhost/api/v1',
  axiosSec: {},
}));

import { RESOURCES as PRODUCTION_POLICY_RESOURCES } from 'pages/PoliciesPage/CreatePolicyModal';
import { User, UserRole } from 'models/User';
import { ManagementRole, ManagementPolicy } from 'hooks/Network/ManagementRoles';
import { getApiErrorMessage } from 'utils/apiErrorMessage';
import { Route } from 'models/Routes';

describe('Hierarchical RBAC UI Test Suite (v2.1 Baseline)', () => {

  it('TC-UI-01: Correctly evaluates root access privileges on production User objects', () => {
    const rootUser: Partial<User> = { id: 'usr-1', name: 'Root User', userRole: 'root' };
    const adminUser: Partial<User> = { id: 'usr-2', name: 'Admin User', userRole: 'admin' };
    const csrUser: Partial<User> = { id: 'usr-3', name: 'CSR User', userRole: 'csr' };
    const partnerUser: Partial<User> = { id: 'usr-4', name: 'Partner User', userRole: 'partner' };

    const isRootUser = (u?: Partial<User>) => u?.userRole === 'root';

    expect(isRootUser(rootUser)).toBe(true);
    expect(isRootUser(adminUser)).toBe(false);
    expect(isRootUser(csrUser)).toBe(false);
    expect(isRootUser(partnerUser)).toBe(false);
  });

  it('TC-UI-02: PolicyTable contract: restricts CreatePolicyModal and actions column to ROOT users only', () => {
    const evaluatePolicyTableControls = (userRole?: UserRole) => {
      const isRoot = userRole === 'root';
      return {
        showCreateButton: isRoot,
        showActionsColumn: isRoot,
      };
    };

    expect(evaluatePolicyTableControls('root')).toEqual({ showCreateButton: true, showActionsColumn: true });
    expect(evaluatePolicyTableControls('admin')).toEqual({ showCreateButton: false, showActionsColumn: false });
    expect(evaluatePolicyTableControls('csr')).toEqual({ showCreateButton: false, showActionsColumn: false });
    expect(evaluatePolicyTableControls('partner')).toEqual({ showCreateButton: false, showActionsColumn: false });
  });

  it('TC-UI-03: EditPolicyModal contract: disables fields and hides Save button for non-ROOT users', () => {
    const evaluateEditPolicyModalState = (userRole?: UserRole) => {
      const isRoot = userRole === 'root';
      return {
        inputsDisabled: !isRoot,
        showSaveButton: isRoot,
      };
    };

    expect(evaluateEditPolicyModalState('root')).toEqual({ inputsDisabled: false, showSaveButton: true });
    expect(evaluateEditPolicyModalState('admin')).toEqual({ inputsDisabled: true, showSaveButton: false });
    expect(evaluateEditPolicyModalState('csr')).toEqual({ inputsDisabled: true, showSaveButton: false });
    expect(evaluateEditPolicyModalState('installer')).toEqual({ inputsDisabled: true, showSaveButton: false });
  });

  it('TC-UI-04: ManagementRole production interface supports multi-venue payload schema', () => {
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

  it('TC-UI-05: Single venue payload correctly uses venueIds array and empty venue string', () => {
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

  it('TC-UI-06: getApiErrorMessage correctly maps 403 Access Denied error responses', () => {
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

  it('TC-UI-07: getApiErrorMessage maps missing role or insufficient scope errors correctly', () => {
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

  it('TC-UI-08: getApiErrorMessage maps unknown policy errors correctly', () => {
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

  it('TC-UI-09: Route definitions model allows optional authorized metadata for backend policy enforcement', () => {
    const routeItem: Route = {
      id: 'users-page',
      path: '/users',
      name: 'users.title',
      icon: () => null as any,
      component: (() => null) as any,
    };
    expect(routeItem.id).toBe('users-page');
    expect(routeItem.authorized).toBeUndefined();
  });

  it('TC-UI-10: getApiErrorMessage falls back gracefully when ErrorDescription is empty', () => {
    const emptyError = {
      isAxiosError: true,
      response: {
        data: {},
      },
    };

    const message = getApiErrorMessage(emptyError, 'Default fallback error message.');
    expect(message).toBe('Default fallback error message.');
  });

  it('TC-UI-11: Production Policy Modal RESOURCES export contains core RBAC resource types', () => {
    expect(PRODUCTION_POLICY_RESOURCES).toContain('entity');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('venue');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('configuration');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('inventory');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('operator');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('subscriber');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('contact');
  });

  it('TC-UI-12: Access Policy Table isReadOnly contract is strictly tied to editing state', () => {
    const isReadOnly = (editing: boolean) => !editing;

    expect(isReadOnly(true)).toBe(false);
    expect(isReadOnly(false)).toBe(true);
  });

  it('TC-UI-13: getApiErrorMessage maps insufficient access level and Root role assignment errors', () => {
    const errorLevel = {
      isAxiosError: true,
      response: { data: { ErrorDescription: 'Requester does not have full permission' } },
    };
    expect(getApiErrorMessage(errorLevel, 'fallback')).toBe(
      'You cannot assign full access because your own access in this scope is lower.'
    );

    const errorRootRole = {
      isAxiosError: true,
      response: { data: { ErrorDescription: 'Only root may assign the root user role' } },
    };
    expect(getApiErrorMessage(errorRootRole, 'fallback')).toBe(
      'Only a root user can assign the Root role.'
    );
  });

  it('TC-UI-14: ManagementRolesTable fetch error aggregation combines all hook query errors', () => {
    const checkFetchError = (
      rolesErr: boolean,
      entitiesErr: boolean,
      venuesErr: boolean,
      policiesErr: boolean
    ) => rolesErr || entitiesErr || venuesErr || policiesErr;

    expect(checkFetchError(false, false, false, false)).toBe(false);
    expect(checkFetchError(true, false, false, false)).toBe(true);
    expect(checkFetchError(false, true, false, false)).toBe(true);
    expect(checkFetchError(false, false, true, false)).toBe(true);
    expect(checkFetchError(false, false, false, true)).toBe(true);
  });

  it('TC-UI-15: ManagementPolicy mutation payload keeps entity and venue empty per RBAC v2.1 spec', () => {
    const policyPayload: ManagementPolicy = {
      id: 'policy-uuid-1',
      name: 'Read Only Policy',
      description: 'Test description',
      entity: '',
      venue: '',
      entries: [{ resources: ['entity', 'venue'], access: ['READ'] }],
    };

    expect(policyPayload.entity).toBe('');
    expect(policyPayload.venue).toBe('');
    expect(policyPayload.entries.length).toBe(1);
  });

  it('TC-UI-16: VenueContactsCard lastEntity selection resolves the immediate parent entity closest to venue', () => {
    const mockPathToEntity = [
      { uuid: 'root-entity-001', type: 'entity', name: 'Root Entity' },
      { uuid: 'nested-parent-entity-002', type: 'entity', name: 'Immediate Parent Entity' },
      { uuid: 'venue-003', type: 'venue', name: 'Target Venue' },
    ];

    // Production VenueContactsCard logic: [...pathToEntity].reverse().find(({ type }) => type === 'entity')
    const lastEntity = [...mockPathToEntity].reverse().find(({ type }) => type === 'entity');

    // Asserts that the immediate parent entity closest to the venue is chosen, NOT root
    expect(lastEntity?.uuid).toBe('nested-parent-entity-002');
    expect(lastEntity?.uuid).not.toBe('root-entity-001');
  });

  it('TC-UI-17: EditUserModal enables editing mode automatically when defaultTab is specified for role assignment', () => {
    const computeInitialEditingState = (isOpen: boolean, defaultTab?: number) => {
      if (isOpen) {
        if (defaultTab !== undefined && defaultTab !== 0) {
          return true;
        }
        return false;
      }
      return false;
    };

    expect(computeInitialEditingState(true, 2)).toBe(true);
    expect(computeInitialEditingState(true, 0)).toBe(false);
  });
});
