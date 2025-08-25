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
  Input,
  useToast,
  VStack,
  Text
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/apiClient';
import { useNavigate } from '@tanstack/react-router';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SurveyPayload {
    survey_title: string;
    status: 'draft';
}

interface QuestionPayload {
    question_title: string;
    question_type: string;
    options?: string[] | null;
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (payload: { survey: SurveyPayload, questions: QuestionPayload[] }) =>
        api.createSurvey(payload.survey),
    onSuccess: async (data, variables) => {
      const newSurveyId = data.data.survey_id;
      const questions = variables.questions;

      if (questions.length > 0) {
          const questionCreationPromises = questions.map(q =>
            api.createQuestion(newSurveyId, q)
          );

          try {
              await Promise.all(questionCreationPromises);
          } catch (error) {
              toast({
                  title: 'Survey created, but failed to import questions.',
                  status: 'error',
                  duration: 5000,
                  isClosable: true,
              });
              return; // Stop if question creation fails
          }
      }

      toast({
        title: 'Survey Imported Successfully.',
        description: 'The survey and its questions have been created.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      navigate({ to: '/surveys/$surveyId/edit', params: { surveyId: newSurveyId } });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Import failed.',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({ title: 'Please select a file.', status: 'warning', duration: 3000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');

      if (lines.length === 0) {
          toast({ title: 'Invalid CSV.', description: 'The file is empty.', status: 'error' });
          return;
      }

      const surveyTitle = lines[0].trim();
      const surveyPayload: SurveyPayload = { survey_title: surveyTitle, status: 'draft' };

      const questionsPayload: QuestionPayload[] = lines.slice(1).map(line => {
          // This regex correctly handles titles with spaces and optional quoted options
          const match = line.match(/^([^,]+),([^,]+)(?:,(.*))?$/);

          if (!match) return null;

          const question_title = match[1]?.trim();
          const question_type = match[2]?.trim().toUpperCase();

          // The options part (match[3]) is optional
          const optionsString = match[3]?.trim().replace(/^"|"$/g, ''); // Remove outer quotes
          const options = optionsString ? optionsString.split(',').map(opt => opt.trim()) : null;

          return { question_title, question_type, options };
      }).filter(Boolean) as QuestionPayload[]; // Filter out any nulls from invalid lines

      mutation.mutate({ survey: surveyPayload, questions: questionsPayload });
    };
    reader.readAsText(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Import Survey from CSV</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Text>Select a CSV file. The first line is the survey title, and subsequent lines are questions in the format: `question title, question type,"option1,option2"`.</Text>
            <Text>To help you get started, click here to download a <a href={import.meta.env.VITE_APP_BASE_URL + '/sample-survey.csv'} download style={{ color: 'blue', textDecoration: 'underline' }}>sample CSV</a>.</Text>
            <FormControl isRequired>
              <FormLabel>CSV File</FormLabel>
              <Input type="file" accept=".csv" onChange={handleFileChange} p={1} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleImport} isLoading={mutation.isPending}>
            Import Survey
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CsvImportModal;
