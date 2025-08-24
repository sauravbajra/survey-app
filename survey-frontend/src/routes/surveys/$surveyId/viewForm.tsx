import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  useToast,
  VStack,
  Text,
  CheckboxGroup,
  Checkbox,
  Stack,
  RadioGroup,
  Radio,
  Select,
  Flex,
  Center
} from '@chakra-ui/react';
import { api } from '../../../api/apiClient';
import LoadingSpinner from '../../../components/LoadingSpinner';

export const Route = createFileRoute('/surveys/$surveyId/viewForm')({
  component: PublicSurveyPage,
});

function PublicSurveyPage() {
  const { surveyId } = Route.useParams();
  const toast = useToast();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<number, string>>({});

  const { data: surveyData, isLoading, isError } = useQuery({
    queryKey: ['publicSurvey', surveyId],
    queryFn: () => api.getPublicSurvey(surveyId),
  });

  const submissionMutation = useMutation({
    mutationFn: (submissionData: any[]) => api.submitPublicSurvey(surveyId, submissionData),
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: 'Submission successful.',
        description: "Thank you for your response!",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission failed.',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<number, string> = {};
    if (survey && survey.questions) {
      survey.questions.forEach((q: Question) => {
        if (q.type === 'CHECKBOX') {
          const val = answers[q.question_id];
          if (!val || (Array.isArray(val) && val.length === 0)) {
            errors[q.question_id] = 'Please select at least one option.';
          }
        }
      });
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({
        title: 'Form Error',
        description: 'Please answer all required questions.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    const submissionPayload = Object.entries(answers).map(([questionId, answerValue]) => ({
      question_id: parseInt(questionId, 10),
      answer_value: answerValue,
    }));
    submissionMutation.mutate(submissionPayload);
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <Center minH="100vh" bg="gray.50">
        <Box p={8} textAlign="center">
          <Heading size="lg" color="gray.600">Survey Not Available</Heading>
          <Text mt={4}>This survey might not be published or the link is incorrect.</Text>
        </Box>
      </Center>
    );
  }

  if (isSubmitted) {
      return (
        <Center minH="100vh" bg="gray.50">
            <Box p={8} textAlign="center">
                <Heading size="xl" color="green.500">Thank You!</Heading>
                <Text mt={4}>Your response has been recorded.</Text>
            </Box>
        </Center>
      );
  }

  const survey = surveyData?.data;

  type Question = {
    question_id: number;
    title: string;
    type: 'TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'DROPDOWN';
    options?: string[];
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'TEXT':
        return <Input onChange={(e) => handleAnswerChange(question.question_id, e.target.value)} />;
      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup onChange={(value) => handleAnswerChange(question.question_id, value)}>
            <Stack>
              {question.options && question.options.map((opt: string) => <Radio key={opt} value={opt}>{opt}</Radio>)}
            </Stack>
          </RadioGroup>
        );
      case 'CHECKBOX':
        return (
          <>
            <CheckboxGroup onChange={(values) => handleAnswerChange(question.question_id, values)}>
              <Stack>
                {question.options && question.options.map((opt: string) => <Checkbox key={opt} value={opt}>{opt}</Checkbox>)}
              </Stack>
            </CheckboxGroup>
            {formErrors[question.question_id] && (
              <Text color="red.500" fontSize="sm" mt={1}>{formErrors[question.question_id]}</Text>
            )}
          </>
        );
      case 'DROPDOWN':
          return (
              <Select placeholder="Select option" onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}>
                  {question.options && question.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
              </Select>
          );
      default:
        return null;
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" p={4}>
      <Box as="form" onSubmit={handleSubmit} bg="white" p={8} borderRadius="lg" boxShadow="lg" w="full" maxW="2xl">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading size="xl">{survey.survey_title}</Heading>
          </Box>
          {survey.questions.map((q: Question) => (
            <FormControl key={q.question_id} isRequired={q.type !== 'CHECKBOX'}>
              <FormLabel fontWeight="bold">{q.title}</FormLabel>
              {renderQuestion(q)}
            </FormControl>
          ))}
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={submissionMutation.isPending}
          >
            Submit Response
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
