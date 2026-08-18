import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ManagementRolesTable } from 'components/ManagementRolesTable';

vi.mock('utils/axiosInstances', () => ({
  secUrl: 'http://localhost/api/v1',
  axiosSec: {},
}));

vi.mock('contexts/AuthProvider', () => ({
  useAuth: () => ({ user: { userRole: 'admin' } }),
}));

vi.mock('hooks/Network/ManagementRoles', async () => {
  const actual = await vi.importActual<any>('hooks/Network/ManagementRoles');
  return {
    ...actual,
    useGetManagementRoles: () => ({ data: [], isLoading: false, error: null }),
    useGetEntities: () => ({ data: [], isLoading: false, error: null }),
    useGetVenues: () => ({ data: [], isLoading: false, error: null }),
    useGetManagementPolicies: () => ({ data: [], isLoading: false, error: null }),
    useCreateManagementRole: () => ({ mutate: vi.fn(), isLoading: false }),
    useUpdateManagementRole: () => ({ mutate: vi.fn(), isLoading: false }),
    useDeleteManagementRole: () => ({ mutate: vi.fn(), isLoading: false }),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>{children}</ChakraProvider>
    </QueryClientProvider>
  );
};

describe('Management Role Immutability Frontend Validation', () => {
  it('renders ManagementRolesTable in read-only mode when isReadOnly is true', () => {
    const Wrapper = createWrapper();
    const { queryByText } = render(
      <Wrapper>
        <ManagementRolesTable userId="usr-123" isReadOnly={true} />
      </Wrapper>
    );

    // In read-only mode, the assignment creation form is omitted from the DOM
    expect(queryByText('Assign New Entity or Venue Scope')).toBeNull();
  });

  it('renders ManagementRolesTable with assignment controls when isReadOnly is false', () => {
    const Wrapper = createWrapper();
    const { queryByText } = render(
      <Wrapper>
        <ManagementRolesTable userId="usr-123" isReadOnly={false} />
      </Wrapper>
    );

    // When editing (isReadOnly=false), assignment action form controls are present in the DOM
    expect(queryByText('Assign New Entity or Venue Scope')).not.toBeNull();
  });
});
