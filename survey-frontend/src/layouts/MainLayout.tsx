import type { ReactNode } from 'react';
import { Box, Container, VStack } from '@chakra-ui/react';
import Navbar from '../components/Navbar';

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Box maxW={{ base: '100%' }}>
      <VStack spacing={8}>
        <Navbar />
        <Container  maxW={{ base: '100%', md: '6xl' }} w="100%">
          {children}
        </Container>
      </VStack>
    </Box>
  );
};
export default MainLayout;