import * as React from 'react';
import { useEffect } from 'react';
import { Spinner, Center, useDisclosure, useBoolean, Tag } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../../components/Modals/Modal';
import ActionsDropdown from '../ActionsDropdown';
import UpdateUserForm from './Form';
import SaveButton from 'components/Buttons/SaveButton';
import ToggleEditButton from 'components/Buttons/ToggleEditButton';
import ConfirmCloseAlert from 'components/Modals/Actions/ConfirmCloseAlert';
import { useGetUser, User } from 'hooks/Network/Users';
import useFormRef from 'hooks/useFormRef';

type Props = {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: number;
};

const EditUserModal = ({ isOpen, onClose, userId, defaultTab }: Props) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useBoolean();
  const queryClient = useQueryClient();
  const { isOpen: showConfirm, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();
  const { form, formRef } = useFormRef<User>();
  const canFetchUser = userId !== '' && isOpen;
  const { data: user, isFetching, refetch } = useGetUser({ id: userId ?? '', enabled: canFetchUser });

  const closeModal = () => (form.dirty ? openConfirm() : onClose());

  const closeCancelAndForm = () => {
    closeConfirm();
    onClose();
  };

  const refresh = () => {
    refetch();
    queryClient.invalidateQueries(['users']);
  };

  useEffect(() => {
    if (isOpen) {
      if (defaultTab !== undefined && defaultTab !== 0) {
        setEditing.on();
      } else {
        setEditing.off();
      }
    }
  }, [isOpen, defaultTab]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={user?.name ?? t('crud.edit_obj', { obj: t('user.title') })}
        tags={
          <>
            {user?.suspended ? (
              <Tag colorScheme="yellow" size="lg">
                {t('user.suspended')}
              </Tag>
            ) : null}
            {user?.waitingForEmailCheck ? (
              <Tag colorScheme="blue" size="lg">
                {t('user.email_not_validated')}
              </Tag>
            ) : null}
          </>
        }
        topRightButtons={
          <>
            <SaveButton
              onClick={form.submitForm}
              isLoading={form.isSubmitting}
              isDisabled={!editing || !form.isValid || !form.dirty}
              hidden={!editing}
            />
            <ToggleEditButton ml={2} isEditing={editing} toggleEdit={setEditing.toggle} isDirty={form.dirty} />
            {user ? (
              <ActionsDropdown
                id={user?.id}
                isSuspended={user?.suspended}
                isWaitingForCheck={user?.waitingForEmailCheck}
                refresh={refresh}
                size="md"
                isDisabled={editing}
              />
            ) : null}
          </>
        }
      >
        {!isFetching && user ? (
          <UpdateUserForm editing={editing} selectedUser={user} isOpen={isOpen} onClose={onClose} formRef={formRef} defaultTab={defaultTab} />
        ) : (
          <Center>
            <Spinner />
          </Center>
        )}
      </Modal>
      <ConfirmCloseAlert isOpen={showConfirm} confirm={closeCancelAndForm} cancel={closeConfirm} />
    </>
  );
};

export default EditUserModal;
