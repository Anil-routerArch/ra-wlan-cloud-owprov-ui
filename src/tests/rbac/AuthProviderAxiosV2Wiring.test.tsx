import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { Endpoint } from 'models/Endpoint';

const { mockAxiosProv, mockAxiosProvV2 } = vi.hoisted(() => ({
  mockAxiosProv: { defaults: { baseURL: '', headers: { common: {} as Record<string, string> } } },
  mockAxiosProvV2: { defaults: { baseURL: '', headers: { common: {} as Record<string, string> } } },
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
});
