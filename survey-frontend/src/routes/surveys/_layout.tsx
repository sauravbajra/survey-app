import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/surveys/_layout')({
  // The component should just render the Outlet, as the MainLayout
  // is already applied by the root route for all authenticated pages.
  component: () => <Outlet />,
});
