import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  useToast,
  VStack,
  HStack,
  IconButton,
  Select,
  Textarea,
  Divider,
  Text,
  Flex,
  Collapse,
  RadioGroup,
  Radio,
  Stack
} from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../../api/apiClient';
import LoadingSpinner from '../../../components/LoadingSpinner';

// Define types for our forms and API payloads
type QuestionForm = {
  id: number | string; // Can be number for existing, string for new
  question_id?: number;
  question_title: string;
  question_type: 'TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'DROPDOWN';
  options: string[];
};

interface UpdateSurveyPayload {
  survey_title: string;
  status: 'draft' | 'published' | 'scheduled';
  publish_date?: string | null;
}

export const Route = createFileRoute('/surveys/$surveyId/edit')({
  component: EditSurveyPage,
});

function EditSurveyPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { surveyId } = Route.useParams();

  // State for form fields
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [publishDate, setPublishDate] = useState('');
  const [publishOption, setPublishOption] = useState<'immediately' | 'later'>('immediately');
  const [, setInitialStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');

  // Fetch existing survey data
  // Define type for survey data returned by API
  type SurveyQuestion = {
    question_id: number;
    title: string;
    type: string;
    options: string[] | number[] | null;
  };

  type SurveyData = {
    survey_id: string;
    survey_title: string;
    status: 'draft' | 'published' | 'scheduled';
    publish_date?: string | null;
    questions: SurveyQuestion[];
    created_at?: string;
  };

  const { data: surveyData, isLoading: isLoadingSurvey } = useQuery<{
    data: SurveyData;
  }>({
    queryKey: ['survey', surveyId],
    queryFn: () => api.getSurveyById(surveyId),
    enabled: !!surveyId,
  });

  // Populate form state once data is fetched
  useEffect(() => {
    if (surveyData) {
      const survey = surveyData.data;
      setTitle(survey.survey_title);
      setQuestions(
        (survey.questions ?? []).map((q: any) => ({
          id: q.question_id,
          question_id: q.question_id,
          question_title: q.title || '',
          question_type: q.type || 'TEXT',
          options: q.options ?? [],
        }))
      );
      setInitialStatus(survey.status);

      if (survey.status === 'scheduled' && survey.publish_date) {
        setPublishOption('later');
        const localDate = new Date(survey.publish_date).toISOString().slice(0, 16);
        setPublishDate(localDate);
      }
    }
  }, [surveyData]);

  const surveyMutation = useMutation({
    mutationFn: (updatedSurvey: UpdateSurveyPayload) => api.updateSurvey(surveyId, updatedSurvey),
    onSuccess: async () => {
      // Logic to update/create/delete questions can be added here
      // For simplicity, we'll just show a success message for the survey update
        await Promise.all(
    questions
      .filter(q => q.question_id)
      .map(q =>
        updateQuestionMutation.mutateAsync({
          questionId: q.question_id!,
          data: {
            question_title: q.question_title,
            question_type: q.question_type,
            options: q.options,
          },
        })
      )
  );
      toast({
        title: 'Survey updated.',
        description: "Your survey has been updated successfully.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
      navigate({ to: '/surveys/$surveyId/preview', params: { surveyId } });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed.',
        description: error.response?.data?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
  const updateQuestionMutation = useMutation({
  mutationFn: ({ questionId, data }: { questionId: number, data: Partial<QuestionForm> }) =>
    api.updateQuestion(questionId, data),
  onSuccess: () => {
    // Optionally show a toast or refetch questions
  },
  onError: (error: any) => {
    toast({
      title: 'Question update failed.',
      description: error.response?.data?.message || 'An error occurred.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  },
});

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: `new-${Date.now()}`, question_title: '', question_type: 'TEXT', options: [] }]);
  };

  const handleQuestionChange = (index: number, field: keyof QuestionForm, value: any) => {
    const newQuestions = [...questions];
    if (field === 'options') {
      newQuestions[index][field] = value.split(',').map((opt: string) => opt.trim());
    } else {
      (newQuestions[index] as any)[field] = value;
    }
    if (field === 'question_type' && value === 'TEXT') {
        newQuestions[index].options = [];
    }
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = (status: 'draft' | 'published' | 'scheduled') => {
    if (!title) {
        toast({ title: "Survey Title is required.", status: 'warning', duration: 3000, isClosable: true });
        return;
    }

    const payload: UpdateSurveyPayload = { survey_title: title, status };

    if (status === 'scheduled') {
        if (!publishDate) {
            toast({ title: "Please select a publish date to schedule.", status: 'warning', duration: 3000, isClosable: true });
            return;
        }
        if (new Date(publishDate) <= new Date()) {
            toast({ title: "Scheduled publish date must be in the future.", status: 'warning', duration: 3000, isClosable: true });
            return;
        }
        payload.publish_date = new Date(publishDate).toISOString();
    }

    surveyMutation.mutate(payload);
  };

  const handlePublishClick = () => {
      if (publishOption === 'immediately') {
          handleSubmit('published');
      } else {
          handleSubmit('scheduled');
      }
  }

  if (isLoadingSurvey) {
      return <LoadingSpinner />;
  }

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" mb={6}>
        <Heading size="lg">Edit Survey</Heading>
        <HStack spacing={4} mt={{ base: 4, md: 0 }}>
            <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                isLoading={surveyMutation.isPending && surveyMutation.variables?.status === 'draft'}
            >
                Save Draft
            </Button>
            <Button
                colorScheme="blue"
                onClick={handlePublishClick}
                isLoading={surveyMutation.isPending && (surveyMutation.variables?.status === 'published' || surveyMutation.variables?.status === 'scheduled')}
            >
                Update
            </Button>
        </HStack>
      </Flex>
      <Box bg="white" p={8} borderRadius="lg" boxShadow="base">
        <VStack spacing={6} align="stretch">
          {/* Survey Details */}
          <FormControl isRequired>
            <FormLabel>Survey Title</FormLabel>
            <Input placeholder="e.g., Customer Feedback Q3" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>Survey ID</FormLabel>
            <Input value={surveyId} isReadOnly disabled />
          </FormControl>

          <Divider my={4} />

          {/* Publishing Options */}
          <Box p={4} borderWidth={1} borderRadius="md">
            <Heading size="sm" mb={4}>Publishing</Heading>
            <RadioGroup onChange={(value) => setPublishOption(value as 'immediately' | 'later')} value={publishOption}>
                <Stack direction="column">
                    <Radio value="immediately">Publish Immediately</Radio>
                    <Radio value="later">Publish Later</Radio>
                </Stack>
            </RadioGroup>
            <Collapse in={publishOption === 'later'} animateOpacity>
                <FormControl mt={4}>
                    <FormLabel>Publish Date & Time</FormLabel>
                    <Input
                        type="datetime-local"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                    />
                </FormControl>
            </Collapse>
          </Box>

          <Divider my={4} />

          {/* Questions Section */}
          <Heading size="md">Questions</Heading>
          {questions.map((q, index) => (
            <VStack key={q.id} p={4} borderWidth={1} borderRadius="md" align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Text fontWeight="bold">Question {index + 1}</Text>
                {questions.length > 1 && (
                  <IconButton aria-label="Remove question" icon={<Trash2 size={16} />} size="sm" colorScheme="red" variant="ghost" onClick={() => handleRemoveQuestion(index)} />
                )}
              </HStack>
              <FormControl isRequired><FormLabel>Question Title</FormLabel><Input placeholder="e.g., How was your experience?" value={q.question_title} onChange={(e) => handleQuestionChange(index, 'question_title', e.target.value)} /></FormControl>
              <FormControl isRequired><FormLabel>Question Type</FormLabel><Select value={q.question_type} onChange={(e) => handleQuestionChange(index, 'question_type', e.target.value)}><option value="TEXT">Text</option><option value="MULTIPLE_CHOICE">Multiple Choice</option><option value="CHECKBOX">Checkbox</option><option value="DROPDOWN">Dropdown</option></Select></FormControl>
              {q.question_type !== 'TEXT' && (
                <FormControl isRequired>
                  <FormLabel>Options (comma-separated)</FormLabel>
                  <Textarea
                    placeholder="e.g., Good, Neutral, Bad"
                    value={(q.options ?? []).join(', ')}
                    onChange={(e) => handleQuestionChange(index, 'options', e.target.value)}
                  />
                </FormControl>
              )}
            </VStack>
          ))}
          <Button leftIcon={<Plus size={16} />} onClick={handleAddQuestion} variant="outline" alignSelf="flex-start">Add Question</Button>
        </VStack>
      </Box>
    </Box>
  );
}
