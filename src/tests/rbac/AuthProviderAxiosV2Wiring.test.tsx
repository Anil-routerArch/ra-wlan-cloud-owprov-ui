import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Endpoint } from 'models/Endpoint';
import { useGetManagementRole } from 'hooks/Network/ManagementRoles';

const { mockAxiosProv, mockAxiosProvV2 } = vi.hoisted(() => ({
  mockAxiosProv: { defaults: { baseURL: '', headers: { common: {} as Record<string, string> } } },
  mockAxiosProvV2: {
    get: vi.fn(),
    defaults: { baseURL: '', headers: { common: {} as Record<string, string> } },
  },
}));

vi.mock('utils/axiosInstances', () => ({
  axiosProv: mockAxiosProv,
  axiosProvV2: mockAxiosProvV2,
  axiosSec: { defaults: { baseURL: '', headers: { common: {} } } },
  axiosGw: { defaults: { baseURL: '', headers: { common: {} } } },
  axiosFms: { defaults: { baseURL: '', headers: { common: {} } } },
  axiosSub: { defaults: { baseURL: '', headers: { common: {} } } },
  axiosOwls: { defaults: { baseURL: '', headers: { common: {} } } },
  axiosAnalytics: { defaults: { baseURL: '', headers: { common: {} } } },
  axiosInstaller: { defaults: { baseURL: '', headers: { common: {} } } },
  axiosRrm: { defaults: { baseURL: '', headers: { common: {} } } },
}));

let capturedEndpointsOnSuccess: ((endpoints: Endpoint[]) => void) | undefined;

vi.mock('hooks/Network/Endpoints', () => ({
  useGetEndpoints: vi.fn().mockImplementation(({ onSuccess }: { onSuccess?: (endpoints: Endpoint[]) => void }) => {
    capturedEndpointsOnSuccess = onSuccess;
    return { refetch: vi.fn() };
  }),
}));

vi.mock('hooks/Network/Account', () => ({
  useGetProfile: vi.fn().mockReturnValue({ data: { id: 'usr-1', avatar: '' }, refetch: vi.fn() }),
  useGetPreferences: vi.fn().mockReturnValue({ data: [] }),
  useGetAvatar: vi.fn().mockReturnValue({ data: '', refetch: vi.fn() }),
  useUpdatePreferences: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useDeleteAccountToken: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
}));

vi.mock('contexts/AuthProvider/utils', () => ({
  useGetConfigurationDescriptions: vi.fn().mockReturnValue({ data: [] }),
}));

import { AuthProvider, useAuth } from 'contexts/AuthProvider';

describe('AuthProvider → axiosProv & axiosProvV2 Integration Wiring', () => {
  beforeEach(() => {
    mockAxiosProv.defaults.baseURL = '';
    mockAxiosProv.defaults.headers.common = {};
    mockAxiosProvV2.defaults.baseURL = '';
    mockAxiosProvV2.defaults.headers.common = {};
    capturedEndpointsOnSuccess = undefined;
  });

  it('1. Propagates Bearer Authorization token to both axiosProv and axiosProvV2 upon mount', () => {
    render(
      <AuthProvider token="initial-token-12345">
        <div>Child Content</div>
      </AuthProvider>
    );

    expect(mockAxiosProv.defaults.headers.common.Authorization).toBe('Bearer initial-token-12345');
    expect(mockAxiosProvV2.defaults.headers.common.Authorization).toBe('Bearer initial-token-12345');
    expect(mockAxiosProv.defaults.headers.common.Authorization).toBe(
      mockAxiosProvV2.defaults.headers.common.Authorization
    );
  });

  it('2. Dynamically configures axiosProv (v1) and axiosProvV2 (v2) baseURLs when owprov endpoint is discovered', () => {
    render(
      <AuthProvider token="token-abc">
        <div>Child Content</div>
      </AuthProvider>
    );

    expect(capturedEndpointsOnSuccess).toBeDefined();

    act(() => {
      capturedEndpointsOnSuccess!([
        {
          type: 'owprov',
          uri: 'https://owprov.example.com:16005',
          authenticationType: 'sec',
          version: '2',
        },
      ]);
    });

    expect(mockAxiosProv.defaults.baseURL).toBe('https://owprov.example.com:16005/api/v1');
    expect(mockAxiosProvV2.defaults.baseURL).toBe('https://owprov.example.com:16005/api/v2');
  });

  it('3. Propagates refreshed token to both axiosProv and axiosProvV2 when token changes', () => {
    let setTokenFn: (t: string) => void = () => {};

    const Consumer = () => {
      const { setToken } = useAuth();
      setTokenFn = setToken;
      return <div>Consumer</div>;
    };

    render(
      <AuthProvider token="token-v1">
        <Consumer />
      </AuthProvider>
    );

    expect(mockAxiosProv.defaults.headers.common.Authorization).toBe('Bearer token-v1');
    expect(mockAxiosProvV2.defaults.headers.common.Authorization).toBe('Bearer token-v1');

    act(() => {
      setTokenFn('refreshed-token-99999');
    });

    expect(mockAxiosProv.defaults.headers.common.Authorization).toBe('Bearer refreshed-token-99999');
    expect(mockAxiosProvV2.defaults.headers.common.Authorization).toBe('Bearer refreshed-token-99999');
  });

  it('4. axiosProvV2 is initially instantiated without a baseURL and never defaults to UCENTRALSEC/api/v2', async () => {
    const actualAxios = await vi.importActual<typeof import('utils/axiosInstances')>('utils/axiosInstances');
    expect(actualAxios.axiosProvV2.defaults.baseURL).toBeUndefined();
    expect(actualAxios.axiosProvV2.defaults.baseURL).not.toBe(actualAxios.secUrl);
    expect(actualAxios.axiosProvV2.defaults.baseURL).not.toBe(
      actualAxios.secUrl.replace('/api/v1', '/api/v2')
    );
  });

  it('5. useGetManagementRole query remains disabled while axiosProvV2.defaults.baseURL is unconfigured', async () => {
    mockAxiosProvV2.defaults.baseURL = '';
    mockAxiosProvV2.get = vi.fn().mockResolvedValue({ data: { id: 'role-test-1' } });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const TestRoleConsumer = () => {
      const { isFetching } = useGetManagementRole('role-test-1');
      return <div data-testid="isFetching">{isFetching ? 'fetching' : 'idle'}</div>;
    };

    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider token="token-xyz">
          <TestRoleConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Before endpoint discovery: baseURL is empty, query is disabled and must NOT call axiosProvV2.get
    expect(getByTestId('isFetching').textContent).toBe('idle');
    expect(mockAxiosProvV2.get).not.toHaveBeenCalled();

    // Now complete owprov endpoint discovery:
    act(() => {
      capturedEndpointsOnSuccess!([
        {
          type: 'owprov',
          uri: 'https://owprov.example.com:16005',
          authenticationType: 'sec',
          version: '2',
        },
      ]);
    });

    expect(mockAxiosProvV2.defaults.baseURL).toBe('https://owprov.example.com:16005/api/v2');

    await waitFor(() => {
      expect(mockAxiosProvV2.get).toHaveBeenCalledWith('managementRole/role-test-1', { params: undefined });
    });
  });

  it('6. useGetManagementRole query remains disabled if other endpoints are discovered but owprov is absent', async () => {
    mockAxiosProvV2.defaults.baseURL = '';
    mockAxiosProvV2.get = vi.fn().mockResolvedValue({ data: { id: 'role-test-2' } });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const TestRoleConsumer = () => {
      const { isFetching } = useGetManagementRole('role-test-2');
      return <div data-testid="isFetching">{isFetching ? 'fetching' : 'idle'}</div>;
    };

    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider token="token-xyz">
          <TestRoleConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Other endpoints discovered (owgw), but NO owprov:
    act(() => {
      capturedEndpointsOnSuccess!([
        {
          type: 'owgw',
          uri: 'https://owgw.example.com:16002',
          authenticationType: 'sec',
          version: '1',
        },
      ]);
    });

    expect(getByTestId('isFetching').textContent).toBe('idle');
    expect(mockAxiosProvV2.get).not.toHaveBeenCalled();
  });
});

