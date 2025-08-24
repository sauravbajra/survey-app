import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Box, Heading, Text } from '@chakra-ui/react';
import { api } from '../../api/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorDisplay from '../../components/ErrorDisplay';

export const Route = createFileRoute('/surveys/$surveyId')({
  component: SurveyDetailPage,
});

function SurveyDetailPage() {
  const { surveyId } = Route.useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => api.getSurveyById(surveyId),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorDisplay message={error.message} />;

  const survey = data?.data;

  return (
    <Box>
      <Heading size="lg" mb={2}>{survey.survey_title}</Heading>
      <Text color="gray.500" mb={6}>Status: {survey.status}</Text>
      {/* Add tabs for questions, submissions, analytics here */}
    </Box>
  );
}