import type { ReactNode } from 'react';
import { Container, Flex } from '@chakra-ui/react';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Container maxW={{ base: '100%' }}>
      <Flex>
        <Sidebar />
        <Container  maxW={{ base: '100%', md: '9xl' }} ml={{ base: 0, md: '250px' }} p={8} w="100%">
          {children}
        </Container>
      </Flex>
    </Container>
  );
};
export default MainLayout;