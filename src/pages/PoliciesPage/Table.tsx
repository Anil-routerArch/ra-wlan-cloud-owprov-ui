import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Pencil, Trash, Eye } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';
import CreatePolicyModal from './CreatePolicyModal';
import EditPolicyModal from './EditPolicyModal';
import ViewPolicyModal from './ViewPolicyModal';
import RefreshButton from 'components/Buttons/RefreshButton';
import { useAuth } from 'contexts/AuthProvider';
import Card from 'components/Card';
import CardBody from 'components/Card/CardBody';
import CardHeader from 'components/Card/CardHeader';
import DataTable from 'components/DataTable';
import {
  useGetManagementPolicies,
  useDeleteManagementPolicy,
  useGetEntities,
  useGetVenues,
  ManagementPolicy,
} from 'hooks/Network/ManagementRoles';
import { Column } from 'models/Table';

const PolicyTable = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isRoot = user?.userRole === 'root' || user?.userRole === 'system';
  const toast = useToast();
  const [editPolicy, setEditPolicy] = useState<ManagementPolicy | null>(null);
  const [viewPolicy, setViewPolicy] = useState<ManagementPolicy | null>(null);
  const { isOpen: editOpen, onOpen: openEdit, onClose: closeEdit } = useDisclosure();
  const { isOpen: viewOpen, onOpen: openView, onClose: closeView } = useDisclosure();

  const { data: policies, refetch: refreshPolicies, isFetching } = useGetManagementPolicies();
  const { data: entities } = useGetEntities();
  const { data: venues } = useGetVenues();
  const deletePolicyMutation = useDeleteManagementPolicy();

  const getEntityName = (id: string) => {
    const found = entities?.find((e) => e.id === id);
    return found ? found.name : id;
  };

  const getVenueName = (id: string) => {
    if (!id) return 'Entity-wide';
    const found = venues?.find((v) => v.id === id);
    return found ? found.name : id;
  };

  const handleDeletePolicy = (policy: ManagementPolicy, closePopover: () => void) => {
    deletePolicyMutation.mutate(policy.id, {
      onSuccess: () => {
        closePopover();
        toast({
          id: `policy-delete-success-${uuid()}`,
          title: t('common.success'),
          description: t('crud.success_delete_obj', { obj: policy.name }),
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      },
      onError: (e: any) => {
        closePopover();
        toast({
          id: `policy-delete-error-${uuid()}`,
          title: t('common.error'),
          description: e?.response?.data?.ErrorDescription || 'Failed to delete policy.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
      },
    });
  };

  const handleEditClick = (policy: ManagementPolicy) => {
    setEditPolicy(policy);
    openEdit();
  };

  const handleViewClick = (policy: ManagementPolicy) => {
    setViewPolicy(policy);
    openView();
  };

  const PolicyActions = ({ policy }: { policy: ManagementPolicy }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return (
      <Flex>
        <Tooltip hasArrow label={t('crud.view') || 'View'} placement="top">
          <IconButton
            aria-label={t('crud.view') || 'View'}
            colorScheme="teal"
            icon={<Eye size={20} />}
            size="sm"
            onClick={() => handleViewClick(policy)}
            mr={isRoot ? 2 : 0}
          />
        </Tooltip>

        {isRoot && (
          <>
            <Tooltip hasArrow label={t('crud.edit')} placement="top">
              <IconButton
                aria-label={t('crud.edit')}
                colorScheme="blue"
                icon={<Pencil size={20} />}
                size="sm"
                onClick={() => handleEditClick(policy)}
                mr={2}
              />
            </Tooltip>

            <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
              <Tooltip hasArrow label={t('crud.delete')} placement="top" isDisabled={isOpen}>
                <Box>
                  <PopoverTrigger>
                    <IconButton aria-label={t('crud.delete')} colorScheme="red" icon={<Trash size={20} />} size="sm" />
                  </PopoverTrigger>
                </Box>
              </Tooltip>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader>Delete {policy.name}</PopoverHeader>
                <PopoverBody>Are you sure you want to delete this management policy?</PopoverBody>
                <PopoverFooter>
                  <Center>
                    <Button colorScheme="gray" mr="1" size="sm" onClick={onClose}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      colorScheme="red"
                      ml="1"
                      size="sm"
                      onClick={() => handleDeletePolicy(policy, onClose)}
                      isLoading={deletePolicyMutation.isLoading}
                    >
                      {t('common.yes')}
                    </Button>
                  </Center>
                </PopoverFooter>
              </PopoverContent>
            </Popover>
          </>
        )}
      </Flex>
    );
  };

  const columns = React.useMemo(() => {
    const baseColumns: Column<ManagementPolicy>[] = [
      {
        id: 'name',
        Header: t('common.name'),
        Footer: '',
        accessor: 'name',
        customWidth: '200px',
        customMinWidth: '150px',
      },
      {
        id: 'entity',
        Header: t('entities.one'),
        Footer: '',
        accessor: 'entity',
        Cell: ({ cell }) => getEntityName(cell.row.original.entity),
        customWidth: '150px',
      },
      {
        id: 'venue',
        Header: t('venues.one'),
        Footer: '',
        accessor: 'venue',
        Cell: ({ cell }) => getVenueName(cell.row.original.venue),
        customWidth: '150px',
      },
      {
        id: 'description',
        Header: t('common.description'),
        Footer: '',
        accessor: 'description',
      },
      {
        id: 'actions',
        Header: t('common.actions'),
        Footer: '',
        accessor: 'id',
        customWidth: '100px',
        Cell: ({ cell }) => <PolicyActions policy={cell.row.original} />,
        disableSortBy: true,
        alwaysShow: true,
      },
    ];

    return baseColumns;
  }, [t, entities, venues]);

  return (
    <>
      <Card>
        <CardHeader mb="10px">
          <Flex w="100%" flexDirection="row" alignItems="center">
            <Heading size="md">{t('policies.title')}</Heading>
            <Box ms="auto">
              {isRoot && <CreatePolicyModal />}
              <RefreshButton onClick={refreshPolicies} isFetching={isFetching} ml={2} />
            </Box>
          </Flex>
        </CardHeader>
        <CardBody>
          <Box overflowX="auto" w="100%">
            <DataTable<ManagementPolicy>
              columns={columns}
              data={policies ?? []}
              isLoading={isFetching}
              obj={t('policies.one')}
              sortBy={[{ id: 'name', desc: false }]}
              hiddenColumns={[]}
              fullScreen
            />
          </Box>
        </CardBody>
      </Card>
      {editPolicy && (
        <EditPolicyModal isOpen={editOpen} onClose={closeEdit} policy={editPolicy} />
      )}
      {viewPolicy && (
        <ViewPolicyModal isOpen={viewOpen} onClose={closeView} policy={viewPolicy} />
      )}
    </>
  );
};

export default PolicyTable;
