import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Heading,
    HStack,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useDisclosure,
    useToast,
    Badge,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton,
    Flex,
    MenuDivider,
    Grid,
    GridItem,
    Select,
} from '@chakra-ui/react';
import { Plus, Edit, Trash2, BarChart2, Upload, MoreVertical, Send, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { useAuth } from '../context/AuthContext';
import CsvImportModal from '../components/CsvImportModal';

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => {
    const pageAsNumber = Number(search.page || 1);
    const page = !isNaN(pageAsNumber) && pageAsNumber > 0 ? Math.floor(pageAsNumber) : 1;
    const status = typeof search.status === 'string' ? search.status : 'all';
    const is_external = typeof search.is_external === 'string' ? search.is_external : 'all';

    return {
      page,
      status,
      is_external,
    };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate({ from: Route.fullPath });
  const { page, status, is_external } = Route.useSearch();
  const pageSize = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['surveys', page, pageSize, status, is_external],
    queryFn: () => api.getSurveys(page, pageSize, { status, is_external }),
    enabled: !!token
  });

  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
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
      onDeleteClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion failed.',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      onDeleteClose();
    },
  });

  const publishMutation = useMutation({
      mutationFn: (surveyId: string) => api.publishSurvey(surveyId),
      onSuccess: () => {
          toast({
              title: 'Survey published.',
              description: 'The survey is now live.',
              status: 'success',
              duration: 3000,
              isClosable: true,
          });
          queryClient.invalidateQueries({ queryKey: ['surveys'] });
      },
      onError: (error: any) => {
          toast({
              title: 'Publishing failed.',
              description: error.response?.data?.message || 'An unexpected error occurred.',
              status: 'error',
              duration: 5000,
              isClosable: true,
          });
      }
  });

  const handleDeleteClick = (surveyId: string) => {
    setSurveyToDelete(surveyId);
    onDeleteOpen();
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

  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    });
  };

  const handleFilterChange = (filterName: 'status' | 'is_external', value: string) => {
    navigate({
      search: (prev) => ({ ...prev, [filterName]: value, page: 1 }),
    });
  };

  return (
    <>
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">All Surveys</Heading>
          <HStack>
            <Button
              colorScheme='blue'
              variant="outline"
              leftIcon={<Upload size={16} />}
              onClick={onImportOpen}
            >
              Import from CSV
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<Plus size={18} />}
              onClick={() => navigate({ to: '/surveys/create' })}
            >
              Create Survey
            </Button>
          </HStack>
        </Flex>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4} mb={6}>
          <GridItem>
                <Select bg='white' value={status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                </Select>
            </GridItem>
            <GridItem>
                <Select bg='white' value={is_external} onChange={(e) => handleFilterChange('is_external', e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="false">Internal</option>
                    <option value="true">External</option>
                </Select>
            </GridItem>
        </Grid>

        <Box bg="white" p={4} borderRadius="lg" boxShadow="base">
          <Table variant="simple">
            <Thead><Tr><Th>Title</Th>
              <Th>Created At</Th>
              <Th>Status</Th>
              <Th textAlign="center">Actions</Th>
              <Th></Th>
             </Tr></Thead>
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
                  <Td
                    fontWeight="medium"
                  >
                    {survey.survey_title}
                    {survey.is_external ? <Badge colorScheme="purple" ml={2}  fontSize='0.75em' lineHeight={1.5} >External</Badge> : null}
                  </Td>

                  <Td>{new Date(survey.created_at).toLocaleString()}</Td>
                                    <Td>
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
                    >
                      {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                    </Badge>
                  </Td>
                  <Td textAlign="center">
                    <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() =>
                          navigate({
                            to: '/surveys/$surveyId/viewDetails',
                            params: { surveyId: survey.survey_id },
                          })
                        }
                      >
                        View Details
                      </Button>
                  </Td>
                  <Td>
                    {!survey.is_external ?
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="Options"
                          icon={<MoreVertical size={16} />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem icon={<BarChart2 size={16} />} onClick={() => navigate({ to: '/surveys/$surveyId/submissions', params: { surveyId: survey.survey_id } })}>
                            View Submissions
                          </MenuItem>
                          <MenuItem icon={<Edit size={16} />} onClick={() => navigate({ to: '/surveys/$surveyId/edit', params: { surveyId: survey.survey_id } })}>
                            Edit Survey
                          </MenuItem>
                          {survey.status === 'draft' && (
                            <MenuItem
                              icon={<Send size={16} />}
                              onClick={() => publishMutation.mutate(survey.survey_id)}
                              isDisabled={publishMutation.isPending}
                            >
                              Publish Survey
                            </MenuItem>
                          )}
                          {survey.status === 'published' && (
                            <MenuItem
                              icon={<ExternalLink size={16} />}
                              onClick={() => navigate({ to: '/surveys/$surveyId/viewForm', params: { surveyId: survey.survey_id } })}
                            >
                              Open Responder View
                            </MenuItem>
                          )}
                          <MenuDivider />
                          <MenuItem icon={<Trash2 size={16} />} color="red.500" onClick={() => handleDeleteClick(survey.survey_id)}>
                            Delete
                          </MenuItem>
                        </MenuList>
                      </Menu>
                      : null}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Box display="flex" justifyContent="flex-end" alignItems="center" mt={4} gap={2}>
            <Button
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              isDisabled={page <= 1}
            >
              Prev
            </Button>
            <Box mx={2} fontWeight="medium">
              Page {page} of {totalPages}
            </Box>
            <Button
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              isDisabled={page >= totalPages}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Box>
      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
      <CsvImportModal isOpen={isImportOpen} onClose={onImportClose} />
    </>
  );
}
