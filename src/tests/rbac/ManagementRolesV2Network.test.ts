import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('utils/axiosInstances', () => ({
  secUrl: 'http://localhost/api/v1',
  axiosSec: {},
  axiosProv: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: 'http://localhost/api/v1', headers: { common: {} } },
  },
  axiosProvV2: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: 'http://localhost/api/v2', headers: { common: {} } },
  },
}));

import { axiosProv, axiosProvV2 } from 'utils/axiosInstances';
import {
  createManagementRole,
  getManagementRoles,
  getManagementRole,
  CreateManagementRole,
} from 'hooks/Network/ManagementRoles';

describe('V2 Management Role Network Contract & Payload Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Creates an entity-wide role via POST /managementRole/0 with empty venueIds array and unwraps { roles: [...] }', async () => {
    const mockRole = {
      id: 'role-uuid-1',
      name: 'Entity Wide Role',
      description: 'Role for whole entity',
      managementPolicy: 'pol-uuid-1',
      users: ['usr-uuid-1'],
      entity: 'ent-uuid-1',
      venue: '',
    };

    (axiosProvV2.post as any).mockResolvedValueOnce({
      data: {
        roles: [mockRole],
      },
    });

    const payload: CreateManagementRole = {
      name: 'Entity Wide Role',
      description: 'Role for whole entity',
      managementPolicy: 'pol-uuid-1',
      users: ['usr-uuid-1'],
      entity: 'ent-uuid-1',
      venueIds: [],
    };

    const result = await createManagementRole(payload);

    expect(axiosProvV2.post).toHaveBeenCalledTimes(1);
    expect(axiosProvV2.post).toHaveBeenCalledWith('managementRole/0', payload);
    expect(axiosProv.post).not.toHaveBeenCalled();
    expect(result).toEqual([mockRole]);
  });

  it('2. Creates venue-scoped roles via POST /managementRole/0 with venueIds array', async () => {
    const mockRoles = [
      {
        id: 'role-uuid-1',
        name: 'Venue Scope 1',
        description: 'Assigned to Venue 1',
        managementPolicy: 'pol-uuid-1',
        users: ['usr-uuid-1'],
        entity: 'ent-uuid-1',
        venue: 'ven-uuid-1',
      },
      {
        id: 'role-uuid-2',
        name: 'Venue Scope 2',
        description: 'Assigned to Venue 2',
        managementPolicy: 'pol-uuid-1',
        users: ['usr-uuid-1'],
        entity: 'ent-uuid-1',
        venue: 'ven-uuid-2',
      },
    ];

    (axiosProvV2.post as any).mockResolvedValueOnce({
      data: {
        roles: mockRoles,
      },
    });

    const payload: CreateManagementRole = {
      name: 'Venue Batch Role',
      description: 'Assigned to Venue 1 & 2',
      managementPolicy: 'pol-uuid-1',
      users: ['usr-uuid-1'],
      entity: 'ent-uuid-1',
      venueIds: ['ven-uuid-1', 'ven-uuid-2'],
    };

    const result = await createManagementRole(payload);

    expect(axiosProvV2.post).toHaveBeenCalledWith('managementRole/0', payload);
    expect(result).toEqual(mockRoles);
  });

  it('3. Rejects with an error when V2 response does not contain a valid { roles: [...] } envelope', async () => {
    const singleRole = {
      id: 'role-single-1',
      name: 'Single Role',
      managementPolicy: 'pol-1',
      users: ['usr-1'],
      entity: 'ent-1',
      venue: '',
    };

    // Simulate invalid legacy single-object response (missing roles array)
    (axiosProvV2.post as any).mockResolvedValueOnce({
      data: singleRole,
    });

    const payload: CreateManagementRole = {
      name: 'Single Role',
      managementPolicy: 'pol-1',
      users: ['usr-1'],
      entity: 'ent-1',
      venueIds: [],
    };

    await expect(createManagementRole(payload)).rejects.toThrow(
      'Invalid response from V2 managementRole API: expected { roles: [...] } envelope'
    );
  });

  it('4. Role listing queries strictly target V1 endpoint via axiosProv.get', async () => {
    const mockRoleList = [
      { id: 'role-1', name: 'Role 1', users: ['usr-1'], entity: 'ent-1', venue: '', managementPolicy: 'pol-1' },
    ];

    (axiosProv.get as any).mockResolvedValueOnce({
      data: {
        roles: mockRoleList,
      },
    });

    const result = await getManagementRoles('usr-1');

    expect(axiosProv.get).toHaveBeenCalledWith('managementRole', {
      params: { userId: 'usr-1' },
    });
    expect(axiosProvV2.get).not.toHaveBeenCalled();
    expect(result).toEqual(mockRoleList);
  });

  it('5. Detail query models expandInUse=true response and standard single role fetch', async () => {
    const mockRole = {
      id: 'role-1',
      name: 'Role 1',
      users: ['usr-1'],
      entity: 'ent-1',
      venue: '',
      managementPolicy: 'pol-1',
    };

    (axiosProvV2.get as any).mockResolvedValueOnce({ data: mockRole });

    const standardRole = await getManagementRole('role-1');
    expect(axiosProvV2.get).toHaveBeenCalledWith('managementRole/role-1', { params: undefined });
    expect(standardRole).toEqual(mockRole);

    const expandedEntries = {
      entries: {
        venues: [{ uuid: 'ven-1', name: 'Venue 1', description: 'Main Venue' }],
      },
    };

    (axiosProvV2.get as any).mockResolvedValueOnce({ data: expandedEntries });

    const expanded = await getManagementRole('role-1', true);
    expect(axiosProvV2.get).toHaveBeenCalledWith('managementRole/role-1', { params: { expandInUse: true } });
    expect(expanded).toEqual(expandedEntries);
  });
});

