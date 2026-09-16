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
  axiosProv
    .get('managementRole', { params: userId ? { userId } : undefined })
    .then(({ data }) => data.roles as ManagementRole[]);

export const useGetManagementRoles = (userId?: string) =>
  useQuery(['managementRoles', userId], () => getManagementRoles(userId), {
    enabled: userId !== undefined ? !!userId : true,
    staleTime: 1000 * 60 * 5,
  });

export const getManagementRole = async (roleId: string, expandInUse?: boolean) =>
  axiosProvV2
    .get(`managementRole/${roleId}`, { params: expandInUse ? { expandInUse } : undefined })
    .then(({ data }) => data);

export const useGetManagementRole = (roleId: string, expandInUse?: boolean) =>
  useQuery(['managementRole', roleId, expandInUse], () => getManagementRole(roleId, expandInUse), {
    enabled: !!roleId,
  });

const createManagementRole = async (newRole: ManagementRole) =>
  axiosProvV2.post('managementRole/0', newRole).then(({ data }) => data.roles as ManagementRole[]);

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
    onSuccess: () => {
      queryClient.invalidateQueries(['managementRoles']);
    },
  });
};

const deleteManagementRole = async (roleId: string) =>
  axiosProvV2.delete(`managementRole/${roleId}`);

export const useDeleteManagementRole = () => {
  const queryClient = useQueryClient();
  return useMutation(deleteManagementRole, {
    onSuccess: () => {
      queryClient.invalidateQueries(['managementRoles']);
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
