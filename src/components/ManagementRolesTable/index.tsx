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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
} from '@chakra-ui/react';
import { Trash, Plus, Info } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';
import { useAuth } from 'contexts/AuthProvider';
import {
  useGetManagementRoles,
  useCreateManagementRole,
  useDeleteManagementRole,
  useGetEntities,
  useGetVenues,
  useGetManagementPolicies,
} from 'hooks/Network/ManagementRoles';

type Props = {
  userId: string;
};

export const ManagementRolesTable = ({ userId }: Props) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuth();
  const isRoot = user?.userRole === 'root' || user?.userRole === 'system';
  const { isOpen: isInfoOpen, onOpen: onOpenInfo, onClose: onCloseInfo } = useDisclosure();

  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');



  const { data: roles, isLoading: rolesLoading, error: rolesError } = useGetManagementRoles();
  const { data: entities, isLoading: entitiesLoading } = useGetEntities();
  const { data: venues, isLoading: venuesLoading } = useGetVenues();
  const { data: policies, isLoading: policiesLoading } = useGetManagementPolicies();

  const createRoleMutation = useCreateManagementRole();
  const deleteRoleMutation = useDeleteManagementRole();


  const userRoles = roles ? roles.filter(role => Array.isArray(role.users) && role.users.includes(userId)) : [];
  const currentPolicy = policies?.find(p => p.id === selectedPolicy);

  const getPolicyPermissions = (policy: any) => {
    if (!policy) return [];
    const map: Record<string, string> = {};
    if (Array.isArray(policy.entries)) {
      policy.entries.forEach((entry: any) => {
        const access = entry.access[0] || 'NOACCESS';
        if (Array.isArray(entry.resources)) {
          entry.resources.forEach((res: string) => {
            map[res] = access;
          });
        }
      });
    }
    const resources = ['customer', 'entity', 'venue', 'inventory', 'configuration', 'managementRole', 'user', 'device'];
    return resources.map(res => ({
      resource: res === 'managementRole' ? 'roles & policies' : res,
      access: map[res] || 'NOACCESS'
    }));
  };

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
              <Th w="50px" />
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

        <FormControl maxW="240px" isRequired>
          <FormLabel fontSize="xs">Role</FormLabel>
          <Flex align="center" gap={1}>
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
            <IconButton
              aria-label="View role details"
              icon={<Info size={18} />}
              size="sm"
              variant="ghost"
              onClick={onOpenInfo}
              isDisabled={!selectedPolicy}
            />
          </Flex>
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

      <Modal isOpen={isInfoOpen} onClose={onCloseInfo} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Role Details: {currentPolicy?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {currentPolicy?.description && (
              <Text fontSize="sm" color="gray.600" mb={4}>
                {currentPolicy.description}
              </Text>
            )}
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Resource</Th>
                  <Th>Access Level</Th>
                </Tr>
              </Thead>
              <Tbody>
                {getPolicyPermissions(currentPolicy).map((p) => (
                  <Tr key={p.resource}>
                    <Td textTransform="capitalize" fontSize="xs">{p.resource}</Td>
                    <Td fontWeight="bold" fontSize="xs" color={p.access === 'NOACCESS' ? 'gray.400' : 'blue.600'}>
                      {p.access}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
