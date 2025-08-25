import { Box, Button, Container, HStack } from '@chakra-ui/react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await Promise.resolve(logout());
    navigate({
      to: '/',
      search: { page: 1, status: 'all', is_external: 'all' },
    });
  };
  const location = useLocation();

  interface NavItemProps {
    icon: React.ElementType;
    children: React.ReactNode;
    to: string;
  }

  const NavItem = ({ icon: Icon, children, to }: NavItemProps) => (
    <Button
      as={Link}
      to={to}
      variant="link"
      justifyContent="flex-start"
      style={{ textDecoration: 'none' }}
      // variant={location.pathname === to ? 'solid' : 'ghost'}
      colorScheme={location.pathname === to ? 'blue' : 'dark'}
      leftIcon={<Icon size={20} />}
    >
      {children}
    </Button>
  );

  return (
    <Box
      as="nav"
      // pos="fixed"
      left="0"
      top="0"
      w="100%"
      h="auto"
      bg="white"
      boxShadow="md"
      p={3}
    >
      <Container maxW={{ base: '100%', md: '6xl' }} w="100%">
        <HStack spacing={4} justifyContent="space-between">
          <NavItem icon={Home} to="/">
            Surveys Dashboard
          </NavItem>
          {token ? (
            <Button
              onClick={handleLogout}
              justifyContent="flex-start"
              variant="ghost"
              colorScheme="red"
              mt="auto"
              leftIcon={<LogOut size={20} />}
            >
              Logout
            </Button>
          ) : (
            <Button
              as={Link}
              to="/login"
              justifyContent="flex-start"
              variant="ghost"
              colorScheme="blue"
              mt="auto"
            >
              Login
            </Button>
          )}
        </HStack>
      </Container>
    </Box>
  );
};
export default Navbar;
