import { createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

export const Route = createRootRoute({
  component: RootComponent,
  // This function runs before the route loads
  beforeLoad: ({ context, location }) => {
    const auth = context.auth;
    // If the user is not authenticated and not on the login page, redirect them
    if (!auth?.token && location.pathname !== '/login') {
      throw redirect({
        to: '/login',
        search: {
          // You can use this to redirect back to the original page after login
          redirect: location.href,
        },
      });
    }
    // If the user is authenticated and tries to go to the login page, redirect to dashboard
    if (auth?.token && location.pathname === '/login') {
        throw redirect({
            to: '/',
        });
    }
  },
});

function RootComponent() {
  const { token } = useAuth();

  // Conditionally render the main layout with the sidebar
  // The Outlet will render the matched child route (e.g., dashboard, survey detail)
  if (token) {
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    );
  }

  // For the login page, just render the component without the sidebar
  return <Outlet />;
}
