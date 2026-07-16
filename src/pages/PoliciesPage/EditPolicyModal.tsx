import React, { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useToast,
  Grid,
  GridItem,
  Heading,
  Text,
  Divider,
  Box,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'contexts/AuthProvider';
import {
  useUpdateManagementPolicy,
  ManagementPolicy,
} from 'hooks/Network/ManagementRoles';

const RESOURCES = [
  'customer',
  'entity',
  'venue',
  'inventory',
  'configuration',
  'managementRole',
  'user',
  'device',
];

const ACCESS_LEVELS = ['NOACCESS', 'READ', 'CREATE', 'MODIFY', 'DELETE', 'FULL'];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  policy: ManagementPolicy;
};

const EditPolicyModal = ({ isOpen, onClose, policy }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isRoot = user?.userRole === 'root' || user?.userRole === 'system';
  const toast = useToast();
  const updatePolicyMutation = useUpdateManagementPolicy();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [preset, setPreset] = useState('full'); // 'full', 'read', 'custom'

  // Custom resource states
  const [customAccess, setCustomAccess] = useState<Record<string, string>>(
    RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'READ' }), {}),
  );

  // Sync state with selected policy
  useEffect(() => {
    if (policy) {
      setName(policy.name);
      setDescription(policy.description || '');

      // Detect preset & custom permissions mapping
      const detect = () => {
        const entries = policy.entries || [];
        if (entries.length === 0) {
          return {
            detectedPreset: 'read',
            mapping: RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'NOACCESS' }), {}),
          };
        }

        const isFull =
          entries.length === 1 &&
          entries[0].access.includes('FULL') &&
          entries[0].resources.length === RESOURCES.length;
        if (isFull) {
          return {
            detectedPreset: 'full',
            mapping: RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'FULL' }), {}),
          };
        }

        const isRead =
          entries.length === 1 &&
          entries[0].access.includes('READ') &&
          entries[0].resources.length === RESOURCES.length;
        if (isRead) {
          return {
            detectedPreset: 'read',
            mapping: RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'READ' }), {}),
          };
        }

        // Custom mapping
        const mapping = RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'NOACCESS' }), {} as Record<string, string>);
        entries.forEach((entry) => {
          const accessLvl = entry.access[0];
          entry.resources.forEach((res: string) => {
            mapping[res] = accessLvl;
          });
        });
        return { detectedPreset: 'custom', mapping };
      };

      const { detectedPreset, mapping } = detect();
      setPreset(detectedPreset);
      setCustomAccess(mapping);
    }
  }, [policy, isOpen]);

  const handleAccessChange = (resource: string, access: string) => {
    setCustomAccess((prev) => ({
      ...prev,
      [resource]: access,
    }));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Policy name is required.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    let entries: { resources: string[]; access: string[] }[] = [];

    if (preset === 'full') {
      entries = [
        {
          resources: RESOURCES,
          access: ['FULL'],
        },
      ];
    } else if (preset === 'read') {
      entries = [
        {
          resources: RESOURCES,
          access: ['READ'],
        },
      ];
    } else {
      const accessGroups: Record<string, string[]> = {};
      Object.entries(customAccess).forEach(([resource, access]) => {
        if (access !== 'NOACCESS') {
          if (!accessGroups[access]) {
            accessGroups[access] = [];
          }
          accessGroups[access].push(resource);
        }
      });

      entries = Object.entries(accessGroups).map(([access, resources]) => ({
        resources,
        access: [access],
      }));
    }

    const payload: ManagementPolicy = {
      id: policy.id,
      name,
      description,
      entity: '',
      venue: '',
      entries,
    };

    updatePolicyMutation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: t('common.success'),
          description: t('crud.success_update_obj', { obj: name }),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      },
      onError: (e: any) => {
        toast({
          title: t('common.error'),
          description: e?.response?.data?.ErrorDescription || 'Failed to update policy.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isRoot
            ? t('crud.edit_obj', { obj: t('policies.one') })
            : `${t('common.view', { defaultValue: 'View' })} ${t('policies.one')}`}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <GridItem colSpan={2}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">{t('common.name')}</FormLabel>
                <Input
                  isDisabled={!isRoot}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CSR Policy"
                />
              </FormControl>
            </GridItem>

            <GridItem colSpan={2}>
              <FormControl>
                <FormLabel fontSize="sm">{t('common.description')}</FormLabel>
                <Textarea
                  isDisabled={!isRoot}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write policy description..."
                  rows={2}
                />
              </FormControl>
            </GridItem>
          </Grid>

          <Divider my={4} />

          <Heading size="xs" mb={2}>
            Permissions Configuration
          </Heading>
          <FormControl mb={4}>
            <FormLabel fontSize="sm">Access Profile Preset</FormLabel>
            <Select isDisabled={!isRoot} value={preset} onChange={(e) => setPreset(e.target.value)}>
              <option value="full">Full Access (All Permissions)</option>
              <option value="read">Read-Only (All View Permissions)</option>
              <option value="custom">Custom Permissions Grid</option>
            </Select>
          </FormControl>

          {preset === 'custom' && (
            <Box border="1px" borderColor="gray.200" borderRadius="md" p={3} bg="gray.50">
              <Grid templateColumns="1fr 1fr" gap={2} alignItems="center">
                <GridItem fontWeight="bold" fontSize="xs" color="gray.600">
                  Resource Name
                </GridItem>
                <GridItem fontWeight="bold" fontSize="xs" color="gray.600">
                  Access Level
                </GridItem>
                {RESOURCES.map((resource) => (
                  <React.Fragment key={resource}>
                    <GridItem>
                      <Text fontSize="sm" textTransform="capitalize" fontWeight="medium">
                        {resource === 'managementRole' ? 'roles & policies' : resource}
                      </Text>
                    </GridItem>
                    <GridItem>
                      <Select
                        isDisabled={!isRoot}
                        size="xs"
                        value={customAccess[resource]}
                        bg="white"
                        onChange={(e) => handleAccessChange(resource, e.target.value)}
                      >
                        {ACCESS_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </Select>
                    </GridItem>
                  </React.Fragment>
                ))}
              </Grid>
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          {isRoot ? (
            <>
              <Button colorScheme="gray" mr={3} onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button colorScheme="blue" onClick={handleSave} isLoading={updatePolicyMutation.isLoading}>
                {t('common.save')}
              </Button>
            </>
          ) : (
            <Button colorScheme="blue" onClick={onClose}>
              {t('common.close') || 'Close'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditPolicyModal;
