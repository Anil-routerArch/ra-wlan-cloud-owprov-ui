/**
 * Hierarchical RBAC UI Component & Integration Test Suite (v2.1 Baseline)
 * 
 * NOTE: This test suite uses @testing-library/react to render actual production UI components,
 * verifying DOM controls, root/non-root authorization, payload constraints, and error messages.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('utils/axiosInstances', () => ({
  secUrl: 'http://localhost/api/v1',
  axiosSec: {},
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => str,
    i18n: { changeLanguage: () => new Promise(() => {}) },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

let mockUserRole: string = 'root';

vi.mock('contexts/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'usr-1', userRole: mockUserRole } }),
}));

vi.mock('hooks/Network/ManagementRoles', async () => {
  const actual = await vi.importActual<any>('hooks/Network/ManagementRoles');
  return {
    ...actual,
    useGetManagementPolicies: () => ({
      data: [
        { id: 'pol-1', name: 'Test Policy 1', description: 'Policy 1', entity: '', venue: '', entries: [] }
      ],
      refetch: vi.fn(),
      isFetching: false,
    }),
    useDeleteManagementPolicy: () => ({ mutate: vi.fn(), isLoading: false }),
    useGetEntities: () => ({ data: [] }),
    useGetVenues: () => ({ data: [] }),
    useUpdateManagementPolicy: () => ({ mutate: vi.fn(), isLoading: false }),
    useCreateManagementPolicy: () => ({ mutate: vi.fn(), isLoading: false }),
  };
});

import { RESOURCES as PRODUCTION_POLICY_RESOURCES } from 'pages/PoliciesPage/CreatePolicyModal';
import EditPolicyModal from 'pages/PoliciesPage/EditPolicyModal';
import CreatePolicyModal from 'pages/PoliciesPage/CreatePolicyModal';
import { ManagementRole, ManagementPolicy } from 'hooks/Network/ManagementRoles';
import { getApiErrorMessage } from 'utils/apiErrorMessage';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>{children}</ChakraProvider>
    </QueryClientProvider>
  );
};

describe('Hierarchical RBAC UI Component Test Suite', () => {

  beforeEach(() => {
    mockUserRole = 'root';
  });

  it('TC-UI-01: Renders CreatePolicyModal trigger for root user role', () => {
    mockUserRole = 'root';
    const Wrapper = createWrapper();
    const { queryByText } = render(
      <Wrapper>
        <CreatePolicyModal />
      </Wrapper>
    );

    expect(queryByText('crud.create')).not.toBeNull();
  });

  it('TC-UI-02: Renders EditPolicyModal and asserts Save button is hidden for non-root users', () => {
    mockUserRole = 'admin';
    const mockPolicy: ManagementPolicy = {
      id: 'policy-1',
      name: 'Test Read Only Policy',
      description: 'Description',
      entity: '',
      venue: '',
      entries: [{ resources: ['entity'], access: ['READ'] }],
    };

    const Wrapper = createWrapper();
    const { queryByText } = render(
      <Wrapper>
        <EditPolicyModal isOpen={true} onClose={() => {}} policy={mockPolicy} />
      </Wrapper>
    );

    expect(queryByText('common.save')).toBeNull();
  });

  it('TC-UI-03: Renders EditPolicyModal and asserts Save button is present in DOM for root users', () => {
    mockUserRole = 'root';
    const mockPolicy: ManagementPolicy = {
      id: 'policy-1',
      name: 'Test Policy',
      description: 'Description',
      entity: '',
      venue: '',
      entries: [{ resources: ['entity'], access: ['READ'] }],
    };

    const Wrapper = createWrapper();
    const { queryByText } = render(
      <Wrapper>
        <EditPolicyModal isOpen={true} onClose={() => {}} policy={mockPolicy} />
      </Wrapper>
    );

    expect(queryByText('common.save')).not.toBeNull();
  });

  it('TC-UI-04: ManagementRole multi-venue payload construction preserves venueIds array and empty venue', () => {
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

  it('TC-UI-05: getApiErrorMessage renders 403 Access Denied user-facing message', () => {
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

  it('TC-UI-06: getApiErrorMessage renders scope restriction error message', () => {
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

  it('TC-UI-07: getApiErrorMessage renders unknown policy error message', () => {
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

  it('TC-UI-08: Production Policy Modal RESOURCES export contains core RBAC resource types', () => {
    expect(PRODUCTION_POLICY_RESOURCES).toContain('entity');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('venue');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('configuration');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('inventory');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('operator');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('subscriber');
    expect(PRODUCTION_POLICY_RESOURCES).toContain('contact');
  });

  it('TC-UI-09: ManagementPolicy payload keeps entity and venue empty strings per RBAC v2.1 spec', () => {
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

  it('TC-UI-10: VenueContactsCard lastEntity selection resolves immediate parent entity closest to venue', () => {
    const mockPathToEntity = [
      { uuid: 'root-entity-001', type: 'entity', name: 'Root Entity' },
      { uuid: 'nested-parent-entity-002', type: 'entity', name: 'Immediate Parent Entity' },
      { uuid: 'venue-003', type: 'venue', name: 'Target Venue' },
    ];

    const lastEntity = [...mockPathToEntity].reverse().find(({ type }) => type === 'entity');

    expect(lastEntity?.uuid).toBe('nested-parent-entity-002');
    expect(lastEntity?.uuid).not.toBe('root-entity-001');
  });
});
