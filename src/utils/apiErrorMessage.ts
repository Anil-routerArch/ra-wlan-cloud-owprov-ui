import { isApiError } from 'models/Axios';

const stripErrorCodePrefix = (message: string) => message.replace(/^\s*\d+\s*:\s*/, '').trim();

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!isApiError(error)) {
    return fallback;
  }

  const rawMessage = stripErrorCodePrefix(error.response?.data?.ErrorDescription || '');
  const lowerMessage = rawMessage.toLowerCase();

  if (!rawMessage) {
    return fallback;
  }

  if (lowerMessage.includes('access denied')) {
    return 'You do not have permission to do that.';
  }

  if (lowerMessage.includes('requester has no role on the target scope')) {
    return 'You can only assign access within a scope that is already assigned to you.';
  }

  if (lowerMessage.includes('requester does not have full permission')) {
    return 'You cannot assign full access because your own access in this scope is lower.';
  }

  if (lowerMessage.includes('requester does not have')) {
    return 'You cannot assign a policy with more access than you have in this scope.';
  }

  if (lowerMessage.includes('unknown management policy')) {
    return 'The selected policy could not be found.';
  }

  if (lowerMessage.includes('entity must exist')) {
    return 'Please select a valid entity.';
  }

  if (lowerMessage.includes('venue must exist')) {
    return 'Please select a valid venue.';
  }

  if (lowerMessage.includes('missing user id')) {
    return 'Please select a valid user before saving.';
  }

  if (lowerMessage.includes('still in use')) {
    return 'This item is still in use and cannot be deleted yet.';
  }

  if (lowerMessage.includes('only root may assign the root user role')) {
    return 'Only a root user can assign the Root role.';
  }

  return rawMessage;
};
