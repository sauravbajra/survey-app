import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Heading, HStack, Table, Tbody, Td, Th, Thead, Tr, useDisclosure, useToast } from '@chakra-ui/react';
import { ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['surveys', page, pageSize],
    queryFn: () => api.getSurveys(page, pageSize),
  });

  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (surveyId: string) => api.deleteSurvey(surveyId),
    onSuccess: () => {
      toast({
        title: 'Survey deleted.',
        description: 'The survey has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion failed.',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    },
  });

  const handleDeleteClick = (surveyId: string) => {
    setSurveyToDelete(surveyId);
    onOpen();
  };

  const handleConfirmDelete = () => {
    if (surveyToDelete) {
      deleteMutation.mutate(surveyToDelete);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    toast({
      title: 'Failed to fetch surveys.',
      description: error?.message || 'An unexpected error occurred.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return (
        <Box p={4}>
            <Heading size="md" color="gray.500">Could not load surveys.</Heading>
        </Box>
    );
  }


  const surveys = data?.data?.surveys || [];
  const totalPages = data?.data?.total_pages || 0;

  return (
    <>
    <Box>
      <Heading size="lg" mb={6}>All Surveys</Heading>
      <Box display="flex" justifyContent="flex-end" mb={4}>
        <Button
          colorScheme="teal"
          leftIcon={<Plus size={18} />}
          onClick={() => navigate({ to: '/surveys/create' })}
        >
          Create Survey
        </Button>
      </Box>
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
                {/* <Td fontWeight="medium">{survey.survey_title}</Td> */}
                <Td
                    fontWeight="medium"
                    onClick={() => navigate({ to: '/surveys/$surveyId/', params: { surveyId: survey.survey_id } })}
                    cursor="pointer"
                    _hover={{ color: 'blue.600', textDecoration: 'underline' }}
                  >
                    {survey.survey_title}
                  </Td>
              <Td>{survey.status}</Td>
              <Td>{new Date(survey.created_at).toLocaleDateString()}</Td>
                <Td>
                                      <HStack spacing={2} w='100%' justifyContent="flex-end">
                      <Button size="sm" variant="ghost" colorScheme="blue" leftIcon={<Edit size={16}/>} onClick={() => navigate({ to: '/surveys/$surveyId/edit', params: { surveyId: survey.survey_id } })}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" colorScheme="red" leftIcon={<Trash2 size={16}/>} onClick={() => handleDeleteClick(survey.survey_id)}>
                        Delete
                    </Button>
                     <Button
                size="sm"
                variant="ghost"
                colorScheme="blue"
                rightIcon={<ChevronRight size={16} />}
                onClick={() =>
                  navigate({
                  to: '/surveys/$surveyId/',
                  params: { surveyId: survey.survey_id },
                  })
                }
                >
                View
                </Button>
                    </HStack>


              </Td>
              </Tr>
            ))}
            </Tbody>
        </Table>
        <Box display="flex" justifyContent="flex-end" alignItems="center" mt={4} gap={2}>
          <Button
            size="sm"
            onClick={() => setPage(page - 1)}
            isDisabled={page === 1}
          >
            Prev
          </Button>
          <Box mx={2} fontWeight="medium">
            Page {page} of {totalPages}
          </Box>
          <Button
            size="sm"
            onClick={() => setPage(page + 1)}
            isDisabled={page >= totalPages}
          >
            Next
          </Button>
        </Box>
      </Box>
    </Box>
     <DeleteConfirmationDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}