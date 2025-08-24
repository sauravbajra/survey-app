import { Box, Button, Heading, VStack } from '@chakra-ui/react';
import { Link, useLocation } from '@tanstack/react-router';
import { Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
    const location = useLocation();

    interface NavItemProps {
        icon: React.ElementType;
        children: React.ReactNode;
        to: string;
    }

    const NavItem = ({ icon: Icon, children, to }: NavItemProps) => (
        <Button as={Link} to={to} justifyContent="flex-start" variant={location.pathname === to ? 'solid' : 'ghost'} colorScheme={location.pathname === to ? 'blue' : 'gray'} w="100%" leftIcon={<Icon size={20} />}>
            {children}
        </Button>
    );

    return (
        <Box as="nav" pos="fixed" left="0" top="0" h="100%" w={{ base: 'full', md: '250px' }} bg="white" boxShadow="md" p={4}>
            <VStack spacing={4} align="stretch">
                <Heading size="md" mb={6} color="blue.600">Dashboard</Heading>
                <NavItem icon={Home} to="/">Surveys</NavItem>
                {localStorage.getItem('isAuthenticated') === 'true' ? (
                  <Button onClick={logout} justifyContent="flex-start" variant="ghost" colorScheme="red" w="100%" mt="auto" leftIcon={<LogOut size={20} />}>
                  Logout
                  </Button>
                ) : (
                  <Button as={Link} to="/login" justifyContent="flex-start" variant="ghost" colorScheme="blue" w="100%" mt="auto">
                  Login
                  </Button>
                )}
            </VStack>
        </Box>
    );
};
export default Sidebar;