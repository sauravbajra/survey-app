import React from 'react';
import { Box, Heading, List, ListItem, Text, useTheme } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsChartsProps {
  result: {
    question_id: number;
    question_title: string;
    question_type: string;
    answer_frequencies: Record<string, number>;
  };
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ result }) => {
  const theme = useTheme();
  const colors = [
    theme.colors.blue[500],
    theme.colors.green[500],
    theme.colors.purple[500],
    theme.colors.orange[500],
    theme.colors.teal[500],
    theme.colors.pink[500],
  ];

  const data = Object.entries(result.answer_frequencies).map(([name, value]) => ({ name, value }));

  const renderChart = () => {
    switch (result.question_type.toUpperCase()) {
      case 'MULTIPLE_CHOICE':
      case 'DROPDOWN':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'CHECKBOX':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={theme.colors.blue[500]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'TEXT':
        return (
            <List spacing={2} mt={2}>
                {data.map(item => (
                    <ListItem key={item.name} p={2} bg="gray.50" borderRadius="md">
                        <Text>"{item.name}" <Text as="span" color="gray.500">({item.value} response(s))</Text></Text>
                    </ListItem>
                ))}
            </List>
        );

      default:
        return <Text>No chart available for this question type.</Text>;
    }
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="md">
      <Heading size="sm">{result.question_title}</Heading>
      {renderChart()}
    </Box>
  );
};

export default AnalyticsCharts;
