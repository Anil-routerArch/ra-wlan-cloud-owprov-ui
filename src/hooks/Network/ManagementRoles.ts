import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Note } from 'models/Note';
import { axiosProv, axiosProvV2 } from 'utils/axiosInstances';

export type ManagementRole = {
  id: string;
  name: string;
  description: string;
  managementPolicy: string;
  users: string[];
  entity: string;
  venue: string;
  venueIds?: string[];
  notes?: Note[];
  created?: number;
  modified?: number;
};

const getManagementRoles = async (userId?: string) =>
export const getManagementRoles = async (userId?: string) =>
  axiosProv
    .get('managementRole', { params: userId ? { userId } : undefined })
    .then(({ data }) => data.roles as ManagementRole[]);

export const useGetManagementRoles = (userId?: string) =>
  useQuery(['managementRoles', userId], () => getManagementRoles(userId), {
    enabled: userId !== undefined ? !!userId : true,
    staleTime: 1000 * 60 * 5,
  });

export type ExpandedUseEntry = {
  uuid: string;
  name: string;
  description?: string;
};

export type ExpandedUseEntryMapList = {
  entries: Record<string, ExpandedUseEntry[]>;
};

export type GetManagementRoleResult<T extends boolean | undefined> = T extends true
  ? ExpandedUseEntryMapList
  : ManagementRole;

export const getManagementRole = async <T extends boolean | undefined = false>(
  roleId: string,
  expandInUse?: T
): Promise<GetManagementRoleResult<T>> =>
  axiosProvV2
    .get(`managementRole/${roleId}`, { params: expandInUse ? { expandInUse } : undefined })
    .then(({ data }) => data as GetManagementRoleResult<T>);

export const useGetManagementRole = <T extends boolean | undefined = false>(
  roleId: string,
  expandInUse?: T
) =>
  useQuery(['managementRole', roleId, expandInUse], () => getManagementRole(roleId, expandInUse), {
    enabled: !!roleId,
  });

export type CreateManagementRole = {
  name: string;
  description?: string;
  managementPolicy: string;
  users: string[];
  entity: string;
  venueIds?: string[];
  notes?: Note[];
};

const createManagementRole = async (newRole: CreateManagementRole) =>
  axiosProvV2.post('managementRole/0', newRole).then(({ data }) => data.roles as ManagementRole[]);
export const createManagementRole = async (newRole: CreateManagementRole) =>
  axiosProvV2.post('managementRole/0', newRole).then(({ data }) => {
    if (data?.roles && Array.isArray(data.roles)) {
      return data.roles as ManagementRole[];
    }
    return [data as ManagementRole];
  });

export const useCreateManagementRole = () => {
  const queryClient = useQueryClient();
  return useMutation(createManagementRole, {
    onSuccess: () => {
      queryClient.invalidateQueries(['managementRoles']);
    },
  });
};

const updateManagementRole = async (role: ManagementRole) =>
  axiosProvV2.put(`managementRole/${role.id}`, role).then(({ data }) => data as ManagementRole);

export const useUpdateManagementRole = () => {
  const queryClient = useQueryClient();
  return useMutation(updateManagementRole, {
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(['managementRoles']);
      queryClient.invalidateQueries(['managementRole', variables.id]);
    },
  });
};

const deleteManagementRole = async (roleId: string) =>
  axiosProvV2.delete(`managementRole/${roleId}`);

export const useDeleteManagementRole = () => {
  const queryClient = useQueryClient();
  return useMutation(deleteManagementRole, {
    onSuccess: (_data, roleId) => {
      queryClient.invalidateQueries(['managementRoles']);
      queryClient.invalidateQueries(['managementRole', roleId]);
    },
  });
};

export type EntityInfo = {
  id: string;
  name: string;
};

export type VenueInfo = {
  id: string;
  name: string;
  entity: string;
};

const getEntities = async () =>
  axiosProv.get('entity').then(({ data }) => data.entities as EntityInfo[]);

export const useGetEntities = () =>
  useQuery(['entities'], getEntities, {
    staleTime: 1000 * 60 * 5,
  });

const getVenues = async () =>
  axiosProv.get('venue').then(({ data }) => data.venues as VenueInfo[]);

export const useGetVenues = () =>
  useQuery(['venues'], getVenues, {
    staleTime: 1000 * 60 * 5,
  });

export type ManagementPolicy = {
  id: string;
  name: string;
  description: string;
  entity: string;
  venue: string;
  entries: {
    resources: string[];
    access: string[];
  }[];
};

const getManagementPolicies = async () =>
  axiosProv.get('managementPolicy').then(({ data }) => data.managementPolicies as ManagementPolicy[]);

export const useGetManagementPolicies = () =>
  useQuery(['managementPolicies'], getManagementPolicies, {
    staleTime: 1000 * 60 * 5,
  });

const createManagementPolicy = async (newPolicy: ManagementPolicy) =>
  axiosProv.post(`managementPolicy/${newPolicy.id}`, newPolicy);

export const useCreateManagementPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation(createManagementPolicy, {
    onSuccess: () => {
      queryClient.invalidateQueries(['managementPolicies']);
    },
  });
};

const updateManagementPolicy = async (policy: ManagementPolicy) =>
  axiosProv.put(`managementPolicy/${policy.id}`, policy);

export const useUpdateManagementPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation(updateManagementPolicy, {
    onSuccess: () => {
      queryClient.invalidateQueries(['managementPolicies']);
    },
  });
};

const deleteManagementPolicy = async (policyId: string) =>
  axiosProv.delete(`managementPolicy/${policyId}`);

export const useDeleteManagementPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation(deleteManagementPolicy, {
    onSuccess: () => {
      queryClient.invalidateQueries(['managementPolicies']);
    },
  });
};
