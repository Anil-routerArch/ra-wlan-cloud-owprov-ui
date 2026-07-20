import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Note } from 'models/Note';
import { axiosProv } from 'utils/axiosInstances';

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

const getManagementRoles = async () =>
  axiosProv.get('managementRole').then(({ data }) => data.roles as ManagementRole[]);

export const useGetManagementRoles = () =>
  useQuery(['managementRoles'], getManagementRoles, {
    staleTime: 1000 * 60 * 5,
  });

const createManagementRole = async (newRole: ManagementRole) =>
  axiosProv.post(`managementRole/${newRole.id}`, newRole);

export const useCreateManagementRole = () => {
  const queryClient = useQueryClient();
  return useMutation(createManagementRole, {
    onSuccess: () => {
      queryClient.invalidateQueries(['managementRoles']);
    },
  });
};

const updateManagementRole = async (role: ManagementRole) =>
  axiosProv.put(`managementRole/${role.id}`, role);

export const useUpdateManagementRole = () => {
  const queryClient = useQueryClient();
  return useMutation(updateManagementRole, {
    onSuccess: () => {
      queryClient.invalidateQueries(['managementRoles']);
    },
  });
};

const deleteManagementRole = async (roleId: string) =>
  axiosProv.delete(`managementRole/${roleId}`);

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
