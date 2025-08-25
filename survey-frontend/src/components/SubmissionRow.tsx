import {
  Box,
  Heading,
  Text,
  Tr,
  Td,
  useDisclosure,
  Collapse,
  IconButton,
  Card,
  CardHeader,
  CardBody,
  Stack,
  StackDivider,
} from '@chakra-ui/react';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/apiClient';
import LoadingSpinner from './LoadingSpinner';

export const SubmissionRow = ({ submission }: { submission: any }) => {
  const { isOpen, onToggle } = useDisclosure();

  // Fetch detailed submission data only when the row is expanded
  const { data: submissionDetails, isLoading } = useQuery({
    queryKey: ['submission', submission.submission_id],
    queryFn: () => api.getSubmissionById(submission.submission_id),
    enabled: isOpen,
  });

  const formatAnsers = (answer: any) => {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return String(answer);
  };

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
            <Box bg="gray.50" borderWidth="1px" p={6}>
              <Card bg="white" borderRadius="md">
                <CardHeader>
                  <Heading size="md">Submitted Answers:</Heading>
                </CardHeader>
                {isLoading && <LoadingSpinner />}
                {!isLoading && responses.length > 0 && (
                  <CardBody pt={2}>
                    <Stack divider={<StackDivider />} spacing="4">
                      {responses.map((res: any, index: number) => (
                        <Stack spacing={2} key={index}>
                          <Heading size="sm">{res.question}</Heading>
                          <Text pl={0}>{formatAnsers(res.answer)}</Text>
                        </Stack>
                      ))}
                    </Stack>
                  </CardBody>
                )}
              </Card>
            </Box>
          </Collapse>
        </Td>
      </Tr>
    </>
  );
};
