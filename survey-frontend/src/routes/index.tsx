import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Heading, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { ChevronRight } from 'lucide-react';
import { api } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => api.getSurveys(),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorDisplay message={error.message} />;

  const surveys = data?.data?.surveys || [];

  return (
    <Box>
      <Heading size="lg" mb={6}>All Surveys</Heading>
      <Box bg="white" p={4} borderRadius="lg" boxShadow="base">
        <Table variant="simple">
          <Thead><Tr><Th>Title</Th><Th>Status</Th><Th>Created At</Th><Th></Th></Tr></Thead>
            <Tbody>
            {surveys.map((survey: {
              created_at: string;
              is_external: boolean;
              publish_date: string | null;
              status: 'published' | 'scheduled' | 'draft';
              survey_id: string;
              survey_title: string;
            }) => (
              <Tr key={survey.survey_id} _hover={{ bg: 'gray.50' }}>
              <Td fontWeight="medium">{survey.survey_title}</Td>
              <Td>{survey.status}</Td>
              <Td>{new Date(survey.created_at).toLocaleDateString()}</Td>
              <Td>
                <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                rightIcon={<ChevronRight size={16} />}
                onClick={() =>
                  navigate({
                  to: '/surveys/$surveyId',
                  params: { surveyId: survey.survey_id },
                  })
                }
                >
                View
                </Button>
              </Td>
              </Tr>
            ))}
            </Tbody>
        </Table>
      </Box>
    </Box>
  );
}