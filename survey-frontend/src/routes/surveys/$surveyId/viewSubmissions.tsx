import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Heading,
  Text,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VStack,
  Flex,
  Button,
  Collapse,
  useDisclosure,
  IconButton,
} from '@chakra-ui/react';
import { api } from '../../../api/apiClient';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import AnalyticsCharts from '../../../components/AnalyticsCharts';

// New component for an expandable submission row
const SubmissionRow = ({ submission }: { submission: any }) => {
  const { isOpen, onToggle } = useDisclosure();

  // Fetch detailed submission data only when the row is expanded
  const { data: submissionDetails, isLoading } = useQuery({
    queryKey: ['submission', submission.submission_id],
    queryFn: () => api.getSubmissionById(submission.submission_id),
    enabled: isOpen, // Only fetch when the row is open
  });

  const responses = submissionDetails?.data?.responses || [];

  return (
    <>
      <Tr>
        <Td>
          <IconButton
            aria-label="Expand row"
            icon={
              isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            }
            variant="ghost"
            size="sm"
            onClick={onToggle}
          />
        </Td>
        <Td>{submission.submission_id}</Td>
        <Td>{new Date(submission.submitted_at).toLocaleString()}</Td>
      </Tr>
      <Tr>
        <Td colSpan={3} p={0} border="none">
          <Collapse in={isOpen} animateOpacity>
            <Box p={4} bg="gray.50">
              {isLoading && <LoadingSpinner />}
              {!isLoading && responses.length > 0 && (
                <VStack align="stretch" spacing={3}>
                  <Heading size="xs">Submitted Answers:</Heading>
                  {responses.map((res: any, index: number) => (
                    <Box
                      key={index}
                      p={2}
                      bg="white"
                      borderRadius="md"
                      borderWidth="1px"
                    >
                      <Text fontWeight="bold">{res.question}</Text>
                      <Text pl={2}>{JSON.stringify(res.answer)}</Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </Collapse>
        </Td>
      </Tr>
    </>
  );
};

export const Route = createFileRoute('/surveys/$surveyId/viewSubmissions')({
  component: SurveyResultsPage,
});

function SurveyResultsPage() {
  const { surveyId } = Route.useParams();
  const toast = useToast();
  const router = useRouter();

  const {
    data: surveyData,
    isLoading: isLoadingSurvey,
    isError: isErrorSurvey,
  } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => api.getSurveyById(surveyId),
    onError: (error: any) => {
      toast({
        title: 'Failed to fetch survey details.',
        description: error.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissions', surveyId],
    queryFn: () => api.getSubmissionsForSurvey(surveyId),
  });

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics', surveyId],
    queryFn: () => api.getSurveyAnalytics(surveyId),
  });

  if (isLoadingSurvey) return <LoadingSpinner />;

  if (isErrorSurvey) {
    return (
      <Box p={4}>
        <Heading size="lg" color="gray.500">
          Survey Not Found
        </Heading>
        <Text>Could not load results for this survey.</Text>
      </Box>
    );
  }

  const survey = surveyData?.data;
  const submissions = submissionsData?.data?.submissions || [];
  const analytics = analyticsData?.data;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={2}>
        <VStack align="start" spacing={0}>
          <Button
            variant="link"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => router.history.back()}
            colorScheme="gray"
            style={{ textDecoration: 'none' }}
          >
            Back
          </Button>
          <Heading size="lg">{survey.survey_title} - Results</Heading>
        </VStack>
      </Flex>
      <Text color="gray.500" mb={6}>
        Status: {survey.status}
      </Text>

      <Tabs variant="enclosed-colored" colorScheme="blue">
        <TabList>
          <Tab>Submissions</Tab>
          <Tab>Analytics</Tab>
        </TabList>
        <TabPanels bg="white" borderRadius="lg" boxShadow="base" mt={-1}>
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
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
