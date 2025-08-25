import {
  createRootRouteWithContext,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { useAuth, type AuthContextType } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

interface MyRouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  // Allow public access to this route for submitting surveys
  beforeLoad: ({ context, location }) => {
    const auth = context.auth;
    if (location.pathname.endsWith('/viewForm')) {
      return;
    }
    // If the user is not authenticated and not on the login page, redirect them
    if (!auth?.token && location.pathname !== '/login') {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
    // If the user is authenticated and tries to go to the login page, redirect to dashboard
    if (auth?.token && location.pathname === '/login') {
      throw redirect({
        to: '/',
        search: { page: 1, status: 'all', is_external: 'all' },
      });
    }
  },
});

function RootComponent() {
  const { token } = useAuth();

  // Navbar is visible for authenticated users
  if (token) {
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    );
  }

  return <Outlet />;
}
