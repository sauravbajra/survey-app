import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VStack,
  Flex,
  Button,
  HStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { api } from '../../../api/apiClient';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { CheckCircle, Edit, Share2, Trash2, ArrowLeft } from 'lucide-react';
import DeleteConfirmationDialog from '../../../components/DeleteConfirmationDialog';
import AnalyticsCharts from '../../../components/AnalyticsCharts';
import { SubmissionRow } from '../../../components/SubmissionRow';

export const Route = createFileRoute('/surveys/$surveyId/viewDetails')({
  component: SurveyDetailPage,
});

function SurveyDetailPage() {
  const { surveyId } = Route.useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const router = useRouter();

  const queryClient = useQueryClient();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Fetch Survey Details directly in this component
  const {
    data: surveyData,
    isLoading: isLoadingSurvey,
    isError: isErrorSurvey,
  } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => api.getSurveyById(surveyId),
  });

  // Fetch Submissions and Analytics separately
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
      navigate({ to: '/' });
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion failed.',
        description: error.response?.data?.message,
        status: 'error',
      });
    },
  });

  const handleShareClick = () => {
    if (survey.status !== 'published') {
      toast({
        title: 'Cannot share this survey.',
        description: 'Only published surveys have a public link.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const publicUrl = `${window.location.origin}/surveys/${surveyId}/viewForm`;
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

  if (isLoadingSurvey) {
    return <LoadingSpinner />;
  }

  if (isErrorSurvey) {
    return (
      <Box p={4}>
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
          <Box>
            <Button
              variant="link"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => router.history.back()}
              colorScheme="gray"
              mb={4}
            >
              Back
            </Button>
            <Heading size="lg">{survey.survey_title}</Heading>
            <Text color="gray.500" mt={1}>
              Status: {survey.status}
            </Text>
          </Box>
          <HStack spacing={2}>
            <Button
              leftIcon={<Share2 size={16} />}
              onClick={handleShareClick}
              variant="outline"
            >
              Share
            </Button>
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
              <Heading size="md" mb={4}>
                Survey Questions
              </Heading>
              <List spacing={3}>
                {survey.questions.map((q: any) => (
                  <ListItem key={q.question_id}>
                    <ListIcon as={CheckCircle} color="green.500" />
                    {q.title}{' '}
                    <Text as="span" color="gray.500">
                      ({q.type})
                    </Text>
                  </ListItem>
                ))}
              </List>
            </TabPanel>
            <TabPanel>
              {isLoadingSubmissions ? (
                <LoadingSpinner />
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
              {isLoadingAnalytics ? (
                <LoadingSpinner />
              ) : (
                <VStack align="stretch" spacing={6}>
                  <Heading size="md">Submission Analytics</Heading>
                  <Text>Total Submissions: {analytics?.total_submissions}</Text>
                  {analytics?.results.map((result: any) => (
                    <Box
                      key={result.question_id}
                      p={4}
                      borderWidth={1}
                      borderRadius="md"
                    >
                      <Heading size="sm">{result.question_title}</Heading>
                      <List mt={2} spacing={1}>
                        {Object.entries(result.answer_frequencies).map(
                          ([answer, count]) => (
                            <ListItem key={answer}>
                              <Text as="span" fontWeight="bold">
                                {answer}:
                              </Text>{' '}
                              {count as number} response(s)
                            </ListItem>
                          )
                        )}
                      </List>
                    </Box>
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
    </>
  );
}
