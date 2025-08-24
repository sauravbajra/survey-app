import { createRootRoute, Outlet } from '@tanstack/react-router';
// import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  // const { token } = useAuth();
  return (
    <MainLayout>
      {/* The Outlet will render the matched child route */}
      <Outlet />
    </MainLayout>
  );
}