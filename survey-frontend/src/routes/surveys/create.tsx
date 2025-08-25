import { useState } from 'react';
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  Stack,
} from '@chakra-ui/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/apiClient';

type QuestionForm = {
  id: number;
  question_title: string;
  question_type: 'TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'DROPDOWN';
  options: string[];
};

interface CreateSurveyPayload {
  survey_title: string;
  status: 'draft' | 'published' | 'scheduled';
  publish_date?: string | null;
}

export const Route = createFileRoute('/surveys/create')({
  component: CreateSurveyPage,
});

function CreateSurveyPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const router = useRouter();

  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { id: 1, question_title: '', question_type: 'TEXT', options: [] },
  ]);
  const [publishDate, setPublishDate] = useState('');
  const [publishOption, setPublishOption] = useState<'immediately' | 'later'>(
    'immediately'
  );

  const surveyMutation = useMutation({
    mutationFn: (newSurvey: CreateSurveyPayload) => api.createSurvey(newSurvey),
    onSuccess: async (data) => {
      const newSurveyId = data.data.survey_id;

      const questionCreationPromises = questions.map((q) =>
        api.createQuestion(newSurveyId, {
          question_title: q.question_title,
          question_type: q.question_type,
          options: q.question_type === 'TEXT' ? null : q.options,
        })
      );

      try {
        await Promise.all(questionCreationPromises);
        toast({
          title: 'Survey saved.',
          description: 'Your survey has been saved successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        queryClient.invalidateQueries({ queryKey: ['surveys'] });
        navigate({
          to: '/surveys/$surveyId/viewDetails',
          params: { surveyId: newSurveyId },
        });
      } catch (error: any) {
        toast({
          title: 'Survey created, but failed to add questions.',
          description: error.response?.data?.message || 'An error occurred.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Survey creation failed.',
        description: error.response?.data?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        question_title: '',
        question_type: 'TEXT',
        options: [],
      },
    ]);
  };

  const handleQuestionChange = (
    index: number,
    field: keyof QuestionForm,
    value: any
  ) => {
    const newQuestions = [...questions];
    if (field === 'options') {
      newQuestions[index][field] = value
        .split(',')
        .map((opt: string) => opt.trim());
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
      toast({
        title: 'Survey Title is required.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const payload: CreateSurveyPayload = { survey_title: title, status };

    if (status === 'scheduled') {
      if (!publishDate) {
        toast({
          title: 'Please select a publish date to schedule.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (new Date(publishDate) <= new Date()) {
        toast({
          title: 'Scheduled publish date must be in the future.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
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
  };

  return (
    <Box>
      <Button
        variant="link"
        leftIcon={<ArrowLeft size={16} />}
        onClick={() => router.history.back()}
        colorScheme="gray"
        mb={4}
        style={{ textDecoration: 'none' }}
      >
        Back
      </Button>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align="center"
        mb={6}
      >
        <Heading size="lg">Create a New Survey</Heading>
        <HStack spacing={4} mt={{ base: 4, md: 0 }}>
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            isLoading={
              surveyMutation.isPending &&
              surveyMutation.variables?.status === 'draft'
            }
          >
            Save Draft
          </Button>
          <Button
            colorScheme="blue"
            onClick={handlePublishClick}
            isLoading={
              surveyMutation.isPending &&
              (surveyMutation.variables?.status === 'published' ||
                surveyMutation.variables?.status === 'scheduled')
            }
          >
            Publish
          </Button>
        </HStack>
      </Flex>
      <Box bg="white" p={8} borderRadius="lg" boxShadow="base">
        <VStack spacing={6} align="stretch">
          <FormControl isRequired>
            <FormLabel>Survey Title</FormLabel>
            <Input
              placeholder="e.g., Customer Feedback Q3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormControl>

          <Divider my={4} />

          <Box p={4} borderWidth={1} borderRadius="md">
            <Heading size="sm" mb={4}>
              Publishing
            </Heading>
            <RadioGroup
              onChange={(v) => setPublishOption(v as 'immediately' | 'later')}
              value={publishOption}
            >
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

          <Heading size="md">Questions</Heading>
          {questions.map((q, index) => (
            <VStack
              key={q.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              align="stretch"
              spacing={4}
            >
              <HStack justify="space-between">
                <Text fontWeight="bold">Question {index + 1}</Text>
                {questions.length > 1 && (
                  <IconButton
                    aria-label="Remove question"
                    icon={<Trash2 size={16} />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleRemoveQuestion(index)}
                  />
                )}
              </HStack>
              <FormControl isRequired>
                <FormLabel>Question Title</FormLabel>
                <Input
                  placeholder="e.g., How was your experience?"
                  value={q.question_title}
                  onChange={(e) =>
                    handleQuestionChange(
                      index,
                      'question_title',
                      e.target.value
                    )
                  }
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Question Type</FormLabel>
                <Select
                  value={q.question_type}
                  onChange={(e) =>
                    handleQuestionChange(index, 'question_type', e.target.value)
                  }
                >
                  <option value="TEXT">Text</option>
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="CHECKBOX">Checkbox</option>
                  <option value="DROPDOWN">Dropdown</option>
                </Select>
              </FormControl>
              {q.question_type !== 'TEXT' && (
                <FormControl isRequired>
                  <FormLabel>Options (comma-separated)</FormLabel>
                  <Textarea
                    placeholder="e.g., Good, Neutral, Bad"
                    value={q.options.join(', ')}
                    onChange={(e) =>
                      handleQuestionChange(index, 'options', e.target.value)
                    }
                  />
                </FormControl>
              )}
            </VStack>
          ))}
          <Button
            leftIcon={<Plus size={16} />}
            onClick={handleAddQuestion}
            variant="outline"
            alignSelf="flex-start"
          >
            Add Question
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
