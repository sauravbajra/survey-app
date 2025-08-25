import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
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
  Center,
  SlideFade,
} from '@chakra-ui/react';
import { api } from '../../../api/apiClient';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { ArrowRight, CircleUserRound } from 'lucide-react';

export const Route = createFileRoute('/surveys/$surveyId/viewForm')({
  component: PublicSurveyPage,
});

// Define types for the questions and conversation history
type Question = {
  question_id: number;
  title: string;
  type: 'TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'DROPDOWN';
  options?: string[];
};

type ConversationMessage = {
  type: 'question' | 'answer';
  content: any;
  question_title?: string; // For answers, to show what was asked
};

function PublicSurveyPage() {
  const { surveyId } = Route.useParams();
  const toast = useToast();

  // State for the conversational flow
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);

  const {
    data: surveyData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['publicSurvey', surveyId],
    queryFn: () => api.getPublicSurvey(surveyId),
  });

  const submissionMutation = useMutation({
    mutationFn: (submissionData: any[]) =>
      api.submitPublicSurvey(surveyId, submissionData),
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Submission failed.',
        description:
          error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const survey = surveyData?.data;
  const currentQuestion: Question | undefined =
    survey?.questions[currentQuestionIndex];

  // Initialize the conversation with the first question when the survey loads
  useEffect(() => {
    if (survey?.questions?.length > 0 && conversation.length === 0) {
      setConversation([{ type: 'question', content: survey.questions[0] }]);
    }
  }, [survey, conversation.length]);

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNextQuestion = () => {
    if (!currentQuestion) return;

    const currentAnswer = answers[currentQuestion.question_id];
    if (
      currentAnswer === undefined ||
      currentAnswer === '' ||
      (Array.isArray(currentAnswer) && currentAnswer.length === 0)
    ) {
      toast({
        title: 'An answer is required.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newAnswerMessage: ConversationMessage = {
      type: 'answer',
      content: currentAnswer,
      question_title: currentQuestion.title,
    };

    // If it's the last question, submit the survey
    if (currentQuestionIndex === survey.questions.length - 1) {
      setConversation((prev) => [...prev, newAnswerMessage]);
      const submissionPayload = Object.entries(answers).map(
        ([questionId, answerValue]) => ({
          question_id: parseInt(questionId, 10),
          answer_value: answerValue,
        })
      );
      submissionMutation.mutate(submissionPayload);
    } else {
      // Otherwise, add the answer and the next question to the conversation
      const nextQuestion = survey.questions[currentQuestionIndex + 1];
      setConversation((prev) => [
        ...prev,
        newAnswerMessage,
        { type: 'question', content: nextQuestion },
      ]);
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const renderAnswerForDisplay = (answerContent: any) => {
    if (Array.isArray(answerContent)) {
      return answerContent.join(', ');
    }
    return answerContent.toString();
  };

  const renderQuestionInput = (question: Question) => {
    const questionId = question.question_id;
    switch (question.type) {
      case 'TEXT':
        return (
          <Input
            placeholder="Type your answer here..."
            value={answers[questionId] || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
          />
        );
      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup
            value={answers[questionId]}
            onChange={(value) => handleAnswerChange(questionId, value)}
          >
            <Stack>
              {question.options?.map((opt: string) => (
                <Radio key={opt} value={opt}>
                  {opt}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        );
      case 'CHECKBOX':
        return (
          <CheckboxGroup
            value={answers[questionId] || []}
            onChange={(values) => handleAnswerChange(questionId, values)}
          >
            <Stack>
              {question.options?.map((opt: string) => (
                <Checkbox key={opt} value={opt}>
                  {opt}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        );
      case 'DROPDOWN':
        return (
          <Select
            placeholder="Select an option"
            value={answers[questionId] || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
          >
            {question.options?.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        );
      default:
        return null;
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <Center>
        <Box p={8} textAlign="center">
          <Heading size="lg" color="gray.600">
            Survey Not Available
          </Heading>
          <Text mt={4}>
            This survey might not be published or the link is incorrect.
          </Text>
        </Box>
      </Center>
    );
  }

  if (isSubmitted) {
    return (
      <Flex direction="column" py={12}>
        <Box
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="lg"
          w="full"
          maxW="xl"
          mx="auto"
        >
          <Center>
            <Box p={8} textAlign="center">
              <Heading size="xl" color="green.500">
                Thank You!
              </Heading>
              <Text mt={4}>Your response has been recorded.</Text>
            </Box>
          </Center>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex direction="column" py={12}>
      <Box
        bg="white"
        p={8}
        borderRadius="lg"
        boxShadow="lg"
        w="full"
        maxW="xl"
        mx="auto"
      >
        <VStack spacing={4} align="stretch">
          <Box textAlign="center" mb={4}>
            <Heading size="lg">{survey.survey_title}</Heading>
          </Box>

          {/* Chat History */}
          <VStack
            spacing={4}
            align="stretch"
            w="full"
            minH="300px"
            overflowY="auto"
            py={12}
            bg="gray.50"
            borderRadius="md"
          >
            {conversation.map((message, index) => (
              <Flex
                key={index}
                justify={
                  message.type === 'question' ? 'flex-start' : 'flex-end'
                }
                alignItems="flex-end"
              >
                {message.type === 'question' ? (
                  <Box p={1} rounded="full" bg="green.300" color="white" mr={2}>
                    <CircleUserRound size={24} />
                  </Box>
                ) : null}

                <Box
                  bg={message.type === 'question' ? 'gray.200' : 'blue.500'}
                  color={message.type === 'question' ? 'black' : 'white'}
                  px={4}
                  py={2}
                  borderRadius="lg"
                  maxW="80%"
                >
                  {message.type === 'question' ? (
                    <Text fontWeight="bold">{message.content.title}</Text>
                  ) : (
                    <Text>{renderAnswerForDisplay(message.content)}</Text>
                  )}
                </Box>
              </Flex>
            ))}
          </VStack>

          {/* Current Question Input */}
          <Box>
            {currentQuestion && (
              <SlideFade key={currentQuestionIndex} in={true} offsetY="20px">
                <Box pt={4} w="full">
                  {renderQuestionInput(currentQuestion)}
                </Box>
              </SlideFade>
            )}
          </Box>

          <Flex justify="flex-end">
            {survey.questions && survey.questions.length > 0 && (
              <Button
                rightIcon={<ArrowRight size={16} />}
                colorScheme="blue"
                onClick={handleNextQuestion}
                isLoading={submissionMutation.isPending}
                isDisabled={!currentQuestion}
              >
                {currentQuestionIndex === survey.questions.length - 1
                  ? 'Submit'
                  : 'Next'}
              </Button>
            )}
          </Flex>
        </VStack>
      </Box>
    </Flex>
  );
}
