import { Center, HStack, Text } from '@chakra-ui/react';
import { XCircle } from 'lucide-react';
const ErrorDisplay = ({ message }: { message?: string }) => <Center p={10}><HStack color="red.500"><XCircle /><Text>Error: {message || "Could not fetch data."}</Text></HStack></Center>;
export default ErrorDisplay;