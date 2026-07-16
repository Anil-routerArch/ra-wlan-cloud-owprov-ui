import React, { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Grid,
  GridItem,
  Heading,
  Text,
  Divider,
  Box,
  Badge,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ManagementPolicy } from 'hooks/Network/ManagementRoles';

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

type Props = {
  isOpen: boolean;
  onClose: () => void;
  policy: ManagementPolicy;
};

const ViewPolicyModal = ({ isOpen, onClose, policy }: Props) => {
  const { t } = useTranslation();
  const [access, setAccess] = useState<Record<string, string>>({});

  useEffect(() => {
    if (policy) {
      const entries = policy.entries || [];
      if (entries.length === 0) {
        setAccess(RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'NOACCESS' }), {}));
        return;
      }

      const isFull =
        entries.length === 1 &&
        entries[0].access.includes('FULL') &&
        entries[0].resources.length === RESOURCES.length;
      if (isFull) {
        setAccess(RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'FULL' }), {}));
        return;
      }

      const isRead =
        entries.length === 1 &&
        entries[0].access.includes('READ') &&
        entries[0].resources.length === RESOURCES.length;
      if (isRead) {
        setAccess(RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'READ' }), {}));
        return;
      }

      // Custom mapping
      const mapping = RESOURCES.reduce((acc, r) => ({ ...acc, [r]: 'NOACCESS' }), {} as Record<string, string>);
      entries.forEach((entry) => {
        const accessLvl = entry.access[0];
        entry.resources.forEach((res: string) => {
          mapping[res] = accessLvl;
        });
      });
      setAccess(mapping);
    }
  }, [policy, isOpen]);

  const getBadgeColor = (lvl: string) => {
    switch (lvl) {
      case 'FULL':
        return 'green';
      case 'MODIFY':
      case 'CREATE':
      case 'DELETE':
        return 'blue';
      case 'READ':
        return 'teal';
      default:
        return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{policy?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mb={4}>
            <Text fontSize="sm" fontWeight="bold" mb={1} color="gray.600">
              {t('common.description')}
            </Text>
            <Text fontSize="sm" color="gray.700">
              {policy?.description || 'No description provided.'}
            </Text>
          </Box>

          <Divider my={4} />

          <Heading size="xs" mb={3} color="gray.600">
            Policy Permissions Grid
          </Heading>

          <Box border="1px" borderColor="gray.200" borderRadius="md" p={3} bg="gray.50">
            <Grid templateColumns="1fr 1fr" gap={3} alignItems="center">
              <GridItem fontWeight="bold" fontSize="xs" color="gray.600" textTransform="uppercase">
                Resource Name
              </GridItem>
              <GridItem fontWeight="bold" fontSize="xs" color="gray.600" textTransform="uppercase">
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
                    <Badge colorScheme={getBadgeColor(access[resource] || 'NOACCESS')}>
                      {access[resource] || 'NOACCESS'}
                    </Badge>
                  </GridItem>
                </React.Fragment>
              ))}
            </Grid>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            {t('common.close') || 'Close'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ViewPolicyModal;
