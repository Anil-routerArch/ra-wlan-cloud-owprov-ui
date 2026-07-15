import React, { useState, useEffect } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Select,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Box,
  Flex,
  useToast,
  Divider,
  Input,
} from '@chakra-ui/react';
import { Trash, Plus } from '@phosphor-icons/react';
import { v4 as uuid } from 'uuid';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'contexts/AuthProvider';
import {
  useGetManagementRoles,
  useCreateManagementRole,
  useDeleteManagementRole,
  useGetEntities,
  useGetVenues,
  useGetManagementPolicies,
  useCreateManagementPolicy,
} from 'hooks/Network/ManagementRoles';

type Props = {
  userId: string;
};

export const ManagementRolesTable = ({ userId }: Props) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuth();
  const isRoot = user?.userRole === 'root' || user?.userRole === 'system';

  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');

  // Policy creation states (Root only)
  const [policyName, setPolicyName] = useState('');
  const [policyEntity, setPolicyEntity] = useState('');
  const [policyVenue, setPolicyVenue] = useState('');
  const [policyPreset, setPolicyPreset] = useState('full');

  const { data: roles, isLoading: rolesLoading, error: rolesError } = useGetManagementRoles();
  const { data: entities, isLoading: entitiesLoading } = useGetEntities();
  const { data: venues, isLoading: venuesLoading } = useGetVenues();
  const { data: policies, isLoading: policiesLoading } = useGetManagementPolicies();

  const createRoleMutation = useCreateManagementRole();
  const deleteRoleMutation = useDeleteManagementRole();
  const createPolicyMutation = useCreateManagementPolicy();

  const userRoles = roles ? roles.filter(role => role.users.includes(userId)) : [];

  useEffect(() => {
    if (policies && policies.length > 0 && !selectedPolicy) {
      setSelectedPolicy(policies[0].id);
    }
  }, [policies]);

  const handleCreate = async () => {
    if (!selectedEntity) {
      toast({
        title: 'Error',
        description: 'Please select an Entity.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!selectedPolicy) {
      toast({
        title: 'Error',
        description: 'Please select a Policy.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newRole = {
      id: uuid(),
      name: `Role-${uuid().substring(0, 8)}`,
      description: `User role assignment`,
      managementPolicy: selectedPolicy,
      users: [userId],
      entity: selectedEntity,
      venue: selectedVenue,
    };

    createRoleMutation.mutate(newRole, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Role scope assigned successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setSelectedEntity('');
        setSelectedVenue('');
      },
      onError: (e: any) => {
        toast({
          title: 'Error',
          description: e?.response?.data?.ErrorDescription || 'Failed to assign role scope.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };

  const handleCreatePolicy = () => {
    if (!policyName) {
      toast({
        title: 'Error',
        description: 'Please specify a policy name.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!policyEntity) {
      toast({
        title: 'Error',
        description: 'Please select an Entity for the policy.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!policyVenue) {
      toast({
        title: 'Error',
        description: 'Please select a Venue for the policy.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    let entries: { resources: string[]; access: string[] }[] = [];
    if (policyPreset === 'full') {
      entries = [
        {
          resources: ['customer', 'entity', 'venue', 'inventory', 'configuration', 'managementRole', 'user', 'device'],
          access: ['FULL'],
        },
      ];
    } else if (policyPreset === 'read') {
      entries = [
        {
          resources: ['customer', 'entity', 'venue', 'inventory', 'configuration', 'device'],
          access: ['READ'],
        },
      ];
    }

    const newPolicy = {
      id: uuid(),
      name: policyName,
      description: `Custom policy created by root`,
      entity: policyEntity,
      venue: policyVenue,
      entries,
    };

    createPolicyMutation.mutate(newPolicy, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Custom management policy created.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setPolicyName('');
        setPolicyEntity('');
        setPolicyVenue('');
      },
      onError: (e: any) => {
        toast({
          title: 'Error',
          description: e?.response?.data?.ErrorDescription || 'Failed to create policy.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };

  const handleDelete = (roleId: string) => {
    deleteRoleMutation.mutate(roleId, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Role scope revoked.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (e: any) => {
        toast({
          title: 'Error',
          description: e?.response?.data?.ErrorDescription || 'Failed to revoke role.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };

  const getEntityName = (id: string) => {
    const found = entities?.find(e => e.id === id);
    return found ? found.name : id;
  };

  const getVenueName = (id: string) => {
    if (!id) return 'Entity-wide';
    const found = venues?.find(v => v.id === id);
    return found ? found.name : id;
  };

  const getPolicyName = (id: string) => {
    const found = policies?.find(p => p.id === id);
    return found ? found.name : id;
  };

  const filteredVenues = venues ? venues.filter(v => v.entity === selectedEntity) : [];

  if (rolesLoading || entitiesLoading || venuesLoading || policiesLoading) {
    return (
      <Flex justify="center" align="center" py={4}>
        <Spinner size="md" />
      </Flex>
    );
  }

  if (rolesError) {
    return (
      <Alert status="error" my={4}>
        <AlertIcon />
        Failed to load management roles.
      </Alert>
    );
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" w="100%">
      <Heading size="sm" mb={4}>Scoped Management Role Assignments</Heading>
      
      {userRoles.length === 0 ? (
        <Alert status="info" mb={4}>
          <AlertIcon />
          No entities or venues assigned to this user.
        </Alert>
      ) : (
        <Table variant="simple" size="sm" mb={6}>
          <Thead>
            <Tr>
              <Th>Entity</Th>
              <Th>Venue</Th>
              <Th>Assigned Role (Policy)</Th>
              <Th w="50px"></Th>
            </Tr>
          </Thead>
          <Tbody>
            {userRoles.map((role) => (
              <Tr key={role.id}>
                <Td>{getEntityName(role.entity)}</Td>
                <Td>{getVenueName(role.venue)}</Td>
                <Td>{getPolicyName(role.managementPolicy)}</Td>
                <Td>
                  <IconButton
                    aria-label="Revoke role"
                    colorScheme="red"
                    size="sm"
                    icon={<Trash size={18} />}
                    onClick={() => handleDelete(role.id)}
                    isLoading={deleteRoleMutation.isLoading}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Divider my={4} />

      <Heading size="xs" mb={3}>Assign New Entity or Venue Scope</Heading>
      <Flex gap={4} wrap="wrap" align="flex-end">
        <FormControl maxW="200px" isRequired>
          <FormLabel fontSize="xs">Entity</FormLabel>
          <Select
            placeholder="Select Entity"
            size="sm"
            value={selectedEntity}
            onChange={(e) => {
              setSelectedEntity(e.target.value);
              setSelectedVenue('');
            }}
          >
            {entities?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl maxW="200px">
          <FormLabel fontSize="xs">Venue (Optional)</FormLabel>
          <Select
            placeholder="Entity-wide"
            size="sm"
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            disabled={!selectedEntity}
          >
            {filteredVenues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl maxW="200px" isRequired>
          <FormLabel fontSize="xs">Role</FormLabel>
          <Select
            size="sm"
            value={selectedPolicy}
            onChange={(e) => setSelectedPolicy(e.target.value)}
          >
            {policies?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <Button
          colorScheme="blue"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={handleCreate}
          isLoading={createRoleMutation.isLoading}
        >
          Assign Scope
        </Button>
      </Flex>

      {isRoot && (
        <>
          <Divider my={6} />
          <Heading size="xs" mb={3}>Create Custom Management Policy (Root Only)</Heading>
          <Flex gap={4} wrap="wrap" align="flex-end">
            <FormControl maxW="200px" isRequired>
              <FormLabel fontSize="xs">Policy Name</FormLabel>
              <Input
                placeholder="Policy Name"
                size="sm"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
              />
            </FormControl>

            <FormControl maxW="200px" isRequired>
              <FormLabel fontSize="xs">Entity</FormLabel>
              <Select
                placeholder="Select Entity"
                size="sm"
                value={policyEntity}
                onChange={(e) => {
                  setPolicyEntity(e.target.value);
                  setPolicyVenue('');
                }}
              >
                {entities?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl maxW="200px" isRequired>
              <FormLabel fontSize="xs">Venue</FormLabel>
              <Select
                placeholder="Select Venue"
                size="sm"
                value={policyVenue}
                onChange={(e) => setPolicyVenue(e.target.value)}
                disabled={!policyEntity}
              >
                {venues?.filter(v => v.entity === policyEntity).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl maxW="200px" isRequired>
              <FormLabel fontSize="xs">Access Preset</FormLabel>
              <Select
                size="sm"
                value={policyPreset}
                onChange={(e) => setPolicyPreset(e.target.value)}
              >
                <option value="full">Full Access</option>
                <option value="read">Read Only</option>
              </Select>
            </FormControl>

            <Button
              colorScheme="teal"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={handleCreatePolicy}
              isLoading={createPolicyMutation.isLoading}
            >
              Create Policy
            </Button>
          </Flex>
        </>
      )}
    </Box>
  );
};
