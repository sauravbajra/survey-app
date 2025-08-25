import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  useToast,
  VStack,
  Text,
  Textarea,
  HStack,
  Input,
  Divider,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/apiClient';
import { Copy } from 'lucide-react';

interface SendSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string | null;
}

const SendSurveyModal: React.FC<SendSurveyModalProps> = ({
  isOpen,
  onClose,
  surveyId,
}) => {
  const [emails, setEmails] = useState('');
  const toast = useToast();
  const publicUrl = surveyId
    ? `${window.location.origin}/surveys/${surveyId}/viewForm`
    : '';

  const mutation = useMutation({
    mutationFn: (emailList: string[]) =>
      api.sendSurveyByEmail(surveyId!, emailList),
    onSuccess: () => {
      toast({
        title: 'Survey Sent.',
        description: 'The survey link has been emailed to the recipients.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      setEmails('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send.',
        description:
          error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSend = () => {
    if (!emails.trim()) {
      toast({
        title: 'Please enter at least one email address.',
        status: 'warning',
      });
      return;
    }
    const emailList = emails
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
    mutation.mutate(emailList);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast({
        title: 'Public link copied!',
        description: 'The link has been copied to your clipboard.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Share Survey</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Public Survey Link</FormLabel>
              <HStack>
                <Input value={publicUrl} isReadOnly />
                <Button leftIcon={<Copy size={16} />} onClick={handleCopyLink}>
                  Copy
                </Button>
              </HStack>
            </FormControl>

            <Divider />

            <Text>
              Or, enter recipient email addresses, separated by commas.
            </Text>
            <FormControl>
              <FormLabel>Send via Email</FormLabel>
              <Textarea
                placeholder="example1@test.com, example2@test.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSend}
            isLoading={mutation.isPending}
          >
            Send Emails
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SendSurveyModal;
