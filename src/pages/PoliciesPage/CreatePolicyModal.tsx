import React, { useState } from 'react';
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
  useDisclosure,
  useToast,
  Grid,
  GridItem,
  Heading,
  Text,
  Divider,
  Box,
} from '@chakra-ui/react';
import { Plus } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';
import {
  useCreateManagementPolicy,
  ManagementPolicy,
} from 'hooks/Network/ManagementRoles';
import { getApiErrorMessage } from 'utils/apiErrorMessage';

const RESOURCES = [
  'entity',
  'venue',
  'configuration',
  'managementRole',
  'device',
];

const ACCESS_LEVELS = ['NOACCESS', 'READ', 'CREATE', 'MODIFY', 'DELETE', 'FULL'];

const CreatePolicyModal = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const createPolicyMutation = useCreateManagementPolicy();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [preset, setPreset] = useState('full'); // 'full', 'read', 'custom'

  // Custom resource states
  const [customAccess, setCustomAccess] = useState<Record<string, string>>(
    RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'READ' }), {}),
  );

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
      // Group by access level to make payload compact
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
      id: uuid(),
      name,
      description,
      entity: '',
      venue: '',
      entries,
    };

    createPolicyMutation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: t('common.success'),
          description: t('crud.success_create_obj', { obj: name }),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        resetForm();
        onClose();
      },
      onError: (e: any) => {
        toast({
          title: t('common.error'),
          description: getApiErrorMessage(e, 'We could not create this policy.'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPreset('full');
    setCustomAccess(RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'READ' }), {}));
  };

  return (
    <>
      <Button colorScheme="blue" leftIcon={<Plus size={18} />} onClick={onOpen}>
        {t('crud.create')}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('crud.create_object', { obj: t('policies.one') })}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem colSpan={2}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">{t('common.name')}</FormLabel>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CSR Policy" />
                </FormControl>
              </GridItem>

              <GridItem colSpan={2}>
                <FormControl>
                  <FormLabel fontSize="sm">{t('common.description')}</FormLabel>
                  <Textarea
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
              <Select value={preset} onChange={(e) => setPreset(e.target.value)}>
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
            <Button colorScheme="gray" mr={3} onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button colorScheme="blue" onClick={handleSave} isLoading={createPolicyMutation.isLoading}>
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreatePolicyModal;
