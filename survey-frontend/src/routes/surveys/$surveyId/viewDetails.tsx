import {
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  ListItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  VStack,
  Flex,
  Button,
  HStack,
  useDisclosure,
  useToast,
  OrderedList,
  Stack,
  StackDivider,
} from '@chakra-ui/react';
import { api } from '../../../api/apiClient';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { Edit, Share2, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';
import DeleteConfirmationDialog from '../../../components/DeleteConfirmationDialog';
import SendSurveyModal from '../../../components/SendSurveyModal';
import AnalyticsCharts from '../../../components/AnalyticsCharts';
import { SubmissionRow } from '../../../components/SubmissionRow';

export const Route = createFileRoute('/surveys/$surveyId/viewDetails')({
  component: SurveyDetailPage,
});

function SurveyDetailPage() {
  const { surveyId } = Route.useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const queryClient = useQueryClient();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isSendOpen,
    onOpen: onSendOpen,
    onClose: onSendClose,
  } = useDisclosure();

  const {
    data: surveyData,
    isLoading: isLoadingSurvey,
    isError: isErrorSurvey,
  } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => api.getSurveyById(surveyId),
  });

  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissions', surveyId],
    queryFn: () => api.getSubmissionsForSurvey(surveyId),
  });
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics', surveyId],
    queryFn: () => api.getSurveyAnalytics(surveyId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteSurvey(surveyId),
    onSuccess: () => {
      toast({ title: 'Survey deleted.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      navigate({
        to: '/',
        search: { page: 1, status: 'all', is_external: 'all' },
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion failed.',
        description: error.response?.data?.message,
        status: 'error',
      });
    },
  });

  if (isLoadingSurvey) {
    return <LoadingSpinner />;
  }

  if (isErrorSurvey) {
    return (
      <Box p={4} textAlign="center">
        <Heading size="lg" color="gray.500">
          Survey Not Found
        </Heading>
        <Text>Could not load details for this survey.</Text>
      </Box>
    );
  }

  const survey = surveyData?.data;
  const submissions = submissionsData?.data?.submissions || [];
  const analytics = analyticsData?.data;

  return (
    <>
      <Box>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <VStack align="start">
            <Button
              variant="link"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => {
                navigate({
                  to: '/',
                  search: { page: 1, status: 'all', is_external: 'all' },
                });
              }}
              colorScheme="gray"
              mb={2}
              style={{ textDecoration: 'none' }}
            >
              Back
            </Button>
            <Heading size="lg">
              {survey.survey_title}{' '}
              <Badge
                colorScheme={
                  survey.status === 'published'
                    ? 'green'
                    : survey.status === 'scheduled'
                      ? 'blue'
                      : 'yellow'
                }
                variant="subtle"
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="md"
                ml={2}
              >
                {survey.status}
              </Badge>
            </Heading>
            <Text>
              Created at: {new Date(survey.created_at).toLocaleString()}
            </Text>
          </VStack>
          <HStack spacing={2}>
            <Button
              leftIcon={<Share2 size={16} />}
              onClick={onSendOpen}
              isDisabled={survey.status !== 'published'}
            >
              Share
            </Button>
            <Button
              leftIcon={<ExternalLink size={16} />}
              as="a"
              target="_blank"
              href={`${window.location.origin}/surveys/${surveyId}/viewForm`}
              isDisabled={survey.status !== 'published'}
            >
              Open
            </Button>
            {survey.is_external ? null : (
              <>
                <Button
                  leftIcon={<Edit size={16} />}
                  onClick={() =>
                    navigate({
                      to: '/surveys/$surveyId/edit',
                      params: { surveyId },
                    })
                  }
                  colorScheme="blue"
                >
                  Edit
                </Button>
                <Button
                  leftIcon={<Trash2 size={16} />}
                  onClick={onDeleteOpen}
                  colorScheme="red"
                >
                  Delete
                </Button>
              </>
            )}
          </HStack>
        </Flex>

        <Tabs
          variant="line"
          colorScheme="blue"
          mt={6}
          boxShadow="base"
          borderRadius="lg"
        >
          <TabList
            bg="white"
            borderRadius="lg"
            borderBottomRadius={0}
            borderBottomWidth={1}
            borderColor="gray.200"
          >
            <Tab py={3}>Questions</Tab>
            <Tab py={3}>Submissions</Tab>
            <Tab py={3}>Analytics</Tab>
          </TabList>
          <TabPanels bg="white" borderRadius="lg" borderTopRadius={0}>
            <TabPanel>
              <Heading size="md" mb={6}>
                Survey Questions
              </Heading>
              <OrderedList spacing={6}>
                <Stack divider={<StackDivider />} spacing="3">
                  {survey.questions.length === 0 ? (
                    <Text
                      textAlign="center"
                      p={4}
                      fontWeight="semibold"
                      color="gray.500"
                    >
                      No questions available.
                    </Text>
                  ) : (
                    survey.questions.map((q: any) => (
                      <ListItem key={q.question_id}>
                        <Heading size="sm" mb={2}>
                          {q.title}
                        </Heading>
                        <Text mb={1}>
                          <Text fontWeight="medium" as="span">
                            Question Type:
                          </Text>{' '}
                          {q.type}
                        </Text>
                        {q.options && q.options.length > 0 && (
                          <Text mb={1}>
                            <Text fontWeight="medium" as="span">
                              Options:
                            </Text>{' '}
                            {q.options.join(', ')}
                          </Text>
                        )}
                      </ListItem>
                    ))
                  )}
                </Stack>
              </OrderedList>
            </TabPanel>
            <TabPanel>
              {isLoadingSubmissions ? (
                <LoadingSpinner />
              ) : submissions && submissions.length === 0 ? (
                <Text
                  textAlign="center"
                  p={4}
                  fontWeight="semibold"
                  color="gray.500"
                >
                  No submissions yet.
                </Text>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th w="50px"></Th>
                      <Th>Submission ID</Th>
                      <Th>Submitted At</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {submissions.map((sub: any) => (
                      <SubmissionRow key={sub.submission_id} submission={sub} />
                    ))}
                  </Tbody>
                </Table>
              )}
            </TabPanel>
            <TabPanel>
              {isLoadingAnalytics ? (
                <LoadingSpinner />
              ) : (
                <VStack align="stretch" spacing={6}>
                  <Heading size="md">Submission Analytics</Heading>
                  <Text>Total Submissions: {analytics?.total_submissions}</Text>
                  {analytics?.results.map((result: any) => (
                    <AnalyticsCharts key={result.question_id} result={result} />
                  ))}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
      <SendSurveyModal
        isOpen={isSendOpen}
        onClose={onSendClose}
        surveyId={surveyId}
      />
    </>
  );
}
