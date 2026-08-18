import React, { useEffect, useState } from 'react';
import { SimpleGrid, useToast } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';
import * as Yup from 'yup';
import StringField from 'components/FormFields/StringField';
import { useCreateSubscriber } from 'hooks/Network/Subscribers';
import useMutationResult from 'hooks/useMutationResult';

const propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  refresh: PropTypes.func.isRequired,
  formRef: PropTypes.instanceOf(Object).isRequired,
  registrationId: PropTypes.string.isRequired,
};

const CreateSubscriberForm = ({ isOpen, onClose, refresh, formRef, registrationId }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [formKey, setFormKey] = useState(uuid());
  const validationSchema = Yup.object().shape({
    email: Yup.string().email(t('form.invalid_email')).required(t('form.required')),
  });
  const { onSuccess, onError } = useMutationResult({
    objName: t('subscribers.one'),
    operationType: 'create',
    onClose,
  });

  const create = useCreateSubscriber();

  useEffect(() => {
    setFormKey(uuid());
  }, [isOpen]);

  return (
    <Formik
      innerRef={formRef}
      key={formKey}
      initialValues={{ email: '' }}
      validationSchema={validationSchema}
      onSubmit={({ email }, { setSubmitting, resetForm }) => {
        if (!registrationId) {
          toast({
            id: `subscriber-create-registration-id-missing`,
            title: t('common.error'),
            description: t('crud.error_create_obj', {
              obj: t('subscribers.one'),
              e: 'Operator registrationId is missing',
            }),
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
          });
          setSubmitting(false);
          return;
        }

        return create.mutateAsync(
          {
            email,
            registrationId,
          },
          {
            onSuccess: () => {
              onSuccess({ setSubmitting, resetForm });
              refresh();
            },
            onError: (e) => {
              onError(e, { setSubmitting });
            },
          },
        );
      }}
    >
      <Form>
        <SimpleGrid minChildWidth="300px" spacing="20px" mb={8}>
          <StringField name="email" label={t('common.email')} isRequired />
        </SimpleGrid>
      </Form>
    </Formik>
  );
};

CreateSubscriberForm.propTypes = propTypes;

export default CreateSubscriberForm;
