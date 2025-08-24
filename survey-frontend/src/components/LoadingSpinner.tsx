import { Center, Spinner } from '@chakra-ui/react';
const LoadingSpinner = () => <Center p={10}><Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" /></Center>;
export default LoadingSpinner;