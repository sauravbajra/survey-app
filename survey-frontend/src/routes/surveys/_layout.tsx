import { createFileRoute, Outlet } from '@tanstack/react-router';
import MainLayout from '../../layouts/MainLayout';

export const Route = createFileRoute('/surveys/_layout')({
  component: () => <MainLayout><Outlet /></MainLayout>,
});